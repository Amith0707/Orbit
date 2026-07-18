import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "migrations");

function parseMigrationId(filename: string): number {
  const match = filename.match(/^(\d+)_/);
  if (!match) {
    throw new Error(`Migration filename "${filename}" must start with a zero-padded numeric id`);
  }
  return Number.parseInt(match[1], 10);
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id integer PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedIds(): Promise<Set<number>> {
  const result = await pool.query<{ id: number }>("SELECT id FROM schema_migrations ORDER BY id");
  return new Set(result.rows.map((row) => row.id));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await getAppliedIds();

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => parseMigrationId(a) - parseMigrationId(b));

  let ranCount = 0;
  for (const file of files) {
    const id = parseMigrationId(file);
    if (applied.has(id)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    const client = await pool.connect();
    try {
      console.log(`Applying migration ${file}...`);
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id, name) VALUES ($1, $2)", [id, file]);
      await client.query("COMMIT");
      console.log(`  -> applied`);
      ranCount += 1;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  -> failed:`, err);
      process.exitCode = 1;
      throw err;
    } finally {
      client.release();
    }
  }

  if (ranCount === 0) {
    console.log("Database is already up to date. No migrations to apply.");
  } else {
    console.log(`Applied ${ranCount} migration(s).`);
  }
}

run()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });
