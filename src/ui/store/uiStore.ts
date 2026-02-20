import { create } from 'zustand';
import type { SimState } from '../../sim/core/types';

interface UIStore {
    simState: SimState | null;
    isPaused: boolean;
    setSimState: (state: SimState | null) => void;
    setPaused: (paused: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    simState: null,
    isPaused: true,
    setSimState: (state) => set({ simState: state }),
    setPaused: (paused) => set({ isPaused: paused })
}));
