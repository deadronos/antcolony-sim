import type { SimState } from './types';
import { evaporatePheromones } from './pheromones';
import { updateAnts } from '../systems/antSystem';

// Run one simulation tick
export function tick(state: SimState) {
    // 1. Update Ant positions, sensors, drops
    updateAnts(state);

    // 2. Decay pheromones over time
    // Only evaporate every few ticks, or with a very small rate
    evaporatePheromones(state.homePheromones, 0.005);
    evaporatePheromones(state.foodPheromones, 0.002);

    state.tick++;
}
