import * as postsRepo from "../repositories/posts.repository.js";
import * as communitiesService from "./communities.service.js";
import * as notificationsService from "./notifications.service.js";
import { findCommunityBySlug, listCommunityMembers } from "../repositories/communities.repository.js";
import { AppError } from "../utils/app-error.js";
import type { PostWithAuthor, CommentRow } from "../repositories/posts.repository.js";
import type { Role } from "../types/express.js";

function toPostDTO(row: PostWithAuthor) {
  return {
    id: row.id,
    communityId: row.community_id,
    body: row.body,
    imageUrl: row.image_url,
    isPinned: row.is_pinned,
    hasPoll: row.has_poll,
    commentCount: Number.parseInt(row.comment_count, 10),
    reactionCount: Number.parseInt(row.reaction_count, 10),
    viewerReaction: row.viewer_reaction,
    author: { id: row.author_id, firstName: row.first_name, lastName: row.last_name, avatarUrl: row.avatar_url },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCommentDTO(row: CommentRow) {
  return {
    id: row.id,
    postId: row.post_id,
    parentCommentId: row.parent_comment_id,
    body: row.body,
    author: { id: row.author_id, firstName: row.first_name, lastName: row.last_name, avatarUrl: row.avatar_url },
    createdAt: row.created_at,
  };
}

async function resolveCommunity(slug: string) {
  const community = await findCommunityBySlug(slug);
  if (!community) throw AppError.notFound("Community not found");
  return community;
}

export async function createPost(slug: string, userId: string, input: { body: string; imageUrl?: string }) {
  const community = await resolveCommunity(slug);
  await communitiesService.requireMembership(community.id, userId);

  const post = await postsRepo.createPost({ communityId: community.id, authorId: userId, body: input.body, imageUrl: input.imageUrl });
  const full = await postsRepo.findPostById(post.id, userId);
  return toPostDTO(full!);
}

export async function listPosts(slug: string, viewerId: string, limit: number, offset: number) {
  const community = await resolveCommunity(slug);
  const { rows, total } = await postsRepo.listCommunityPosts(community.id, viewerId, limit, offset);
  return { posts: rows.map(toPostDTO), total };
}

export async function getPost(postId: string, viewerId: string) {
  const post = await postsRepo.findPostById(postId, viewerId);
  if (!post) throw AppError.notFound("Post not found");
  return toPostDTO(post);
}

async function requirePostAccess(
  postId: string,
  userId: string,
  requesterRole: Role,
  requireAuthorOrModerator: boolean
) {
  const post = await postsRepo.findPostById(postId, userId);
  if (!post) throw AppError.notFound("Post not found");
  if (requireAuthorOrModerator && post.author_id !== userId && requesterRole !== "administrator") {
    if (!post.community_id) throw AppError.forbidden();
    await communitiesService.requireMembership(post.community_id, userId, ["moderator", "owner"]);
  }
  return post;
}

export async function pinPost(postId: string, userId: string, requesterRole: Role, isPinned: boolean) {
  const post = await requirePostAccess(postId, userId, requesterRole, true);
  await postsRepo.setPinned(postId, isPinned);
  const updated = await postsRepo.findPostById(post.id, userId);
  return toPostDTO(updated!);
}

export async function deletePost(postId: string, userId: string, requesterRole: Role) {
  await requirePostAccess(postId, userId, requesterRole, true);
  await postsRepo.softDeletePost(postId);
}

const VALID_REACTIONS = new Set(["like", "celebrate", "support", "love", "insightful", "curious"]);

export async function react(postId: string, userId: string, reactionType: string) {
  if (!VALID_REACTIONS.has(reactionType)) throw AppError.badRequest("Invalid reaction type");
  const post = await postsRepo.findPostById(postId, userId);
  if (!post) throw AppError.notFound("Post not found");

  await postsRepo.upsertReaction(postId, userId, reactionType);

  if (post.author_id !== userId) {
    await notificationsService.notifyUser({
      userId: post.author_id,
      type: "post_reaction",
      title: "New reaction on your post",
      body: `Someone reacted to your post`,
      linkUrl: `/communities/posts/${postId}`,
    });
  }

  const updated = await postsRepo.findPostById(postId, userId);
  return toPostDTO(updated!);
}

export async function removeReaction(postId: string, userId: string) {
  await postsRepo.removeReaction(postId, userId);
  const updated = await postsRepo.findPostById(postId, userId);
  if (!updated) throw AppError.notFound("Post not found");
  return toPostDTO(updated);
}

export async function addComment(postId: string, userId: string, input: { body: string; parentCommentId?: string }) {
  const post = await postsRepo.findPostById(postId, userId);
  if (!post) throw AppError.notFound("Post not found");
  if (post.community_id) {
    await communitiesService.requireMembership(post.community_id, userId);
  }

  const comment = await postsRepo.createComment({ postId, authorId: userId, body: input.body, parentCommentId: input.parentCommentId });

  if (post.author_id !== userId) {
    await notificationsService.notifyUser({
      userId: post.author_id,
      type: "post_comment",
      title: "New comment on your post",
      body: input.body.slice(0, 140),
      linkUrl: `/communities/posts/${postId}`,
    });
  }

  return toCommentDTO(comment);
}

export async function listComments(postId: string) {
  const comments = await postsRepo.listComments(postId);
  return comments.map(toCommentDTO);
}

export async function deleteComment(commentId: string, userId: string, requesterRole: Role) {
  const comment = await postsRepo.findCommentById(commentId);
  if (!comment) throw AppError.notFound("Comment not found");
  if (comment.author_id !== userId && requesterRole !== "administrator") {
    const post = await postsRepo.findPostById(comment.post_id, userId);
    if (post?.community_id) {
      await communitiesService.requireMembership(post.community_id, userId, ["moderator", "owner"]);
    } else {
      throw AppError.forbidden();
    }
  }
  await postsRepo.softDeleteComment(commentId);
}

export async function notifyCommunityOfNewPost(communityId: string, excludeUserId: string, title: string, linkUrl: string) {
  const members = await listCommunityMembers(communityId);
  const recipientIds = members.map((m) => m.user_id).filter((id) => id !== excludeUserId);
  await notificationsService.notifyUsers(recipientIds, { type: "poll_new", title, linkUrl });
}
