import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';
import { getIndex } from '../utils/grid';

/**
 * Total number of pheromone cells in the simulation grid.
 *
 * The pheromone arrays are stored as flattened 2D grids for cache-friendly
 * access during diffusion and evaporation.
 */
export const PHEROMONE_SIZE = WORLD_WIDTH * WORLD_HEIGHT;

/**
 * Allocate a fresh pheromone grid initialized to zero.
 */
export function createPheromones(): Float32Array {
    return new Float32Array(PHEROMONE_SIZE);
}

/**
 * Reduce pheromone intensity over time and clear near-zero values.
 *
 * This keeps trails from lingering forever while also preventing tiny
 * floating-point remnants from accumulating in the grid.
 */
export function evaporatePheromones(grid: Float32Array, decayRate: number = 0.005) {
    for (let i = 0; i < grid.length; i++) {
        if (grid[i] > 0.01) {
            grid[i] -= decayRate;
        } else {
            grid[i] = 0;
        }
    }
}

/**
 * Diffuse pheromones using a lightweight blur pass.
 *
 * The algorithm copies the original grid into `tempGrid`, then blends each
 * interior cell with its four neighbors plus itself. Writing the result back
 * into `grid` avoids an extra full-array copy after diffusion while keeping the
 * source values stable during the pass.
 */
export function diffusePheromones(grid: Float32Array, tempGrid: Float32Array, diffusionRate: number = 0.1) {
    tempGrid.set(grid);

    for (let y = 1; y < WORLD_HEIGHT - 1; y++) {
        for (let x = 1; x < WORLD_WIDTH - 1; x++) {
            const idx = getIndex(x, y);
            const val = tempGrid[idx];

            const sum = tempGrid[idx - 1] +
                        tempGrid[idx + 1] +
                        tempGrid[idx - WORLD_WIDTH] +
                        tempGrid[idx + WORLD_WIDTH] +
                        val;

            const blurred = sum / 5.0;

            grid[idx] = val * (1 - diffusionRate) + blurred * diffusionRate;
        }
    }
}
