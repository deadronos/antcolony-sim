import { TOTAL_ANTS } from '../../shared/constants';
import { AntState, AntType, type Ant } from './types';

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
