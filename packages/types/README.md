# @diffit/types

Shared TypeScript types, interfaces, and validation schemas for diffit.tools v2.0.

## Installation

```bash
npm install @diffit/types
# or
yarn add @diffit/types
# or
pnpm add @diffit/types
```

## Usage

### Import Types

```typescript
import { User, Diff, Collection, Comment } from '@diffit/types';

// Use the types
const user: User = {
  id: '123',
  email: 'user@example.com',
  plan: 'pro',
  // ... other properties
};
```

### Import Constants

```typescript
import { PLAN_LIMITS, FILE_SIZE_LIMITS, ERROR_CODES } from '@diffit/types';

// Check plan limits
const maxFileSize = PLAN_LIMITS.PRO.maxFileSize;

// Use error codes
throw new Error(ERROR_CODES.FILE_TOO_LARGE);
```

### Use Validation Schemas

```typescript
import { UserSchema, DiffSchema, z } from '@diffit/types';

// Validate data
const result = UserSchema.safeParse(userData);
if (result.success) {
  const user = result.data;
} else {
  console.error(result.error);
}

// Create custom schemas
const CustomSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
});
```

### Use Type Guards

```typescript
import { isUser, isDiff, isCollection } from '@diffit/types';

// Type narrowing
if (isUser(data)) {
  // TypeScript knows data is a User
  console.log(data.email);
}
```

### Use Validators

```typescript
import { 
  validateFileSize, 
  validateUsername, 
  validatePasswordStrength 
} from '@diffit/types';

// Validate file size
const { valid, error } = validateFileSize(fileSize, 'pro');

// Validate username
const usernameResult = validateUsername('john_doe');

// Check password strength
const passwordResult = validatePasswordStrength('MyP@ssw0rd!');
console.log(passwordResult.strength); // 'strong'
```

### Use Error Classes

```typescript
import { 
  AppError, 
  ValidationError, 
  NotFoundError,
  ErrorCode 
} from '@diffit/types';

// Throw specific errors
throw new ValidationError('Invalid input', { field: 'email' });
throw new NotFoundError('User', userId);

// Handle errors
try {
  // ... some operation
} catch (error) {
  if (error instanceof AppError) {
    console.log(error.code, error.statusCode);
  }
}
```

### Use Pagination Utilities

```typescript
import { 
  PaginatedList, 
  Connection, 
  calculateOffset,
  encodeCursor 
} from '@diffit/types';

// Create paginated response
const paginatedDiffs: PaginatedList<Diff> = {
  items: diffs,
  pagination: {
    hasNextPage: true,
    hasPreviousPage: false,
    limit: 20,
    currentPage: 1,
    totalPages: 5,
    totalCount: 100,
  },
};

// Use cursor pagination
const cursor = encodeCursor({ id: '123', createdAt: new Date() });
```

### Use Filter Builders

```typescript
import { FilterBuilder, DiffFilters } from '@diffit/types';

// Build complex filters
const filters = new FilterBuilder()
  .where('visibility', 'eq', 'public')
  .and()
  .where('language', 'in', ['javascript', 'typescript'])
  .or()
  .group((fb) => {
    fb.where('tags', 'contains', 'featured')
      .and()
      .where('viewCount', 'gte', 100);
  })
  .build();

// Use type-safe filters
const diffFilters: DiffFilters = {
  search: 'react',
  contentType: ['code'],
  language: ['javascript', 'typescript'],
  hasComments: true,
};
```

### Use Type Utilities

```typescript
import { 
  DeepPartial, 
  PartialBy, 
  Prettify,
  Brand 
} from '@diffit/types';

// Deep partial for nested updates
type UpdateUserInput = DeepPartial<User>;

// Make specific fields optional
type CreateDiffInput = PartialBy<Diff, 'id' | 'createdAt'>;

// Create branded types for type safety
type UserId = Brand<string, 'UserId'>;
type DiffId = Brand<string, 'DiffId'>;

// Prevent mixing up IDs
function getDiff(id: DiffId): Diff {
  // ...
}
```

## Available Types

### Core Types
- `User`, `UserPlan`, `UserRole`, `UserPreferences`
- `Diff`, `DiffMetadata`, `DiffOptions`, `DiffChange`
- `Collection`, `CollectionMetadata`
- `Comment`, `CommentThread`, `CommentReaction`
- `Subscription`, `Invoice`, `PaymentMethod`

### API Types
- `ApiResponse`, `ApiError`, `PaginatedResponse`
- `BatchResult`, `FileUploadResponse`
- Request/Response types for all endpoints

### Analytics Types
- `AnalyticsEvent`, `AnalyticsMetric`
- `UserAnalytics`, `AnalyticsAggregate`

### Utility Types
- Pagination: `Connection`, `Edge`, `PaginationInfo`
- Filters: `FilterCondition`, `FilterGroup`, `SortInput`
- Errors: `AppError`, `ValidationError`, `ErrorResponse`

## Constants

- `PLAN_LIMITS`: Limits for each subscription plan
- `FILE_SIZE_LIMITS`: Maximum file sizes
- `RATE_LIMITS`: API rate limits by plan
- `ERROR_CODES`: Standard error codes
- `FEATURE_FLAGS`: Available feature flags
- `REGEX`: Common regular expressions
- `DEFAULTS`: Default values for settings

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

## License

MIT