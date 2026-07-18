import { api } from "@/lib/http/apiClient";

export type TagKind = "interest" | "hobby" | "skill";

export interface Tag {
  id: string;
  kind: TagKind;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

export async function listTags(kind?: TagKind): Promise<Tag[]> {
  const { data } = await api.get<{ tags: Tag[] }>("/meta/tags", { params: kind ? { kind } : undefined });
  return data.tags;
}

export async function listDepartments(): Promise<Department[]> {
  const { data } = await api.get<{ departments: Department[] }>("/meta/departments");
  return data.departments;
}
