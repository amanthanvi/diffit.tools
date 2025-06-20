// PostHog analytics exports
export * from './config'
export * from './client'
export * from './server'

// Re-export PostHog for advanced usage
export { default as posthog } from 'posthog-js'
export { PostHog } from 'posthog-node'