import { Canvas } from "@react-three/fiber";
import { Scene } from "./components/3d/Scene";
import { Overlay } from "./components/ui/Overlay";

export function App() {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      {/* 3D WebGL Canvas fixed to background */}
      <div className="canvas-layer">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Interactive UI Overlay */}
      <Overlay />
    </div>
  );
}

export default App;