import { WORLD_WIDTH, WORLD_HEIGHT, FOOD_INITIAL_QUANTITY } from '../../shared/constants';
import { TileType } from './types';
import { getIndex } from '../utils/grid';
import { createNoise2D, type RandomFn } from 'simplex-noise';

export interface WorldSetupResult {
    grid: Uint8Array;
    wallDamage: Uint8Array;
    foodQuantity: Uint8Array;
    foodTileCount: number;
    nestX: number;
    nestY: number;
}

/**
 * Simple seeded random number generator (LCG)
 */
function makeSeededRandom(seed: number): RandomFn {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) & 0xffffffff;
        return (state >>> 0) / 0xffffffff;
    };
}

/**
 * Generate a fresh cave-like world for the colony.
 *
 * The map is built in layers: first we carve organic walls from simplex noise,
 * then we clear a nest area, and finally we scatter food patches into the open
 * spaces. The returned arrays are sized for direct use by the simulation loop.
 *
 * @param seed - Optional seed for reproducible world generation. Defaults to random.
 */
export function createWorld(seed?: number): WorldSetupResult {
    const size = WORLD_WIDTH * WORLD_HEIGHT;
    const grid = new Uint8Array(size);
    const wallDamage = new Uint8Array(size);
    const foodQuantity = new Uint8Array(size);

    // Use seed if provided, otherwise createNoise2D uses a random seed
    const noise2D = seed !== undefined ? createNoise2D(makeSeededRandom(seed)) : createNoise2D();

    // Default to empty
    grid.fill(TileType.EMPTY);
    wallDamage.fill(0);

    // Setup nest in the center
    const nestX = Math.floor(WORLD_WIDTH / 2);
    const nestY = Math.floor(WORLD_HEIGHT / 2);

    // 1. Generate Organic Walls (Caves) using Simplex Noise
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const idx = getIndex(x, y);

            // Don't spawn walls too close to the nest
            const distToNest = Math.sqrt((x - nestX) ** 2 + (y - nestY) ** 2);
            if (distToNest < 15) continue;

            // Multiple octaves or scales for noise
            const n = noise2D(x * 0.05, y * 0.05); // Large scale features
            const detail = noise2D(x * 0.15, y * 0.15) * 0.3; // Small details

            if (n + detail > 0.4) {
                grid[idx] = TileType.WALL;
            }
        }
    }

    // 2. Clear nest area (3x3)
    for (let y = nestY - 1; y <= nestY + 1; y++) {
        for (let x = nestX - 1; x <= nestX + 1; x++) {
            const idx = getIndex(x, y);
            if (idx >= 0) grid[idx] = TileType.NEST;
        }
    }

    // 3. Generate Food Patches using Noise with different offset
    const foodNoise = seed !== undefined ? createNoise2D(makeSeededRandom(seed + 1)) : createNoise2D();
    let foodTileCount = 0;
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const idx = getIndex(x, y);

            // Only place food in non-wall, non-nest areas
            if (grid[idx] !== TileType.EMPTY) continue;

            const fn = foodNoise(x * 0.03 + 100, y * 0.03 + 100);

            // If noise is high, it's a potential food patch
            if (fn > 0.75) {
                grid[idx] = TileType.FOOD;
                foodQuantity[idx] = FOOD_INITIAL_QUANTITY;
                foodTileCount++;
            }
        }
    }

    return { grid, wallDamage, foodQuantity, foodTileCount, nestX, nestY };
}
