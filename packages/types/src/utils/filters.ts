import { z } from 'zod';

/**
 * Sort order
 */
export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = typeof SortOrder[keyof typeof SortOrder];

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

/**
 * Number range filter
 */
export interface NumberRangeFilter {
  min?: number;
  max?: number;
}

/**
 * Text search options
 */
export interface TextSearchOptions {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

/**
 * Generic sort input
 */
export interface SortInput<TField = string> {
  field: TField;
  order: SortOrder;
}

/**
 * Generic filter operators
 */
export const FilterOperator = {
  EQUALS: 'eq',
  NOT_EQUALS: 'neq',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL: 'lte',
  IN: 'in',
  NOT_IN: 'nin',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'ncontains',
  STARTS_WITH: 'starts',
  ENDS_WITH: 'ends',
  IS_NULL: 'null',
  IS_NOT_NULL: 'nnull',
} as const;

export type FilterOperator = typeof FilterOperator[keyof typeof FilterOperator];

/**
 * Generic filter condition
 */
export interface FilterCondition<TValue = any> {
  field: string;
  operator: FilterOperator;
  value?: TValue;
}

/**
 * Filter group with logical operators
 */
export interface FilterGroup {
  operator: 'AND' | 'OR';
  conditions: Array<FilterCondition | FilterGroup>;
}

/**
 * Common filter presets
 */
export interface CommonFilters {
  search?: string;
  tags?: string[];
  status?: string[];
  dateRange?: DateRangeFilter;
  owner?: string;
  visibility?: string[];
}

/**
 * Diff-specific filters
 */
export interface DiffFilters extends CommonFilters {
  contentType?: string[];
  language?: string[];
  hasComments?: boolean;
  isFork?: boolean;
  parentId?: string;
  collectionId?: string;
  minLines?: number;
  maxLines?: number;
}

/**
 * Collection-specific filters
 */
export interface CollectionFilters extends CommonFilters {
  featured?: boolean;
  pinned?: boolean;
  minDiffCount?: number;
  maxDiffCount?: number;
}

/**
 * User-specific filters
 */
export interface UserFilters {
  search?: string;
  plan?: string[];
  role?: string[];
  isActive?: boolean;
  hasApiKey?: boolean;
  organizationId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Zod schemas
export const SortOrderSchema = z.enum([SortOrder.ASC, SortOrder.DESC]);

export const DateRangeFilterSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.from <= data.to;
    }
    return true;
  },
  { message: 'From date must be before or equal to To date' }
);

export const NumberRangeFilterSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
}).refine(
  (data) => {
    if (data.min !== undefined && data.max !== undefined) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: 'Min value must be less than or equal to Max value' }
);

export const TextSearchOptionsSchema = z.object({
  query: z.string().min(1),
  fields: z.array(z.string()).optional(),
  fuzzy: z.boolean().optional(),
  caseSensitive: z.boolean().optional(),
  wholeWord: z.boolean().optional(),
});

export const SortInputSchema = <T extends z.ZodType>(fieldSchema: T) =>
  z.object({
    field: fieldSchema,
    order: SortOrderSchema,
  });

export const FilterOperatorSchema = z.enum([
  FilterOperator.EQUALS,
  FilterOperator.NOT_EQUALS,
  FilterOperator.GREATER_THAN,
  FilterOperator.GREATER_THAN_OR_EQUAL,
  FilterOperator.LESS_THAN,
  FilterOperator.LESS_THAN_OR_EQUAL,
  FilterOperator.IN,
  FilterOperator.NOT_IN,
  FilterOperator.CONTAINS,
  FilterOperator.NOT_CONTAINS,
  FilterOperator.STARTS_WITH,
  FilterOperator.ENDS_WITH,
  FilterOperator.IS_NULL,
  FilterOperator.IS_NOT_NULL,
]);

export const FilterConditionSchema = z.object({
  field: z.string(),
  operator: FilterOperatorSchema,
  value: z.any().optional(),
});

export const FilterGroupSchema: z.ZodType<FilterGroup> = z.lazy(() =>
  z.object({
    operator: z.enum(['AND', 'OR']),
    conditions: z.array(z.union([FilterConditionSchema, FilterGroupSchema])),
  })
);

export const CommonFiltersSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  dateRange: DateRangeFilterSchema.optional(),
  owner: z.string().optional(),
  visibility: z.array(z.string()).optional(),
});

export const DiffFiltersSchema = CommonFiltersSchema.extend({
  contentType: z.array(z.string()).optional(),
  language: z.array(z.string()).optional(),
  hasComments: z.boolean().optional(),
  isFork: z.boolean().optional(),
  parentId: z.string().optional(),
  collectionId: z.string().optional(),
  minLines: z.number().int().min(0).optional(),
  maxLines: z.number().int().min(0).optional(),
});

export const CollectionFiltersSchema = CommonFiltersSchema.extend({
  featured: z.boolean().optional(),
  pinned: z.boolean().optional(),
  minDiffCount: z.number().int().min(0).optional(),
  maxDiffCount: z.number().int().min(0).optional(),
});

export const UserFiltersSchema = z.object({
  search: z.string().optional(),
  plan: z.array(z.string()).optional(),
  role: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  hasApiKey: z.boolean().optional(),
  organizationId: z.string().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

// Filter builder utilities
export class FilterBuilder {
  private conditions: Array<FilterCondition | FilterGroup> = [];
  private currentOperator: 'AND' | 'OR' = 'AND';

  and(): this {
    this.currentOperator = 'AND';
    return this;
  }

  or(): this {
    this.currentOperator = 'OR';
    return this;
  }

  where(field: string, operator: FilterOperator, value?: any): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  group(builder: (fb: FilterBuilder) => void): this {
    const groupBuilder = new FilterBuilder();
    builder(groupBuilder);
    const group = groupBuilder.build();
    if (group) {
      this.conditions.push(group);
    }
    return this;
  }

  build(): FilterGroup | null {
    if (this.conditions.length === 0) {
      return null;
    }
    if (this.conditions.length === 1 && 'operator' in this.conditions[0]) {
      return this.conditions[0] as FilterGroup;
    }
    return {
      operator: this.currentOperator,
      conditions: this.conditions,
    };
  }
}

// Helper functions
export function createDateRangeFilter(
  days?: number,
  from?: Date,
  to?: Date
): DateRangeFilter {
  if (days !== undefined) {
    const now = new Date();
    return {
      from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
      to: now,
    };
  }
  return { from, to };
}

export function parseSearchQuery(query: string): TextSearchOptions {
  // Simple implementation - can be extended for more complex parsing
  const isQuoted = query.startsWith('"') && query.endsWith('"');
  return {
    query: isQuoted ? query.slice(1, -1) : query,
    fuzzy: !isQuoted,
    caseSensitive: false,
    wholeWord: isQuoted,
  };
}