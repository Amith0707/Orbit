import { api } from "@/lib/http/apiClient";

export interface ProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: string;
  jobTitle: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  hireDate: string | null;
  department: { id: string; name: string } | null;
  interests: string[];
  hobbies: string[];
  skills: string[];
  createdAt: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  departmentId?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  location?: string | null;
  availability?: string | null;
  tagIds?: string[];
}

export async function getMyProfile(): Promise<ProfileDTO> {
  const { data } = await api.get<{ profile: ProfileDTO }>("/users/me");
  return data.profile;
}

export async function getUserProfile(userId: string): Promise<ProfileDTO> {
  const { data } = await api.get<{ profile: ProfileDTO }>(`/users/${userId}`);
  return data.profile;
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<ProfileDTO> {
  const { data } = await api.patch<{ profile: ProfileDTO }>("/users/me", input);
  return data.profile;
}

export async function uploadAvatar(file: File): Promise<ProfileDTO> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await api.post<{ profile: ProfileDTO }>("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.profile;
}

export interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: { id: string; name: string } | null;
  interests: string[];
  hobbies: string[];
  skills: string[];
}

export async function listDirectory(params: { search?: string; departmentId?: string; limit?: number; offset?: number }) {
  const { data } = await api.get<{ users: DirectoryUser[]; total: number }>("/users", { params });
  return data;
}
