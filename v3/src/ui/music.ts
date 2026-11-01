// Tema del carrito: una cueca original en 6/8, sintetizada con WebAudio (sin archivos de audio).

export type MusicMode = 'menu' | 'turno';

type Chord = 'G' | 'D7' | 'C';
/** Compás de melodía: [grado de la escala o null, duración en corcheas]. */
type Phrase = [number | null, number][];
type Bar = [Chord, Phrase];

/** Duración de una corchea, en segundos. */
const EIGHTH: Record<MusicMode, number> = { menu: 0.25, turno: 0.21 };

/** Sol mayor. El grado 0 es sol 4; cada 7 grados se sube una octava. */
const SCALE = [0, 2, 4, 5, 7, 9, 11];

const CHORDS: Record<Chord, { root: number; fifth: number; strum: number[] }> = {
  G: { root: -14, fifth: -10, strum: [-7, -5, -3, 0] },
  D7: { root: -10, fifth: -13, strum: [-6, -4, -3, -1] },
  C: { root: -11, fifth: -14, strum: [-7, -4, -2, 0] }
};

const VERSE: Bar[] = [
  ['G', [[7, 2], [6, 1], [7, 2], [4, 1]]],
  ['G', [[5, 1], [4, 1], [2, 1], [4, 3]]],
  ['D7', [[1, 2], [3, 1], [5, 2], [4, 1]]],
  ['D7', [[6, 1], [5, 1], [3, 1], [1, 3]]],
  ['D7', [[1, 2], [3, 1], [6, 2], [5, 1]]],
  ['D7', [[3, 1], [5, 1], [3, 1], [1, 3]]],
  ['G', [[2, 1], [4, 1], [7, 1], [6, 1], [5, 1], [4, 1]]],
  ['G', [[2, 2], [0, 1], [0, 3]]]
];

const CHORUS: Bar[] = [
  ['C', [[7, 1], [5, 1], [3, 1], [5, 3]]],
  ['C', [[8, 1], [7, 1], [5, 1], [7, 3]]],
  ['G', [[4, 2], [7, 1], [6, 2], [4, 1]]],
  ['G', [[5, 1], [4, 1], [2, 1], [4, 3]]],
  ['D7', [[6, 2], [5, 2], [3, 2]]],
  ['D7', [[1, 2], [3, 2], [6, 2]]],
  ['G', [[7, 1], [6, 1], [7, 1], [4, 1], [2, 1], [4, 1]]],
  ['G', [[7, 3], [null, 3]]]
];

export const SONG: Bar[] = [...VERSE, ...VERSE, ...CHORUS, ...CHORUS];

export const SONG_BARS = SONG.length;

export function barSeconds(mode: MusicMode): number {
  return EIGHTH[mode] * 6;
}

function pitch(degree: number): number {
  const octave = Math.floor(degree / 7);
  const semitones = 12 * octave + SCALE[degree - octave * 7];
  return 391.995 * 2 ** (semitones / 12);
}

/** Cuerda pulsada: guitarra del acompañamiento y bajo. */
function pluck(ctx: BaseAudioContext, out: AudioNode, freq: number, t: number, gain: number, decay: number, bright: number) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(bright, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), t + decay);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.connect(filter).connect(g).connect(out);
  osc.start(t);
  osc.stop(t + decay + 0.02);
}

/** Acordeón de la melodía: dos ondas apenas desafinadas y un filtro suave. */
function reed(ctx: BaseAudioContext, out: AudioNode, freq: number, t: number, duration: number, gain: number) {
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  filter.type = 'lowpass';
  filter.frequency.value = 1900;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.setValueAtTime(gain, t + Math.max(0.03, duration - 0.05));
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  filter.connect(g).connect(out);
  for (const detune of [-5, 5]) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** Golpe de tormento, la caja de madera que marca la cueca. */
function tormento(ctx: BaseAudioContext, out: AudioNode, t: number, gain: number) {
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noiseBuffer(ctx);
  filter.type = 'bandpass';
  filter.frequency.value = 1100;
  filter.Q.value = 1.2;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
  src.stop(t + 0.1);
}

/** Programa un compás. Los compases impares cambian a 3/4, el vaivén propio de la cueca. */
export function scheduleBar(ctx: BaseAudioContext, out: AudioNode, bar: number, t: number, mode: MusicMode) {
  const [chordId, phrase] = SONG[bar % SONG.length];
  const chord = CHORDS[chordId];
  const eighth = EIGHTH[mode];
  const swaying = bar % 2 === 1;
  const strums = swaying ? [0, 2, 4] : [0, 2, 3, 5];
  const basses = swaying ? [chord.root, chord.fifth, chord.root] : [chord.root, chord.fifth];

  basses.forEach((degree, i) => pluck(ctx, out, pitch(degree), t + i * eighth * (swaying ? 2 : 3), 0.28, 0.42, 900));
  for (const step of strums) {
    const accent = step === 0 || step === (swaying ? 2 : 3);
    chord.strum.forEach((degree, i) => pluck(ctx, out, pitch(degree), t + step * eighth + i * 0.009, accent ? 0.075 : 0.05, 0.3, 2600));
    if (mode === 'turno') tormento(ctx, out, t + step * eighth, accent ? 0.2 : 0.11);
  }

  let at = t;
  for (const [degree, length] of phrase) {
    const duration = length * eighth * 0.94;
    if (degree !== null) {
      reed(ctx, out, pitch(degree), at, duration, 0.1);
      if (mode === 'turno') reed(ctx, out, pitch(degree - 2), at, duration, 0.065);
    }
    at += length * eighth;
  }
}
