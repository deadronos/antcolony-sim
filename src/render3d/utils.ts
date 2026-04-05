import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from '../shared/constants';

/**
 * Converts 2D grid coordinates to 3D world coordinates.
 * @param gridX The X coordinate on the grid
 * @param gridY The Y coordinate on the grid
 * @returns A tuple [worldX, worldZ]
 */
export function getWorldPosition(gridX: number, gridY: number): [number, number] {
    const worldX = (gridX - WORLD_WIDTH / 2) * CELL_SIZE;
    const worldZ = (gridY - WORLD_HEIGHT / 2) * CELL_SIZE;
    return [worldX, worldZ];
}
