import { query } from "../db/client.js";

export interface DepartmentRow {
  id: string;
  name: string;
}

export async function listDepartments(): Promise<DepartmentRow[]> {
  const result = await query<DepartmentRow>(`SELECT id, name FROM departments ORDER BY name`);
  return result.rows;
}

export async function findDepartmentById(id: string): Promise<DepartmentRow | null> {
  const result = await query<DepartmentRow>(`SELECT id, name FROM departments WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}
