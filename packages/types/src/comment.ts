import { z } from 'zod';

/**
 * Comment reaction types
 */
export const CommentReaction = {
  LIKE: 'like',
  LOVE: 'love',
  HELPFUL: 'helpful',
  UNHELPFUL: 'unhelpful',
  THINKING: 'thinking',
  CELEBRATE: 'celebrate',
} as const;

export type CommentReaction = typeof CommentReaction[keyof typeof CommentReaction];

/**
 * Comment status
 */
export const CommentStatus = {
  ACTIVE: 'active',
  DELETED: 'deleted',
  HIDDEN: 'hidden',
  FLAGGED: 'flagged',
} as const;

export type CommentStatus = typeof CommentStatus[keyof typeof CommentStatus];

/**
 * Line comment position
 */
export interface CommentPosition {
  lineNumber: number;
  side: 'left' | 'right';
  startOffset?: number;
  endOffset?: number;
}

/**
 * Comment author info
 */
export interface CommentAuthor {
  displayName: string;
  avatarUrl?: string;
}

/**
 * Comment reaction summary
 */
export interface ReactionSummary {
  type: CommentReaction;
  count: number;
  hasReacted: boolean;
  users: Array<{
    id: string;
    displayName: string;
  }>;
}

/**
 * Comment object
 */
export interface Comment {
  id: string;
  diffId: string;
  parentId?: string;
  threadId?: string;
  
  author: CommentAuthor;
  content: string;
  contentHtml: string; // Sanitized HTML
  
  position?: CommentPosition; // For line comments
  
  status: CommentStatus;
  editedAt?: Date;
  
  reactions: ReactionSummary[];
  replyCount: number;
  
  metadata: {
    isResolved: boolean;
    isPinned: boolean;
    mentionedUsers: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comment thread
 */
export interface CommentThread {
  id: string;
  diffId: string;
  position?: CommentPosition;
  
  status: 'open' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: Date;
  
  participants: CommentAuthor[];
  commentCount: number;
  lastActivityAt: Date;
  
  comments: Comment[];
}

/**
 * Create comment input
 */
export interface CreateCommentInput {
  diffId: string;
  content: string;
  authorName?: string;
  parentId?: string;
  position?: CommentPosition;
}

/**
 * Update comment input
 */
export interface UpdateCommentInput {
  content: string;
}

/**
 * Add reaction input
 */
export interface AddReactionInput {
  commentId: string;
  reaction: CommentReaction;
}

// Zod schemas
export const CommentReactionSchema = z.enum([
  CommentReaction.LIKE,
  CommentReaction.LOVE,
  CommentReaction.HELPFUL,
  CommentReaction.UNHELPFUL,
  CommentReaction.THINKING,
  CommentReaction.CELEBRATE,
]);

export const CommentStatusSchema = z.enum([
  CommentStatus.ACTIVE,
  CommentStatus.DELETED,
  CommentStatus.HIDDEN,
  CommentStatus.FLAGGED,
]);

export const CommentPositionSchema = z.object({
  lineNumber: z.number().int().min(1),
  side: z.enum(['left', 'right']),
  startOffset: z.number().int().min(0).optional(),
  endOffset: z.number().int().min(0).optional(),
});

export const CommentAuthorSchema = z.object({
  displayName: z.string(),
  avatarUrl: z.string().url().optional(),
});

export const ReactionSummarySchema = z.object({
  type: CommentReactionSchema,
  count: z.number().int().min(0),
  hasReacted: z.boolean(),
  users: z.array(z.object({
    id: z.string(),
    displayName: z.string(),
  })),
});

export const CommentSchema = z.object({
  id: z.string(),
  diffId: z.string(),
  parentId: z.string().optional(),
  threadId: z.string().optional(),
  
  author: CommentAuthorSchema,
  content: z.string().min(1).max(5000),
  contentHtml: z.string(),
  
  position: CommentPositionSchema.optional(),
  
  status: CommentStatusSchema,
  editedAt: z.date().optional(),
  
  reactions: z.array(ReactionSummarySchema),
  replyCount: z.number().int().min(0),
  
  metadata: z.object({
    isResolved: z.boolean(),
    isPinned: z.boolean(),
    mentionedUsers: z.array(z.string()),
  }),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CommentThreadSchema = z.object({
  id: z.string(),
  diffId: z.string(),
  position: CommentPositionSchema.optional(),
  
  status: z.enum(['open', 'resolved']),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  
  participants: z.array(CommentAuthorSchema),
  commentCount: z.number().int().min(0),
  lastActivityAt: z.date(),
  
  comments: z.array(CommentSchema),
});

export const CreateCommentInputSchema = z.object({
  diffId: z.string(),
  content: z.string().min(1).max(5000),
  authorName: z.string().optional(),
  parentId: z.string().optional(),
  position: CommentPositionSchema.optional(),
});

export const UpdateCommentInputSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const AddReactionInputSchema = z.object({
  commentId: z.string(),
  reaction: CommentReactionSchema,
});