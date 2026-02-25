export const TileType = {
    EMPTY: 0,
    WALL: 1,
    NEST: 2,
    FOOD: 3
} as const;
export type TileType = typeof TileType[keyof typeof TileType];

export const AntState = {
    SEARCHING: 0,
    RETURNING: 1
} as const;
export type AntState = typeof AntState[keyof typeof AntState];

export const BroodType = {
    EGG: 0,
    LARVA: 1,
    PUPA: 2
} as const;
export type BroodType = typeof BroodType[keyof typeof BroodType];

export interface BroodItem {
    id: number;
    type: BroodType;
    progress: number; // 0 to 1
    x: number;
    y: number;
}

export interface Ant {
    id: number;
    x: number;
    y: number;
    angle: number;       // heading in radians
    state: AntState;
    hasFood: boolean;

    // Timers and behavior states
    wanderTimer: number; // to occasionally pick a new random direction
}

export interface SimUpgrades {
    antSpeedLevel: number;
    sensorRangeLevel: number;
    pheromoneDropLevel: number;
}

export interface SimState {
    tick: number;
    ants: Ant[];
    brood: BroodItem[];
    foodPheromones: Float32Array;
    homePheromones: Float32Array;
    grid: Uint8Array;         // TileType values mapped 1D
    foodQuantity: Uint8Array; // Remaining food units per tile (only meaningful for FOOD tiles)
    foodTileCount: number;    // Number of active food tiles
    colonyFood: number;
    nestX: number;
    nestY: number;
    upgrades: SimUpgrades;
}

export interface SimSnapshot {
    tick: number;
    ants: Ant[];
    brood: BroodItem[];
    foodPheromones: Float32Array;
    homePheromones: Float32Array;
    grid: Uint8Array;
    foodTileCount: number;
    colonyFood: number;
    upgrades: SimUpgrades;
}
