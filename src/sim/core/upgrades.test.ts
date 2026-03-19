import { describe, it, expect } from 'vitest';
import { UPGRADE_DEFS, INITIAL_UPGRADES, getUpgradeCost } from './upgrades';

describe('Upgrade System', () => {
    describe('INITIAL_UPGRADES', () => {
        it('should start all upgrades at level 0', () => {
            expect(INITIAL_UPGRADES.antSpeedLevel).toBe(0);
            expect(INITIAL_UPGRADES.sensorRangeLevel).toBe(0);
            expect(INITIAL_UPGRADES.pheromoneDropLevel).toBe(0);
            expect(INITIAL_UPGRADES.scoutSpeedLevel).toBe(0);
            expect(INITIAL_UPGRADES.soldierStrengthLevel).toBe(0);
            expect(INITIAL_UPGRADES.diggingSpeedLevel).toBe(0);
        });
    });

    describe('getUpgradeCost', () => {
        it('should return baseCost at level 0', () => {
            expect(getUpgradeCost(UPGRADE_DEFS.antSpeedLevel, 0)).toBe(10);
            expect(getUpgradeCost(UPGRADE_DEFS.sensorRangeLevel, 0)).toBe(15);
            expect(getUpgradeCost(UPGRADE_DEFS.pheromoneDropLevel, 0)).toBe(20);
            expect(getUpgradeCost(UPGRADE_DEFS.scoutSpeedLevel, 0)).toBe(30);
            expect(getUpgradeCost(UPGRADE_DEFS.soldierStrengthLevel, 0)).toBe(50);
            expect(getUpgradeCost(UPGRADE_DEFS.diggingSpeedLevel, 0)).toBe(40);
        });

        it('should scale cost exponentially with level', () => {
            // antSpeedLevel: baseCost=10, multiplier=1.5
            expect(getUpgradeCost(UPGRADE_DEFS.antSpeedLevel, 1)).toBe(Math.floor(10 * Math.pow(1.5, 1))); // 15
            expect(getUpgradeCost(UPGRADE_DEFS.antSpeedLevel, 2)).toBe(Math.floor(10 * Math.pow(1.5, 2))); // 22
            expect(getUpgradeCost(UPGRADE_DEFS.antSpeedLevel, 3)).toBe(Math.floor(10 * Math.pow(1.5, 3))); // 33
        });

        it('should return an integer (floor applied)', () => {
            const cost = getUpgradeCost(UPGRADE_DEFS.antSpeedLevel, 2);
            expect(Number.isInteger(cost)).toBe(true);
        });

        it('should increase cost at every level', () => {
            const def = UPGRADE_DEFS.sensorRangeLevel;
            for (let i = 0; i < def.maxLevel - 1; i++) {
                expect(getUpgradeCost(def, i + 1)).toBeGreaterThan(getUpgradeCost(def, i));
            }
        });
    });

    describe('Upgrade getValue', () => {
        it('antSpeedLevel: returns 0.5 at level 0 and increases by 0.1 per level', () => {
            expect(UPGRADE_DEFS.antSpeedLevel.getValue(0)).toBeCloseTo(0.5);
            expect(UPGRADE_DEFS.antSpeedLevel.getValue(1)).toBeCloseTo(0.6);
            expect(UPGRADE_DEFS.antSpeedLevel.getValue(5)).toBeCloseTo(1.0);
            expect(UPGRADE_DEFS.antSpeedLevel.getValue(10)).toBeCloseTo(1.5);
        });

        it('sensorRangeLevel: returns 10 at level 0 and increases by 3 per level', () => {
            expect(UPGRADE_DEFS.sensorRangeLevel.getValue(0)).toBeCloseTo(10);
            expect(UPGRADE_DEFS.sensorRangeLevel.getValue(1)).toBeCloseTo(13);
            expect(UPGRADE_DEFS.sensorRangeLevel.getValue(5)).toBeCloseTo(25);
        });

        it('pheromoneDropLevel: returns 0.1 at level 0 and increases by 0.05 per level', () => {
            expect(UPGRADE_DEFS.pheromoneDropLevel.getValue(0)).toBeCloseTo(0.1);
            expect(UPGRADE_DEFS.pheromoneDropLevel.getValue(1)).toBeCloseTo(0.15);
            expect(UPGRADE_DEFS.pheromoneDropLevel.getValue(5)).toBeCloseTo(0.35);
        });

        it('scoutSpeedLevel: returns 1.0 at level 0 and increases by 0.2 per level', () => {
            expect(UPGRADE_DEFS.scoutSpeedLevel.getValue(0)).toBeCloseTo(1.0);
            expect(UPGRADE_DEFS.scoutSpeedLevel.getValue(1)).toBeCloseTo(1.2);
            expect(UPGRADE_DEFS.scoutSpeedLevel.getValue(5)).toBeCloseTo(2.0);
        });

        it('soldierStrengthLevel: returns 1.0 at level 0 and increases by 0.5 per level', () => {
            expect(UPGRADE_DEFS.soldierStrengthLevel.getValue(0)).toBeCloseTo(1.0);
            expect(UPGRADE_DEFS.soldierStrengthLevel.getValue(1)).toBeCloseTo(1.5);
            expect(UPGRADE_DEFS.soldierStrengthLevel.getValue(5)).toBeCloseTo(3.5);
        });

        it('diggingSpeedLevel: returns 1.0 at level 0 and increases by 0.5 per level', () => {
            expect(UPGRADE_DEFS.diggingSpeedLevel.getValue(0)).toBeCloseTo(1.0);
            expect(UPGRADE_DEFS.diggingSpeedLevel.getValue(1)).toBeCloseTo(1.5);
            expect(UPGRADE_DEFS.diggingSpeedLevel.getValue(5)).toBeCloseTo(3.5);
        });

        it('each upgrade getValue is monotonically increasing with level', () => {
            for (const key of Object.keys(UPGRADE_DEFS) as Array<keyof typeof UPGRADE_DEFS>) {
                const def = UPGRADE_DEFS[key];
                for (let lvl = 0; lvl < def.maxLevel - 1; lvl++) {
                    expect(def.getValue(lvl + 1)).toBeGreaterThan(def.getValue(lvl));
                }
            }
        });
    });
});
