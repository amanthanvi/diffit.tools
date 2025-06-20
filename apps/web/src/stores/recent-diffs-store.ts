import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface RecentDiff {
  id: string;
  title?: string;
  description?: string;
  leftContent: string;
  rightContent: string;
  leftLines: number;
  rightLines: number;
  syntax: string;
  createdAt: string;
}

interface RecentDiffsState {
  recentDiffs: RecentDiff[];
  addDiff: (diff: Omit<RecentDiff, "id" | "createdAt">) => string;
  removeDiff: (id: string) => void;
  updateDiff: (id: string, updates: Partial<RecentDiff>) => void;
  getDiff: (id: string) => RecentDiff | undefined;
  clearAll: () => void;
}

const MAX_RECENT_DIFFS = 50;

export const useRecentDiffsStore = create<RecentDiffsState>()(
  persist(
    (set, get) => ({
      recentDiffs: [],

      addDiff: (diff) => {
        const id = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDiff: RecentDiff = {
          ...diff,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedDiffs = [newDiff, ...state.recentDiffs];
          // Keep only the most recent diffs
          if (updatedDiffs.length > MAX_RECENT_DIFFS) {
            updatedDiffs.pop();
          }
          return { recentDiffs: updatedDiffs };
        });

        return id;
      },

      removeDiff: (id) => {
        set((state) => ({
          recentDiffs: state.recentDiffs.filter((diff) => diff.id !== id),
        }));
      },

      updateDiff: (id, updates) => {
        set((state) => ({
          recentDiffs: state.recentDiffs.map((diff) =>
            diff.id === id ? { ...diff, ...updates } : diff
          ),
        }));
      },

      getDiff: (id) => {
        return get().recentDiffs.find((diff) => diff.id === id);
      },

      clearAll: () => {
        set({ recentDiffs: [] });
      },
    }),
    {
      name: "recent-diffs-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);