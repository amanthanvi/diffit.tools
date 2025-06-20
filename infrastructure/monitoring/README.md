# @diffit/monitoring

Comprehensive monitoring and analytics package for diffit.tools, including error tracking, product analytics, and performance monitoring.

## Features

- **Error Tracking** with Sentry
- **Product Analytics** with PostHog
- **Performance Monitoring** with Web Vitals
- **Custom Metrics** tracking
- **A/B Testing** support
- **User Session Recording** (privacy-compliant)
- **Real User Monitoring (RUM)**

## Installation

```bash
pnpm add @diffit/monitoring
```

## Usage

### Basic Setup

```typescript
import { initMonitoring } from '@diffit/monitoring';

// Initialize monitoring in your app
initMonitoring({
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  },
  analytics: {
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    environment: process.env.NODE_ENV,
  },
  performance: {
    enableWebVitals: true,
    enableCustomMetrics: true,
  },
});
```

### Error Tracking

```typescript
import { trackError, setUserContext, addBreadcrumbEvent } from '@diffit/monitoring';

// Track errors
try {
  // Your code
} catch (error) {
  trackError(error as Error, {
    component: 'DiffViewer',
    action: 'processFile',
  });
}

// Set user context
setUserContext({
  id: 'user123',
  email: 'user@example.com',
});

// Add breadcrumbs
addBreadcrumbEvent('File uploaded', 'upload', {
  fileName: 'example.txt',
  fileSize: 1024,
});
```

### Analytics

```typescript
import { useAnalytics } from '@diffit/monitoring';

function MyComponent() {
  const analytics = useAnalytics();

  const handleDiffCreate = (diffId: string) => {
    analytics.trackDiffCreated(diffId, 'text', 1024);
  };

  const handleShare = (diffId: string) => {
    analytics.trackDiffShared(diffId, 'link');
  };

  return (
    // Your component
  );
}
```

### Performance Tracking

```typescript
import { usePerformanceTracking } from '@diffit/monitoring';

function DiffProcessor() {
  const perf = usePerformanceTracking();

  const processDiff = async (file: File) => {
    // Track file load time
    perf.startTiming('file_load', { fileName: file.name });
    const content = await loadFile(file);
    perf.endTiming('file_load', { fileSize: file.size });

    // Track diff calculation
    perf.startTiming('diff_calculation');
    const diff = await calculateDiff(content);
    const duration = perf.endTiming('diff_calculation');

    // Record custom metric
    perf.recordMetric('diff_lines', diff.lines, 'lines');
  };
}
```

### Feature Flags

```typescript
import { getFeatureFlag } from '@diffit/monitoring';

function MyComponent() {
  const showNewFeature = getFeatureFlag('new-diff-viewer', false);

  return showNewFeature ? <NewDiffViewer /> : <OldDiffViewer />;
}
```

## Configuration

### Environment Variables

```bash
# Sentry
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Vercel Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Privacy Compliance

The monitoring package is designed to be privacy-compliant:

- Session recordings mask all input fields
- No PII is collected without explicit user consent
- All data is encrypted in transit
- Supports user opt-out preferences

## API Reference

### Sentry Functions

- `initSentry(config)` - Initialize Sentry
- `trackError(error, context)` - Track errors
- `trackMessage(message, level, context)` - Track messages
- `setUserContext(user)` - Set user context
- `addBreadcrumbEvent(message, category, data)` - Add breadcrumb

### Analytics Functions

- `initClientAnalytics(config)` - Initialize client-side analytics
- `initServerAnalytics(config)` - Initialize server-side analytics
- `identifyUser(user)` - Identify user
- `trackEvent(event, properties)` - Track custom events
- `getFeatureFlag(flag, defaultValue)` - Get feature flag value

### Performance Functions

- `initWebVitals(config)` - Initialize Web Vitals tracking
- `performanceTracker` - Performance tracking instance
- `trackDiffPerformance` - Diff-specific performance tracking
- `generatePerformanceReport()` - Generate performance report

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## License

MIT