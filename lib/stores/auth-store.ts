import { create } from "zustand";

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  role: "STUDENT" | "TEACHER";
  isAdmin?: boolean;
  reviewCount: number;
  likedCount: number;
  followingCount: number;
  followerCount: number;
  points: number;
}

interface AuthState {
  initialized: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
  authDialogOpen: boolean;
  initializeAuth: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  isLoggedIn: false,
  user: null,
  authDialogOpen: false,
  async initializeAuth() {
    if (get().initialized) {
      return;
    }

    const response = await fetch("/api/auth/me");

    if (!response.ok) {
      set({
        initialized: true,
        isLoggedIn: false,
        user: null,
        authDialogOpen: response.status === 401,
      });
      return;
    }

    const data = (await response.json()) as { user?: UserProfile };
    set({
      user: data.user ?? null,
      isLoggedIn: Boolean(data.user),
      initialized: true,
    });
  },
  setUser: (user) => set({ user, isLoggedIn: true, initialized: true }),
  clearUser: () => set({ user: null, isLoggedIn: false, initialized: true }),
  openAuthDialog: () => set({ authDialogOpen: true }),
  closeAuthDialog: () => set({ authDialogOpen: false }),
}));
