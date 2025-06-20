import { PrismaClient, UserPlan, DiffVisibility, DiffType, ApiKeyStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Helper to generate API keys
function generateApiKey(): string {
  return `dfft_${randomBytes(32).toString('hex')}`;
}

// Helper to generate slugs
function generateSlug(): string {
  return randomBytes(6).toString('hex');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.diffAnalytics.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.fileMetadata.deleteMany();
  await prisma.usage.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.diff.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const freeUser = await prisma.user.create({
    data: {
      clerkId: 'user_free_test',
      email: 'free@example.com',
      username: 'freeuser',
      displayName: 'Free User',
      plan: UserPlan.FREE,
      bio: 'Testing the free plan features',
    },
  });

  const proUser = await prisma.user.create({
    data: {
      clerkId: 'user_pro_test',
      email: 'pro@example.com',
      username: 'prouser',
      displayName: 'Pro User',
      plan: UserPlan.PRO,
      maxDiffsPerMonth: 1000,
      maxFileSizeMB: 50,
      maxCollections: 50,
      bio: 'Professional developer using diffit.tools',
    },
  });

  const enterpriseUser = await prisma.user.create({
    data: {
      clerkId: 'user_enterprise_test',
      email: 'enterprise@example.com',
      username: 'enterpriseuser',
      displayName: 'Enterprise User',
      plan: UserPlan.ENTERPRISE,
      maxDiffsPerMonth: -1, // Unlimited
      maxFileSizeMB: 500,
      maxCollections: -1, // Unlimited
      bio: 'Enterprise customer with unlimited features',
    },
  });

  console.log('✅ Created test users');

  // Create API keys
  const proApiKey = await prisma.apiKey.create({
    data: {
      userId: proUser.id,
      name: 'Development API Key',
      key: generateApiKey(),
      permissions: ['diff:create', 'diff:read', 'diff:update', 'diff:delete'],
      rateLimitPerHour: 1000,
      status: ApiKeyStatus.ACTIVE,
    },
  });

  const enterpriseApiKey = await prisma.apiKey.create({
    data: {
      userId: enterpriseUser.id,
      name: 'Production API Key',
      key: generateApiKey(),
      permissions: ['*'], // All permissions
      rateLimitPerHour: 10000,
      status: ApiKeyStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  console.log('✅ Created API keys');

  // Create collections
  const publicCollection = await prisma.collection.create({
    data: {
      userId: proUser.id,
      name: 'Public Code Reviews',
      description: 'Collection of public code review diffs',
      slug: `collection-${generateSlug()}`,
      isPublic: true,
      color: '#3B82F6',
      icon: '📂',
    },
  });

  const privateCollection = await prisma.collection.create({
    data: {
      userId: proUser.id,
      name: 'Private Project Diffs',
      description: 'Internal project comparisons',
      slug: `collection-${generateSlug()}`,
      isPublic: false,
      color: '#10B981',
      icon: '🔒',
    },
  });

  console.log('✅ Created collections');

  // Create sample diffs
  const diffs = [
    // Public text diff
    {
      userId: freeUser.id,
      slug: `diff-${generateSlug()}`,
      title: 'README.md Changes',
      description: 'Updated project documentation',
      leftContent: `# Project Name

A simple project description.

## Installation
npm install

## Usage
npm start`,
      rightContent: `# Project Name

An **enhanced** project description with more details.

## Prerequisites
- Node.js 18+
- npm or yarn

## Installation
\`\`\`bash
npm install
# or
yarn install
\`\`\`

## Usage
\`\`\`bash
npm start
# or
yarn start
\`\`\`

## Contributing
Please read CONTRIBUTING.md`,
      leftTitle: 'Original README',
      rightTitle: 'Updated README',
      type: DiffType.TEXT,
      visibility: DiffVisibility.PUBLIC,
      metaTitle: 'README.md Changes - diffit.tools',
      metaDescription: 'Compare changes made to the project README file',
    },
    
    // Private code diff
    {
      userId: proUser.id,
      collectionId: privateCollection.id,
      slug: `diff-${generateSlug()}`,
      title: 'API Endpoint Refactoring',
      description: 'Refactored user authentication endpoint',
      leftContent: `export async function login(req, res) {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token, user });
}`,
      rightContent: `export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Find user with rate limiting
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await logFailedAttempt(email);
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Update last login
    await user.updateLastLogin();
    
    res.json({
      accessToken,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'An error occurred during login' 
    });
  }
}`,
      leftTitle: 'login.js (before)',
      rightTitle: 'login.ts (after)',
      type: DiffType.CODE,
      visibility: DiffVisibility.PRIVATE,
      ignoreWhitespace: true,
      contextLines: 5,
    },
    
    // JSON diff
    {
      userId: proUser.id,
      collectionId: publicCollection.id,
      slug: `diff-${generateSlug()}`,
      title: 'Package.json Dependencies Update',
      description: 'Updated project dependencies to latest versions',
      leftContent: JSON.stringify({
        name: '@diffit/web',
        version: '1.0.0',
        dependencies: {
          react: '^17.0.2',
          'react-dom': '^17.0.2',
          next: '^12.0.0',
          typescript: '^4.5.0',
        },
      }, null, 2),
      rightContent: JSON.stringify({
        name: '@diffit/web',
        version: '2.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          next: '^14.0.0',
          typescript: '^5.3.0',
          '@tanstack/react-query': '^5.0.0',
          zod: '^3.22.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/node': '^20.0.0',
          eslint: '^8.50.0',
          prettier: '^3.0.0',
        },
      }, null, 2),
      type: DiffType.JSON,
      visibility: DiffVisibility.PUBLIC,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    
    // Unlisted diff
    {
      userId: enterpriseUser.id,
      slug: `diff-${generateSlug()}`,
      title: 'Configuration File Update',
      description: 'Updated environment configuration',
      leftContent: `DATABASE_URL=postgres://localhost/myapp
REDIS_URL=redis://localhost:6379
API_KEY=dev-key-123`,
      rightContent: `DATABASE_URL=postgres://prod-db.example.com/myapp
REDIS_URL=redis://prod-redis.example.com:6379
API_KEY=\${SECRET_API_KEY}
SENTRY_DSN=https://sentry.io/...
LOG_LEVEL=info
ENABLE_MONITORING=true`,
      type: DiffType.TEXT,
      visibility: DiffVisibility.UNLISTED,
    },
  ];

  const createdDiffs = [];
  for (const diffData of diffs) {
    const diff = await prisma.diff.create({
      data: diffData,
    });
    createdDiffs.push(diff);
    
    // Create analytics for each diff
    await prisma.diffAnalytics.create({
      data: {
        diffId: diff.id,
        totalViews: Math.floor(Math.random() * 1000),
        uniqueViews: Math.floor(Math.random() * 500),
        avgViewDuration: Math.floor(Math.random() * 300),
        downloads: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 20),
        viewsByCountry: {
          US: Math.floor(Math.random() * 300),
          UK: Math.floor(Math.random() * 100),
          DE: Math.floor(Math.random() * 80),
          FR: Math.floor(Math.random() * 60),
        },
        viewsByDevice: {
          desktop: Math.floor(Math.random() * 400),
          mobile: Math.floor(Math.random() * 200),
          tablet: Math.floor(Math.random() * 50),
        },
      },
    });
  }

  console.log('✅ Created sample diffs with analytics');

  // Create comments
  const comments = [
    {
      diffId: createdDiffs[1].id, // Code diff
      userId: freeUser.id,
      content: 'Great refactoring! The error handling is much better now.',
      lineNumber: 15,
      side: 'right',
    },
    {
      diffId: createdDiffs[1].id,
      userId: proUser.id,
      content: 'Thanks! I also added TypeScript types for better type safety.',
      lineNumber: 1,
      side: 'right',
    },
    {
      diffId: createdDiffs[0].id, // README diff
      userId: enterpriseUser.id,
      content: 'The new documentation structure is much clearer. Nice work!',
    },
  ];

  for (const commentData of comments) {
    await prisma.comment.create({
      data: commentData,
    });
  }

  // Create nested comment
  const parentComment = await prisma.comment.create({
    data: {
      diffId: createdDiffs[1].id,
      userId: enterpriseUser.id,
      content: 'Should we also add rate limiting to prevent brute force attacks?',
      lineNumber: 25,
      side: 'right',
    },
  });

  await prisma.comment.create({
    data: {
      diffId: createdDiffs[1].id,
      userId: proUser.id,
      parentId: parentComment.id,
      content: 'Good point! I\'ll add that in the next iteration.',
    },
  });

  console.log('✅ Created sample comments');

  // Create usage records
  const usageTypes = [
    'DIFF_CREATE',
    'DIFF_VIEW',
    'API_CALL',
    'FILE_UPLOAD',
    'EXPORT',
    'SHARE',
  ] as const;

  for (let i = 0; i < 20; i++) {
    await prisma.usage.create({
      data: {
        userId: [freeUser.id, proUser.id, enterpriseUser.id][Math.floor(Math.random() * 3)],
        type: usageTypes[Math.floor(Math.random() * usageTypes.length)],
        metadata: {
          source: ['web', 'api', 'embed'][Math.floor(Math.random() * 3)],
          duration: Math.floor(Math.random() * 1000),
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
      },
    });
  }

  console.log('✅ Created usage records');

  console.log(`
🎉 Seed completed successfully!

Created:
- 3 users (free, pro, enterprise)
- 2 API keys
- 2 collections
- ${createdDiffs.length} diffs with analytics
- ${comments.length + 2} comments (including nested)
- 20 usage records

You can now:
1. Run 'pnpm db:studio' to view the data in Prisma Studio
2. Use the generated slugs to access diffs
3. Test API keys: 
   - Pro: ${proApiKey.key}
   - Enterprise: ${enterpriseApiKey.key}
`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });