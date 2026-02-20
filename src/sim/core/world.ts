import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';
import { TileType } from './types';
import { getIndex } from '../utils/grid';

export interface WorldSetupResult {
    grid: Uint8Array;
    nestX: number;
    nestY: number;
}

export function createWorld(): WorldSetupResult {
    const size = WORLD_WIDTH * WORLD_HEIGHT;
    const grid = new Uint8Array(size);

    // Default to empty
    grid.fill(TileType.EMPTY);

    // Setup nest in the center
    const nestX = Math.floor(WORLD_WIDTH / 2);
    const nestY = Math.floor(WORLD_HEIGHT / 2);

    // Make a small 3x3 nest patch
    for (let y = nestY - 1; y <= nestY + 1; y++) {
        for (let x = nestX - 1; x <= nestX + 1; x++) {
            grid[getIndex(x, y)] = TileType.NEST;
        }
    }

    // Add 2 food patches
    const createFoodPatch = (cx: number, cy: number, radius: number) => {
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) {
                    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                        grid[getIndex(x, y)] = TileType.FOOD;
                    }
                }
            }
        }
    };

    createFoodPatch(Math.floor(WORLD_WIDTH * 0.2), Math.floor(WORLD_HEIGHT * 0.2), 4);
    createFoodPatch(Math.floor(WORLD_WIDTH * 0.8), Math.floor(WORLD_HEIGHT * 0.7), 6);

    // Add random geometric obstacles (walls) to make pathing interesting
    const numObstacles = 15;
    for (let i = 0; i < numObstacles; i++) {
        const cx = Math.floor(Math.random() * WORLD_WIDTH);
        const cy = Math.floor(Math.random() * WORLD_HEIGHT);

        // Don't spawn walls too close to the nest
        const distToNest = Math.sqrt((cx - nestX) ** 2 + (cy - nestY) ** 2);
        if (distToNest < 20) continue;

        // Create a clump of walls
        const w = 2 + Math.floor(Math.random() * 8);
        const h = 2 + Math.floor(Math.random() * 8);

        for (let y = cy; y < cy + h; y++) {
            for (let x = cx; x < cx + w; x++) {
                if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
                    const idx = getIndex(x, y);
                    // Only overwrite empty space
                    if (grid[idx] === TileType.EMPTY) {
                        grid[idx] = TileType.WALL;
                    }
                }
            }
        }
    }

    return { grid, nestX, nestY };
}
