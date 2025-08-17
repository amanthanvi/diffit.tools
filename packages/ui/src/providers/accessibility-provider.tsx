"use client";

import * as React from 'react';

export interface AccessibilitySettings {
  // Visual
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  
  // Navigation
  keyboardNavigation: boolean;
  focusIndicator: 'default' | 'enhanced' | 'custom';
  skipLinks: boolean;
  
  // Screen Reader
  screenReaderMode: boolean;
  announceUpdates: boolean;
  verbosity: 'brief' | 'normal' | 'verbose';
  
  // Interaction
  clickTargetSize: 'default' | 'large' | 'extra-large';
  autoCompleteHelp: boolean;
  confirmDangerousActions: boolean;
  
  // Content
  altTextDisplay: 'auto' | 'always' | 'never';
  captionsEnabled: boolean;
  simplifiedLanguage: boolean;
}

export interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusTrap: (enabled: boolean) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  isScreenReaderActive: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  keyboardNavigation: true,
  focusIndicator: 'default',
  skipLinks: true,
  screenReaderMode: false,
  announceUpdates: true,
  verbosity: 'normal',
  clickTargetSize: 'default',
  autoCompleteHelp: true,
  confirmDangerousActions: true,
  altTextDisplay: 'auto',
  captionsEnabled: true,
  simplifiedLanguage: false,
};

const AccessibilityContext = React.createContext<AccessibilityContextValue | undefined>(undefined);

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export interface AccessibilityProviderProps {
  children: React.ReactNode;
  defaultSettings?: Partial<AccessibilitySettings>;
  storageKey?: string;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  defaultSettings: customDefaults,
  storageKey = 'diffit-a11y-settings',
}) => {
  const [settings, setSettings] = React.useState<AccessibilitySettings>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch (e) {
          console.error('Failed to parse accessibility settings:', e);
        }
      }
    }
    return { ...defaultSettings, ...customDefaults };
  });

  const [focusTrapEnabled, setFocusTrapEnabled] = React.useState(false);
  const announcerRef = React.useRef<HTMLDivElement | null>(null);
  const [isScreenReaderActive, setIsScreenReaderActive] = React.useState(false);

  // Detect system preferences
  React.useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    handleMotionChange(motionQuery);
    motionQuery.addEventListener('change', handleMotionChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }));
    };
    handleContrastChange(contrastQuery);
    contrastQuery.addEventListener('change', handleContrastChange);

    // Detect screen reader (heuristic approach)
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const indicators = [
        // NVDA
        window.navigator.userAgent.includes('NVDA'),
        // JAWS
        window.navigator.userAgent.includes('JAWS'),
        // Check for aria-live regions being monitored
        document.querySelector('[role="status"]') !== null,
        // Check for high contrast mode (often used with screen readers)
        contrastQuery.matches,
      ];
      
      setIsScreenReaderActive(indicators.some(Boolean));
    };
    detectScreenReader();

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Save settings to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    }
  }, [settings, storageKey]);

  // Apply settings to document
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Apply high contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Apply reduced motion
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    
    // Apply font size
    root.setAttribute('data-font-size', settings.fontSize);
    
    // Apply focus indicator style
    root.setAttribute('data-focus-indicator', settings.focusIndicator);
    
    // Apply click target size
    root.setAttribute('data-target-size', settings.clickTargetSize);
    
    // Apply screen reader mode
    root.setAttribute('data-screen-reader', settings.screenReaderMode.toString());
  }, [settings]);

  const updateSettings = React.useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = React.useCallback(() => {
    setSettings({ ...defaultSettings, ...customDefaults });
  }, [customDefaults]);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announceUpdates) return;
    
    if (!announcerRef.current) {
      // Create announcer element if it doesn't exist
      const announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }
    
    // Update aria-live priority if needed
    announcerRef.current.setAttribute('aria-live', priority);
    
    // Clear previous announcement
    announcerRef.current.textContent = '';
    
    // Announce new message after a brief delay (for screen reader detection)
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = message;
      }
    }, 100);
    
    // Clear after announcement
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = '';
      }
    }, 1000);
  }, [settings.announceUpdates]);

  const setFocusTrap = React.useCallback((enabled: boolean) => {
    setFocusTrapEnabled(enabled);
  }, []);

  const value: AccessibilityContextValue = {
    settings,
    updateSettings,
    resetSettings,
    announce,
    setFocusTrap,
    isHighContrast: settings.highContrast,
    isReducedMotion: settings.reducedMotion,
    isScreenReaderActive,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <FocusTrap enabled={focusTrapEnabled} />
      <SkipLinks enabled={settings.skipLinks} />
    </AccessibilityContext.Provider>
  );
};

// Focus Trap Component
const FocusTrap: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return null;
};

// Skip Links Component
const SkipLinks: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#search" className="skip-link">
        Skip to search
      </a>
      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }
        
        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: var(--background);
          color: var(--foreground);
          padding: 0.5rem 1rem;
          text-decoration: none;
          border-radius: 0.25rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .skip-link:focus {
          position: absolute;
          left: 0.5rem;
          top: 0.5rem;
          width: auto;
          height: auto;
          overflow: visible;
          z-index: 10000;
        }
      `}</style>
    </div>
  );
};

// Accessibility Hooks

export const useAnnounce = () => {
  const { announce } = useAccessibility();
  return announce;
};

export const useFocusManagement = () => {
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const saveFocus = React.useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = React.useCallback(() => {
    if (previousFocusRef.current && previousFocusRef.current.focus) {
      previousFocusRef.current.focus();
    }
  }, []);

  const focusElement = React.useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.focus) {
      element.focus();
    }
  }, []);

  const focusFirst = React.useCallback((container?: HTMLElement) => {
    const parent = container || document.body;
    const firstFocusable = parent.querySelector(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusElement,
    focusFirst,
  };
};

export const useKeyboardNavigation = (handlers: Record<string, () => void>) => {
  const { settings } = useAccessibility();

  React.useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const meta = e.metaKey;

      // Build key combination string
      let combo = '';
      if (ctrl) combo += 'Ctrl+';
      if (shift) combo += 'Shift+';
      if (alt) combo += 'Alt+';
      if (meta) combo += 'Meta+';
      combo += key;

      // Check for handler
      if (handlers[combo]) {
        e.preventDefault();
        handlers[combo]();
      } else if (handlers[key]) {
        handlers[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers, settings.keyboardNavigation]);
};