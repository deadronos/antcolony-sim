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
});
