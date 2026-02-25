import React from 'react';
import * as THREE from 'three';
import { useUIStore } from '../ui/store/uiStore';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from '../shared/constants';
import { TileType, type SimState } from '../sim/core/types';

export const Terrain3D: React.FC = () => {
    // Terrain is relatively static, grabbing ONCE from state or on reset
    const [terrain, setTerrain] = React.useState<{
        nestData: THREE.Matrix4[];
        foodData: THREE.Matrix4[];
        wallData: THREE.Matrix4[];
    } | null>(null);

    React.useEffect(() => {
        const buildTerrain = (st: SimState | SimSnapshot) => {
            if (!('grid' in st)) return; // Don't try to build without grid data

            const nest: THREE.Matrix4[] = [];
            const food: THREE.Matrix4[] = [];
            const wall: THREE.Matrix4[] = [];

            const dummy = new THREE.Object3D();
            const yOffset = 0.5;

            for (let i = 0; i < st.grid.length; i++) {
                const tile = st.grid[i];
                if (tile === TileType.EMPTY) continue;

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
                } else if (tile === TileType.FOOD) {
                    dummy.scale.set(CELL_SIZE * 0.8, CELL_SIZE * 0.6, CELL_SIZE * 0.8);
                    dummy.position.y = (CELL_SIZE * 0.6) / 2;
                    dummy.updateMatrix();
                    food.push(dummy.matrix.clone());
                }
            }
            setTerrain({ nestData: nest, foodData: food, wallData: wall });
        };

        // Build immediately if state exists
        const currentState = useUIStore.getState().simState;
        if (currentState) buildTerrain(currentState);

        // Rebuild only when the simulation resets (tick 0)
        const unsub = useUIStore.subscribe((state) => {
            if (state.simState && state.simState.tick === 0) {
                buildTerrain(state.simState);
            }
        });

        return unsub;
    }, []);

    if (!terrain) return null;
    const { nestData, foodData, wallData } = terrain;

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
