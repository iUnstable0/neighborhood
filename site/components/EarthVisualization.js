import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const EarthVisualization = ({ sourceAirport }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !sourceAirport) return;

    // Clean up previous scene if it exists
    if (sceneRef.current) {
      sceneRef.current.clear();
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Earth setup
    const earthGeometry = new THREE.SphereGeometry(5, 64, 64);
    const earthTexture = new THREE.TextureLoader().load('/earth_texture.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: earthTexture,
      bumpScale: 0.1,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Convert lat/lon to 3D coordinates
    const { lat, lon } = sourceAirport;
    const point = latLonToVector3(lat, lon, 5);

    // Position camera to look at the airport
    const distance = 8; // Closer zoom
    camera.position.copy(point).multiplyScalar(1.5); // Position camera behind the point
    camera.lookAt(point);

    // Add marker for airport
    const markerGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    scene.add(marker);

    // Add a pulsing effect to the marker
    const pulseGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.position.copy(point);
    scene.add(pulse);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 7; // Prevent zooming out too far
    controls.maxDistance = 10; // Prevent zooming in too close
    controls.target.copy(point); // Set orbit center to the airport

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;
      requestAnimationFrame(animate);
      
      // Animate pulse
      const time = Date.now() * 0.001;
      pulse.scale.set(
        1 + Math.sin(time * 2) * 0.2,
        1 + Math.sin(time * 2) * 0.2,
        1 + Math.sin(time * 2) * 0.2
      );
      pulse.material.opacity = 0.5 + Math.sin(time * 2) * 0.2;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [sourceAirport]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '300px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
};

// Helper function to convert lat/lon to 3D coordinates
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

export default EarthVisualization; 