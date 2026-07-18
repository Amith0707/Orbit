export type Role = "employee" | "administrator";

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: Role;
  departmentId: string | null;
  jobTitle: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  hireDate: string | null;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
