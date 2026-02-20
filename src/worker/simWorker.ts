import * as Comlink from 'comlink';
import { createWorld } from '../sim/core/world';
import { createAnts } from '../sim/core/ants';
import { createPheromones } from '../sim/core/pheromones';
import { tick } from '../sim/core/tick';
import { TICK_INTERVAL_MS } from '../shared/constants';
import type { SimState, SimUpgrades } from '../sim/core/types';
import { UPGRADE_DEFS, getUpgradeCost, INITIAL_UPGRADES } from '../sim/core/upgrades';

let state: SimState | null = null;
let intervalId: number | null = null;
let isPaused = true;
let currentSpeed = 1;

const api = {
    init() {
        const { grid, nestX, nestY } = createWorld();
        state = {
            tick: 0,
            ants: createAnts(nestX, nestY),
            foodPheromones: createPheromones(),
            homePheromones: createPheromones(),
            grid,
            colonyFood: 100, // Start with some food for buying upgrades faster
            nestX,
            nestY,
            upgrades: { ...INITIAL_UPGRADES }
        };
    },
    start() {
        if (!state) this.init();
        if (intervalId) return;
        isPaused = false;
        intervalId = setInterval(() => {
            if (!isPaused && state) {
                // If speed is > 1, process multiple simulation ticks per interval tick
                for (let i = 0; i < currentSpeed; i++) {
                    tick(state);
                }
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
    setSpeed(speed: number) {
        currentSpeed = speed;
    },
    purchaseUpgrade(upgradeId: keyof SimUpgrades) {
        if (!state) return;
        const def = UPGRADE_DEFS[upgradeId];
        const currentLevel = state.upgrades[upgradeId];

        if (currentLevel >= def.maxLevel) return;

        const cost = getUpgradeCost(def, currentLevel);
        if (state.colonyFood >= cost) {
            state.colonyFood -= cost;
            state.upgrades[upgradeId] = currentLevel + 1;
        }
    },
    getState(): SimState | null {
        return state;
    }
};

export type SimAPI = typeof api;

Comlink.expose(api);
