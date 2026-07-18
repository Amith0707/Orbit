import { supabase, unwrap } from "../db/supabase-client.js";

export interface DepartmentRow {
  id: string;
  name: string;
}

export async function listDepartments(): Promise<DepartmentRow[]> {
  return unwrap(await supabase.from("departments").select("id, name").order("name"));
}

export async function findDepartmentById(id: string): Promise<DepartmentRow | null> {
  const rows = unwrap(await supabase.from("departments").select("id, name").eq("id", id));
  return rows[0] ?? null;
}
