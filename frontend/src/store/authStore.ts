import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

const initialUser: User | null = (() => {
  try {
    const s = localStorage.getItem('lingkodbrgai_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: localStorage.getItem('lingkodbrgai_token'),
  isLoading: !initialUser && Boolean(localStorage.getItem('lingkodbrgai_token')),

  login: (token, user) => {
    localStorage.setItem('lingkodbrgai_token', token);
    localStorage.setItem('lingkodbrgai_user', JSON.stringify(user));
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('lingkodbrgai_token');
    localStorage.removeItem('lingkodbrgai_user');
    set({ token: null, user: null, isLoading: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('lingkodbrgai_token');
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      const user = await api.auth.getMe();
      if (user && user.id) {
        localStorage.setItem('lingkodbrgai_user', JSON.stringify(user));
        set({ user, token, isLoading: false });
      }
    } catch {
      // Keep offline/stale state active so user does not experience lockouts during network cold-starts
      set({ isLoading: false });
    }
  },
}));
