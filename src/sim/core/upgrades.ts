import type { SimUpgrades } from './types';

export interface UpgradeDef {
    id: keyof SimUpgrades;
    name: string;
    description: string;
    baseCost: number;
    costMultiplier: number;
    maxLevel: number;
    // Returns the actual value used in the simulation given a level
    getValue: (level: number) => number;
}

export const UPGRADE_DEFS: Record<keyof SimUpgrades, UpgradeDef> = {
    antSpeedLevel: {
        id: 'antSpeedLevel',
        name: 'Worker Speed',
        description: 'Increases ant movement speed.',
        baseCost: 10,
        costMultiplier: 1.5,
        maxLevel: 10,
        getValue: (lvl) => 0.5 + (lvl * 0.1) // Base: 0.5, Max: 1.5
    },
    sensorRangeLevel: {
        id: 'sensorRangeLevel',
        name: 'Sensor Range',
        description: 'Increases pheromone detection distance.',
        baseCost: 15,
        costMultiplier: 1.6,
        maxLevel: 5,
        getValue: (lvl) => 10 + (lvl * 3) // Base: 10, Max: 25
    },
    pheromoneDropLevel: {
        id: 'pheromoneDropLevel',
        name: 'Pheromone Strength',
        description: 'Increases pheromone drop intensity per tick.',
        baseCost: 20,
        costMultiplier: 1.8,
        maxLevel: 5,
        getValue: (lvl) => 0.1 + (lvl * 0.05) // Base: 0.1, Max: 0.35
    },
    scoutSpeedLevel: {
        id: 'scoutSpeedLevel',
        name: 'Scout Agility',
        description: 'Increases scout movement speed and sensor efficiency.',
        baseCost: 30,
        costMultiplier: 1.7,
        maxLevel: 5,
        getValue: (lvl) => 1.0 + (lvl * 0.2) // Multiplier for scout base
    },
    soldierStrengthLevel: {
        id: 'soldierStrengthLevel',
        name: 'Soldier Strength',
        description: 'Increases soldier defense against future threats.',
        baseCost: 50,
        costMultiplier: 2.0,
        maxLevel: 5,
        getValue: (lvl) => 1.0 + (lvl * 0.5) // Base: 1.0, Max: 3.5
    },
    diggingSpeedLevel: {
        id: 'diggingSpeedLevel',
        name: 'Digging Speed',
        description: 'Increases speed at which ants dig through walls.',
        baseCost: 40,
        costMultiplier: 1.8,
        maxLevel: 5,
        getValue: (lvl) => 1.0 + (lvl * 0.5) // Multiplier for digging progress
    }
};

export const INITIAL_UPGRADES: SimUpgrades = {
    antSpeedLevel: 0,
    sensorRangeLevel: 0,
    pheromoneDropLevel: 0,
    scoutSpeedLevel: 0,
    soldierStrengthLevel: 0,
    diggingSpeedLevel: 0
};

export function getUpgradeCost(def: UpgradeDef, currentLevel: number): number {
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
}
