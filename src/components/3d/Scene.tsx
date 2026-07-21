import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NeuralGrid } from "./NeuralGrid";
import { useAppStore } from "../../store/useAppStore";

export const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const activeSection = useAppStore((state) => state.activeSection);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Subtle parallax tilt based on mouse position
    const targetMouseX = (state.pointer.x * Math.PI) / 12;
    const targetMouseY = (state.pointer.y * Math.PI) / 12;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetMouseX,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -targetMouseY,
      0.05
    );

    // Dynamic camera Z depth according to navigation section
    let targetZ = 5;
    if (activeSection === "projects") targetZ = 3.5;
    if (activeSection === "blog") targetZ = 4.2;

    state.camera.position.z = THREE.MathUtils.lerp(
      state.camera.position.z,
      targetZ,
      0.03
    );
  });

  return (
    <group ref={groupRef}>
      <NeuralGrid />
      <ambientLight intensity={0.5} />
    </group>
  );
};