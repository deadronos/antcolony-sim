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

    return { grid, nestX, nestY };
}
