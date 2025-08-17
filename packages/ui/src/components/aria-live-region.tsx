"use client";

import * as React from 'react';
import { cn } from '../lib/utils';

export interface AriaLiveRegionProps {
  message?: string;
  priority?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all' | Array<'additions' | 'removals' | 'text'>;
  className?: string;
  clearAfter?: number;
  id?: string;
}

/**
 * ARIA Live Region Component
 * Announces dynamic content changes to screen readers
 */
export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({
  message,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className,
  clearAfter = 1000,
  id,
}) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (message) {
      setCurrentMessage(message);

      if (clearAfter > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setCurrentMessage('');
        }, clearAfter);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, clearAfter]);

  const relevantValue = Array.isArray(relevant) ? relevant.join(' ') : relevant;

  return (
    <div
      id={id}
      role={priority === 'off' ? undefined : 'status'}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevantValue}
      className={cn('sr-only', className)}
    >
      {currentMessage}
    </div>
  );
};

/**
 * Screen Reader Only Text
 * Visually hidden but accessible to screen readers
 */
export const ScreenReaderOnly: React.FC<{
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}> = ({ children, as: Component = 'span', className }) => {
  return (
    <Component className={cn('sr-only', className)}>
      {children}
    </Component>
  );
};

/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible
 */
export const VisuallyHidden: React.FC<{
  children: React.ReactNode;
  focusable?: boolean;
  className?: string;
}> = ({ children, focusable = false, className }) => {
  if (focusable) {
    return (
      <span
        className={cn(
          'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
          'focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:whitespace-normal',
          'focus:p-2 focus:bg-background focus:text-foreground focus:border focus:border-border',
          'focus:rounded focus:shadow-sm focus:z-50',
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        className
      )}
    >
      {children}
    </span>
  );
};

/**
 * Announcer Hook
 * Use this to announce messages to screen readers
 */
export const useAnnouncer = () => {
  const [announcement, setAnnouncement] = React.useState<{
    message: string;
    priority: 'polite' | 'assertive';
    id: string;
  } | null>(null);

  const announce = React.useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    // Generate unique ID to force re-announcement of same message
    const id = `announcement-${Date.now()}`;
    setAnnouncement({ message, priority, id });
  }, []);

  return {
    announce,
    announcement,
  };
};

/**
 * Progress Announcer Component
 * Announces progress updates to screen readers
 */
export const ProgressAnnouncer: React.FC<{
  value: number;
  max?: number;
  message?: string;
  announceEvery?: number;
}> = ({ value, max = 100, message, announceEvery = 10 }) => {
  const [lastAnnounced, setLastAnnounced] = React.useState(0);
  const { announce } = useAnnouncer();

  React.useEffect(() => {
    const percentage = Math.round((value / max) * 100);
    
    if (percentage - lastAnnounced >= announceEvery || percentage === 100) {
      const progressMessage = message 
        ? `${message}: ${percentage}% complete`
        : `Progress: ${percentage}% complete`;
      
      announce(progressMessage, percentage === 100 ? 'assertive' : 'polite');
      setLastAnnounced(percentage);
    }
  }, [value, max, message, announceEvery, lastAnnounced, announce]);

  return null;
};

/**
 * Loading Announcer Component
 * Announces loading states to screen readers
 */
export const LoadingAnnouncer: React.FC<{
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
  errorMessage?: string;
  error?: boolean;
}> = ({
  isLoading,
  loadingMessage = 'Loading...',
  completeMessage = 'Loading complete',
  errorMessage = 'Loading failed',
  error = false,
}) => {
  const { announce } = useAnnouncer();
  const wasLoadingRef = React.useRef(false);

  React.useEffect(() => {
    if (isLoading && !wasLoadingRef.current) {
      announce(loadingMessage, 'polite');
      wasLoadingRef.current = true;
    } else if (!isLoading && wasLoadingRef.current) {
      if (error) {
        announce(errorMessage, 'assertive');
      } else {
        announce(completeMessage, 'polite');
      }
      wasLoadingRef.current = false;
    }
  }, [isLoading, error, loadingMessage, completeMessage, errorMessage, announce]);

  return null;
};

/**
 * Form Validation Announcer
 * Announces form validation errors to screen readers
 */
export const ValidationAnnouncer: React.FC<{
  errors: Record<string, string | string[]>;
  announceOn?: 'change' | 'submit';
}> = ({ errors, announceOn = 'change' }) => {
  const { announce } = useAnnouncer();
  const previousErrorsRef = React.useRef<typeof errors>({});

  React.useEffect(() => {
    if (announceOn !== 'change') return;

    const errorMessages: string[] = [];
    
    // Find new errors
    Object.entries(errors).forEach(([field, messages]) => {
      if (!previousErrorsRef.current[field]) {
        const messageArray = Array.isArray(messages) ? messages : [messages];
        messageArray.forEach(msg => {
          errorMessages.push(`${field}: ${msg}`);
        });
      }
    });

    if (errorMessages.length > 0) {
      announce(
        `${errorMessages.length} validation error${errorMessages.length > 1 ? 's' : ''}: ${errorMessages.join(', ')}`,
        'assertive'
      );
    }

    previousErrorsRef.current = { ...errors };
  }, [errors, announceOn, announce]);

  return null;
};

/**
 * Route Change Announcer
 * Announces page navigation to screen readers
 */
export const RouteChangeAnnouncer: React.FC<{
  pathname: string;
  title?: string;
}> = ({ pathname, title }) => {
  const { announce } = useAnnouncer();
  const previousPathnameRef = React.useRef(pathname);

  React.useEffect(() => {
    if (pathname !== previousPathnameRef.current) {
      const message = title 
        ? `Navigated to ${title}`
        : `Navigated to ${pathname}`;
      
      announce(message, 'assertive');
      previousPathnameRef.current = pathname;
    }
  }, [pathname, title, announce]);

  return null;
};

/**
 * Notification Announcer
 * Announces notifications to screen readers
 */
export const NotificationAnnouncer: React.FC<{
  notification: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null;
}> = ({ notification }) => {
  const { announce } = useAnnouncer();
  const previousIdRef = React.useRef<string>('');

  React.useEffect(() => {
    if (notification && notification.id !== previousIdRef.current) {
      const priority = notification.type === 'error' ? 'assertive' : 'polite';
      const prefix = notification.type === 'error' ? 'Error: ' 
        : notification.type === 'warning' ? 'Warning: '
        : notification.type === 'success' ? 'Success: '
        : '';
      
      announce(`${prefix}${notification.message}`, priority);
      previousIdRef.current = notification.id;
    }
  }, [notification, announce]);

  return null;
};