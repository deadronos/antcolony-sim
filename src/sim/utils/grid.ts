import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';

/**
 * Get 1D index from 2D coordinates with bounds checking
 * 
 * @param x - X coordinate (0 to WORLD_WIDTH-1)
 * @param y - Y coordinate (0 to WORLD_HEIGHT-1)
 * @returns 1D index for array access
 * @throws {Error} If coordinates are out of bounds
 */
export function getIndex(x: number, y: number): number {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    
    // Validate bounds to prevent array out-of-bounds access
    if (!inBounds(floorX, floorY)) {
        throw new Error(`Coordinates (${floorX}, ${floorY}) are out of bounds. ` +
                      `Valid range: x=[0,${WORLD_WIDTH-1}], y=[0,${WORLD_HEIGHT-1}]`);
    }
    
    return floorY * WORLD_WIDTH + floorX;
}

/**
 * Check if x, y coordinates are within the world bounds
 * 
 * @param x - X coordinate to check
 * @param y - Y coordinate to check
 * @returns true if coordinates are within bounds, false otherwise
 */
export function inBounds(x: number, y: number): boolean {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}
