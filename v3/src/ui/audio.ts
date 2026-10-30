// Efectos de sonido sintetizados con WebAudio (sin archivos de audio).

type Sfx = 'tap' | 'sizzle' | 'ready' | 'burnt' | 'cash' | 'angry' | 'error' | 'win' | 'lose' | 'trash';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

/** iOS sólo permite crear/reanudar el audio dentro de un gesto del usuario. */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gain = 0.15, slideTo?: number) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration: number, gain = 0.08, highpass = 2000) {
  if (!ctx) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
}

export function play(sfx: Sfx) {
  if (!enabled || !ctx) return;
  switch (sfx) {
    case 'tap':
      tone(660, 0, 0.06, 'triangle', 0.08);
      break;
    case 'sizzle':
      noise(0.45, 0.06, 3000);
      break;
    case 'ready':
      tone(880, 0, 0.1, 'sine', 0.1);
      tone(1320, 0.08, 0.14, 'sine', 0.08);
      break;
    case 'burnt':
      noise(0.6, 0.1, 600);
      tone(180, 0, 0.4, 'sawtooth', 0.05, 90);
      break;
    case 'cash':
      tone(1046, 0, 0.08, 'square', 0.06);
      tone(1568, 0.07, 0.22, 'square', 0.06);
      break;
    case 'angry':
      tone(220, 0, 0.25, 'sawtooth', 0.07, 140);
      break;
    case 'error':
      tone(200, 0, 0.12, 'square', 0.05);
      break;
    case 'trash':
      noise(0.2, 0.08, 800);
      break;
    case 'win':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.12));
      break;
    case 'lose':
      [392, 330, 262].forEach((f, i) => tone(f, i * 0.18, 0.3, 'triangle', 0.1));
      break;
  }
}
