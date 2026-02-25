import type { SimState } from './types';
import { evaporatePheromones, diffusePheromones } from './pheromones';
import { updateAnts } from '../systems/antSystem';
import { FOOD_TO_SPAWN } from '../../shared/constants';
import { AntState, BroodType } from './types';

const EGG_DURATION = 100;
const LARVA_DURATION = 200;
const PUPA_DURATION = 150;
const LARVA_FOOD_REQ = 0.05; // Food consumed per tick for larva progress

// Run one simulation tick
export function tick(state: SimState, scratchBuffer: Float32Array) {
    // 1. Update Ant positions, sensors, drops
    updateAnts(state);

    // 2. Diffusion and Decay
    diffusePheromones(state.homePheromones, scratchBuffer, 0.1);
    diffusePheromones(state.foodPheromones, scratchBuffer, 0.1);

    evaporatePheromones(state.homePheromones, 0.005);
    evaporatePheromones(state.foodPheromones, 0.002);

    // 3. Brood Progression
    for (let i = state.brood.length - 1; i >= 0; i--) {
        const item = state.brood[i];

        if (item.type === BroodType.EGG) {
            item.progress += 1 / EGG_DURATION;
            if (item.progress >= 1) {
                item.type = BroodType.LARVA;
                item.progress = 0;
            }
        } else if (item.type === BroodType.LARVA) {
            // Larvae need food to grow
            if (state.colonyFood >= LARVA_FOOD_REQ) {
                state.colonyFood -= LARVA_FOOD_REQ;
                item.progress += 1 / LARVA_DURATION;
                if (item.progress >= 1) {
                    item.type = BroodType.PUPA;
                    item.progress = 0;
                }
            }
        } else if (item.type === BroodType.PUPA) {
            item.progress += 1 / PUPA_DURATION;
            if (item.progress >= 1) {
                // Hatch!
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
                state.brood.splice(i, 1);
            }
        }
    }

    // 4. Queen Lays Eggs
    if (state.colonyFood >= FOOD_TO_SPAWN) {
        state.colonyFood -= FOOD_TO_SPAWN;
        const nextId = state.brood.length > 0 ? state.brood[state.brood.length - 1].id + 1 : 0;
        
        // Random position within a small radius of the nest
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 2;
        const bx = state.nestX + Math.cos(angle) * dist;
        const by = state.nestY + Math.sin(angle) * dist;

        state.brood.push({
            id: nextId,
            type: BroodType.EGG,
            progress: 0,
            x: bx,
            y: by
        });
    }

    state.tick++;
}
