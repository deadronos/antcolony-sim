import * as Comlink from 'comlink';
import { createWorld } from '../sim/core/world';
import { createAnts } from '../sim/core/ants';
import { createPheromones } from '../sim/core/pheromones';
import { tick } from '../sim/core/tick';
import { TICK_INTERVAL_MS } from '../shared/constants';
import { AntType, type SimState, type SimUpgrades, type SimSnapshot } from '../sim/core/types';
import { UPGRADE_DEFS, getUpgradeCost, INITIAL_UPGRADES } from '../sim/core/upgrades';

let state: SimState | null = null;
let scratchBuffer: Float32Array | null = null;
let intervalId: number | null = null;
let isPaused = true;
let currentSpeed = 1;

const api = {
    init() {
        const { grid, foodQuantity, foodTileCount, nestX, nestY } = createWorld();
        scratchBuffer = createPheromones();
        state = {
            tick: 0,
            ants: createAnts(nestX, nestY),
            brood: [],
            foodPheromones: createPheromones(),
            homePheromones: createPheromones(),
            grid,
            foodQuantity,
            foodTileCount,
            colonyFood: 100, // Start with some food for buying upgrades faster
            nestX,
            nestY,
            upgrades: { ...INITIAL_UPGRADES },
            productionType: AntType.WORKER
        };
    },
    start() {
        if (!state || !scratchBuffer) this.init();
        if (intervalId) return;
        isPaused = false;
        intervalId = setInterval(() => {
            if (!isPaused && state && scratchBuffer) {
                // If speed is > 1, process multiple simulation ticks per interval tick
                for (let i = 0; i < currentSpeed; i++) {
                    tick(state, scratchBuffer);
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
    setProductionType(type: AntType) {
        if (state) state.productionType = type;
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
    },
    getSnapshot(): SimSnapshot | null {
        if (!state) return null;
        return {
            tick: state.tick,
            ants: state.ants, // Still an array of objects for now
            brood: state.brood,
            foodPheromones: state.foodPheromones,
            homePheromones: state.homePheromones,
            grid: state.grid,
            foodTileCount: state.foodTileCount,
            colonyFood: state.colonyFood,
            upgrades: state.upgrades,
            productionType: state.productionType
        };
    }
};

export type SimAPI = typeof api;

Comlink.expose(api);
