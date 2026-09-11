import { create } from 'zustand';
import { AuditEntry } from '../types';

interface AuditState {
  entries: AuditEntry[];
  chainValid: boolean | null;
  brokenAt: number | undefined;
  totalEntries: number;
  setTrail: (entries: AuditEntry[]) => void;
  setVerification: (valid: boolean, brokenAt?: number, total?: number) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  entries: [],
  chainValid: null,
  brokenAt: undefined,
  totalEntries: 0,
  setTrail: (entries) => set({ entries }),
  setVerification: (valid, brokenAt, total = 0) => set({ chainValid: valid, brokenAt, totalEntries: total }),
}));
