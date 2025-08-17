import { compress, decompress } from 'lz-string';

export interface ShareableData {
  version: string;
  type: 'text' | 'file' | 'folder';
  leftContent?: string;
  rightContent?: string;
  leftName?: string;
  rightName?: string;
  options?: {
    ignoreWhitespace?: boolean;
    ignoreCase?: boolean;
    contextLines?: number;
  };
  metadata?: {
    createdAt: string;
    expiresAt?: string;
    title?: string;
    description?: string;
  };
}

export class ShareService {
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_URL_LENGTH = 2048; // Safe URL length
  private static readonly MAX_HASH_LENGTH = 32768; // Max for URL hash

  /**
   * Generate a shareable URL from diff data
   */
  static generateShareUrl(data: Omit<ShareableData, 'version'>): string {
    const shareData: ShareableData = {
      ...data,
      version: this.VERSION,
      metadata: {
        ...data.metadata,
        createdAt: data.metadata?.createdAt || new Date().toISOString(),
      },
    };

    // Compress the data
    const compressed = this.compressData(shareData);
    
    // Check if we should use hash or external storage
    if (compressed.length > this.MAX_HASH_LENGTH) {
      // For large diffs, we'd need external storage
      // For now, we'll truncate and add a warning
      console.warn('Diff too large for URL sharing, consider using external storage');
      return this.createHashUrl(compressed.substring(0, this.MAX_HASH_LENGTH));
    }

    return this.createHashUrl(compressed);
  }

  /**
   * Parse a shared URL to extract diff data
   */
  static parseShareUrl(url: string): ShareableData | null {
    try {
      const urlObj = new URL(url);
      const hash = urlObj.hash.slice(1); // Remove the #
      
      if (!hash) return null;

      // Check if it's a direct hash or an ID for external storage
      if (hash.startsWith('id:')) {
        // This would fetch from external storage
        console.warn('External storage IDs not yet implemented');
        return null;
      }

      return this.decompressData(hash);
    } catch (error) {
      console.error('Failed to parse share URL:', error);
      return null;
    }
  }

  /**
   * Generate a short share code for the diff
   */
  static generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Compress data for URL sharing
   */
  private static compressData(data: ShareableData): string {
    const json = JSON.stringify(data);
    const compressed = compress(json);
    
    // Base64 URL-safe encoding
    return btoa(compressed)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decompress data from URL
   */
  private static decompressData(compressed: string): ShareableData | null {
    try {
      // Restore Base64 padding
      const padding = '='.repeat((4 - (compressed.length % 4)) % 4);
      const base64 = compressed
        .replace(/-/g, '+')
        .replace(/_/g, '/') + padding;
      
      const decompressed = decompress(atob(base64));
      if (!decompressed) return null;
      
      const data = JSON.parse(decompressed) as ShareableData;
      
      // Validate version
      if (data.version !== this.VERSION) {
        console.warn(`Share data version mismatch: expected ${this.VERSION}, got ${data.version}`);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to decompress share data:', error);
      return null;
    }
  }

  /**
   * Create a shareable URL with the compressed data
   */
  private static createHashUrl(compressed: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://diffit.tools';
    
    return `${baseUrl}/shared#${compressed}`;
  }

  /**
   * Create a short link using external service (mock implementation)
   */
  static async createShortLink(longUrl: string): Promise<string> {
    // In production, this would call a URL shortening service
    // For now, return a mock short URL
    const code = this.generateShareCode();
    return `https://diffit.tools/s/${code}`;
  }

  /**
   * Save diff data to browser storage for persistence
   */
  static saveToBrowser(key: string, data: ShareableData): void {
    if (typeof window === 'undefined') return;
    
    try {
      const compressed = this.compressData(data);
      localStorage.setItem(`diffit:share:${key}`, compressed);
      
      // Keep track of saved shares
      const savedShares = JSON.parse(localStorage.getItem('diffit:shares') || '[]');
      if (!savedShares.includes(key)) {
        savedShares.push(key);
        localStorage.setItem('diffit:shares', JSON.stringify(savedShares));
      }
    } catch (error) {
      console.error('Failed to save to browser storage:', error);
    }
  }

  /**
   * Load diff data from browser storage
   */
  static loadFromBrowser(key: string): ShareableData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const compressed = localStorage.getItem(`diffit:share:${key}`);
      if (!compressed) return null;
      
      return this.decompressData(compressed);
    } catch (error) {
      console.error('Failed to load from browser storage:', error);
      return null;
    }
  }

  /**
   * Get all saved shares from browser storage
   */
  static getSavedShares(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('diffit:shares') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Delete a saved share
   */
  static deleteSavedShare(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`diffit:share:${key}`);
      
      const savedShares = JSON.parse(localStorage.getItem('diffit:shares') || '[]');
      const filtered = savedShares.filter((k: string) => k !== key);
      localStorage.setItem('diffit:shares', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete saved share:', error);
    }
  }

  /**
   * Check if content is too large for URL sharing
   */
  static canShareViaUrl(data: Omit<ShareableData, 'version'>): boolean {
    const shareData: ShareableData = {
      ...data,
      version: this.VERSION,
    };
    
    const compressed = this.compressData(shareData);
    return compressed.length <= this.MAX_HASH_LENGTH;
  }

  /**
   * Get size estimate for share data
   */
  static getShareSize(data: Omit<ShareableData, 'version'>): {
    raw: number;
    compressed: number;
    percentage: number;
    canShare: boolean;
  } {
    const shareData: ShareableData = {
      ...data,
      version: this.VERSION,
    };
    
    const json = JSON.stringify(shareData);
    const compressed = this.compressData(shareData);
    
    return {
      raw: json.length,
      compressed: compressed.length,
      percentage: Math.round((compressed.length / json.length) * 100),
      canShare: compressed.length <= this.MAX_HASH_LENGTH,
    };
  }
}