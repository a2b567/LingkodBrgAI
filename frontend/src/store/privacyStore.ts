import { create } from 'zustand';

interface PrivacyState {
  isPrivacyMode: boolean;
  revealedItemIds: Record<string, boolean>;
  togglePrivacyMode: () => void;
  setPrivacyMode: (enabled: boolean) => void;
  toggleRevealItem: (id: string) => void;
  isItemRevealed: (id: string) => boolean;
  resetRevealed: () => void;
}

export const usePrivacyStore = create<PrivacyState>((set, get) => {
  const initialMode = localStorage.getItem('lingkod_privacy_mode') !== 'false';

  return {
    isPrivacyMode: initialMode,
    revealedItemIds: {},

    togglePrivacyMode: () => {
      const next = !get().isPrivacyMode;
      localStorage.setItem('lingkod_privacy_mode', String(next));
      set({ isPrivacyMode: next, revealedItemIds: {} });
    },

    setPrivacyMode: (enabled: boolean) => {
      localStorage.setItem('lingkod_privacy_mode', String(enabled));
      set({ isPrivacyMode: enabled, revealedItemIds: {} });
    },

    toggleRevealItem: (id: string) => {
      set((state) => ({
        revealedItemIds: {
          ...state.revealedItemIds,
          [id]: !state.revealedItemIds[id],
        },
      }));
    },

    isItemRevealed: (id: string) => {
      if (!get().isPrivacyMode) return true;
      return !!get().revealedItemIds[id];
    },

    resetRevealed: () => {
      set({ revealedItemIds: {} });
    },
  };
});
