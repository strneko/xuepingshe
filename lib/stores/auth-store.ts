import { create } from "zustand";

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  reviewCount: number;
  likedCount: number;
  points: number;
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  setUser: (user) => set({ user, isLoggedIn: true }),
  clearUser: () => set({ user: null, isLoggedIn: false }),
}));
