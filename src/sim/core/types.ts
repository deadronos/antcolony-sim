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
    foodPheromones: Float32Array;
    homePheromones: Float32Array;
    grid: Uint8Array;    // TileType values mapped 1D
    colonyFood: number;
    nestX: number;
    nestY: number;
    upgrades: SimUpgrades;
}

export interface SimSnapshot {
    tick: number;
    ants: Ant[];
    foodPheromones: Float32Array;
    homePheromones: Float32Array;
    colonyFood: number;
    upgrades: SimUpgrades;
}
