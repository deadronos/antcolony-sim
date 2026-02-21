import { create } from 'zustand';
import type { SimState } from '../../sim/core/types';

interface UIStore {
    simState: SimState | null;
    isPaused: boolean;
    speedMultiplier: number;
    showPheromones: boolean;
    renderMode: '2D' | '3D';
    setSimState: (state: SimState | null) => void;
    setPaused: (paused: boolean) => void;
    setSpeedMultiplier: (speed: number) => void;
    setShowPheromones: (show: boolean) => void;
    setRenderMode: (mode: '2D' | '3D') => void;
}

export const useUIStore = create<UIStore>((set) => ({
    simState: null,
    isPaused: true,
    speedMultiplier: 1,
    showPheromones: true,
    renderMode: '2D',
    setSimState: (state) => set({ simState: state }),
    setPaused: (paused) => set({ isPaused: paused }),
    setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),
    setShowPheromones: (show) => set({ showPheromones: show }),
    setRenderMode: (mode) => set({ renderMode: mode })
}));
