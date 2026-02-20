import { CELL_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../shared/constants';
import { AntState, TileType, type SimState } from '../sim/core/types';

export function renderSimulation(ctx: CanvasRenderingContext2D, state: SimState) {
    // Clear background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, WORLD_WIDTH * CELL_SIZE, WORLD_HEIGHT * CELL_SIZE);

    // 1. Grid (Nest, Food, Wall)
    for (let i = 0; i < state.grid.length; i++) {
        const x = i % WORLD_WIDTH;
        const y = Math.floor(i / WORLD_WIDTH);
        const tile = state.grid[i];

        if (tile === TileType.NEST) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (tile === TileType.FOOD) {
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (tile === TileType.WALL) {
            ctx.fillStyle = '#555555';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }

    // 2. Pheromone Heatmaps
    for (let i = 0; i < state.foodPheromones.length; i++) {
        const x = i % WORLD_WIDTH;
        const y = Math.floor(i / WORLD_WIDTH);

        const fp = state.foodPheromones[i];
        if (fp > 0.05) {
            ctx.fillStyle = `rgba(0, 255, 0, ${fp * 0.5})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        const hp = state.homePheromones[i];
        if (hp > 0.05) {
            ctx.fillStyle = `rgba(0, 150, 255, ${hp * 0.5})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
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
