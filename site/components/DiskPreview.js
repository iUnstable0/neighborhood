import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function GoldDisk() {
  // Animate highlight rotation for a bit of realism
  // const highlightRef = React.useRef();
  const groupRef = React.useRef();
  useFrame(({ clock }) => {
    // if (highlightRef.current) {
    //   highlightRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    // }
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.x = Math.PI / 2; // Face the user
      groupRef.current.rotation.z = t * 0.6; // Spin like a wheel
    }
  });
//   // Generate faint grooves as thin cylinders
//   const grooves = Array.from({ length: 8 }).map((_, i) => {
//     const angle = (i / 8) * Math.PI * 2;
//     return (
//       <mesh key={i} position={[0, 0, 0.0415]} rotation={[Math.PI / 2, 0, angle]}>
//         <cylinderGeometry args={[0.98, 0.98, 0.002, 32]} />
//         <meshStandardMaterial color={'#fff'} opacity={0.09} transparent />
//       </mesh>
//     );
//   });
  // DVD notches (rectangular cutouts around the hub)
  const notchCount = 6;
  const notchRadius = 0.18;
  const notchWidth = 0.045;
  const notchHeight = 0.018;
  const notchDepth = 0.012;
  const notches = Array.from({ length: notchCount }).map((_, i) => {
    const angle = (i / notchCount) * Math.PI * 2;
    const x = Math.cos(angle) * notchRadius;
    const y = Math.sin(angle) * notchRadius;
    return (
      <mesh
        key={i}
        position={[x, y, 0.048]}
        rotation={[Math.PI / 2, 0, angle]}
      >
        <boxGeometry args={[notchWidth, notchHeight, notchDepth]} />
        <meshStandardMaterial color={'#bbb'} metalness={0.3} roughness={0.2} />
      </mesh>
    );
  });
  // Iridescent/rainbow overlay (layered mesh)
  const rainbowColors = [
    '#FFD700', // gold
    '#FF69B4', // pink
    '#00FFFF', // cyan
    '#00FF00', // green
    '#FFA500', // orange
    '#1E90FF', // blue
    '#FF0000', // red
  ];
  const rainbowMeshes = rainbowColors.map((color, i) => (
    <mesh key={color} position={[0, 0, 0.041 + i * 0.001]}>
      <cylinderGeometry args={[1 - i * 0.08, 1 - i * 0.08, 0.01, 96]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.9}
        roughness={0.15}
        transparent
        opacity={0.18}
        reflectivity={0.95}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  ));
  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {/* Main gold disk */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.08, 96]} />
        <meshPhysicalMaterial
          color={'#FFCC00'} // strong gold
          metalness={0.1}
          roughness={0.7}
          transmission={0.3}
          transparent
          opacity={0.75}
          ior={1.7}
          thickness={0.2}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Rainbow/iridescent overlays */}
      {rainbowMeshes}
      {/* Center hole */}
      <mesh position={[0, 0, 0.041]}>
        <cylinderGeometry args={[0.13, 0.13, 0.09, 48]} />
        <meshStandardMaterial color={'#fff'} metalness={0.1} roughness={0.1} />
      </mesh>
      {/* Inner ring */}
      <mesh position={[0, 0, 0.042]}>
        <cylinderGeometry args={[0.18, 0.15, 0.01, 48]} />
        <meshStandardMaterial color={'#e0e0e0'} metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Grooves */}
      {/* {grooves} */}
      {/* DVD notches */}
      {notches}
      {/* Removed highlight mesh for natural look */}
    </group>
  );
}

export default function DiskPreview() {
  // Reflection: render a mirrored, faded version below
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas style={{ width: '100%', height: '100%', background: '#fff' }} camera={{ position: [0, 0, 4.2], fov: 38 }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[2, 5, 5]} intensity={1.2} />
        {/* Main spinning disk */}
        <GoldDisk />
        {/* Reflection (mirrored, faded, below) */}

      </Canvas>
      {/* Optional: fade out the reflection with a CSS gradient overlay */}

    </div>
  );
} 