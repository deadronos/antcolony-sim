import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Ants3D } from './Ants3D';
import { Terrain3D } from './Terrain3D';
import { Brood3D } from './Brood3D';

export const AntScene: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
            <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 200, 300], fov: 45 }}>
                <color attach="background" args={['#0a0a0c']} />
                <ambientLight intensity={0.4} />
                <directionalLight
                    castShadow
                    position={[100, 200, 50]}
                    intensity={1.5}
                    shadow-mapSize={[2048, 2048]}
                />
                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <Terrain3D />
                    <Ants3D />
                    <Brood3D />
                </Suspense>

                <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={50}
                    maxDistance={1000}
                />
            </Canvas>
        </div>
    );
};
