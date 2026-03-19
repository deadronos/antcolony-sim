import { TOTAL_ANTS } from '../../shared/constants';
import { AntState, AntType, type Ant } from './types';

/**
 * Create the initial colony population at the nest.
 *
 * Every ant starts at the nest with a random heading so the colony can fan
 * out immediately without requiring a separate bootstrap phase.
 */
export function createAnts(nestX: number, nestY: number): Ant[] {
    const ants: Ant[] = [];
    for (let i = 0; i < TOTAL_ANTS; i++) {
        ants.push({
            id: i,
            type: AntType.WORKER,
            x: nestX,
            y: nestY,
            angle: Math.random() * Math.PI * 2,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 0
        });
    }
    return ants;
}
