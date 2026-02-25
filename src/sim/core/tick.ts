import type { SimState } from './types';
import { evaporatePheromones, diffusePheromones } from './pheromones';
import { updateAnts } from '../systems/antSystem';
import { FOOD_TO_SPAWN } from '../../shared/constants';
import { AntState } from './types';

// Run one simulation tick
export function tick(state: SimState, scratchBuffer: Float32Array) {
    // 1. Update Ant positions, sensors, drops
    updateAnts(state);

    // 2. Diffusion and Decay
    // We diffuse first to spread the scent, then decay to keep it fresh
    diffusePheromones(state.homePheromones, scratchBuffer, 0.1);
    diffusePheromones(state.foodPheromones, scratchBuffer, 0.1);

    evaporatePheromones(state.homePheromones, 0.005);
    evaporatePheromones(state.foodPheromones, 0.002);

    // 3. Worker Spawning
    if (state.colonyFood >= FOOD_TO_SPAWN) {
        state.colonyFood -= FOOD_TO_SPAWN;
        const newAntId = state.ants.length > 0 ? state.ants[state.ants.length - 1].id + 1 : 0;
        state.ants.push({
            id: newAntId,
            x: state.nestX,
            y: state.nestY,
            angle: Math.random() * Math.PI * 2,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 0
        });
    }

    state.tick++;
}
