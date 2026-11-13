// Música y sonidos sintetizados con WebAudio (sin archivos): una cumbia chiptune original
// para el juego y un tema tranquilo para el menú.

type Note = [number | null, number];
type Chord = 'Am' | 'F' | 'C' | 'G';

interface Song {
  bpm: number;
  chords: Chord[];
  melody: Note[][];
  style: 'cumbia' | 'calma';
}

const GAME: Song = {
  bpm: 116,
  style: 'cumbia',
  chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am', 'C', 'F', 'G', 'Am', 'C', 'F', 'G', 'Am'],
  melody: [
    [[76, 2], [76, 2], [74, 2], [72, 2], [69, 4], [72, 2], [76, 2]],
    [[77, 3], [76, 1], [74, 2], [72, 2], [74, 6], [null, 2]],
    [[72, 2], [72, 2], [74, 2], [76, 2], [79, 4], [76, 2], [74, 2]],
    [[74, 3], [72, 1], [71, 2], [67, 2], [71, 6], [null, 2]],
    [[76, 2], [76, 2], [74, 2], [72, 2], [69, 4], [72, 2], [76, 2]],
    [[77, 2], [79, 2], [81, 2], [79, 2], [77, 4], [76, 4]],
    [[74, 2], [76, 2], [77, 2], [76, 2], [74, 4], [71, 4]],
    [[69, 6], [null, 2], [76, 2], [74, 2], [72, 2], [71, 2]],
    [[79, 4], [76, 2], [79, 2], [81, 4], [79, 4]],
    [[77, 2], [76, 2], [74, 2], [72, 2], [77, 8]],
    [[79, 2], [77, 2], [76, 2], [74, 2], [71, 4], [74, 4]],
    [[76, 8], [null, 4], [72, 2], [74, 2]],
    [[76, 2], [79, 2], [84, 4], [83, 2], [81, 2], [79, 4]],
    [[81, 2], [79, 2], [77, 2], [76, 2], [77, 4], [81, 4]],
    [[79, 3], [77, 1], [76, 2], [74, 2], [71, 4], [67, 4]],
    [[69, 8], [null, 8]]
  ]
};

const MENU: Song = {
  bpm: 88,
  style: 'calma',
  chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'C'],
  melody: [
    [[67, 4], [72, 4], [76, 4], [74, 4]],
    [[72, 6], [69, 2], [71, 4], [72, 4]],
    [[69, 4], [72, 4], [77, 4], [76, 4]],
    [[74, 8], [71, 4], [67, 4]],
    [[76, 4], [79, 4], [77, 2], [76, 2], [74, 4]],
    [[72, 4], [76, 4], [74, 4], [72, 4]],
    [[69, 4], [71, 2], [72, 2], [74, 4], [71, 4]],
    [[72, 12], [null, 4]]
  ]
};

const ROOT: Record<Chord, number> = { Am: 45, F: 41, C: 48, G: 43 };
const TONES: Record<Chord, number[]> = { Am: [57, 60, 64], F: [53, 57, 60], C: [55, 60, 64], G: [55, 59, 62] };
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private song: Song | null = null;
  private wanted: Song | null = null;
  private step = 0;
  private nextTime = 0;

  musicOn = true;
  sfxOn = true;

  /** Se llama en el primer toque: iOS no deja sonar audio antes. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? 0.42 : 0;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxOn ? 0.7 : 0;
      this.sfxBus.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      window.setInterval(() => this.schedule(), 40);
      if (this.wanted) this.start(this.wanted);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? 0.42 : 0, this.ctx.currentTime, 0.05);
  }

  setSfx(on: boolean) {
    this.sfxOn = on;
    if (this.ctx) this.sfxBus.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.05);
  }

  play(which: 'menu' | 'juego' | null) {
    const song = which === 'menu' ? MENU : which === 'juego' ? GAME : null;
    this.wanted = song;
    if (this.ctx && song !== this.song) this.start(song);
  }

  private start(song: Song | null) {
    this.song = song;
    this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.08;
  }

  private schedule() {
    if (!this.ctx || !this.song || this.ctx.state !== 'running') return;
    const sixteenth = 60 / this.song.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      this.playStep(this.song, this.step, this.nextTime, sixteenth);
      this.step = (this.step + 1) % (this.song.chords.length * 16);
      this.nextTime += sixteenth;
    }
  }

  private playStep(song: Song, step: number, t: number, six: number) {
    const bar = Math.floor(step / 16);
    const pos = step % 16;
    const chord = song.chords[bar];
    // melodía
    let acc = 0;
    for (const [note, len] of song.melody[bar]) {
      if (acc === pos && note !== null) {
        this.tone(this.musicBus, song.style === 'cumbia' ? 'square' : 'triangle', hz(note), t, len * six * 0.92,
          song.style === 'cumbia' ? 0.11 : 0.2);
      }
      acc += len;
    }
    if (song.style === 'cumbia') {
      // bajo: tónica y quinta
      if (pos === 0 || pos === 8) this.tone(this.musicBus, 'triangle', hz(ROOT[chord]), t, six * 3, 0.4);
      if (pos === 6 || pos === 14) this.tone(this.musicBus, 'triangle', hz(ROOT[chord] + 7), t, six * 1.6, 0.32);
      // acordes a contratiempo
      if (pos % 4 === 2) for (const n of TONES[chord]) this.tone(this.musicBus, 'square', hz(n), t, six * 0.9, 0.025);
      // güiro, bombo y tumba
      this.hit(t, pos % 4 === 0 ? 0.06 : pos % 2 ? 0.025 : 0.045, 7000, 0.035);
      if (pos === 0 || pos === 8) this.kick(t);
      if (pos === 4 || pos === 12) this.hit(t, 0.16, 1800, 0.08);
      if (pos === 11 || pos === 15) this.tone(this.musicBus, 'sine', 196, t, 0.12, 0.18, 0.6);
    } else {
      if (pos === 0) this.tone(this.musicBus, 'triangle', hz(ROOT[chord]), t, six * 14, 0.3);
      if (pos % 4 === 0) {
        const n = TONES[chord][(pos / 4) % 3];
        this.tone(this.musicBus, 'sine', hz(n), t, six * 3, 0.08);
      }
      if (pos === 8) this.hit(t, 0.03, 6000, 0.05);
    }
  }

  private tone(bus: GainNode, type: OscillatorType, freq: number, t: number, dur: number, vol: number, drop = 1) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (drop !== 1) o.frequency.exponentialRampToValueAtTime(freq * drop, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setTargetAtTime(vol * 0.6, t + 0.02, 0.08);
    g.gain.setTargetAtTime(0, t + dur, 0.03);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + dur + 0.2);
  }

  private hit(t: number, vol: number, freq: number, dur: number, bus = this.musicBus) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + 0.2);
  }

  // ── Efectos ────────────────────────────────────────────────────────────────

  private seq(notes: number[], gap: number, type: OscillatorType = 'square', vol = 0.16, dur = 0.09) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + 0.01;
    notes.forEach((n, i) => this.tone(this.sfxBus, type, hz(n), t0 + i * gap, dur, vol));
  }

  tap() { this.seq([84], 0, 'square', 0.08, 0.04); }
  send() { this.seq([72, 79], 0.06, 'square', 0.12, 0.06); }
  queued() { this.seq([67, 64], 0.08, 'triangle', 0.2, 0.08); }
  fixed(streak: number) {
    const up = Math.min(streak - 1, 5) * 2;
    this.seq([76 + up, 79 + up, 84 + up], 0.055, 'square', 0.13, 0.07);
  }
  expired() { this.seq([62, 58, 55], 0.1, 'sawtooth', 0.09, 0.12); }
  card() { this.seq([72, 76, 79, 84], 0.05, 'triangle', 0.25, 0.1); }
  good() { this.seq([72, 76, 79, 84, 88], 0.06, 'square', 0.11, 0.1); }
  bad() { this.seq([64, 63, 62, 61], 0.08, 'square', 0.1, 0.1); }
  build() {
    if (!this.ctx) return;
    this.kick(this.ctx.currentTime);
    this.seq([60, 67, 72, 76, 79], 0.07, 'square', 0.12, 0.1);
  }
  coin() { this.seq([83, 88], 0.07, 'square', 0.1, 0.08); }
  error() { this.seq([50, 50], 0.1, 'square', 0.1, 0.06); }
  fanfare(win: boolean) {
    if (win) this.seq([67, 72, 76, 79, 76, 79, 84], 0.12, 'square', 0.14, 0.16);
    else this.seq([72, 71, 69, 67, 64, 60], 0.18, 'triangle', 0.25, 0.2);
  }
}

export const audio = new AudioEngine();
