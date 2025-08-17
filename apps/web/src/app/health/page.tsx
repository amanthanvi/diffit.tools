'use client';

import { trpc } from '@/lib/trpc';

export default function HealthPage() {
  const health = trpc.health.useQuery();
  const version = trpc.version.useQuery();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">System Health Check</h1>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Health Status</h2>
          {health.isLoading && <p>Loading health status...</p>}
          {health.error && (
            <p className="text-red-600">Error: {health.error.message}</p>
          )}
          {health.data && (
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {JSON.stringify(health.data, null, 2)}
            </pre>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">API Version</h2>
          {version.isLoading && <p>Loading version info...</p>}
          {version.error && (
            <p className="text-red-600">Error: {version.error.message}</p>
          )}
          {version.data && (
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
              {JSON.stringify(version.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}