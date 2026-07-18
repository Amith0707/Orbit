import { query } from "../db/client.js";
import type { Role } from "../types/express.js";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: Role;
  department_id: string | null;
  job_title: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  hire_date: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

const USER_COLUMNS = `
  id, email, password_hash, first_name, last_name, avatar_url, role,
  department_id, job_title, bio, location, availability, hire_date,
  is_active, last_login_at, created_at, updated_at
`;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role?: Role;
}): Promise<UserRow> {
  const result = await query<UserRow>(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${USER_COLUMNS}`,
    [input.email.trim().toLowerCase(), input.passwordHash, input.firstName, input.lastName, input.role ?? "employee"]
  );
  return result.rows[0];
}

export async function promoteUserToAdmin(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET role = 'administrator', updated_at = now() WHERE email = $1 RETURNING ${USER_COLUMNS}`,
    [email.trim().toLowerCase()]
  );
  return result.rows[0] ?? null;
}

export async function updatePasswordAndPromote(email: string, passwordHash: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET password_hash = $2, role = 'administrator', updated_at = now()
     WHERE email = $1 RETURNING ${USER_COLUMNS}`,
    [email.trim().toLowerCase(), passwordHash]
  );
  return result.rows[0] ?? null;
}

export async function touchLastLogin(userId: string): Promise<void> {
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [userId]);
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  departmentId?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  location?: string | null;
  availability?: string | null;
}

export async function updateUserProfile(userId: string, input: UpdateProfileInput): Promise<UserRow> {
  const result = await query<UserRow>(
    `UPDATE users SET
       first_name = COALESCE($2, first_name),
       last_name = COALESCE($3, last_name),
       avatar_url = COALESCE($4, avatar_url),
       department_id = COALESCE($5, department_id),
       job_title = COALESCE($6, job_title),
       bio = COALESCE($7, bio),
       location = COALESCE($8, location),
       availability = COALESCE($9, availability),
       updated_at = now()
     WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [
      userId,
      input.firstName,
      input.lastName,
      input.avatarUrl,
      input.departmentId,
      input.jobTitle,
      input.bio,
      input.location,
      input.availability,
    ]
  );
  return result.rows[0];
}

export interface ListUsersFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
  limit: number;
  offset: number;
}

export async function listUsers(filters: ListUsersFilters): Promise<{ rows: UserRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search.toLowerCase()}%`);
    conditions.push(
      `(LOWER(first_name || ' ' || last_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`
    );
  }
  if (filters.role) {
    params.push(filters.role);
    conditions.push(`role = $${params.length}`);
  }
  if (filters.isActive !== undefined) {
    params.push(filters.isActive);
    conditions.push(`is_active = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );

  params.push(filters.limit, filters.offset);
  const rowsResult = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number.parseInt(countResult.rows[0].count, 10) };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, isActive]
  );
  return result.rows[0] ?? null;
}

export async function setUserRole(userId: string, role: Role): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users SET role = $2, updated_at = now() WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, role]
  );
  return result.rows[0] ?? null;
}
