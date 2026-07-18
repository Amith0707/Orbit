import type { Request, Response } from "express";
import { pathParam } from "../utils/params.js";
import { z } from "zod";
import * as postsService from "../services/posts.service.js";

export const createPostSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  imageUrl: z.string().url().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const reactSchema = z.object({
  reactionType: z.enum(["like", "celebrate", "support", "love", "insightful", "curious"]),
});

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
});

export async function handleCreatePost(req: Request, res: Response) {
  const input = createPostSchema.parse(req.body);
  const post = await postsService.createPost(pathParam(req, "slug"), req.user!.id, input);
  res.status(201).json({ post });
}

export async function handleListPosts(req: Request, res: Response) {
  const { limit, offset } = listQuerySchema.parse(req.query);
  const result = await postsService.listPosts(pathParam(req, "slug"), req.user!.id, limit, offset);
  res.json(result);
}

export async function handleGetPost(req: Request, res: Response) {
  const post = await postsService.getPost(pathParam(req, "postId"), req.user!.id);
  res.json({ post });
}

export async function handlePin(req: Request, res: Response) {
  const post = await postsService.pinPost(pathParam(req, "postId"), req.user!.id, req.user!.role, true);
  res.json({ post });
}

export async function handleUnpin(req: Request, res: Response) {
  const post = await postsService.pinPost(pathParam(req, "postId"), req.user!.id, req.user!.role, false);
  res.json({ post });
}

export async function handleDeletePost(req: Request, res: Response) {
  await postsService.deletePost(pathParam(req, "postId"), req.user!.id, req.user!.role);
  res.json({ success: true });
}

export async function handleReact(req: Request, res: Response) {
  const { reactionType } = reactSchema.parse(req.body);
  const post = await postsService.react(pathParam(req, "postId"), req.user!.id, reactionType);
  res.json({ post });
}

export async function handleRemoveReaction(req: Request, res: Response) {
  const post = await postsService.removeReaction(pathParam(req, "postId"), req.user!.id);
  res.json({ post });
}

export async function handleListComments(req: Request, res: Response) {
  const comments = await postsService.listComments(pathParam(req, "postId"));
  res.json({ comments });
}

export async function handleCreateComment(req: Request, res: Response) {
  const input = createCommentSchema.parse(req.body);
  const comment = await postsService.addComment(pathParam(req, "postId"), req.user!.id, input);
  res.status(201).json({ comment });
}

export async function handleDeleteComment(req: Request, res: Response) {
  await postsService.deleteComment(pathParam(req, "commentId"), req.user!.id, req.user!.role);
  res.json({ success: true });
}
