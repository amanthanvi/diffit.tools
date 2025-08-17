/**
 * Keyboard Navigation Utilities
 * Provides comprehensive keyboard navigation support for accessibility
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  global?: boolean;
}

export class KeyboardNavigationManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private enabled: boolean = true;
  private activeElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (!this.enabled) return;

    const combo = this.getKeyCombo(e);
    const shortcut = this.shortcuts.get(combo);

    if (shortcut) {
      // Check if it's a global shortcut or if we're not in an input field
      const isInputField = this.isInputField(e.target as HTMLElement);
      
      if (shortcut.global || !isInputField) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
      }
    }

    // Handle arrow key navigation
    this.handleArrowNavigation(e);
  }

  private handleFocusIn(e: FocusEvent) {
    this.activeElement = e.target as HTMLElement;
  }

  private getKeyCombo(e: KeyboardEvent): string {
    let combo = '';
    if (e.ctrlKey) combo += 'Ctrl+';
    if (e.shiftKey) combo += 'Shift+';
    if (e.altKey) combo += 'Alt+';
    if (e.metaKey) combo += 'Meta+';
    combo += e.key;
    return combo;
  }

  private isInputField(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.contentEditable === 'true'
    );
  }

  private handleArrowNavigation(e: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement || this.isInputField(activeElement)) {
      return;
    }

    // Find navigable elements
    const navigableElements = this.getNavigableElements();
    const currentIndex = navigableElements.indexOf(activeElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowUp':
        nextIndex = this.findPreviousInColumn(navigableElements, currentIndex);
        break;
      case 'ArrowDown':
        nextIndex = this.findNextInColumn(navigableElements, currentIndex);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        nextIndex = Math.min(navigableElements.length - 1, currentIndex + 1);
        break;
    }

    if (nextIndex !== currentIndex && navigableElements[nextIndex]) {
      e.preventDefault();
      navigableElements[nextIndex].focus();
    }
  }

  private getNavigableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[role="option"]',
    ].join(', ');

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  private findPreviousInColumn(elements: HTMLElement[], currentIndex: number): number {
    const current = elements[currentIndex];
    const currentRect = current.getBoundingClientRect();
    
    // Find elements above current element
    const candidates = elements
      .slice(0, currentIndex)
      .map((el, idx) => ({ el, idx, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.bottom <= currentRect.top)
      .filter(({ rect }) => 
        Math.abs(rect.left - currentRect.left) < 50 // Within 50px horizontally
      );

    if (candidates.length === 0) return currentIndex;

    // Return the closest one
    return candidates.reduce((closest, current) => {
      const closestDist = Math.abs(elements[closest].getBoundingClientRect().bottom - currentRect.top);
      const currentDist = Math.abs(current.rect.bottom - currentRect.top);
      return currentDist < closestDist ? current.idx : closest;
    }, candidates[0].idx);
  }

  private findNextInColumn(elements: HTMLElement[], currentIndex: number): number {
    const current = elements[currentIndex];
    const currentRect = current.getBoundingClientRect();
    
    // Find elements below current element
    const candidates = elements
      .slice(currentIndex + 1)
      .map((el, idx) => ({ el, idx: idx + currentIndex + 1, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.top >= currentRect.bottom)
      .filter(({ rect }) => 
        Math.abs(rect.left - currentRect.left) < 50 // Within 50px horizontally
      );

    if (candidates.length === 0) return currentIndex;

    // Return the closest one
    return candidates.reduce((closest, current) => {
      const closestDist = Math.abs(elements[closest].getBoundingClientRect().top - currentRect.bottom);
      const currentDist = Math.abs(current.rect.top - currentRect.bottom);
      return currentDist < closestDist ? current.idx : closest;
    }, candidates[0].idx);
  }

  public registerShortcut(shortcut: KeyboardShortcut) {
    const combo = this.buildCombo(shortcut);
    this.shortcuts.set(combo, shortcut);
  }

  public unregisterShortcut(shortcut: KeyboardShortcut) {
    const combo = this.buildCombo(shortcut);
    this.shortcuts.delete(combo);
  }

  private buildCombo(shortcut: KeyboardShortcut): string {
    let combo = '';
    if (shortcut.ctrl) combo += 'Ctrl+';
    if (shortcut.shift) combo += 'Shift+';
    if (shortcut.alt) combo += 'Alt+';
    if (shortcut.meta) combo += 'Meta+';
    combo += shortcut.key;
    return combo;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  public destroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    this.shortcuts.clear();
  }
}

// Default keyboard shortcuts for diff viewer
export const DEFAULT_DIFF_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'j',
    description: 'Next change',
    action: () => {
      const event = new CustomEvent('diff:navigate', { detail: { direction: 'next' } });
      document.dispatchEvent(event);
    },
  },
  {
    key: 'k',
    description: 'Previous change',
    action: () => {
      const event = new CustomEvent('diff:navigate', { detail: { direction: 'prev' } });
      document.dispatchEvent(event);
    },
  },
  {
    key: 'n',
    description: 'Next file',
    action: () => {
      const event = new CustomEvent('diff:navigate-file', { detail: { direction: 'next' } });
      document.dispatchEvent(event);
    },
  },
  {
    key: 'p',
    description: 'Previous file',
    action: () => {
      const event = new CustomEvent('diff:navigate-file', { detail: { direction: 'prev' } });
      document.dispatchEvent(event);
    },
  },
  {
    key: 'Enter',
    description: 'Expand/collapse section',
    action: () => {
      const event = new CustomEvent('diff:toggle-section');
      document.dispatchEvent(event);
    },
  },
  {
    key: ' ',
    description: 'Toggle side-by-side/unified view',
    action: () => {
      const event = new CustomEvent('diff:toggle-view');
      document.dispatchEvent(event);
    },
  },
  {
    key: 'w',
    description: 'Toggle whitespace',
    action: () => {
      const event = new CustomEvent('diff:toggle-whitespace');
      document.dispatchEvent(event);
    },
  },
  {
    key: 'e',
    ctrl: true,
    description: 'Export diff',
    action: () => {
      const event = new CustomEvent('diff:export');
      document.dispatchEvent(event);
    },
    global: true,
  },
  {
    key: 's',
    ctrl: true,
    description: 'Save diff',
    action: () => {
      const event = new CustomEvent('diff:save');
      document.dispatchEvent(event);
    },
    global: true,
  },
  {
    key: '/',
    description: 'Focus search',
    action: () => {
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
  },
  {
    key: 'Escape',
    description: 'Close dialog/menu',
    action: () => {
      const event = new CustomEvent('ui:close-overlay');
      document.dispatchEvent(event);
    },
    global: true,
  },
  {
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    action: () => {
      const event = new CustomEvent('ui:show-shortcuts');
      document.dispatchEvent(event);
    },
    global: true,
  },
];

// Focus management utilities
export class FocusManager {
  private focusHistory: HTMLElement[] = [];
  private trapStack: HTMLElement[] = [];

  public saveFocus() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusHistory.push(activeElement);
    }
  }

  public restoreFocus() {
    const element = this.focusHistory.pop();
    if (element && element.focus) {
      element.focus();
    }
  }

  public focusFirst(container: HTMLElement) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  public focusLast(container: HTMLElement) {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }

  public trapFocus(container: HTMLElement) {
    this.trapStack.push(container);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const focusable = this.getFocusableElements(container);
      if (focusable.length === 0) return;
      
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    container.setAttribute('data-focus-trap', 'true');
    
    // Store cleanup function
    (container as any).__focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeAttribute('data-focus-trap');
    };
  }

  public releaseFocus(container: HTMLElement) {
    const index = this.trapStack.indexOf(container);
    if (index > -1) {
      this.trapStack.splice(index, 1);
    }
    
    const cleanup = (container as any).__focusTrapCleanup;
    if (cleanup) {
      cleanup();
      delete (container as any).__focusTrapCleanup;
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }
}

// Create singleton instances
export const keyboardNav = new KeyboardNavigationManager();
export const focusManager = new FocusManager();

// Initialize default shortcuts
DEFAULT_DIFF_SHORTCUTS.forEach(shortcut => {
  keyboardNav.registerShortcut(shortcut);
});