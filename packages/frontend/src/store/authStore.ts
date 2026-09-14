import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CitizenAuthProfile {
  citizenId: string;
  onegovId?: string;
  name: string;
  email?: string;
  role?: string;
  state?: string;
  district?: string;
  pincode?: string;
  primaryAddress?: string;
  identityMap?: Record<string, string>;
  token: string;
}

interface AuthState {
  citizenId: string | null;
  onegovId: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  state: string | null;
  district: string | null;
  pincode: string | null;
  primaryAddress: string | null;
  identityMap: Record<string, string> | null;
  token: string | null;
  login: (...args: any[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      citizenId: null,
      onegovId: null,
      name: null,
      email: null,
      role: null,
      state: null,
      district: null,
      pincode: null,
      primaryAddress: null,
      identityMap: null,
      token: null,
      login: (...args: any[]) => {
        let profile: any = {};
        if (typeof args[0] === 'object' && args[0] !== null) {
          profile = args[0];
        } else {
          profile = {
            citizenId: args[0],
            name: args[1],
            token: args[2],
            onegovId: args[3],
            email: args[4],
          };
        }

        const citizenId = profile.citizenId || 'citizen-000001';
        const onegovId = profile.onegovId || `OG-2026-${String(citizenId).slice(-8)}`;

        if (profile.token) {
          localStorage.setItem('govlink_token', profile.token);
        }

        set({
          citizenId,
          onegovId,
          name: profile.name || 'Citizen',
          email: profile.email || null,
          role: profile.role || 'CITIZEN',
          state: profile.state || null,
          district: profile.district || null,
          pincode: profile.pincode || null,
          primaryAddress: profile.primaryAddress || null,
          identityMap: profile.identityMap || null,
          token: profile.token || null,
        });
      },
      logout: () => {
        localStorage.removeItem('govlink_token');
        set({
          citizenId: null,
          onegovId: null,
          name: null,
          email: null,
          role: null,
          state: null,
          district: null,
          pincode: null,
          primaryAddress: null,
          identityMap: null,
          token: null,
        });
      },
    }),
    { name: 'govlink-auth' }
  )
);
