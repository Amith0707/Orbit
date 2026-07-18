import * as pollsRepo from "../repositories/polls.repository.js";
import * as communitiesService from "./communities.service.js";
import { findPostById } from "../repositories/posts.repository.js";
import { notifyUsers } from "./notifications.service.js";
import { findCommunityBySlug, listCommunityMembers } from "../repositories/communities.repository.js";
import { AppError } from "../utils/app-error.js";

export interface PollResultsDTO {
  id: string;
  postId: string | null;
  question: string;
  allowMultipleChoices: boolean;
  closesAt: string | null;
  isClosed: boolean;
  isPastDeadline: boolean;
  aiSummary: string | null;
  totalVoters: number;
  viewerVoteOptionIds: string[];
  options: { id: string; label: string; voteCount: number; percentage: number }[];
}

export async function createPoll(
  slug: string,
  userId: string,
  input: { question: string; options: string[]; allowMultipleChoices: boolean; closesAt?: Date }
) {
  const community = await findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  await communitiesService.requireMembership(community.id, userId);

  if (input.options.length < 2) throw AppError.badRequest("A poll needs at least 2 options");

  const { postId } = await pollsRepo.createPollWithPost({
    communityId: community.id,
    authorId: userId,
    question: input.question,
    options: input.options,
    allowMultipleChoices: input.allowMultipleChoices,
    closesAt: input.closesAt,
  });

  const members = await listCommunityMembers(community.id);
  const recipientIds = members.map((m) => m.user_id).filter((id) => id !== userId);
  await notifyUsers(recipientIds, {
    type: "poll_new",
    title: "New poll posted",
    body: input.question,
    linkUrl: `/communities/posts/${postId}`,
  });

  return getResultsByPostId(postId, userId);
}

async function buildResults(poll: pollsRepo.PollRow, viewerId: string): Promise<PollResultsDTO> {
  const [options, counts, viewerVotes, totalVoters] = await Promise.all([
    pollsRepo.listPollOptions(poll.id),
    pollsRepo.countVotesByOption(poll.id),
    pollsRepo.getViewerVotes(poll.id, viewerId),
    pollsRepo.countUniqueVoters(poll.id),
  ]);

  const countMap = new Map(counts.map((c) => [c.poll_option_id, Number.parseInt(c.vote_count, 10)]));
  const totalVotes = counts.reduce((sum, c) => sum + Number.parseInt(c.vote_count, 10), 0);

  return {
    id: poll.id,
    postId: poll.post_id,
    question: poll.question,
    allowMultipleChoices: poll.allow_multiple_choices,
    closesAt: poll.closes_at,
    isClosed: poll.is_closed,
    isPastDeadline: poll.closes_at ? new Date(poll.closes_at) < new Date() : false,
    aiSummary: poll.ai_summary,
    totalVoters,
    viewerVoteOptionIds: viewerVotes,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      voteCount: countMap.get(o.id) ?? 0,
      percentage: totalVotes > 0 ? Math.round(((countMap.get(o.id) ?? 0) / totalVotes) * 1000) / 10 : 0,
    })),
  };
}

export async function getResultsByPostId(postId: string, viewerId: string): Promise<PollResultsDTO> {
  const poll = await pollsRepo.findPollByPostId(postId);
  if (!poll) throw AppError.notFound("This post does not have a poll");
  return buildResults(poll, viewerId);
}

export async function vote(postId: string, userId: string, optionIds: string[]) {
  const poll = await pollsRepo.findPollByPostId(postId);
  if (!poll) throw AppError.notFound("This post does not have a poll");
  if (poll.is_closed) throw AppError.badRequest("This poll is closed");
  if (poll.closes_at && new Date(poll.closes_at) < new Date()) {
    throw AppError.badRequest("The voting window for this poll has ended");
  }

  const post = await findPostById(postId, userId);
  if (post?.community_id) {
    await communitiesService.requireMembership(post.community_id, userId);
  }

  const validOptions = await pollsRepo.listPollOptions(poll.id);
  const validIds = new Set(validOptions.map((o) => o.id));
  const filteredOptionIds = optionIds.filter((id) => validIds.has(id));
  if (filteredOptionIds.length === 0) throw AppError.badRequest("No valid options selected");
  if (!poll.allow_multiple_choices && filteredOptionIds.length > 1) {
    throw AppError.badRequest("This poll only allows a single choice");
  }

  await pollsRepo.castVote(poll.id, userId, filteredOptionIds, poll.allow_multiple_choices);
  return getResultsByPostId(postId, userId);
}

export async function getPollForClose(postId: string) {
  const poll = await pollsRepo.findPollByPostId(postId);
  if (!poll) throw AppError.notFound("This post does not have a poll");
  if (poll.is_closed) throw AppError.badRequest("This poll is already closed");
  return poll;
}

export async function finalizeClose(pollId: string, aiSummary: string) {
  return pollsRepo.closePoll(pollId, aiSummary);
}
