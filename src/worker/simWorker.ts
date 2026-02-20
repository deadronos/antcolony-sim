import * as Comlink from 'comlink';
import { createWorld } from '../sim/core/world';
import { createAnts } from '../sim/core/ants';
import { createPheromones } from '../sim/core/pheromones';
import { tick } from '../sim/core/tick';
import { TICK_INTERVAL_MS } from '../shared/constants';
import type { SimState } from '../sim/core/types';

let state: SimState | null = null;
let intervalId: number | null = null;
let isPaused = true;

const api = {
    init() {
        const { grid, nestX, nestY } = createWorld();
        state = {
            tick: 0,
            ants: createAnts(nestX, nestY),
            foodPheromones: createPheromones(),
            homePheromones: createPheromones(),
            grid,
            colonyFood: 0
        };
    },
    start() {
        if (!state) this.init();
        if (intervalId) return;
        isPaused = false;
        intervalId = setInterval(() => {
            if (!isPaused && state) {
                tick(state);
            }
        }, TICK_INTERVAL_MS) as unknown as number;
    },
    pause() {
        isPaused = true;
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    },
    reset() {
        this.pause();
        this.init();
    },
    getState(): SimState | null {
        return state;
    }
};

export type SimAPI = typeof api;

Comlink.expose(api);
