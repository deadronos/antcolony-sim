import React from 'react';
import * as THREE from 'three';
import { useUIStore } from '../ui/store/uiStore';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from '../shared/constants';
import { TileType, type SimState, type SimSnapshot } from '../sim/core/types';

export const Terrain3D: React.FC = () => {
    const [staticTerrain, setStaticTerrain] = React.useState<{
        nestData: THREE.Matrix4[];
        wallData: THREE.Matrix4[];
    } | null>(null);

    const [foodData, setFoodData] = React.useState<THREE.Matrix4[]>([]);

    const buildFood = React.useCallback((st: SimState | SimSnapshot) => {
        if (!('grid' in st)) return;
        const food: THREE.Matrix4[] = [];
        const dummy = new THREE.Object3D();

        for (let i = 0; i < st.grid.length; i++) {
            if (st.grid[i] !== TileType.FOOD) continue;
            const gx = i % WORLD_WIDTH;
            const gy = Math.floor(i / WORLD_WIDTH);
            const x = (gx - WORLD_WIDTH / 2) * CELL_SIZE;
            const z = (gy - WORLD_HEIGHT / 2) * CELL_SIZE;
            dummy.position.set(x, (CELL_SIZE * 0.6) / 2, z);
            dummy.scale.set(CELL_SIZE * 0.8, CELL_SIZE * 0.6, CELL_SIZE * 0.8);
            dummy.updateMatrix();
            food.push(dummy.matrix.clone());
        }
        setFoodData(food);
    }, []);

    React.useEffect(() => {
        const buildStatic = (st: SimState | SimSnapshot) => {
            if (!('grid' in st)) return;

            const nest: THREE.Matrix4[] = [];
            const wall: THREE.Matrix4[] = [];

            const dummy = new THREE.Object3D();
            const yOffset = 0.5;

            for (let i = 0; i < st.grid.length; i++) {
                const tile = st.grid[i];
                if (tile === TileType.EMPTY || tile === TileType.FOOD) continue;

                const gx = i % WORLD_WIDTH;
                const gy = Math.floor(i / WORLD_WIDTH);

                const x = (gx - WORLD_WIDTH / 2) * CELL_SIZE;
                const z = (gy - WORLD_HEIGHT / 2) * CELL_SIZE;

                dummy.position.set(x, yOffset, z);

                if (tile === TileType.WALL) {
                    dummy.scale.set(CELL_SIZE, CELL_SIZE * 3, CELL_SIZE);
                    dummy.position.y = (CELL_SIZE * 3) / 2;
                    dummy.updateMatrix();
                    wall.push(dummy.matrix.clone());
                } else if (tile === TileType.NEST) {
                    dummy.scale.set(CELL_SIZE, 0.2, CELL_SIZE);
                    dummy.position.y = 0.1;
                    dummy.updateMatrix();
                    nest.push(dummy.matrix.clone());
                }
            }
            setStaticTerrain({ nestData: nest, wallData: wall });
            buildFood(st);
        };

        // Build immediately if state exists
        const currentState = useUIStore.getState().simState;
        if (currentState) buildStatic(currentState);

        // Rebuild static terrain only when the simulation resets (tick 0)
        const unsub = useUIStore.subscribe((state) => {
            if (state.simState && state.simState.tick === 0) {
                buildStatic(state.simState);
            }
        });

        return unsub;
    }, [buildFood]);

    // Rebuild food mesh whenever foodTileCount decreases
    React.useEffect(() => {
        let lastFoodTileCount = -1;
        const unsub = useUIStore.subscribe((state) => {
            if (state.simState && 'foodTileCount' in state.simState) {
                const count = (state.simState as { foodTileCount: number }).foodTileCount;
                if (count !== lastFoodTileCount) {
                    lastFoodTileCount = count;
                    buildFood(state.simState);
                }
            }
        });
        return unsub;
    }, [buildFood]);

    if (!staticTerrain) return null;
    const { nestData, wallData } = staticTerrain;

    return (
        <group>
            {/* Base Ground Plane */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <planeGeometry args={[WORLD_WIDTH * CELL_SIZE, WORLD_HEIGHT * CELL_SIZE]} />
                <meshStandardMaterial color="#1e1e1e" />
            </mesh>

            <StaticInstancedMesh matrices={wallData} color="#3d2b1f" castShadow />
            <StaticInstancedMesh matrices={foodData} color="#32CD32" castShadow />
            <StaticInstancedMesh matrices={nestData} color="#6b4c31" receiveShadow />
        </group>
    );
};

// Helper for static InstancedMeshes
const StaticInstancedMesh = ({ matrices, color, castShadow = false, receiveShadow = false }: { matrices: THREE.Matrix4[], color: string, castShadow?: boolean, receiveShadow?: boolean }) => {
    const meshRef = React.useRef<THREE.InstancedMesh>(null);

    React.useLayoutEffect(() => {
        if (meshRef.current && matrices.length > 0) {
            matrices.forEach((mat, i) => {
                meshRef.current!.setMatrixAt(i, mat);
            });
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [matrices]);

    if (matrices.length === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, matrices.length]} castShadow={castShadow} receiveShadow={receiveShadow}>
            <boxGeometry />
            <meshStandardMaterial color={color} />
        </instancedMesh>
    );
}
