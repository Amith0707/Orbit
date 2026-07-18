import { pool } from "../client.js";
import { findUserByEmail, createUser, updatePasswordAndPromote } from "../../repositories/users.repository.js";
import { hashPassword } from "../../utils/password.js";

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const password = args.password;
  const force = args.force === "true" || "force" in args;

  if (!email || !password) {
    console.error("Usage: npm run db:seed:admin -- --email=admin@company.com --password=... [--force]");
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    if (existing.role === "administrator" && !force) {
      console.log(`${email} is already an administrator. No changes made.`);
      return;
    }
    if (!force) {
      console.log(`${email} already exists as an employee. Re-run with --force to promote and reset their password.`);
      return;
    }
    const passwordHash = await hashPassword(password);
    await updatePasswordAndPromote(email, passwordHash);
    console.log(`Promoted existing user ${email} to administrator and reset their password.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email,
    passwordHash,
    firstName: args.firstName ?? "Admin",
    lastName: args.lastName ?? "User",
    role: "administrator",
  });
  console.log(`Created administrator account: ${user.email}`);
}

run()
  .catch((err) => {
    console.error("Failed to seed admin:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void pool.end();
  });
