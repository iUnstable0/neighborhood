import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';

export default function DiskScene({ onExit }) {
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 10000,
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Canvas style={{ width: '100vw', height: '100vh', background: '#fff' }} camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 5, 5]} intensity={0.7} />
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
          <meshStandardMaterial color={'#bbb'} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} />
        <EffectComposer>
          <Pixelation granularity={8} />
        </EffectComposer>
      </Canvas>
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 32,
          right: 32,
          zIndex: 10001,
          fontSize: 24,
          padding: '8px 24px',
          border: '2px solid #000',
          background: '#fff',
          color: '#000',
          cursor: 'pointer',
        }}
      >
        Exit
      </button>
    </div>
  );
} 