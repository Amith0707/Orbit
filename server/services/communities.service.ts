import * as communitiesRepo from "../repositories/communities.repository.js";
import { getCommunityTags, setCommunityTags } from "../repositories/tags.repository.js";
import { slugify } from "../utils/slugify.js";
import { AppError } from "../utils/app-error.js";
import type { CommunityRow, CommunityWithStats } from "../repositories/communities.repository.js";

async function toDTO(row: CommunityRow | CommunityWithStats) {
  const tags = await getCommunityTags(row.id);
  const withStats = row as CommunityWithStats;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    createdBy: row.created_by,
    isArchived: row.is_archived,
    memberCount: withStats.member_count ? Number.parseInt(withStats.member_count, 10) : undefined,
    viewerRole: withStats.viewer_role ?? undefined,
    tags: tags.map((t) => ({ id: t.id, kind: t.kind, name: t.name })),
    createdAt: row.created_at,
  };
}

export async function createCommunity(input: {
  name: string;
  description?: string;
  coverImageUrl?: string;
  tagIds?: string[];
  createdBy: string;
}) {
  const baseSlug = slugify(input.name);
  if (!baseSlug) throw AppError.badRequest("Community name must contain letters or numbers");

  let slug = baseSlug;
  let suffix = 1;
  while (await communitiesRepo.slugExists(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const community = await communitiesRepo.createCommunity({
    name: input.name,
    slug,
    description: input.description,
    coverImageUrl: input.coverImageUrl,
    createdBy: input.createdBy,
  });

  await communitiesRepo.joinCommunity(community.id, input.createdBy, "owner");
  if (input.tagIds?.length) {
    await setCommunityTags(community.id, input.tagIds);
  }

  return getCommunityBySlug(slug, input.createdBy);
}

export async function listCommunities(input: {
  viewerId: string;
  search?: string;
  joinedOnly?: boolean;
  limit: number;
  offset: number;
}) {
  const { rows, total } = await communitiesRepo.listCommunities(input);
  const communities = await Promise.all(rows.map(toDTO));
  return { communities, total };
}

export async function listMyCommunities(viewerId: string) {
  const rows = await communitiesRepo.listCommunitiesForUser(viewerId);
  return Promise.all(rows.map(toDTO));
}

export async function getCommunityBySlug(slug: string, viewerId: string) {
  const community = await communitiesRepo.findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");

  const [memberCount, membership] = await Promise.all([
    communitiesRepo.countCommunityMembers(community.id),
    communitiesRepo.getMembership(community.id, viewerId),
  ]);

  return toDTO({
    ...community,
    member_count: String(memberCount),
    viewer_role: membership?.role ?? null,
  });
}

export async function joinCommunity(slug: string, userId: string) {
  const community = await communitiesRepo.findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  await communitiesRepo.joinCommunity(community.id, userId);
  return getCommunityBySlug(slug, userId);
}

export async function leaveCommunity(slug: string, userId: string) {
  const community = await communitiesRepo.findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  const membership = await communitiesRepo.getMembership(community.id, userId);
  if (membership?.role === "owner") {
    throw AppError.badRequest("The community owner cannot leave. Transfer ownership or archive the community instead.");
  }
  await communitiesRepo.leaveCommunity(community.id, userId);
}

export async function getMembers(slug: string) {
  const community = await communitiesRepo.findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  const members = await communitiesRepo.listCommunityMembers(community.id);
  return members.map((m) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    firstName: m.first_name,
    lastName: m.last_name,
    avatarUrl: m.avatar_url,
    jobTitle: m.job_title,
  }));
}

export async function requireMembership(communityId: string, userId: string, roles?: string[]) {
  const membership = await communitiesRepo.getMembership(communityId, userId);
  if (!membership) throw AppError.forbidden("You must be a member of this community");
  if (roles && !roles.includes(membership.role)) {
    throw AppError.forbidden("You do not have permission to do this in this community");
  }
  return membership;
}

export async function getCommunityOrThrow(communityId: string) {
  const community = await communitiesRepo.findCommunityById(communityId);
  if (!community) throw AppError.notFound("Community not found");
  return community;
}
