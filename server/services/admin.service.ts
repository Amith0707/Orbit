import { listUsers, setUserActive, setUserRole, type UserRow } from "../repositories/users.repository.js";
import {
  adminListCommunities,
  setCommunityArchived,
  countCommunityMembers,
} from "../repositories/communities.repository.js";
import { adminListRecentPosts } from "../repositories/posts.repository.js";
import { listDepartments } from "../repositories/departments.repository.js";
import { AppError } from "../utils/app-error.js";
import type { Role } from "../types/express.js";

function toAdminUserDTO(user: UserRow, departmentName: string | null) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    department: user.department_id ? { id: user.department_id, name: departmentName } : null,
    jobTitle: user.job_title,
    isActive: user.is_active,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

export async function adminListUsers(filters: { search?: string; role?: Role; isActive?: boolean; limit: number; offset: number }) {
  const { rows, total } = await listUsers(filters);
  const departments = await listDepartments();
  const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
  return {
    total,
    users: rows.map((u) => toAdminUserDTO(u, u.department_id ? (departmentMap.get(u.department_id) ?? null) : null)),
  };
}

export async function adminSetUserRole(targetUserId: string, requesterId: string, role: Role) {
  if (targetUserId === requesterId && role !== "administrator") {
    throw AppError.badRequest("You cannot remove your own administrator access");
  }
  const updated = await setUserRole(targetUserId, role);
  if (!updated) throw AppError.notFound("User not found");
  return toAdminUserDTO(updated, null);
}

export async function adminSetUserActive(targetUserId: string, requesterId: string, isActive: boolean) {
  if (targetUserId === requesterId && !isActive) {
    throw AppError.badRequest("You cannot deactivate your own account");
  }
  const updated = await setUserActive(targetUserId, isActive);
  if (!updated) throw AppError.notFound("User not found");
  return toAdminUserDTO(updated, null);
}

export async function adminListCommunitiesWithStats(limit: number, offset: number) {
  const { rows, total } = await adminListCommunities(limit, offset);
  return {
    total,
    communities: rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      isArchived: c.is_archived,
      memberCount: Number.parseInt(c.member_count, 10),
      createdAt: c.created_at,
    })),
  };
}

export async function adminSetCommunityArchived(communityId: string, isArchived: boolean) {
  const updated = await setCommunityArchived(communityId, isArchived);
  if (!updated) throw AppError.notFound("Community not found");
  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    isArchived: updated.is_archived,
    memberCount: await countCommunityMembers(updated.id),
  };
}

export async function adminListRecentPostsForModeration(limit: number, offset: number) {
  const { rows, total } = await adminListRecentPosts(limit, offset);
  return {
    total,
    posts: rows.map((p) => ({
      id: p.id,
      body: p.body,
      imageUrl: p.image_url,
      communityId: p.community_id,
      communityName: p.community_name,
      isPinned: p.is_pinned,
      commentCount: Number.parseInt(p.comment_count, 10),
      reactionCount: Number.parseInt(p.reaction_count, 10),
      author: { id: p.author_id, firstName: p.first_name, lastName: p.last_name, avatarUrl: p.avatar_url },
      createdAt: p.created_at,
    })),
  };
}

