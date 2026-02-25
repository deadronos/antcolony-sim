import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';

// Get 1D index from 2D coordinates
export function getIndex(x: number, y: number): number {
    return Math.floor(y) * WORLD_WIDTH + Math.floor(x);
}

// Check if x, y is within bounds
export function inBounds(x: number, y: number): boolean {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}
