import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { updateAnts } from './antSystem';
import { AntState, AntType, TileType, type SimState } from '../core/types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';
import { INITIAL_UPGRADES } from '../core/upgrades';
import { getIndex } from '../utils/grid';

describe('Ant System', () => {
    let state: SimState;

    beforeEach(() => {
        // Mock Math.random to return 0.5 (no noise)
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const grid = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(TileType.EMPTY);
        state = {
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
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should pick up food when SEARCHING and standing on FOOD tile', () => {
        const foodX = 20;
        const foodY = 20;
        const foodIdx = getIndex(foodX, foodY);
        state.grid[foodIdx] = TileType.FOOD;
        state.foodQuantity[foodIdx] = 5;
        
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: foodX,
            y: foodY,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 10
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.RETURNING);
        expect(state.ants[0].hasFood).toBe(true);
        expect(state.foodQuantity[foodIdx]).toBe(4);
        expect(state.grid[foodIdx]).toBe(TileType.FOOD); // still has food
    });

    it('should deplete food tile to EMPTY when quantity reaches zero', () => {
        const foodX = 20;
        const foodY = 20;
        const foodIdx = getIndex(foodX, foodY);
        state.grid[foodIdx] = TileType.FOOD;
        state.foodQuantity[foodIdx] = 1; // last unit

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: foodX,
            y: foodY,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 10
        });

        updateAnts(state);

        expect(state.foodQuantity[foodIdx]).toBe(0);
        expect(state.grid[foodIdx]).toBe(TileType.EMPTY); // tile depleted
    });

    it('should deliver food when RETURNING and standing on NEST tile', () => {
        const nestX = 10;
        const nestY = 10;
        state.grid[getIndex(nestX, nestY)] = TileType.NEST;
        
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: nestX,
            y: nestY,
            angle: 0,
            state: AntState.RETURNING,
            hasFood: true,
            wanderTimer: 10
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.SEARCHING);
        expect(state.ants[0].hasFood).toBe(false);
        expect(state.colonyFood).toBe(1);
    });

    it('should turn around when hitting a wall', () => {
        // Ant speed is 0.5 at level 0. 
        // If ant is at 10.7, next x will be 11.2, which hits tile 11.
        const antX = 10.7;
        const antY = 10.5;
        const wallX = 11; 
        const wallY = 10;
        
        state.grid[getIndex(wallX, wallY)] = TileType.WALL;
        
        const initialAngle = 0;
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: antX,
            y: antY,
            angle: initialAngle,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100 
        });

        updateAnts(state);

        // Target angle is PI (turned around from 0)
        const targetAngle = Math.PI;
        let diff = Math.abs(state.ants[0].angle - targetAngle) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        
        expect(diff).toBeLessThan(0.1); 
    });

    it('should not cause out-of-bounds access when moving outside world bounds', () => {
        // Place ant near edge moving outward
        const antX = WORLD_WIDTH - 0.1;
        const antY = WORLD_HEIGHT / 2;
        
        const initialAngle = 0; // Moving right (out of bounds)
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: antX,
            y: antY,
            angle: initialAngle,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100 
        });

        // This should not throw an error due to out-of-bounds access
        expect(() => updateAnts(state)).not.toThrow();

        // Ant should turn around
        const targetAngle = Math.PI;
        let diff = Math.abs(state.ants[0].angle - targetAngle) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        
        expect(diff).toBeLessThan(0.1);
    });

    it('should not decrement food quantity below zero', () => {
        const foodX = 30;
        const foodY = 30;
        const foodIdx = getIndex(foodX, foodY);
        state.grid[foodIdx] = TileType.FOOD;
        state.foodQuantity[foodIdx] = 0; // Already depleted
        
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: foodX,
            y: foodY,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 10
        });

        updateAnts(state);

        // Ant should still pick up food (state change) but quantity shouldn't go negative
        expect(state.ants[0].state).toBe(AntState.RETURNING);
        expect(state.ants[0].hasFood).toBe(true);
        expect(state.foodQuantity[foodIdx]).toBe(0); // Should not go negative
    });
});

describe('Ant Caste Behavior', () => {
    let state: SimState;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const grid = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(TileType.EMPTY);
        state = {
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
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should not pick up food when ant type is SCOUT', () => {
        const foodX = 20, foodY = 20;
        const foodIdx = getIndex(foodX, foodY);
        state.grid[foodIdx] = TileType.FOOD;
        state.foodQuantity[foodIdx] = 5;

        state.ants.push({
            id: 1,
            type: AntType.SCOUT,
            x: foodX,
            y: foodY,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 10
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.SEARCHING);
        expect(state.ants[0].hasFood).toBe(false);
        expect(state.foodQuantity[foodIdx]).toBe(5);
    });

    it('should move faster as SCOUT than as WORKER (at level 0)', () => {
        // At level 0: WORKER speed = 0.5, SCOUT speed = 0.5 * 1.5 * 1.0 = 0.75
        state.ants.push({
            id: 1,
            type: AntType.SCOUT,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        // Scout should have moved 0.75 units forward (angle=0, no noise with Math.random=0.5)
        expect(state.ants[0].x).toBeCloseTo(50.75);
        expect(state.ants[0].y).toBeCloseTo(50);
    });

    it('should move slower as SOLDIER than as WORKER (at level 0)', () => {
        // At level 0: WORKER speed = 0.5, SOLDIER speed = 0.5 * 0.7 = 0.35
        state.ants.push({
            id: 1,
            type: AntType.SOLDIER,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        // Soldier should have moved 0.35 units forward
        expect(state.ants[0].x).toBeCloseTo(50.35);
        expect(state.ants[0].y).toBeCloseTo(50);
    });

    it('should move at base speed as WORKER (at level 0)', () => {
        // At level 0: WORKER speed = 0.5
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        expect(state.ants[0].x).toBeCloseTo(50.5);
        expect(state.ants[0].y).toBeCloseTo(50);
    });
});

describe('Pheromone Dropping', () => {
    let state: SimState;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const grid = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(TileType.EMPTY);
        state = {
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
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should drop home pheromone when SEARCHING', () => {
        const antX = 50, antY = 50;
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: antX,
            y: antY,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        const idx = getIndex(antX, antY);
        expect(state.homePheromones[idx]).toBeGreaterThan(0);
        expect(state.foodPheromones[idx]).toBe(0);
    });

    it('should drop food pheromone when RETURNING', () => {
        const antX = 50, antY = 50;
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: antX,
            y: antY,
            angle: 0,
            state: AntState.RETURNING,
            hasFood: true,
            wanderTimer: 100
        });

        updateAnts(state);

        const idx = getIndex(antX, antY);
        expect(state.foodPheromones[idx]).toBeGreaterThan(0);
        expect(state.homePheromones[idx]).toBe(0);
    });

    it('should not exceed 1.0 when pheromone already at max', () => {
        const antX = 50, antY = 50;
        const idx = getIndex(antX, antY);
        state.homePheromones[idx] = 1.0; // Already saturated

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: antX,
            y: antY,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        expect(state.homePheromones[idx]).toBe(1.0);
    });
});

describe('Digging Behavior', () => {
    let state: SimState;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const grid = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(TileType.EMPTY);
        state = {
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
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should start digging when WORKER hits a wall and random < 0.2', () => {
        // Mock random to 0.1 so both noise and digging chance return 0.1 (<0.2)
        vi.spyOn(Math, 'random').mockReturnValue(0.1);

        const wallX = 11, wallY = 10;
        state.grid[getIndex(wallX, wallY)] = TileType.WALL;

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 10.7,
            y: 10.5,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.DIGGING);
        expect(state.ants[0].diggingTargetId).toBe(getIndex(wallX, wallY));
    });

    it('should never start digging as SCOUT (always turns around)', () => {
        // Mock random to 0.1 – SCOUT is excluded from digging regardless
        vi.spyOn(Math, 'random').mockReturnValue(0.1);

        const wallX = 11, wallY = 10;
        state.grid[getIndex(wallX, wallY)] = TileType.WALL;

        state.ants.push({
            id: 1,
            type: AntType.SCOUT,
            x: 10.7,
            y: 10.5,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 100
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.SEARCHING);
        expect(state.ants[0].diggingTargetId).toBeUndefined();
    });

    it('should accumulate wall damage while DIGGING', () => {
        // DIGGING_BASE_DAMAGE=2, DIGGING_MULT=1.0 (level 0) → 2 damage per tick
        const wallIdx = getIndex(11, 10);
        state.grid[wallIdx] = TileType.WALL;

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 10,
            y: 10,
            angle: 0,
            state: AntState.DIGGING,
            hasFood: false,
            wanderTimer: 0,
            diggingTargetId: wallIdx
        });

        updateAnts(state);

        expect(state.wallDamage[wallIdx]).toBe(2);
        expect(state.ants[0].state).toBe(AntState.DIGGING);
    });

    it('should destroy wall and resume SEARCHING when wall damage reaches maximum', () => {
        // Set damage to 98; one more tick adds 2 → total 100 ≥ DIGGING_MAX_HEALTH
        const wallIdx = getIndex(11, 10);
        state.grid[wallIdx] = TileType.WALL;
        state.wallDamage[wallIdx] = 98;

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 10,
            y: 10,
            angle: 0,
            state: AntState.DIGGING,
            hasFood: false,
            wanderTimer: 0,
            diggingTargetId: wallIdx
        });

        updateAnts(state);

        expect(state.grid[wallIdx]).toBe(TileType.EMPTY);
        expect(state.wallDamage[wallIdx]).toBe(0);
        expect(state.ants[0].state).toBe(AntState.SEARCHING);
        expect(state.ants[0].diggingTargetId).toBeUndefined();
    });

    it('should resume SEARCHING when digging target wall was already destroyed', () => {
        const wallIdx = getIndex(11, 10);
        state.grid[wallIdx] = TileType.EMPTY; // Wall already gone (destroyed by another ant)

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 10,
            y: 10,
            angle: 0,
            state: AntState.DIGGING,
            hasFood: false,
            wanderTimer: 0,
            diggingTargetId: wallIdx
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.SEARCHING);
        expect(state.ants[0].diggingTargetId).toBeUndefined();
    });

    it('should resume SEARCHING when DIGGING state has no target', () => {
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 10,
            y: 10,
            angle: 0,
            state: AntState.DIGGING,
            hasFood: false,
            wanderTimer: 0
            // diggingTargetId intentionally omitted (undefined)
        });

        updateAnts(state);

        expect(state.ants[0].state).toBe(AntState.SEARCHING);
    });
});

describe('Ant Steering', () => {
    let state: SimState;

    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);

        const grid = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(TileType.EMPTY);
        state = {
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
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should steer toward food pheromone when SEARCHING', () => {
        // SENSOR_DIST=10 (level 0), SENSOR_SPREAD=π/4
        // Right sensor at (57,57) from ant at (50,50) facing angle=0
        const SENSOR_DIST = 10;
        const SENSOR_SPREAD = Math.PI / 4;
        const rightSensorX = Math.floor(50 + Math.cos(SENSOR_SPREAD) * SENSOR_DIST);
        const rightSensorY = Math.floor(50 + Math.sin(SENSOR_SPREAD) * SENSOR_DIST);
        state.foodPheromones[getIndex(rightSensorX, rightSensorY)] = 1.0;

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 0 // Force steering this tick
        });

        updateAnts(state);

        // Ant should have turned right by SENSOR_SPREAD (noise=0 since Math.random=0.5)
        expect(state.ants[0].angle).toBeCloseTo(SENSOR_SPREAD);
    });

    it('should steer toward home pheromone when RETURNING', () => {
        // Left sensor at (57,42) from ant at (50,50) facing angle=0
        const SENSOR_DIST = 10;
        const SENSOR_SPREAD = Math.PI / 4;
        const leftSensorX = Math.floor(50 + Math.cos(-SENSOR_SPREAD) * SENSOR_DIST);
        const leftSensorY = Math.floor(50 + Math.sin(-SENSOR_SPREAD) * SENSOR_DIST);
        state.homePheromones[getIndex(leftSensorX, leftSensorY)] = 1.0;

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.RETURNING,
            hasFood: true,
            wanderTimer: 0 // Force steering this tick
        });

        updateAnts(state);

        // Ant should have turned left by SENSOR_SPREAD
        expect(state.ants[0].angle).toBeCloseTo(-SENSOR_SPREAD);
    });

    it('should not change direction when there is no pheromone signal', () => {
        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 0 // Force steering this tick (no signal → wander, angle unchanged)
        });

        updateAnts(state);

        // With Math.random()=0.5 noise = (0.5-0.5)*0.2 = 0, and no signal → angle stays 0
        expect(state.ants[0].angle).toBeCloseTo(0);
    });

    it('should keep heading straight when forward pheromone is strongest', () => {
        const SENSOR_DIST = 10;
        // Place food pheromone directly ahead
        const forwardX = Math.floor(50 + Math.cos(0) * SENSOR_DIST);
        const forwardY = Math.floor(50 + Math.sin(0) * SENSOR_DIST);
        state.foodPheromones[getIndex(forwardX, forwardY)] = 1.0;

        state.ants.push({
            id: 1,
            type: AntType.WORKER,
            x: 50,
            y: 50,
            angle: 0,
            state: AntState.SEARCHING,
            hasFood: false,
            wanderTimer: 0
        });

        updateAnts(state);

        // Angle should remain 0 (forward is strongest, no noise)
        expect(state.ants[0].angle).toBeCloseTo(0);
    });
});
