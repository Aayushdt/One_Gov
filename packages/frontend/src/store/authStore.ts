import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  citizenId: string | null;
  name: string | null;
  token: string | null;
  login: (citizenId: string, name: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      citizenId: null,
      name: null,
      token: null,
      login: (citizenId, name, token) => {
        localStorage.setItem('govlink_token', token);
        set({ citizenId, name, token });
      },
      logout: () => {
        localStorage.removeItem('govlink_token');
        set({ citizenId: null, name: null, token: null });
      },
    }),
    { name: 'govlink-auth' }
  )
);
