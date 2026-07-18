import { supabase, unwrap } from "../db/supabase-client.js";
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

const USER_COLUMNS =
  "id, email, password_hash, first_name, last_name, avatar_url, role, department_id, job_title, bio, location, availability, hire_date, is_active, last_login_at, created_at, updated_at";

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const rows = unwrap(
    await supabase.from("users").select(USER_COLUMNS).eq("email", email.trim().toLowerCase())
  ) as unknown as UserRow[];
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const rows = unwrap(await supabase.from("users").select(USER_COLUMNS).eq("id", id)) as unknown as UserRow[];
  return rows[0] ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role?: Role;
}): Promise<UserRow> {
  const rows = unwrap(
    await supabase
      .from("users")
      .insert({
        email: input.email.trim().toLowerCase(),
        password_hash: input.passwordHash,
        first_name: input.firstName,
        last_name: input.lastName,
        role: input.role ?? "employee",
      })
      .select(USER_COLUMNS)
  ) as unknown as UserRow[];
  return rows[0];
}

export async function promoteUserToAdmin(email: string): Promise<UserRow | null> {
  const rows = unwrap(
    await supabase
      .from("users")
      .update({ role: "administrator", updated_at: new Date().toISOString() })
      .eq("email", email.trim().toLowerCase())
      .select(USER_COLUMNS)
  ) as unknown as UserRow[];
  return rows[0] ?? null;
}

export async function updatePasswordAndPromote(email: string, passwordHash: string): Promise<UserRow | null> {
  const rows = unwrap(
    await supabase
      .from("users")
      .update({ password_hash: passwordHash, role: "administrator", updated_at: new Date().toISOString() })
      .eq("email", email.trim().toLowerCase())
      .select(USER_COLUMNS)
  ) as unknown as UserRow[];
  return rows[0] ?? null;
}

export async function touchLastLogin(userId: string): Promise<void> {
  unwrap(await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", userId));
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
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
  if (input.departmentId !== undefined) patch.department_id = input.departmentId;
  if (input.jobTitle !== undefined) patch.job_title = input.jobTitle;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.location !== undefined) patch.location = input.location;
  if (input.availability !== undefined) patch.availability = input.availability;

  const rows = unwrap(
    await supabase.from("users").update(patch).eq("id", userId).select(USER_COLUMNS)
  ) as unknown as UserRow[];
  return rows[0];
}

export interface ListUsersFilters {
  search?: string;
  role?: Role;
  isActive?: boolean;
  limit: number;
  offset: number;
}

export async function listUsers(filters: ListUsersFilters): Promise<{ rows: UserRow[]; total: number }> {
  const rows = unwrap(
    await supabase.rpc("list_users", {
      p_search: filters.search ? `%${filters.search.toLowerCase()}%` : null,
      p_role: filters.role ?? null,
      p_is_active: filters.isActive ?? null,
      p_limit: filters.limit,
      p_offset: filters.offset,
    })
  ) as (UserRow & { total_count: number })[];

  return {
    rows: rows.map((row) => {
      const { total_count, ...rest } = row;
      void total_count;
      return rest;
    }),
    total: rows[0]?.total_count ?? 0,
  };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<UserRow | null> {
  const rows = unwrap(
    await supabase
      .from("users")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select(USER_COLUMNS)
  ) as unknown as UserRow[];
  return rows[0] ?? null;
}

export async function setUserRole(userId: string, role: Role): Promise<UserRow | null> {
  const rows = unwrap(
    await supabase
      .from("users")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select(USER_COLUMNS)
  ) as unknown as UserRow[];
  return rows[0] ?? null;
}
