import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGlobalPointer } from "../../hooks/useGlobalPointer";

const CAMERA_Z = 15;
const PARALLAX_DISTANCE = 0.5;

export const CameraController = () => {
  const { camera } = useThree();
  const pointer = useGlobalPointer();

  useFrame((_, delta) => {
    camera.position.z = CAMERA_Z;
    THREE.MathUtils.damp(camera.position.x, pointer.x * PARALLAX_DISTANCE, 4, delta);
    THREE.MathUtils.damp(camera.position.y, pointer.y * PARALLAX_DISTANCE, 4, delta);
  });

  return null;
};
