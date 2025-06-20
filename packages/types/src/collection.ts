import { z } from 'zod';
import { DiffVisibility } from './diff';

/**
 * Collection visibility (inherits from diff visibility)
 */
export type CollectionVisibility = DiffVisibility;

/**
 * Collection sort options
 */
export const CollectionSort = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TITLE: 'title',
  VIEW_COUNT: 'viewCount',
  DIFF_COUNT: 'diffCount',
} as const;

export type CollectionSort = typeof CollectionSort[keyof typeof CollectionSort];

/**
 * Collection metadata
 */
export interface CollectionMetadata {
  icon?: string;
  color?: string;
  coverImage?: string;
  featured: boolean;
  pinned: boolean;
}

/**
 * Collection object
 */
export interface Collection {
  id: string;
  
  title: string;
  description?: string;
  slug: string;
  
  visibility: CollectionVisibility;
  password?: string;
  
  metadata: CollectionMetadata;
  
  stats: {
    diffCount: number;
    totalViews: number;
    uniqueViewers: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Collection with diffs included
 */
export interface CollectionWithDiffs extends Collection {
  diffs: Array<{
    id: string;
    title?: string;
    addedAt: Date;
    order: number;
  }>;
}

/**
 * Create collection input
 */
export interface CreateCollectionInput {
  title: string;
  description?: string;
  slug?: string;
  visibility?: CollectionVisibility;
  password?: string;
  metadata?: Partial<CollectionMetadata>;
}

/**
 * Update collection input
 */
export interface UpdateCollectionInput {
  title?: string;
  description?: string;
  slug?: string;
  visibility?: CollectionVisibility;
  password?: string;
  metadata?: Partial<CollectionMetadata>;
}

/**
 * Add diff to collection input
 */
export interface AddDiffToCollectionInput {
  collectionId: string;
  diffId: string;
  order?: number;
}

// Zod schemas
export const CollectionMetadataSchema = z.object({
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  coverImage: z.string().url().optional(),
  featured: z.boolean(),
  pinned: z.boolean(),
});

export const CollectionSchema = z.object({
  id: z.string(),
  
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  
  visibility: z.enum(['public', 'private', 'unlisted', 'password']),
  password: z.string().min(6).optional(),
  
  metadata: CollectionMetadataSchema,
  
  stats: z.object({
    diffCount: z.number().int().min(0),
    totalViews: z.number().int().min(0),
    uniqueViewers: z.number().int().min(0),
  }),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CollectionWithDiffsSchema = CollectionSchema.extend({
  diffs: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    addedAt: z.date(),
    order: z.number().int(),
  })),
});

export const CreateCollectionInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  visibility: z.enum(['public', 'private', 'unlisted', 'password']).optional(),
  password: z.string().min(6).optional(),
  metadata: CollectionMetadataSchema.partial().optional(),
});

export const UpdateCollectionInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  visibility: z.enum(['public', 'private', 'unlisted', 'password']).optional(),
  password: z.string().min(6).optional(),
  metadata: CollectionMetadataSchema.partial().optional(),
});

export const AddDiffToCollectionInputSchema = z.object({
  collectionId: z.string(),
  diffId: z.string(),
  order: z.number().int().optional(),
});