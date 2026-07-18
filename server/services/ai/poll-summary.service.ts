import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import * as pollsService from "../polls.service.js";
import * as communitiesService from "../communities.service.js";
import { notifyUsers } from "../notifications.service.js";
import { listCommunityMembers } from "../../repositories/communities.repository.js";
import { AppError } from "../../utils/app-error.js";

const pollSummarySchema = z.object({
  summary: z
    .string()
    .min(10)
    .max(400)
    .describe("A short, friendly 2-3 sentence summary covering participation, the winning option, and a light conclusion"),
});

export async function closePollWithSummary(postId: string, userId: string) {
  const poll = await pollsService.getPollForClose(postId);

  if (poll.created_by !== userId) {
    if (!poll.community_id) throw AppError.forbidden();
    await communitiesService.requireMembership(poll.community_id, userId, ["moderator", "owner"]);
  }

  const results = await pollsService.getResultsByPostId(postId, userId);
  const prompt = [
    `Poll question: ${results.question}`,
    `Total unique voters: ${results.totalVoters}`,
    "Options:",
    ...results.options.map((o) => `- ${o.label}: ${o.voteCount} votes (${o.percentage}%)`),
  ].join("\n");

  let summary: string;
  try {
    const ai = await aiProvider.generateStructured({
      schema: pollSummarySchema,
      schemaName: "poll_summary",
      system:
        "Summarize these poll results factually, using ONLY the numbers given. Mention the winning option by name and the participation level. Keep it short, warm, and conversational — not a dry statistics readout.",
      prompt,
      temperature: 0.6,
    });
    summary = ai.summary;
  } catch (err) {
    console.error("Poll summary generation failed:", err);
    const winner = [...results.options].sort((a, b) => b.voteCount - a.voteCount)[0];
    summary = winner
      ? `"${winner.label}" won with ${winner.voteCount} of ${results.totalVoters} votes.`
      : "No votes were cast before this poll closed.";
  }

  await pollsService.finalizeClose(poll.id, summary);

  if (poll.community_id) {
    const members = await listCommunityMembers(poll.community_id);
    await notifyUsers(
      members.map((m) => m.user_id),
      { type: "poll_closed", title: `Poll closed: ${results.question}`, body: summary, linkUrl: `/communities/posts/${postId}` }
    );
  }

  return pollsService.getResultsByPostId(postId, userId);
}
