/**
 * A ringing tone while the call connects, so the wait sounds like a phone
 * and not a spinner. Synthesised with the Web Audio API — the standard
 * ringback pair (400 Hz + 450 Hz) in the cadence used in Nigeria and the UK:
 * 0.4 s on, 0.2 s off, 0.4 s on, 2 s off. No audio file, nothing to load.
 */
export function createRingback() {
  let ctx: AudioContext | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let gain: GainNode | null = null;

  function burst(at: number, length: number) {
    if (!ctx || !gain) return;
    for (const hz of [400, 450]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + length);
    }
  }

  function cycle() {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    burst(t, 0.4);
    burst(t + 0.6, 0.4);
    timer = setTimeout(cycle, 3000);
  }

  return {
    start() {
      if (ctx) return;
      try {
        ctx = new AudioContext();
        gain = ctx.createGain();
        gain.gain.value = 0.08; // quiet: it sits under the room, not over it
        gain.connect(ctx.destination);
        cycle();
      } catch {
        ctx = null; // no audio here; the status text still shows "connecting"
      }
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      const c = ctx;
      ctx = null;
      gain = null;
      void c?.close();
    },
  };
}
