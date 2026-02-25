import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';
import { getIndex } from '../utils/grid';

export const PHEROMONE_SIZE = WORLD_WIDTH * WORLD_HEIGHT;

export function createPheromones(): Float32Array {
    return new Float32Array(PHEROMONE_SIZE);
}

export function evaporatePheromones(grid: Float32Array, decayRate: number = 0.005) {
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] > 0.01) {
            grid[i] -= decayRate;
        } else {
            grid[i] = 0;
        }
    }
}

// Simple blur for diffusion
export function diffusePheromones(grid: Float32Array, tempGrid: Float32Array, diffusionRate: number = 0.1) {
    tempGrid.set(grid); // Initialize tempGrid with current values to preserve edges

    for (let y = 1; y < WORLD_HEIGHT - 1; y++) {
        for (let x = 1; x < WORLD_WIDTH - 1; x++) {
            const idx = getIndex(x, y);
            const val = grid[idx];

            const sum = val +
                grid[idx - 1] +
                grid[idx + 1] +
                grid[idx - WORLD_WIDTH] +
                grid[idx + WORLD_WIDTH];

            const blurred = sum / 5.0;

            // Mix original and blurred based on diffusionRate
            tempGrid[idx] = val * (1 - diffusionRate) + blurred * diffusionRate;
        }
    }

    // Swap back
    grid.set(tempGrid);
}
