import { useEffect, useState, useCallback } from 'react';

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  cacheSize: {
    usage: number;
    quota: number;
    percentage: number;
  } | null;
}

export interface UseServiceWorkerOptions {
  swUrl?: string;
  onUpdate?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  autoUpdate?: boolean;
}

export const useServiceWorker = ({
  swUrl = '/sw-enhanced.js',
  onUpdate,
  onSuccess,
  onError,
  autoUpdate = true,
}: UseServiceWorkerOptions = {}) => {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    registration: null,
    updateAvailable: false,
    cacheSize: null,
  });

  // Check if service worker is supported
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setStatus(prev => ({ ...prev, isSupported }));
    
    if (!isSupported) {
      console.warn('Service Workers are not supported in this browser');
    }
  }, []);

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if (!status.isSupported) return;

    let registration: ServiceWorkerRegistration | null = null;

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/',
        });

        setStatus(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        console.log('Service Worker registered successfully');
        onSuccess?.();

        // Check for updates
        if (autoUpdate) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setStatus(prev => ({ ...prev, updateAvailable: true }));
                onUpdate?.();
              }
            });
          });
        }

        // Check for updates periodically
        if (autoUpdate) {
          const interval = setInterval(() => {
            registration?.update();
          }, 60 * 60 * 1000); // Check every hour

          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        onError?.(error as Error);
        setStatus(prev => ({ ...prev, isRegistered: false }));
      }
    };

    registerServiceWorker();

    return () => {
      if (registration) {
        // Note: We don't unregister the service worker on unmount
        // as it should persist for offline functionality
      }
    };
  }, [status.isSupported, swUrl, onUpdate, onSuccess, onError, autoUpdate]);

  // Get cache size
  const getCacheSize = useCallback(async () => {
    if (!status.isSupported || !status.registration) return;

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise<{ usage: number; quota: number; percentage: number }>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_SIZE') {
            const cacheSize = event.data.data;
            setStatus(prev => ({ ...prev, cacheSize }));
            resolve(cacheSize);
          }
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return null;
    }
  }, [status.isSupported, status.registration]);

  // Clear all caches
  const clearCaches = useCallback(async () => {
    if (!status.isSupported || !status.registration) return false;

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHES_CLEARED') {
            resolve(true);
          }
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CLEAR_ALL_CACHES' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }, [status.isSupported, status.registration]);

  // Cache a diff for offline access
  const cacheDiff = useCallback(async (data: {
    id: string;
    title: string;
    content: any;
    metadata?: any;
  }) => {
    if (!status.isSupported || !status.registration) return false;

    try {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CACHE_DIFF',
        data,
      });
      return true;
    } catch (error) {
      console.error('Failed to cache diff:', error);
      return false;
    }
  }, [status.isSupported, status.registration]);

  // Delete a cached diff
  const deleteCachedDiff = useCallback(async (id: string) => {
    if (!status.isSupported || !status.registration) return false;

    try {
      navigator.serviceWorker.controller?.postMessage({
        type: 'DELETE_DIFF',
        data: { id },
      });
      return true;
    } catch (error) {
      console.error('Failed to delete cached diff:', error);
      return false;
    }
  }, [status.isSupported, status.registration]);

  // Get all cached diffs
  const getCachedDiffs = useCallback(async () => {
    if (!status.isSupported || !status.registration) return [];

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise<any[]>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'CACHED_DIFFS') {
            resolve(event.data.data || []);
          }
        };

        navigator.serviceWorker.controller?.postMessage(
          { type: 'GET_CACHED_DIFFS' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to get cached diffs:', error);
      return [];
    }
  }, [status.isSupported, status.registration]);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(async () => {
    if (!status.isSupported || !status.registration) return;

    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }, [status.isSupported, status.registration]);

  // Update service worker
  const update = useCallback(async () => {
    if (!status.isSupported || !status.registration) return false;

    try {
      await status.registration.update();
      return true;
    } catch (error) {
      console.error('Failed to update service worker:', error);
      return false;
    }
  }, [status.isSupported, status.registration]);

  return {
    ...status,
    getCacheSize,
    clearCaches,
    cacheDiff,
    deleteCachedDiff,
    getCachedDiffs,
    skipWaiting,
    update,
  };
};

// Hook to check if running as PWA
export const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [displayMode, setDisplayMode] = useState<'browser' | 'standalone' | 'fullscreen'>('browser');

  useEffect(() => {
    const checkDisplayMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      
      setIsPWA(isStandalone || isFullscreen || isInWebApp);
      
      if (isFullscreen) {
        setDisplayMode('fullscreen');
      } else if (isStandalone || isInWebApp) {
        setDisplayMode('standalone');
      } else {
        setDisplayMode('browser');
      }
    };

    checkDisplayMode();

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');

    const handleChange = () => checkDisplayMode();
    
    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', handleChange);
      fullscreenQuery.addEventListener('change', handleChange);
    }

    return () => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleChange);
        fullscreenQuery.removeEventListener('change', handleChange);
      }
    };
  }, []);

  return { isPWA, displayMode };
};

// Hook for push notifications
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported');
      return 'denied' as NotificationPermission;
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission;
  }, []);

  const subscribe = useCallback(async (publicKey: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, [subscription]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      // Fallback to regular notification
      new Notification(title, options);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  }, [permission]);

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
};