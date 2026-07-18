import * as challengesRepo from "../repositories/challenges.repository.js";
import * as communitiesService from "./communities.service.js";
import { findCommunityBySlug, listCommunityMembers } from "../repositories/communities.repository.js";
import { notifyUsers } from "./notifications.service.js";
import { AppError } from "../utils/app-error.js";
import type { ChallengeRow } from "../repositories/challenges.repository.js";

export function toChallengeDTO(row: ChallengeRow, participantCount: number) {
  return {
    id: row.id,
    communityId: row.community_id,
    title: row.title,
    description: row.description,
    goalMetric: row.goal_metric,
    goalTarget: row.goal_target ? Number.parseFloat(row.goal_target) : null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    source: row.source,
    participantCount,
    createdAt: row.created_at,
  };
}

export async function createChallenge(
  slug: string,
  userId: string,
  input: { title: string; description: string; goalMetric?: string; goalTarget?: number; startsAt: string; endsAt: string }
) {
  const community = await findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  await communitiesService.requireMembership(community.id, userId, ["moderator", "owner"]);

  const challenge = await challengesRepo.createChallenge({
    communityId: community.id,
    createdBy: userId,
    ...input,
    status: "active",
    source: "manual",
  });

  const members = await listCommunityMembers(community.id);
  await notifyUsers(
    members.map((m) => m.user_id).filter((id) => id !== userId),
    { type: "challenge_new", title: `New challenge: ${challenge.title}`, linkUrl: `/communities/${slug}` }
  );

  return toChallengeDTO(challenge, 0);
}

export async function listChallenges(slug: string) {
  const community = await findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  const challenges = await challengesRepo.listChallengesForCommunity(community.id);
  const withCounts = await Promise.all(
    challenges.map(async (c) => toChallengeDTO(c, await challengesRepo.countParticipants(c.id)))
  );
  return withCounts;
}

export async function joinChallenge(challengeId: string, userId: string) {
  const challenge = await challengesRepo.findChallengeById(challengeId);
  if (!challenge) throw AppError.notFound("Challenge not found");
  await communitiesService.requireMembership(challenge.community_id, userId);
  await challengesRepo.joinChallenge(challengeId, userId);
  return toChallengeDTO(challenge, await challengesRepo.countParticipants(challengeId));
}

export async function publishChallenge(challengeId: string, userId: string) {
  const challenge = await challengesRepo.findChallengeById(challengeId);
  if (!challenge) throw AppError.notFound("Challenge not found");
  await communitiesService.requireMembership(challenge.community_id, userId, ["moderator", "owner"]);
  const published = await challengesRepo.publishChallenge(challengeId);

  const members = await listCommunityMembers(challenge.community_id);
  await notifyUsers(
    members.map((m) => m.user_id).filter((id) => id !== userId),
    { type: "challenge_new", title: `New challenge: ${published.title}`, linkUrl: `/communities/${challenge.community_id}` }
  );

  return toChallengeDTO(published, 0);
}
