export const TileType = {
    EMPTY: 0,
    WALL: 1,
    NEST: 2,
    FOOD: 3
} as const;
export type TileType = typeof TileType[keyof typeof TileType];

export const AntState = {
    SEARCHING: 0,
    RETURNING: 1,
    DIGGING: 2
} as const;
export type AntState = typeof AntState[keyof typeof AntState];

export const BroodType = {
    EGG: 0,
    LARVA: 1,
    PUPA: 2
} as const;
export type BroodType = typeof BroodType[keyof typeof BroodType];

export const AntType = {
    WORKER: 0,
    SCOUT: 1,
    SOLDIER: 2
} as const;
export type AntType = typeof AntType[keyof typeof AntType];

export interface BroodItem {
    id: number;
    type: BroodType;
    antType: AntType; // The caste this brood will hatch into
    progress: number; // 0 to 1
    x: number;
    y: number;
}

export interface Ant {
    id: number;
    type: AntType;
    x: number;
    y: number;
    angle: number;       // heading in radians
    state: AntState;
    hasFood: boolean;

    // Timers and behavior states
    wanderTimer: number; // to occasionally pick a new random direction
    diggingTargetId?: number; // target wall tile index
}

export interface SimUpgrades {
    antSpeedLevel: number;
    sensorRangeLevel: number;
    pheromoneDropLevel: number;
    scoutSpeedLevel: number; // Scout specific
    soldierStrengthLevel: number; // Soldier specific
    diggingSpeedLevel: number;
}

export interface SimState {
    tick: number;
    ants: Ant[];
    brood: BroodItem[];
    foodPheromones: Float32Array;
    homePheromones: Float32Array;
    grid: Uint8Array;         // TileType values mapped 1D
    wallDamage: Uint8Array;   // Damage tracked per tile
    foodQuantity: Uint8Array; // Remaining food units per tile (only meaningful for FOOD tiles)
    foodTileCount: number;    // Number of active food tiles
    colonyFood: number;
    nestX: number;
    nestY: number;
    upgrades: SimUpgrades;
    productionType: AntType;
}

export interface SimSnapshot {
    tick: number;
    ants: Ant[];
    brood: BroodItem[];
    foodPheromones: Float32Array;
    homePheromones: Float32Array;
    grid: Uint8Array;
    wallDamage: Uint8Array;
    foodTileCount: number;
    colonyFood: number;
    upgrades: SimUpgrades;
    productionType: AntType;
}
