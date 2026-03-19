import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { tick } from './tick';
import { AntState, AntType, BroodType, TileType, type SimState } from './types';
import { WORLD_WIDTH, WORLD_HEIGHT, FOOD_TO_SPAWN } from '../../shared/constants';
import { INITIAL_UPGRADES } from './upgrades';

// These match the private constants in tick.ts
const EGG_DURATION = 100;
const LARVA_DURATION = 200;
const PUPA_DURATION = 150;
const LARVA_FOOD_REQ = 0.05;

function makeState(): SimState {
    const grid = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(TileType.EMPTY);
    return {
        tick: 0,
        ants: [],
        brood: [],
        foodPheromones: new Float32Array(WORLD_WIDTH * WORLD_HEIGHT),
        homePheromones: new Float32Array(WORLD_WIDTH * WORLD_HEIGHT),
        grid,
        wallDamage: new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT),
        foodQuantity: new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT),
        foodTileCount: 0,
        colonyFood: 0,
        nestX: 10,
        nestY: 10,
        upgrades: { ...INITIAL_UPGRADES },
        productionType: AntType.WORKER
    };
}

describe('Brood Lifecycle', () => {
    let state: SimState;
    let scratch: Float32Array;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        state = makeState();
        scratch = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('tick counter', () => {
        it('should increment the tick counter on each call', () => {
            tick(state, scratch);
            expect(state.tick).toBe(1);
            tick(state, scratch);
            expect(state.tick).toBe(2);
        });
    });

    describe('Egg phase', () => {
        it('should increase egg progress each tick', () => {
            state.brood.push({ id: 0, type: BroodType.EGG, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].progress).toBeCloseTo(1 / EGG_DURATION);
        });

        it('should remain as EGG before duration is complete', () => {
            state.brood.push({ id: 0, type: BroodType.EGG, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].type).toBe(BroodType.EGG);
        });

        it('should transition to LARVA when progress reaches 1', () => {
            // Set progress one step before completion so it crosses 1 on the next tick
            state.brood.push({ id: 0, type: BroodType.EGG, antType: AntType.WORKER, progress: 0.99, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].type).toBe(BroodType.LARVA);
            expect(state.brood[0].progress).toBe(0);
        });

        it('should not consume colony food during egg phase', () => {
            state.colonyFood = 0;
            state.brood.push({ id: 0, type: BroodType.EGG, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.colonyFood).toBe(0);
        });
    });

    describe('Larva phase', () => {
        it('should pause larva development when colony food is insufficient', () => {
            state.colonyFood = 0;
            state.brood.push({ id: 0, type: BroodType.LARVA, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].progress).toBe(0);
            expect(state.brood[0].type).toBe(BroodType.LARVA);
        });

        it('should progress larva development when colony food is sufficient', () => {
            state.colonyFood = 1;
            state.brood.push({ id: 0, type: BroodType.LARVA, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].progress).toBeCloseTo(1 / LARVA_DURATION);
        });

        it('should consume colony food each tick during larva development', () => {
            state.colonyFood = 1;
            state.brood.push({ id: 0, type: BroodType.LARVA, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.colonyFood).toBeCloseTo(1 - LARVA_FOOD_REQ);
        });

        it('should transition to PUPA when larva progress reaches 1', () => {
            // Just enough food for one tick and one step over the threshold
            state.colonyFood = LARVA_FOOD_REQ;
            state.brood.push({ id: 0, type: BroodType.LARVA, antType: AntType.WORKER, progress: 0.995, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].type).toBe(BroodType.PUPA);
            expect(state.brood[0].progress).toBe(0);
        });
    });

    describe('Pupa phase', () => {
        it('should increase pupa progress each tick', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].progress).toBeCloseTo(1 / PUPA_DURATION);
        });

        it('should remain as PUPA before duration is complete', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].type).toBe(BroodType.PUPA);
        });

        it('should remove pupa from brood when it hatches', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0.9999, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood.length).toBe(0);
        });

        it('should add a new ant when pupa hatches', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0.9999, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.ants.length).toBe(1);
        });

        it('should hatch ant of the correct caste', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.SCOUT, progress: 0.9999, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.ants[0].type).toBe(AntType.SCOUT);
        });

        it('should place hatched ant at the nest position', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0.9999, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.ants[0].x).toBe(state.nestX);
            expect(state.ants[0].y).toBe(state.nestY);
        });

        it('should hatch ant in SEARCHING state without food', () => {
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0.9999, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.ants[0].state).toBe(AntState.SEARCHING);
            expect(state.ants[0].hasFood).toBe(false);
        });

        it('should not consume colony food during pupa phase', () => {
            state.colonyFood = 0;
            state.brood.push({ id: 0, type: BroodType.PUPA, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.colonyFood).toBe(0);
        });
    });

    describe('Multiple brood items', () => {
        it('should progress all brood items in a single tick', () => {
            state.brood.push({ id: 0, type: BroodType.EGG, antType: AntType.WORKER, progress: 0, x: 10, y: 10 });
            state.brood.push({ id: 1, type: BroodType.PUPA, antType: AntType.SCOUT, progress: 0, x: 10, y: 10 });
            tick(state, scratch);
            expect(state.brood[0].progress).toBeCloseTo(1 / EGG_DURATION);
            expect(state.brood[1].progress).toBeCloseTo(1 / PUPA_DURATION);
        });
    });
});

describe('Queen Spawning', () => {
    let state: SimState;
    let scratch: Float32Array;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        state = makeState();
        scratch = new Float32Array(WORLD_WIDTH * WORLD_HEIGHT);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should lay an egg when colonyFood >= FOOD_TO_SPAWN', () => {
        state.colonyFood = FOOD_TO_SPAWN;
        tick(state, scratch);
        expect(state.brood.length).toBe(1);
        expect(state.brood[0].type).toBe(BroodType.EGG);
    });

    it('should consume FOOD_TO_SPAWN food when laying an egg', () => {
        state.colonyFood = FOOD_TO_SPAWN;
        tick(state, scratch);
        expect(state.colonyFood).toBe(0);
    });

    it('should not lay an egg when colonyFood < FOOD_TO_SPAWN', () => {
        state.colonyFood = FOOD_TO_SPAWN - 1;
        tick(state, scratch);
        expect(state.brood.length).toBe(0);
    });

    it('should lay egg with the current productionType', () => {
        state.colonyFood = FOOD_TO_SPAWN;
        state.productionType = AntType.SOLDIER;
        tick(state, scratch);
        expect(state.brood[0].antType).toBe(AntType.SOLDIER);
    });

    it('should start the new egg at progress 0', () => {
        state.colonyFood = FOOD_TO_SPAWN;
        tick(state, scratch);
        expect(state.brood[0].progress).toBe(0);
    });
});
