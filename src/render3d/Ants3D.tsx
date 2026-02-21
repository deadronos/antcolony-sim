import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../ui/store/uiStore';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from '../shared/constants';

const dummy = new THREE.Object3D();
const UP = new THREE.Vector3(0, 1, 0);

export const Ants3D: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    useFrame(() => {
        if (!meshRef.current) return;

        // Grab bleeding-edge state straight from Zustand without triggering React rerenders
        const state = useUIStore.getState().simState;
        if (!state) return;

        const count = state.ants.length;
        // Ensure InstancedMesh instances count matches
        meshRef.current.count = count;

        for (let i = 0; i < count; i++) {
            const ant = state.ants[i];

            // Map 2D grid: center map at 0,0
            // Since 2D is (0 to WORLD_WIDTH), shifting it
            const x = (ant.x - WORLD_WIDTH / 2) * CELL_SIZE;
            const z = (ant.y - WORLD_HEIGHT / 2) * CELL_SIZE;

            // Set position
            dummy.position.set(x, 0.5, z);

            // Set rotation based on angle logic (2D angle 0 points Right on +X)
            // In 3D:
            dummy.rotation.set(0, 0, 0); // reset
            dummy.rotateOnAxis(UP, -ant.angle); // Rotate around Y

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            // Set Color based on carrying food
            if (ant.hasFood) {
                meshRef.current.setColorAt(i, new THREE.Color('#ffaa00'));
            } else {
                meshRef.current.setColorAt(i, new THREE.Color('#ffffff'));
            }
        }

        // Tell Three.js to push buffered updates
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    // Start with buffer size capable of holding up to maximum simulation sizes easily
    const MAX_ANTS = 2000;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_ANTS]} castShadow receiveShadow>
            <boxGeometry args={[2, 1, 4]} />
            <meshStandardMaterial attach="material" />
        </instancedMesh>
    );
};
