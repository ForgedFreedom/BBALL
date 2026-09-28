// Manually-triggered sound effects, synthesized entirely with the Web Audio
// API (no audio files/assets) — a referee whistle and an end-of-game horn.
// A single AudioContext is lazily created and reused (browsers require a
// user gesture, e.g. this button click, before audio can play).
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

// A pea whistle's "trill" comes from a rolling ball inside warbling the
// pitch rapidly — approximated here with an LFO modulating the oscillator's
// frequency, rather than a plain steady tone.
export const playWhistle = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 0.6;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2900, now);

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(24, now);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(220, now);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
  gain.gain.setValueAtTime(0.35, now + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  lfo.start(now);
  osc.stop(now + duration);
  lfo.stop(now + duration);
};

// Two slightly-detuned sawtooth oscillators for a fuller, harsher buzzer/air
// horn tone than a single wave gives.
export const playBuzzer = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 1.3;

  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(220, now);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(221.5, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
  gain.gain.setValueAtTime(0.3, now + duration - 0.3);
  gain.gain.linearRampToValueAtTime(0, now + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
};
