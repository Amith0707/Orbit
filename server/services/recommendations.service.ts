import { listCandidateCommunities, listCandidateCoworkers } from "../repositories/recommendations.repository.js";
import { getUserTags, getCommunityTagsForCommunities, type TagRow } from "../repositories/tags.repository.js";
import { findUserById } from "../repositories/users.repository.js";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function groupByKind(tags: TagRow[]) {
  return {
    interests: tags.filter((t) => t.kind === "interest").map((t) => t.name),
    hobbies: tags.filter((t) => t.kind === "hobby").map((t) => t.name),
    skills: tags.filter((t) => t.kind === "skill").map((t) => t.name),
  };
}

function intersectByName(a: string[], b: string[]): string[] {
  const bLower = new Set(b.map((n) => n.toLowerCase()));
  return a.filter((n) => bLower.has(n.toLowerCase()));
}

export interface TagOverlap {
  sharedInterests: string[];
  sharedHobbies: string[];
  sharedSkills: string[];
}

export async function computeTagOverlap(userIdA: string, userIdB: string): Promise<TagOverlap> {
  const [tagsA, tagsB] = await Promise.all([getUserTags(userIdA), getUserTags(userIdB)]);
  const groupedA = groupByKind(tagsA);
  const groupedB = groupByKind(tagsB);
  return {
    sharedInterests: intersectByName(groupedA.interests, groupedB.interests),
    sharedHobbies: intersectByName(groupedA.hobbies, groupedB.hobbies),
    sharedSkills: intersectByName(groupedA.skills, groupedB.skills),
  };
}

export interface CommunityScoreResult {
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  score: number;
  breakdown: {
    sharedInterests: string[];
    sharedHobbies: string[];
    sharedSkills: string[];
    coworkerCount: number;
  };
}

export async function scoreCommunityCandidates(userId: string, limit = 6): Promise<CommunityScoreResult[]> {
  const user = await findUserById(userId);
  const userTags = await getUserTags(userId);
  const userGrouped = groupByKind(userTags);

  const candidates = await listCandidateCommunities(userId, user?.department_id ?? null);
  if (candidates.length === 0) return [];

  const tagsByCommunity = await getCommunityTagsForCommunities(candidates.map((c) => c.id));

  const scored = candidates.map((c) => {
    const communityTags = groupByKind(tagsByCommunity.get(c.id) ?? []);
    const sharedInterests = intersectByName(userGrouped.interests, communityTags.interests);
    const sharedHobbies = intersectByName(userGrouped.hobbies, communityTags.hobbies);
    const sharedSkills = intersectByName(userGrouped.skills, communityTags.skills);
    const sharedTagCount = sharedInterests.length + sharedHobbies.length + sharedSkills.length;
    const coworkerCount = Number.parseInt(c.coworker_count, 10);

    const score = clamp01(sharedTagCount * 0.2 + Math.min(coworkerCount, 5) * 0.1);

    return {
      communityId: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverImageUrl: c.cover_image_url,
      memberCount: Number.parseInt(c.member_count, 10),
      score,
      breakdown: { sharedInterests, sharedHobbies, sharedSkills, coworkerCount },
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface CoworkerScoreResult {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  score: number;
  breakdown: {
    sharedInterests: string[];
    sharedHobbies: string[];
    sharedSkills: string[];
    sameDepartment: boolean;
    departmentName: string | null;
    sharedCommunityCount: number;
    sharedUpcomingEventCount: number;
  };
}

export async function scoreCoworkerCandidates(userId: string, limit = 6): Promise<CoworkerScoreResult[]> {
  const user = await findUserById(userId);
  const userTags = await getUserTags(userId);
  const userGrouped = groupByKind(userTags);

  const candidates = await listCandidateCoworkers(userId, 100);
  if (candidates.length === 0) return [];

  const tagMap = new Map<string, TagRow[]>();
  await Promise.all(
    candidates.map(async (c) => {
      tagMap.set(c.id, await getUserTags(c.id));
    })
  );

  const scored = candidates.map((c) => {
    const candidateGrouped = groupByKind(tagMap.get(c.id) ?? []);
    const sharedInterests = intersectByName(userGrouped.interests, candidateGrouped.interests);
    const sharedHobbies = intersectByName(userGrouped.hobbies, candidateGrouped.hobbies);
    const sharedSkills = intersectByName(userGrouped.skills, candidateGrouped.skills);
    const sharedTagCount = sharedInterests.length + sharedHobbies.length + sharedSkills.length;
    const sameDepartment = Boolean(user?.department_id) && c.department_id === user?.department_id;
    const sharedCommunityCount = Number.parseInt(c.shared_community_count, 10);
    const sharedUpcomingEventCount = Number.parseInt(c.shared_upcoming_event_count, 10);

    const score = clamp01(
      sharedTagCount * 0.15 +
        (sameDepartment ? 0.15 : 0) +
        Math.min(sharedCommunityCount, 3) * 0.1 +
        Math.min(sharedUpcomingEventCount, 3) * 0.1
    );

    return {
      userId: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      avatarUrl: c.avatar_url,
      jobTitle: c.job_title,
      score,
      breakdown: {
        sharedInterests,
        sharedHobbies,
        sharedSkills,
        sameDepartment,
        departmentName: c.department_name,
        sharedCommunityCount,
        sharedUpcomingEventCount,
      },
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
