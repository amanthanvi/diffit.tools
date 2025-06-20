import { z } from 'zod';

/**
 * Diff view modes
 */
export const DiffViewMode = {
  SPLIT: 'split',
  UNIFIED: 'unified',
  INLINE: 'inline',
} as const;

export type DiffViewMode = typeof DiffViewMode[keyof typeof DiffViewMode];

/**
 * Diff content types
 */
export const DiffContentType = {
  TEXT: 'text',
  CODE: 'code',
  MARKDOWN: 'markdown',
  JSON: 'json',
  XML: 'xml',
  BINARY: 'binary',
} as const;

export type DiffContentType = typeof DiffContentType[keyof typeof DiffContentType];

/**
 * Diff visibility levels
 */
export const DiffVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
  PASSWORD: 'password',
} as const;

export type DiffVisibility = typeof DiffVisibility[keyof typeof DiffVisibility];

/**
 * Programming language for syntax highlighting
 */
export type ProgrammingLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'scala'
  | 'r'
  | 'sql'
  | 'html'
  | 'css'
  | 'scss'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'plaintext';

/**
 * Individual change within a diff
 */
export interface DiffChange {
  type: 'add' | 'remove' | 'modify' | 'equal';
  lineNumber: {
    left?: number;
    right?: number;
  };
  content: {
    left?: string;
    right?: string;
  };
  highlighted?: {
    left?: string;
    right?: string;
  };
}

/**
 * Diff hunk (group of changes)
 */
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  changes: DiffChange[];
}

/**
 * File metadata for diffs
 */
export interface DiffFile {
  path: string;
  language?: ProgrammingLanguage;
  mimeType?: string;
  size: {
    before: number;
    after: number;
  };
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

/**
 * Diff rendering options
 */
export interface DiffOptions {
  viewMode: DiffViewMode;
  contextLines: number;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  showLineNumbers: boolean;
  syntaxHighlighting: boolean;
  wordWrap: boolean;
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
}

/**
 * Diff metadata
 */
export interface DiffMetadata {
  title?: string;
  description?: string;
  tags: string[];
  language?: ProgrammingLanguage;
  contentType: DiffContentType;
  visibility: DiffVisibility;
  password?: string;
  expiresAt?: Date;
  allowComments: boolean;
  allowForks: boolean;
  embedEnabled: boolean;
}

/**
 * Complete diff object
 */
export interface Diff {
  id: string;
  shortId: string;
  collectionId?: string;
  parentId?: string; // For forked diffs
  
  leftContent: string;
  rightContent: string;
  leftTitle?: string;
  rightTitle?: string;
  
  files?: DiffFile[]; // For multi-file diffs
  metadata: DiffMetadata;
  options: DiffOptions;
  
  stats: {
    additions: number;
    deletions: number;
    filesChanged: number;
    hunksCount: number;
  };
  
  viewCount: number;
  forkCount: number;
  commentCount: number;
  
  createdAt: Date;
  updatedAt: Date;
  lastViewedAt?: Date;
}

/**
 * Diff creation input
 */
export interface CreateDiffInput {
  leftContent: string;
  rightContent: string;
  leftTitle?: string;
  rightTitle?: string;
  metadata?: Partial<DiffMetadata>;
  options?: Partial<DiffOptions>;
  collectionId?: string;
  parentId?: string;
}

/**
 * Diff update input
 */
export interface UpdateDiffInput {
  leftContent?: string;
  rightContent?: string;
  leftTitle?: string;
  rightTitle?: string;
  metadata?: Partial<DiffMetadata>;
  options?: Partial<DiffOptions>;
}

// Zod schemas
export const DiffViewModeSchema = z.enum([
  DiffViewMode.SPLIT,
  DiffViewMode.UNIFIED,
  DiffViewMode.INLINE,
]);

export const DiffContentTypeSchema = z.enum([
  DiffContentType.TEXT,
  DiffContentType.CODE,
  DiffContentType.MARKDOWN,
  DiffContentType.JSON,
  DiffContentType.XML,
  DiffContentType.BINARY,
]);

export const DiffVisibilitySchema = z.enum([
  DiffVisibility.PUBLIC,
  DiffVisibility.PRIVATE,
  DiffVisibility.UNLISTED,
  DiffVisibility.PASSWORD,
]);

export const DiffChangeSchema = z.object({
  type: z.enum(['add', 'remove', 'modify', 'equal']),
  lineNumber: z.object({
    left: z.number().optional(),
    right: z.number().optional(),
  }),
  content: z.object({
    left: z.string().optional(),
    right: z.string().optional(),
  }),
  highlighted: z.object({
    left: z.string().optional(),
    right: z.string().optional(),
  }).optional(),
});

export const DiffHunkSchema = z.object({
  oldStart: z.number(),
  oldLines: z.number(),
  newStart: z.number(),
  newLines: z.number(),
  header: z.string(),
  changes: z.array(DiffChangeSchema),
});

export const DiffFileSchema = z.object({
  path: z.string(),
  language: z.string().optional(),
  mimeType: z.string().optional(),
  size: z.object({
    before: z.number(),
    after: z.number(),
  }),
  additions: z.number(),
  deletions: z.number(),
  hunks: z.array(DiffHunkSchema),
});

export const DiffOptionsSchema = z.object({
  viewMode: DiffViewModeSchema,
  contextLines: z.number().min(0).max(999),
  ignoreWhitespace: z.boolean(),
  ignoreCase: z.boolean(),
  showLineNumbers: z.boolean(),
  syntaxHighlighting: z.boolean(),
  wordWrap: z.boolean(),
  theme: z.enum(['light', 'dark']),
  fontSize: z.number().min(8).max(32),
  fontFamily: z.string(),
});

export const DiffMetadataSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)),
  language: z.string().optional(),
  contentType: DiffContentTypeSchema,
  visibility: DiffVisibilitySchema,
  password: z.string().min(6).optional(),
  expiresAt: z.date().optional(),
  allowComments: z.boolean(),
  allowForks: z.boolean(),
  embedEnabled: z.boolean(),
});

export const DiffSchema = z.object({
  id: z.string(),
  shortId: z.string(),
  collectionId: z.string().optional(),
  parentId: z.string().optional(),
  
  leftContent: z.string(),
  rightContent: z.string(),
  leftTitle: z.string().optional(),
  rightTitle: z.string().optional(),
  
  files: z.array(DiffFileSchema).optional(),
  metadata: DiffMetadataSchema,
  options: DiffOptionsSchema,
  
  stats: z.object({
    additions: z.number(),
    deletions: z.number(),
    filesChanged: z.number(),
    hunksCount: z.number(),
  }),
  
  viewCount: z.number(),
  forkCount: z.number(),
  commentCount: z.number(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
  lastViewedAt: z.date().optional(),
});

export const CreateDiffInputSchema = z.object({
  leftContent: z.string(),
  rightContent: z.string(),
  leftTitle: z.string().optional(),
  rightTitle: z.string().optional(),
  metadata: DiffMetadataSchema.partial().optional(),
  options: DiffOptionsSchema.partial().optional(),
  collectionId: z.string().optional(),
  parentId: z.string().optional(),
});

export const UpdateDiffInputSchema = z.object({
  leftContent: z.string().optional(),
  rightContent: z.string().optional(),
  leftTitle: z.string().optional(),
  rightTitle: z.string().optional(),
  metadata: DiffMetadataSchema.partial().optional(),
  options: DiffOptionsSchema.partial().optional(),
});