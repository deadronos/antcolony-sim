import { create } from 'zustand';
import type { SimState, SimSnapshot } from '../../sim/core/types';

interface UIStore {
    simState: SimState | SimSnapshot | null;
    isPaused: boolean;
    speedMultiplier: number;
    showPheromones: boolean;
    renderMode: '2D' | '3D';
    setSimState: (state: SimState | SimSnapshot | null) => void;
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
    setSimState: (state) => set((prev) => {
        // If we have an existing state with a grid, and the new state is a snapshot (no grid),
        // merge them to preserve the static grid data.
        if (prev.simState && 'grid' in prev.simState && state && !('grid' in state)) {
            return { simState: { ...prev.simState, ...state } };
        }
        return { simState: state };
    }),
    setPaused: (paused) => set({ isPaused: paused }),
    setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),
    setShowPheromones: (show) => set({ showPheromones: show }),
    setRenderMode: (mode) => set({ renderMode: mode })
}));
