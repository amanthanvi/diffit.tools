export interface DiffResult {
  id: string;
  leftContent: string;
  rightContent: string;
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  description?: string;
  syntax: string;
  mode: "unified" | "split" | "inline";
  isPublic: boolean;
  shareId?: string;
  userId?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  diffCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface UsageStats {
  apiCalls: {
    used: number;
    limit: number;
  };
  storage: {
    used: number;
    limit: number;
  };
  teamMembers: {
    used: number;
    limit: number;
  };
}