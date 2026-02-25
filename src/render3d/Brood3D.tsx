import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../ui/store/uiStore';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from '../shared/constants';
import { BroodType } from '../sim/core/types';

const dummy = new THREE.Object3D();

export const Brood3D: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    useFrame(() => {
        if (!meshRef.current) return;

        const state = useUIStore.getState().simState;
        if (!state || !state.brood) {
            meshRef.current.count = 0;
            return;
        }

        const count = state.brood.length;
        meshRef.current.count = count;

        for (let i = 0; i < count; i++) {
            const item = state.brood[i];
            const x = (item.x - WORLD_WIDTH / 2) * CELL_SIZE;
            const z = (item.y - WORLD_HEIGHT / 2) * CELL_SIZE;

            dummy.position.set(x, 0.2, z);
            
            // Set scale and color based on type
            let scale = 0.5;
            let color = new THREE.Color('#ffffff');

            if (item.type === BroodType.EGG) {
                scale = 0.4;
                color.set('#ffffff'); // Pure white
                dummy.scale.set(scale, scale * 0.7, scale);
            } else if (item.type === BroodType.LARVA) {
                scale = 0.5 + (item.progress * 0.5); // Grows over time
                color.set('#ffffdd'); // Creamy yellow
                dummy.scale.set(scale * 1.2, scale * 0.8, scale);
            } else if (item.type === BroodType.PUPA) {
                scale = 1.0;
                color.set('#d2b48c'); // Tan / Light brown
                dummy.scale.set(scale, scale * 0.8, scale);
            }

            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            meshRef.current.setColorAt(i, color);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    const MAX_BROOD = 500;

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_BROOD]} castShadow receiveShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
};
