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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('bmis_token'),
  isLoading: true,

  login: (token, user) => {
    localStorage.setItem('bmis_token', token);
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('bmis_token');
    set({ token: null, user: null, isLoading: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('bmis_token');
    if (!token) {
      set({ user: null, token: null, isLoading: false });
      return;
    }

    try {
      const user = await api.auth.getMe();
      set({ user, token, isLoading: false });
    } catch (error) {
      // Token is invalid/expired
      localStorage.removeItem('bmis_token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
