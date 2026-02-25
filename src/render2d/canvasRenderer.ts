import { CELL_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../shared/constants';
import { AntState, TileType, type SimState } from '../sim/core/types';

export interface RenderOptions {
    showPheromones: boolean;
}

let offscreenCanvas: HTMLCanvasElement | null = null;
let pheromoneImageData: ImageData | null = null;
let pheromoneBuffer: Uint8ClampedArray | null = null;

function getOffscreenCanvas(state: SimState | SimSnapshot) {
    if (!offscreenCanvas) {
        if (!('grid' in state)) return null; // Can't init without grid

        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = WORLD_WIDTH * CELL_SIZE;
        offscreenCanvas.height = WORLD_HEIGHT * CELL_SIZE;
        const ctx = offscreenCanvas.getContext('2d')!;

        // Draw static grid once
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        for (let i = 0; i < state.grid.length; i++) {
            const x = i % WORLD_WIDTH;
            const y = Math.floor(i / WORLD_WIDTH);
            const tile = state.grid[i];

            if (tile === TileType.NEST) {
                ctx.fillStyle = '#6b4c31';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else if (tile === TileType.FOOD) {
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else if (tile === TileType.WALL) {
                ctx.fillStyle = '#3d2b1f';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    return offscreenCanvas;
}

export function renderSimulation(ctx: CanvasRenderingContext2D, state: SimState | SimSnapshot, options: RenderOptions) {
    // 1. Draw cached static background
    const bg = getOffscreenCanvas(state);
    if (bg) ctx.drawImage(bg, 0, 0);

    // 2. Pheromone Heatmaps (Optimized with ImageData)
    if (options.showPheromones) {
        if (!pheromoneImageData) {
            pheromoneImageData = new ImageData(WORLD_WIDTH, WORLD_HEIGHT);
            pheromoneBuffer = pheromoneImageData.data;
        }

        const data = pheromoneBuffer!;
        for (let i = 0; i < state.foodPheromones.length; i++) {
            const fp = state.foodPheromones[i];
            const hp = state.homePheromones[i];
            const dataIdx = i * 4;

            // Food Pheromone: Green
            // Home Pheromone: Blue
            // We can mix them or prioritize
            data[dataIdx + 0] = 0; // R
            data[dataIdx + 1] = Math.min(255, fp * 255); // G
            data[dataIdx + 2] = Math.min(255, hp * 255); // B
            data[dataIdx + 3] = Math.max(fp, hp) * 128; // A (semi-transparent)
        }

        // Create a temporary small canvas to scale up the pheromone ImageData
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = WORLD_WIDTH;
        tempCanvas.height = WORLD_HEIGHT;
        tempCanvas.getContext('2d')!.putImageData(pheromoneImageData, 0, 0);

        ctx.imageSmoothingEnabled = true; // Smooth trails
        ctx.drawImage(tempCanvas, 0, 0, WORLD_WIDTH * CELL_SIZE, WORLD_HEIGHT * CELL_SIZE);
    }

    // 3. Ants
    for (const ant of state.ants) {
        ctx.save();
        // Move to ant center
        ctx.translate((ant.x + 0.5) * CELL_SIZE, (ant.y + 0.5) * CELL_SIZE);
        ctx.rotate(ant.angle);

        // Color based on searching logic
        if (ant.hasFood) {
            ctx.fillStyle = '#ffaa00'; // Yellowish for food carrier
        } else if (ant.state === AntState.SEARCHING) {
            ctx.fillStyle = '#ffffff'; // White default
        } else {
            ctx.fillStyle = '#bbffbb'; // Soft green if returning but no food? (fallback)
        }

        // Simple shape
        ctx.beginPath();
        ctx.ellipse(-1, 0, 2, 1, 0, 0, Math.PI * 2); // Body
        ctx.ellipse(1, 0, 1, 1, 0, 0, Math.PI * 2);  // Head
        ctx.fill();

        ctx.restore();
    }
}
