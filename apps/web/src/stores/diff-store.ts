import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useRecentDiffsStore } from "./recent-diffs-store";

interface DiffState {
  leftContent: string;
  rightContent: string;
  syntax: string;
  diffMode: "unified" | "split" | "inline";
  history: Array<{ leftContent: string; rightContent: string }>;
  historyIndex: number;
  currentDiffId?: string;
  title?: string;
  description?: string;
}

interface DiffActions {
  setLeftContent: (content: string) => void;
  setRightContent: (content: string) => void;
  setSyntax: (syntax: string) => void;
  setDiffMode: (mode: "unified" | "split" | "inline") => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  saveDiff: () => string;
  loadDiff: (id: string) => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 50;

export const useDiffStore = create<DiffState & DiffActions>()(
  persist(
    (set, get) => ({
      leftContent: "",
      rightContent: "",
      syntax: "text",
      diffMode: "split",
      history: [{ leftContent: "", rightContent: "" }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false,
      currentDiffId: undefined,
      title: undefined,
      description: undefined,

      setLeftContent: (content: string) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ leftContent: content, rightContent: state.rightContent });
        
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          leftContent: content,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          canUndo: newHistory.length > 1,
          canRedo: false,
        });
      },

      setRightContent: (content: string) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push({ leftContent: state.leftContent, rightContent: content });
        
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          rightContent: content,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          canUndo: newHistory.length > 1,
          canRedo: false,
        });
      },

      setSyntax: (syntax: string) => set({ syntax }),
      
      setDiffMode: (diffMode: "unified" | "split" | "inline") => {
        set({ diffMode });
      },
      
      setTitle: (title: string) => set({ title }),
      
      setDescription: (description: string) => set({ description }),

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const historyItem = state.history[newIndex];
          set({
            leftContent: historyItem.leftContent,
            rightContent: historyItem.rightContent,
            historyIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: true,
          });
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const historyItem = state.history[newIndex];
          set({
            leftContent: historyItem.leftContent,
            rightContent: historyItem.rightContent,
            historyIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < state.history.length - 1,
          });
        }
      },

      clear: () => {
        set({
          leftContent: "",
          rightContent: "",
          history: [{ leftContent: "", rightContent: "" }],
          historyIndex: 0,
          canUndo: false,
          canRedo: false,
          currentDiffId: undefined,
          title: undefined,
          description: undefined,
        });
      },
      
      saveDiff: () => {
        const state = get();
        const diffId = useRecentDiffsStore.getState().addDiff({
          title: state.title,
          description: state.description,
          leftContent: state.leftContent,
          rightContent: state.rightContent,
          leftLines: String(state.leftContent || '').split("\n").length,
          rightLines: String(state.rightContent || '').split("\n").length,
          syntax: state.syntax,
        });
        set({ currentDiffId: diffId });
        return diffId;
      },
      
      loadDiff: (id: string) => {
        const diff = useRecentDiffsStore.getState().getDiff(id);
        if (diff) {
          set({
            leftContent: diff.leftContent,
            rightContent: diff.rightContent,
            syntax: diff.syntax,
            title: diff.title,
            description: diff.description,
            currentDiffId: id,
            history: [{ leftContent: diff.leftContent, rightContent: diff.rightContent }],
            historyIndex: 0,
            canUndo: false,
            canRedo: false,
          });
        }
      },
    }),
    {
      name: "diff-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        leftContent: state.leftContent,
        rightContent: state.rightContent,
        syntax: state.syntax,
        diffMode: state.diffMode,
      }),
    }
  )
);