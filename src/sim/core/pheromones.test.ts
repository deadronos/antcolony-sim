import { describe, it, expect, beforeEach } from 'vitest';
import { createPheromones, evaporatePheromones, diffusePheromones } from './pheromones';
import { getIndex } from '../utils/grid';

describe('Pheromone Logic', () => {
    let grid: Float32Array;
    let scratch: Float32Array;

    beforeEach(() => {
        grid = createPheromones();
        scratch = createPheromones();
    });

    it('should evaporate pheromones over time', () => {
        const idx = getIndex(10, 10);
        grid[idx] = 1.0;
        
        evaporatePheromones(grid, 0.1);
        expect(grid[idx]).toBeCloseTo(0.9);
        
        evaporatePheromones(grid, 0.9);
        expect(grid[idx]).toBeCloseTo(0, 5);
    });

    it('should diffuse pheromones to neighbors', () => {
        const x = 50;
        const y = 50;
        const idx = getIndex(x, y);
        
        grid[idx] = 1.0;
        
        // Run diffusion
        diffusePheromones(grid, scratch, 1.0); // 100% diffusion rate for test
        
        // The center should decrease, neighbors should increase
        expect(grid[idx]).toBeLessThan(1.0);
        
        const neighbors = [
            getIndex(x + 1, y),
            getIndex(x - 1, y),
            getIndex(x, y + 1),
            getIndex(x, y - 1),
        ];
        
        for (const nIdx of neighbors) {
            expect(grid[nIdx]).toBeGreaterThan(0);
        }
    });

    it('should preserve total pheromone during diffusion (roughly)', () => {
        grid.fill(0);
        const idx = getIndex(10, 10);
        grid[idx] = 1.0;
        
        const totalBefore = grid.reduce((a, b) => a + b, 0);
        
        diffusePheromones(grid, scratch, 0.5);
        
        const totalAfter = grid.reduce((a, b) => a + b, 0);
        
        // Simple blur diffusion isn't perfectly conservative at edges, 
        // but in the middle it should be very close.
        expect(totalAfter).toBeCloseTo(totalBefore, 5);
    });

    it('should optimize diffusion by avoiding final array copy', () => {
        // This test verifies that the optimized version doesn't do the final grid.set(tempGrid)
        // by checking that tempGrid contains original values after diffusion
        grid.fill(0);
        const idx = getIndex(50, 50);
        grid[idx] = 1.0;
        
        // Make a copy of original values
        const originalValues = new Float32Array(grid);
        
        diffusePheromones(grid, scratch, 0.5);
        
        // After diffusion, scratch should still contain original values
        // (not the diffused values), proving we didn't do the final copy
        expect(scratch[idx]).toBeCloseTo(originalValues[idx]);
        
        // But grid should have the diffused values
        expect(grid[idx]).toBeLessThan(originalValues[idx]);
    });
});
