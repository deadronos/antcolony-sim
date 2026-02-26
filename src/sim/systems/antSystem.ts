import { WORLD_WIDTH, WORLD_HEIGHT } from '../../shared/constants';
import { AntState, AntType, TileType, type Ant, type SimState } from '../core/types';
import { getIndex } from '../utils/grid';
import { UPGRADE_DEFS } from '../core/upgrades';

const WANDER_STRENGTH = 0.2;

export function updateAnts(state: SimState) {
    const BASE_ANT_SPEED = UPGRADE_DEFS.antSpeedLevel.getValue(state.upgrades.antSpeedLevel);
    const PHEROMONE_DROP = UPGRADE_DEFS.pheromoneDropLevel.getValue(state.upgrades.pheromoneDropLevel);
    const SCOUT_SPEED_MULT = UPGRADE_DEFS.scoutSpeedLevel.getValue(state.upgrades.scoutSpeedLevel);
    const DIGGING_MULT = UPGRADE_DEFS.diggingSpeedLevel.getValue(state.upgrades.diggingSpeedLevel);
    const DIGGING_BASE_DAMAGE = 2;
    const DIGGING_MAX_HEALTH = 100;

    for (const ant of state.ants) {
        if (ant.state === AntState.DIGGING) {
            if (ant.diggingTargetId !== undefined) {
                if (state.grid[ant.diggingTargetId] === TileType.WALL) {
                    state.wallDamage[ant.diggingTargetId] += DIGGING_BASE_DAMAGE * DIGGING_MULT;
                    if (state.wallDamage[ant.diggingTargetId] >= DIGGING_MAX_HEALTH) {
                        state.grid[ant.diggingTargetId] = TileType.EMPTY;
                        state.wallDamage[ant.diggingTargetId] = 0;
                        ant.state = AntState.SEARCHING;
                        ant.diggingTargetId = undefined;
                    }
                } else {
                    // Wall was destroyed by another ant
                    ant.state = AntState.SEARCHING;
                    ant.diggingTargetId = undefined;
                }
            } else {
                ant.state = AntState.SEARCHING;
            }
            continue; // Skip movement and steering while digging
        }

        // Calculate per-ant stats
        let currentSpeed = BASE_ANT_SPEED;
        if (ant.type === AntType.SCOUT) {
            currentSpeed *= 1.5 * SCOUT_SPEED_MULT;
        } else if (ant.type === AntType.SOLDIER) {
            currentSpeed *= 0.7; // Soldiers are slower
        }

        // 1. Drop Pheromone based on current state
        const idx = getIndex(Math.floor(ant.x), Math.floor(ant.y));
        if (ant.state === AntState.SEARCHING) {
            // Drop home pheromone
            state.homePheromones[idx] = Math.min(state.homePheromones[idx] + PHEROMONE_DROP, 1.0);
        } else {
            // Drop food pheromone
            state.foodPheromones[idx] = Math.min(state.foodPheromones[idx] + PHEROMONE_DROP, 1.0);
        }

        // 2. Sense and Steer
        ant.wanderTimer--;
        if (ant.wanderTimer <= 0) {
            steerAnt(ant, state);
            ant.wanderTimer = Math.floor(Math.random() * 5); // Pick new steering occasionally
        }

        // Add some random noise
        ant.angle += (Math.random() - 0.5) * WANDER_STRENGTH;

        // 3. Move
        const nx = ant.x + Math.cos(ant.angle) * currentSpeed;
        const ny = ant.y + Math.sin(ant.angle) * currentSpeed;

        // Wall collisions
        if (nx < 0 || nx >= WORLD_WIDTH || ny < 0 || ny >= WORLD_HEIGHT) {
            ant.angle += Math.PI; // Turn around
        } else {
            const nextIdx = getIndex(Math.floor(nx), Math.floor(ny));
            if (state.grid[nextIdx] === TileType.WALL) {
                if ((ant.type === AntType.WORKER || ant.type === AntType.SOLDIER) && Math.random() < 0.2) {
                    ant.state = AntState.DIGGING;
                    ant.diggingTargetId = nextIdx;
                } else {
                    ant.angle += Math.PI; // Don't test wall bounce, just turn around
                }
            } else {
                ant.x = nx;
                ant.y = ny;
            }
        }

        // 4. Check for logic triggers (Food pickup, Nest delivery)
        const currentIdx = getIndex(Math.floor(ant.x), Math.floor(ant.y));
        const tile = state.grid[currentIdx];

        if (ant.state === AntState.SEARCHING && tile === TileType.FOOD && ant.type !== AntType.SCOUT) {
            ant.state = AntState.RETURNING;
            ant.hasFood = true;
            ant.angle += Math.PI; // turn around
            state.foodQuantity[currentIdx]--;
            if (state.foodQuantity[currentIdx] === 0) {
                state.grid[currentIdx] = TileType.EMPTY;
                state.foodTileCount--;
            }
        } else if (ant.state === AntState.RETURNING && tile === TileType.NEST) {
            ant.state = AntState.SEARCHING;
            ant.hasFood = false;
            state.colonyFood++;
            ant.angle += Math.PI; // go back out
        }
    }
}

function steerAnt(ant: Ant, state: SimState) {
    let SENSOR_DIST = UPGRADE_DEFS.sensorRangeLevel.getValue(state.upgrades.sensorRangeLevel);
    if (ant.type === AntType.SCOUT) {
        const SCOUT_SPEED_MULT = UPGRADE_DEFS.scoutSpeedLevel.getValue(state.upgrades.scoutSpeedLevel);
        SENSOR_DIST *= 1.5 * SCOUT_SPEED_MULT; // Scouts have longer sensor range
    }

    const SENSOR_SPREAD = Math.PI / 4;

    const targetPheromone = ant.state === AntState.SEARCHING ? state.foodPheromones : state.homePheromones;
    const avoidPheromone = ant.state === AntState.SEARCHING ? state.homePheromones : null;

    // Sample 3 points: ahead, left, right
    const sample = (offsetAngle: number) => {
        const sx = Math.floor(ant.x + Math.cos(ant.angle + offsetAngle) * SENSOR_DIST);
        const sy = Math.floor(ant.y + Math.sin(ant.angle + offsetAngle) * SENSOR_DIST);

        if (sx < 0 || sx >= WORLD_WIDTH || sy < 0 || sy >= WORLD_HEIGHT) return 0;

        const idx = getIndex(sx, sy);

        // Bonus for target, penalty for current (to encourage moving outward)
        let weight = targetPheromone[idx];
        if (avoidPheromone) weight -= avoidPheromone[idx] * 0.1;

        return weight;
    };

    const wForward = sample(0);
    const wLeft = sample(-SENSOR_SPREAD);
    const wRight = sample(SENSOR_SPREAD);

    if (wForward === 0 && wLeft === 0 && wRight === 0) {
        // No strong signal, wander
        return;
    }

    if (wForward > wLeft && wForward > wRight) {
        // Keep straight
    } else if (wLeft > wRight) {
        ant.angle -= SENSOR_SPREAD;
    } else if (wRight > wLeft) {
        ant.angle += SENSOR_SPREAD;
    }
}
