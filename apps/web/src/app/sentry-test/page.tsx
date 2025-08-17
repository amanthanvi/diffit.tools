'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const [errorSent, setErrorSent] = useState(false);

  const triggerError = () => {
    try {
      // Capture a test exception
      throw new Error('Test error from diffit.tools - Phase 0 verification');
    } catch (error) {
      Sentry.captureException(error);
      setErrorSent(true);
      console.error('Sentry test error:', error);
    }
  };

  const triggerMessage = () => {
    Sentry.captureMessage('Test message from diffit.tools', 'info');
    setErrorSent(true);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Sentry Test Page</h1>
      
      <div style={{ marginTop: '20px' }}>
        <p>SENTRY_DSN configured: {process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Yes' : 'No'}</p>
        
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={triggerError}
            style={{ 
              padding: '10px 20px', 
              marginRight: '10px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Trigger Test Error
          </button>
          
          <button 
            onClick={triggerMessage}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#4444ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send Test Message
          </button>
        </div>
        
        {errorSent && (
          <p style={{ marginTop: '20px', color: 'green' }}>
            ✓ Event sent to Sentry (if DSN is configured)
          </p>
        )}
      </div>
    </div>
  );
}