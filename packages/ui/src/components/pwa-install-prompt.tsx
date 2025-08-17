"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { cn } from '../lib/utils';
import {
  Download,
  Smartphone,
  Monitor,
  Check,
  X,
  Globe,
  Zap,
  Shield,
  HardDrive,
  Wifi,
  WifiOff,
  Bell,
  Home,
} from 'lucide-react';

export interface PWAInstallPromptProps {
  className?: string;
  autoPrompt?: boolean;
  promptDelay?: number;
  onInstall?: () => void;
  onDismiss?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className,
  autoPrompt = true,
  promptDelay = 5000,
  onInstall,
  onDismiss,
}) => {
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showBanner, setShowBanner] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = React.useState<'idle' | 'installing' | 'installed'>('idle');

  React.useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebApp);
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      setIsIOS(isIOSDevice && isSafari);
    };

    checkInstalled();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (autoPrompt && !localStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => {
          setShowBanner(true);
        }, promptDelay);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallState('installed');
      setShowPrompt(false);
      setShowBanner(false);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [autoPrompt, promptDelay, onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowPrompt(true);
      }
      return;
    }

    setInstallState('installing');

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallState('installed');
        onInstall?.();
      } else {
        setInstallState('idle');
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Failed to install PWA:', error);
      setInstallState('idle');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    onDismiss?.();
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating Install Banner */}
      {showBanner && !isInstalled && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5",
          className
        )}>
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Install Diffit.tools</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Install our app for offline access and better performance
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstallClick}
                      disabled={installState === 'installing'}
                    >
                      {installState === 'installing' ? 'Installing...' : 'Install'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                    >
                      Not now
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* iOS Install Instructions Dialog */}
      <Dialog open={showPrompt && isIOS} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Diffit.tools</DialogTitle>
            <DialogDescription>
              Add Diffit.tools to your home screen for the best experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">1</span>
              </div>
              <p className="text-sm">
                Tap the share button <span className="inline-block px-1">􀈂</span> in Safari
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">2</span>
              </div>
              <p className="text-sm">
                Scroll down and tap "Add to Home Screen"
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">3</span>
              </div>
              <p className="text-sm">
                Tap "Add" to install the app
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPrompt(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop/Android Install Dialog */}
      <Dialog open={showPrompt && !isIOS} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Install Diffit.tools</DialogTitle>
            <DialogDescription>
              Get the full app experience with offline support
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <FeatureCard
                icon={<WifiOff className="h-5 w-5" />}
                title="Offline Access"
                description="Work without internet"
              />
              <FeatureCard
                icon={<Zap className="h-5 w-5" />}
                title="Fast Performance"
                description="Native app speed"
              />
              <FeatureCard
                icon={<HardDrive className="h-5 w-5" />}
                title="Local Storage"
                description="Save diffs locally"
              />
              <FeatureCard
                icon={<Bell className="h-5 w-5" />}
                title="Notifications"
                description="Get updates"
              />
            </div>
            
            {installState === 'installed' && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Successfully installed! You can now use Diffit.tools as a native app.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDismiss}>
              Maybe later
            </Button>
            <Button 
              onClick={handleInstallClick}
              disabled={installState === 'installing' || installState === 'installed'}
            >
              {installState === 'installing' ? (
                <>Installing...</>
              ) : installState === 'installed' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Installed
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Feature card component
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
    <div className="text-primary">{icon}</div>
    <div>
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

// PWA Status Badge Component
export const PWAStatusBadge: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(isStandalone);
    };

    updateOnlineStatus();
    checkInstalled();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isInstalled && (
        <Badge variant="outline" className="gap-1">
          <Home className="h-3 w-3" />
          Installed
        </Badge>
      )}
      <Badge variant={isOnline ? "outline" : "secondary"} className="gap-1">
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
    </div>
  );
};

// Hook to manage PWA installation
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebApp = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebApp);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    checkInstalled();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = React.useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall,
    isInstalled,
    install,
  };
};