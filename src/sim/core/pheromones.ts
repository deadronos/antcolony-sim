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

// Optimized blur for diffusion - avoids unnecessary array copies
export function diffusePheromones(grid: Float32Array, tempGrid: Float32Array, diffusionRate: number = 0.1) {
    // Use typed array set() method for efficient copying
    tempGrid.set(grid);

    // Perform diffusion calculation using original values from tempGrid
    for (let y = 1; y < WORLD_HEIGHT - 1; y++) {
        for (let x = 1; x < WORLD_WIDTH - 1; x++) {
            const idx = getIndex(x, y);
            const val = tempGrid[idx]; // Use original value from tempGrid

            // Sum neighboring cells using tempGrid (original values)
            const sum = tempGrid[idx - 1] +
                        tempGrid[idx + 1] +
                        tempGrid[idx - WORLD_WIDTH] +
                        tempGrid[idx + WORLD_WIDTH] +
                        val;

            const blurred = sum / 5.0;

            // Mix original and blurred based on diffusionRate
            grid[idx] = val * (1 - diffusionRate) + blurred * diffusionRate;
        }
    }
    
    // Note: We no longer need to copy tempGrid back to grid
    // The result is already in grid, and tempGrid will be reused next time
}
