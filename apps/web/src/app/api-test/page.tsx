'use client';

import { useEffect, useState } from 'react';

export default function ApiTestPage() {
  const [apiResult, setApiResult] = useState<any>(null);
  const [trpcResult, setTrpcResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test regular API
    fetch('/api/test')
      .then(res => res.json())
      .then(data => setApiResult(data))
      .catch(err => setError(`API Error: ${err.message}`));

    // Test tRPC endpoint directly
    fetch('/api/trpc/health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "0": {
          "json": null
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        setTrpcResult(data);
        setLoading(false);
      })
      .catch(err => {
        setError(`tRPC Error: ${err.message}`);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Test Page</h1>
      
      <h2>Regular API Test (/api/test)</h2>
      {apiResult ? (
        <pre>{JSON.stringify(apiResult, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
      
      <h2>tRPC Test (/api/trpc/health)</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <pre>{JSON.stringify(trpcResult, null, 2)}</pre>
      )}
    </div>
  );
}