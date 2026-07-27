import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";

// Short synth blip frequencies (Hz) per SFX name — avoids shipping audio assets.
const SFX_TONES: Record<string, number> = {
  nav: 420,
  fragment: 880,
  terminal: 260,
};

/**
 * Opt-in Web Audio SFX manager. Lazily creates the AudioContext on first user
 * gesture (per browser autoplay policy) and exposes a `playSfx(name)` callback
 * that is a no-op while muted.
 */
export const useAudioManager = () => {
  const audioEnabled = useAppStore((state) => state.audioEnabled);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioEnabled || contextRef.current) return;
    contextRef.current = new AudioContext();
  }, [audioEnabled]);

  const playSfx = useCallback(
    (name: keyof typeof SFX_TONES) => {
      if (!audioEnabled || !contextRef.current) return;
      const ctx = contextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = SFX_TONES[name] ?? 440;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    },
    [audioEnabled]
  );

  return { playSfx };
};
