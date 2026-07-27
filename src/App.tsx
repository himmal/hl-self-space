import { Canvas } from "@react-three/fiber";
import { Routes, Route } from "react-router-dom";
import { Scene } from "./components/3d/Scene";
import { Overlay } from "./components/ui/Overlay";
import { CrtOverlay } from "./components/ui/CrtOverlay";
import { StatusHUD } from "./components/ui/StatusHUD";
import { CommandTerminal } from "./components/ui/CommandTerminal";
import { CyberCursor } from "./components/ui/CyberCursor";
import { NotFoundUI } from "./components/ui/NotFoundUI";

const NeuralGridExperience = () => (
  <>
    {/* 3D WebGL Canvas fixed to background */}
    <div className="canvas-layer">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>

    {/* Interactive UI Overlay */}
    <Overlay />

    {/* Exploration & engagement HUD layer */}
    <StatusHUD />
    <CommandTerminal />
    <CyberCursor />
    <CrtOverlay />
  </>
);

export function App() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<NeuralGridExperience />} />
        <Route path="*" element={<NotFoundUI />} />
      </Routes>
    </div>
  );
}

export default App;
