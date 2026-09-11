import { create } from 'zustand';
import { WorkflowRun } from '../types';

interface WorkflowState {
  run: WorkflowRun | null;
  setRun: (run: WorkflowRun | null) => void;
  updateRun: (updates: Partial<WorkflowRun>) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  run: null,
  setRun: (run) => set({ run }),
  updateRun: (updates) => set((s) => ({ run: s.run ? { ...s.run, ...updates } : null })),
  reset: () => set({ run: null }),
}));
