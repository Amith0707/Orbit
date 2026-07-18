import {
  findUserById,
  updateUserProfile,
  listUsers,
  type UpdateProfileInput,
} from "../repositories/users.repository.js";
import { getUserTags, setUserTags, getUserTagsForUsers, type TagRow } from "../repositories/tags.repository.js";
import { findDepartmentById, listDepartments as listDepartmentsRepo } from "../repositories/departments.repository.js";
import { AppError } from "../utils/app-error.js";

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

function groupTags(tags: TagRow[]) {
  return {
    interests: tags.filter((t) => t.kind === "interest").map((t) => t.name),
    hobbies: tags.filter((t) => t.kind === "hobby").map((t) => t.name),
    skills: tags.filter((t) => t.kind === "skill").map((t) => t.name),
  };
}

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const user = await findUserById(userId);
  if (!user) throw AppError.notFound("User not found");

  const [tags, department] = await Promise.all([
    getUserTags(userId),
    user.department_id ? findDepartmentById(user.department_id) : Promise.resolve(null),
  ]);

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    jobTitle: user.job_title,
    bio: user.bio,
    location: user.location,
    availability: user.availability,
    hireDate: user.hire_date,
    department,
    ...groupTags(tags),
    createdAt: user.created_at,
  };
}

export interface UpdateProfilePayload extends UpdateProfileInput {
  tagIds?: string[];
}

export async function updateProfile(userId: string, input: UpdateProfilePayload): Promise<ProfileDTO> {
  const { tagIds, ...profileFields } = input;
  await updateUserProfile(userId, profileFields);
  if (tagIds) {
    await setUserTags(userId, tagIds);
  }
  return getProfile(userId);
}

export interface DirectoryFilters {
  search?: string;
  departmentId?: string;
  limit: number;
  offset: number;
}

export async function listDirectory(filters: DirectoryFilters) {
  const { rows, total } = await listUsers({
    search: filters.search,
    limit: filters.limit,
    offset: filters.offset,
  });

  const filtered = filters.departmentId ? rows.filter((u) => u.department_id === filters.departmentId) : rows;
  const tagsByUser = await getUserTagsForUsers(filtered.map((u) => u.id));
  const departments = await listDepartmentsRepo();
  const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

  return {
    total,
    users: filtered.map((u) => {
      const tags = tagsByUser.get(u.id) ?? [];
      return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        avatarUrl: u.avatar_url,
        jobTitle: u.job_title,
        department: u.department_id ? { id: u.department_id, name: departmentMap.get(u.department_id) ?? "" } : null,
        ...groupTags(tags),
      };
    }),
  };
}

export async function listDepartments() {
  return listDepartmentsRepo();
}
