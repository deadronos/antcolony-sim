import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../ui/store/uiStore';
import { WORLD_WIDTH, WORLD_HEIGHT, CELL_SIZE } from '../shared/constants';

const dummy = new THREE.Object3D();
const UP = new THREE.Vector3(0, 1, 0);

export const Ants3D: React.FC = () => {
    const headRef = useRef<THREE.InstancedMesh>(null);
    const thoraxRef = useRef<THREE.InstancedMesh>(null);
    const abdomenRef = useRef<THREE.InstancedMesh>(null);
    const foodRef = useRef<THREE.InstancedMesh>(null);

    // Geometries
    const headGeo = useMemo(() => {
        const geo = new THREE.SphereGeometry(0.8, 16, 16);
        geo.scale(0.8, 0.8, 0.8);
        return geo;
    }, []);

    const thoraxGeo = useMemo(() => {
        const geo = new THREE.SphereGeometry(0.6, 16, 16);
        geo.scale(1.0, 0.8, 0.8);
        return geo;
    }, []);

    const abdomenGeo = useMemo(() => {
        const geo = new THREE.SphereGeometry(1.0, 16, 16);
        geo.scale(1.2, 0.8, 0.8);
        return geo;
    }, []);

    const foodGeo = useMemo(() => {
        const geo = new THREE.DodecahedronGeometry(0.8);
        return geo;
    }, []);

    // Materials
    const antMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8 }), []);
    const foodMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#88cc44', roughness: 0.4 }), []); // Green leaf/globule

    useFrame((state) => {
        if (!headRef.current || !thoraxRef.current || !abdomenRef.current || !foodRef.current) return;

        const simState = useUIStore.getState().simState;
        if (!simState) return;

        const count = simState.ants.length;
        headRef.current.count = count;
        thoraxRef.current.count = count;
        abdomenRef.current.count = count;
        foodRef.current.count = count;

        const time = state.clock.getElapsedTime();

        for (let i = 0; i < count; i++) {
            const ant = simState.ants[i];

            const baseX = (ant.x - WORLD_WIDTH / 2) * CELL_SIZE;
            const baseZ = (ant.y - WORLD_HEIGHT / 2) * CELL_SIZE;

            // Wobble animation
            // Use ant id to desynchronize the wobble
            const speedWobble = Math.sin(time * 20 + ant.id) * 0.2;
            const wobbleY = 0.5 + Math.abs(speedWobble); // Bounce up/down
            const wobblePitch = speedWobble * 0.2; // Pitch back and forth

            dummy.position.set(baseX, wobbleY, baseZ);
            dummy.rotation.set(0, 0, 0); // reset
            dummy.rotateOnAxis(UP, -ant.angle); // Rotate around Y based on heading
            dummy.rotateZ(wobblePitch); // apply wobble pitch

            // Thorax
            dummy.updateMatrix();
            thoraxRef.current.setMatrixAt(i, dummy.matrix);

            // Head (forward +X in local space)
            dummy.translateX(0.8);
            dummy.updateMatrix();
            headRef.current.setMatrixAt(i, dummy.matrix);

            // Food (carried in front/top of head)
            if (ant.hasFood) {
                dummy.translateX(0.5);
                dummy.translateY(0.4);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                foodRef.current.setMatrixAt(i, dummy.matrix);
                
                // Reset to head
                dummy.scale.set(1, 1, 1);
                dummy.translateY(-0.4);
                dummy.translateX(-0.5);
            } else {
                dummy.scale.set(0, 0, 0); // Hide
                dummy.updateMatrix();
                foodRef.current.setMatrixAt(i, dummy.matrix);
                dummy.scale.set(1, 1, 1); // Reset
            }

            // Abdomen (backward -X in local space)
            // Revert Head translate (-0.8) and translate -1.2 to go backward
            dummy.translateX(-2.0);
            dummy.updateMatrix();
            abdomenRef.current.setMatrixAt(i, dummy.matrix);
        }

        headRef.current.instanceMatrix.needsUpdate = true;
        thoraxRef.current.instanceMatrix.needsUpdate = true;
        abdomenRef.current.instanceMatrix.needsUpdate = true;
        foodRef.current.instanceMatrix.needsUpdate = true;
    });

    const MAX_ANTS = 2000;

    return (
        <group>
            <instancedMesh ref={headRef} args={[headGeo, antMaterial, MAX_ANTS]} castShadow receiveShadow />
            <instancedMesh ref={thoraxRef} args={[thoraxGeo, antMaterial, MAX_ANTS]} castShadow receiveShadow />
            <instancedMesh ref={abdomenRef} args={[abdomenGeo, antMaterial, MAX_ANTS]} castShadow receiveShadow />
            <instancedMesh ref={foodRef} args={[foodGeo, foodMaterial, MAX_ANTS]} castShadow receiveShadow />
        </group>
    );
};
