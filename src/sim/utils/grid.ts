import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';

/**
 * Get 1D index from 2D coordinates with bounds checking
 * 
 * @param x - X coordinate (0 to WORLD_WIDTH-1)
 * @param y - Y coordinate (0 to WORLD_HEIGHT-1)
 * @returns 1D index for array access, or -1 if out of bounds
 */
export function getIndex(x: number, y: number): number {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    
    if (!inBounds(floorX, floorY)) {
        return -1;
    }
    
    return floorY * WORLD_WIDTH + floorX;
}

/**
 * Get 1D index from 2D coordinates - unsafe version for hot paths where
 * bounds have already been validated. Use getIndex for safe access.
 */
export function getIndexUnsafe(x: number, y: number): number {
    return Math.floor(y) * WORLD_WIDTH + Math.floor(x);
}

/**
 * Check if x, y coordinates are within the world bounds
 */
export function inBounds(x: number, y: number): boolean {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}
