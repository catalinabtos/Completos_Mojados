// Interfaz del juego: pantallas, HUD, menús y el ciclo de animación.

import {
  BUILDINGS, CUENTA_OPTIONS, DEPTS, HIRE_COST, KINDS, LESSONS, MAX_CREWS, SALARY, deptById,
  kindById, lessonById, type BuildingId, type DeptId, type KindId, type Option
} from '../engine/content';
import { BARRIOS, barrioOf, isEmptyLot, type Pt } from '../engine/map';
import {
  MONTHS, MONTH_NAMES, MONTH_SECONDS, YEARS, avgApproval, build, canBuild, canHire, chooseCuenta, chooseOption,
  closeCard, continueAfterYear, crewsOf, currentCard, deserialize, dispatch, drainEvents, freeLots, hire, income,
  monthOfYear, newGame, serialize, tick, trustFactor, upgrade, upgradeCost, upkeep, voteShare, year,
  type GameEvent, type GameState
} from '../engine/sim';
import { AVATARS, DEPT_ICONS, ICONS, RIVAL, SPEAKERS, UI_ICONS, buildingArt, seasonOf } from '../render/art';
import { ART_H, ART_W, CityRenderer, T } from '../render/city';
import { toDataUrl } from '../render/pixel';
import { audio } from './audio';
import { loadGame, loadMeta, saveGame, saveMeta, type Meta } from './storage';

// ── utilidades DOM ───────────────────────────────────────────────────────────

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const urlCache = new Map<HTMLCanvasElement, string>();
function pix(c: HTMLCanvasElement, scale: number, cls = ''): HTMLImageElement {
  let url = urlCache.get(c);
  if (!url) {
    url = toDataUrl(c);
    urlCache.set(c, url);
  }
  const img = el('img', 'pix ' + cls);
  img.src = url;
  img.alt = '';
  img.width = c.width * scale;
  img.height = c.height * scale;
  return img;
}

function button(label: string, cls: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', 'btn ' + cls, label);
  b.type = 'button';
  b.addEventListener('click', () => {
    audio.unlock();
    audio.tap();
    onClick();
  });
  return b;
}

const fmt = (n: number) => Math.round(n).toString();
const money = (n: number) => `$${Math.round(n)}M`;
const signed = (n: number) => (n > 0 ? '+' : '') + Math.round(n);

const HAPPY: Record<KindId, string> = {
  bache: '¡Ya no se me desarma el auto!',
  agua: '¡Por fin no se inunda la cuadra!',
  basura: '¡Quedó limpiecito!',
  pasto: '¡La plaza quedó preciosa!',
  fuego: '¡Lo apagaron a tiempo!',
  luz: '¡Luz en el pasaje, por fin!',
  salud: '¡Me dieron hora al tiro!',
  vecina: '¡Gracias por acordarse de mí!',
  perro: '¡El Firulais encontró familia!'
};
const HAPPY_GENERIC = ['¡Bacán, quedó impeque!', '¡Así da gusto vivir en Talca!', '¡Rapidito! Así se hace.', '¡Al fin alguien escucha!'];
const ANGRY = ['¡Llevo semanas reclamando!', '¿Y la muni? ¡Ni luces!', '¡Voy a ir a la OIRS!', '¡Nadie nos pesca!', '¡Pucha, otra vez lo mismo!'];

type Hint = 'tap' | 'travel' | 'faces' | 'build' | 'hire' | null;

// ── aplicación ───────────────────────────────────────────────────────────────

export class App {
  private root: HTMLElement;
  private meta!: Meta;
  private s: GameState | null = null;
  private renderer: CityRenderer | null = null;
  private screen = '';
  private raf = 0;
  private last = 0;
  private time = 0;
  private paused = false;
  private buildMode = false;
  private selected: Pt | null = null;
  private modalOpen = false;
  private hud: Record<string, HTMLElement> = {};
  private deptBtns = new Map<DeptId, HTMLElement>();
  private fx!: HTMLElement;
  private boardEl!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private scale = 2;
  private hint: Hint = null;
  private hintEl!: HTMLElement;
  private lastToast = 0;
  private demo: GameState | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  async start() {
    this.meta = await loadMeta();
    audio.setMusic(this.meta.music);
    audio.setSfx(this.meta.sfx);
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        audio.suspend();
        if (this.s && this.screen === 'game') {
          if (!this.modalOpen) this.openPause();
          void this.persist();
        }
      } else audio.resume();
    });
    window.addEventListener('resize', () => this.layout());
    await this.showTitle();
  }

  private clear() {
    cancelAnimationFrame(this.raf);
    this.root.innerHTML = '';
    this.modalOpen = false;
    this.buildMode = false;
    this.selected = null;
  }

  // ── Título ─────────────────────────────────────────────────────────────────

  private async showTitle() {
    this.clear();
    this.screen = 'title';
    audio.play('menu');
    const wrap = el('div', 'screen title');
    const bg = el('canvas', 'title-bg') as HTMLCanvasElement;
    wrap.append(bg);
    const demoRenderer = new CityRenderer(bg);
    const cover = () => {
      const dpr = window.devicePixelRatio || 1;
      const n = Math.ceil(Math.max((wrap.clientWidth * dpr) / ART_W, (wrap.clientHeight * dpr) / ART_H));
      bg.style.width = `${(ART_W * n) / dpr}px`;
      bg.style.height = `${(ART_H * n) / dpr}px`;
    };
    requestAnimationFrame(cover);
    this.demo = newGame(7);
    this.demo.problems = [];
    // Una ciudad bonita de fondo, con algunas obras.
    const deco: [number, number, BuildingId][] = [[3, 7, 'plaza'], [9, 9, 'cesfam'], [5, 3, 'led'], [8, 12, 'sede'], [2, 16, 'contenedores']];
    for (const [x, y, t] of deco) this.demo.buildings.push({ x, y, type: t, barrio: barrioOf(x, y) });
    this.demo.approval = this.demo.approval.map(() => 70);

    const panel = el('div', 'title-panel');
    panel.append(el('div', 'logo', '<span class="l1">TALCA</span><span class="l2">en tus manos</span>'));
    panel.append(el('p', 'tagline', 'Gestiona tu ciudad, toma decisiones y descubre qué deberíamos exigirle a una alcaldía.'));
    const saved = await loadGame();
    const savedState = saved ? deserialize(saved) : null;
    const btns = el('div', 'stack');
    if (savedState && savedState.phase !== 'ended') {
      btns.append(button('Continuar mandato', 'primary', () => this.startGame(savedState)));
      btns.append(button('Nueva partida', '', () => this.showAvatar()));
    } else {
      btns.append(button('Jugar', 'primary', () => this.showAvatar()));
    }
    btns.append(button(`Fichas ciudadanas (${this.meta.lessons.length}/${LESSONS.length})`, '', () => this.openFichas()));
    const row = el('div', 'row2');
    row.append(button('Ajustes', 'small', () => this.openSettings()));
    row.append(button('Créditos', 'small', () => this.openCredits()));
    btns.append(row);
    panel.append(btns);
    if (this.meta.bestVote > 0) {
      panel.append(el('p', 'record', `Mejor votación: ${fmt(this.meta.bestVote)}% · Reelecciones: ${this.meta.wins}`));
    }
    wrap.append(panel);
    this.root.append(wrap);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      this.time += dt;
      // el mes del fondo avanza solo, para ver las estaciones
      this.demo!.month = Math.floor(this.time / 6) % 12;
      demoRenderer.draw(this.demo!, this.time, dt, { build: false, selected: null, paused: false, faces: false });
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // ── Elegir avatar ──────────────────────────────────────────────────────────

  private showAvatar() {
    this.clear();
    this.screen = 'avatar';
    const wrap = el('div', 'screen paper');
    wrap.append(el('h1', '', '¿Quién asume la alcaldía?'));
    wrap.append(el('p', 'muted center', 'Elige tu personaje. Es ficticio: no representa a ninguna persona ni partido real.'));
    const grid = el('div', 'avatars');
    AVATARS.forEach((a, i) => {
      const b = el('button', 'avatar');
      b.type = 'button';
      b.append(pix(a.art, 4));
      b.append(el('span', '', a.title));
      b.addEventListener('click', () => {
        audio.unlock();
        audio.good();
        this.showIntro(i);
      });
      grid.append(b);
    });
    wrap.append(grid);
    wrap.append(button('Volver', 'small', () => void this.showTitle()));
    this.root.append(wrap);
  }

  private showIntro(avatar: number) {
    this.clear();
    const a = AVATARS[avatar];
    const fem = a.title === 'Alcaldesa';
    const wrap = el('div', 'screen paper');
    const head = el('div', 'intro-head');
    head.append(pix(a.art, 3));
    head.append(el('h1', '', `¡${fem ? 'Bienvenida' : 'Bienvenido'}, ${a.title}!`));
    wrap.append(head);
    wrap.append(el('p', '', 'Talca te eligió. Durante <b>cuatro años</b> vas a dirigir la municipalidad: tapar baches, recoger la basura, cuidar la salud y apoyar a los vecinos de seis barrios.'));
    wrap.append(el('p', '', 'Pero ojo: no basta con trabajar rápido. Tus decisiones sobre plata, contratos y participación también cuentan. <b>Al final, Talca vota.</b>'));
    const how = el('div', 'how');
    how.append(this.howRow(ICONS.bache, 'Toca los problemas para mandar una cuadrilla del departamento que corresponde.'));
    how.append(this.howRow(UI_ICONS.hammer, 'Construye en los sitios eriazos: los barrios con obras mejoran solos.'));
    how.append(this.howRow(UI_ICONS.eye, 'Decide con cuidado: la confianza multiplica tus votos.'));
    wrap.append(how);
    wrap.append(button('¡A trabajar!', 'primary', () => {
      this.meta.games++;
      void saveMeta(this.meta);
      this.startGame(newGame(Math.floor(Math.random() * 1e9), avatar, a.title));
    }));
    this.root.append(wrap);
  }

  private howRow(icon: HTMLCanvasElement, text: string) {
    const r = el('div', 'how-row');
    r.append(pix(icon, 3));
    r.append(el('span', '', text));
    return r;
  }

  // ── Partida ────────────────────────────────────────────────────────────────

  private startGame(s: GameState) {
    this.clear();
    this.s = s;
    this.screen = 'game';
    this.paused = false;
    audio.play('juego');
    const wrap = el('div', 'screen game');

    // HUD
    const hud = el('header', 'hud');
    const row1 = el('div', 'hud-row');
    const date = el('div', 'chip date');
    const dateText = el('span', '', '');
    const monthBar = el('i', 'month-bar');
    date.append(dateText, monthBar);
    const moneyChip = el('div', 'chip money');
    moneyChip.append(pix(UI_ICONS.money, 2));
    const moneyText = el('span', '', '');
    moneyChip.append(moneyText);
    moneyChip.addEventListener('click', () => {
      const st = this.s!;
      this.toast(`Ingresos ${money(income(st))}/mes · gastos ${money(upkeep(st))}/mes (sueldos y mantención).`);
    });
    const vote = el('div', 'chip vote');
    const voteText = el('span', '', '');
    vote.append(el('small', '', 'Encuesta'), voteText);
    const pauseBtn = el('button', 'icon-btn');
    pauseBtn.type = 'button';
    pauseBtn.setAttribute('aria-label', 'Pausa');
    pauseBtn.append(pix(UI_ICONS.pause, 2));
    pauseBtn.addEventListener('click', () => {
      audio.tap();
      this.openPause();
    });
    row1.append(date, moneyChip, vote, pauseBtn);
    const row2 = el('div', 'hud-row meters');
    const appr = el('div', 'meter appr');
    appr.append(pix(UI_ICONS.heart, 2));
    const apprBar = el('div', 'bar');
    const apprFill = el('i');
    apprBar.append(apprFill);
    const apprText = el('b');
    appr.append(apprBar, apprText);
    const tr = el('div', 'meter');
    tr.append(pix(UI_ICONS.eye, 2));
    const trText = el('b');
    tr.append(trText);
    const pa = el('div', 'meter');
    pa.append(pix(UI_ICONS.people, 2));
    const paText = el('b');
    pa.append(paText);
    appr.title = 'Aprobación promedio de los barrios';
    tr.title = 'Transparencia';
    pa.title = 'Participación ciudadana';
    for (const [m, what] of [[appr, 'appr'], [tr, 'transp'], [pa, 'partic']] as const) {
      m.addEventListener('click', () => this.explainMeter(what));
    }
    row2.append(appr, tr, pa);
    hud.append(row1, row2);
    this.hud = { dateText, monthBar, moneyText, voteText, apprFill, apprText, trText, paText, moneyChip };

    // Tablero
    const board = el('div', 'board');
    const canvas = el('canvas', 'city') as HTMLCanvasElement;
    this.canvas = canvas;
    this.renderer = new CityRenderer(canvas);
    this.fx = el('div', 'fx');
    const stage = el('div', 'stage');
    stage.append(canvas, this.fx);
    board.append(stage);
    this.hintEl = el('div', 'hint hidden');
    board.append(this.hintEl);
    this.boardEl = stage;
    canvas.addEventListener('pointerdown', (e) => this.onBoardTap(e));

    // Barra de departamentos
    const bar = el('nav', 'bar');
    this.deptBtns.clear();
    for (const d of DEPTS) {
      const b = el('button', 'dept');
      b.type = 'button';
      b.style.setProperty('--dept', d.color);
      b.append(pix(DEPT_ICONS[d.id], 3));
      b.append(el('span', 'dept-name', d.short));
      b.append(el('span', 'dept-count', ''));
      b.addEventListener('click', () => {
        audio.tap();
        this.openDept(d.id);
      });
      bar.append(b);
      this.deptBtns.set(d.id, b);
    }
    const buildBtn = el('button', 'dept build');
    buildBtn.type = 'button';
    buildBtn.append(pix(UI_ICONS.hammer, 3));
    buildBtn.append(el('span', 'dept-name', 'Construir'));
    buildBtn.append(el('span', 'dept-count', ''));
    buildBtn.addEventListener('click', () => {
      audio.tap();
      this.toggleBuild();
    });
    this.hud.buildBtn = buildBtn;
    bar.append(buildBtn);

    wrap.append(hud, board, bar);
    this.root.append(wrap);
    this.layout();
    requestAnimationFrame(() => this.layout());

    this.setHint(!this.meta.tutorialDone && s.month === 0 ? 'tap' : null);
    // Si se retoma una partida en medio de una carta o de la cuenta pública.
    if (s.phase === 'card') this.openCard();
    else if (s.phase === 'yearEnd') this.openYearEnd();
    else if (s.phase === 'ended') this.openElection();

    this.last = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private layout() {
    if (this.screen !== 'game' || !this.boardEl) return;
    const box = this.boardEl.parentElement!.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const n = Math.max(1, Math.floor(Math.min((box.width * dpr) / ART_W, (box.height * dpr) / ART_H)));
    this.scale = n / dpr;
    const w = ART_W * this.scale;
    const h = ART_H * this.scale;
    this.boardEl.style.width = `${w}px`;
    this.boardEl.style.height = `${h}px`;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  private frame(dt: number) {
    const s = this.s!;
    this.time += dt;
    const running = !this.paused && !this.modalOpen && !this.buildMode && s.phase === 'playing';
    if (running) tick(s, dt);
    for (const e of drainEvents(s)) this.onEvent(e);
    this.renderer!.draw(s, this.time, dt, { build: this.buildMode, selected: this.selected, paused: !running });
    this.updateHud();
  }

  private updateHud() {
    const s = this.s!;
    const h = this.hud;
    // En la cuenta pública el mes ya avanzó: se muestra diciembre del año que termina.
    const m = s.phase === 'yearEnd' || s.phase === 'ended' ? s.month - 1 : Math.min(s.month, MONTHS - 1);
    h.dateText.textContent = `${MONTH_NAMES[m % 12]} · Año ${Math.floor(m / 12) + 1}`;
    h.monthBar.style.width = `${Math.min(100, (s.monthT / MONTH_SECONDS) * 100)}%`;
    h.moneyText.textContent = money(s.money);
    h.moneyChip.classList.toggle('neg', s.money < 0);
    const a = avgApproval(s);
    h.apprFill.style.width = `${a}%`;
    h.apprFill.className = a >= 60 ? 'ok' : a >= 40 ? 'mid' : 'low';
    h.apprText.textContent = fmt(a);
    h.trText.textContent = fmt(s.transparency);
    h.paText.textContent = fmt(s.participation);
    const v = voteShare(s);
    h.voteText.textContent = `${fmt(v)}%`;
    h.voteText.className = v > 50 ? 'win' : 'lose';
    for (const d of DEPTS) {
      const crews = crewsOf(s, d.id);
      const idle = crews.filter((c) => c.state === 'idle').length;
      const btn = this.deptBtns.get(d.id)!;
      const waiting = s.problems.filter((p) => p.status === 'queued' && kindById(p.kind).dept === d.id).length;
      btn.querySelector('.dept-count')!.textContent = `${idle}/${crews.length}`;
      btn.classList.toggle('busy', idle === 0);
      btn.classList.toggle('alert', waiting > 0);
    }
    h.buildBtn.querySelector('.dept-count')!.textContent = `${freeLots(s).length} sitios`;
    h.buildBtn.classList.toggle('active', this.buildMode);
  }

  // ── Toques en la ciudad ────────────────────────────────────────────────────

  private toArt(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { ax: ((e.clientX - r.left) / r.width) * ART_W, ay: ((e.clientY - r.top) / r.height) * ART_H };
  }

  private onBoardTap(e: PointerEvent) {
    audio.unlock();
    const s = this.s!;
    if (this.paused || this.modalOpen || s.phase !== 'playing') return;
    const { ax, ay } = this.toArt(e);
    const tx = Math.floor(ax / T);
    const ty = Math.floor(ay / T);
    if (this.buildMode) {
      if (isEmptyLot(tx, ty) && freeLots(s).some((p) => p.x === tx && p.y === ty)) {
        audio.tap();
        this.selected = { x: tx, y: ty };
        this.openBuildMenu();
      } else {
        audio.error();
      }
      return;
    }
    const id = this.renderer!.problemAt(s, ax, ay);
    if (id !== null) {
      const res = dispatch(s, id);
      if (res === 'sent' && this.hint === 'tap') this.setHint('travel');
      return;
    }
    // carita de barrio
    for (const b of BARRIOS) {
      const cx = b.sign.x * T + 7, cy = b.sign.y * T + 7;
      if (Math.hypot(ax - cx, ay - cy) < 12) {
        this.toast(`${b.name}: ${fmt(s.approval[b.id])}% de aprobación`);
        return;
      }
    }
  }

  private toggleBuild() {
    if (this.s!.phase !== 'playing') return;
    this.buildMode = !this.buildMode;
    this.selected = null;
    if (this.buildMode) {
      if (this.hint === 'build') this.setHint(null);
      if (!freeLots(this.s!).length) {
        this.toast('Ya no quedan sitios eriazos: ¡construiste en toda la ciudad!');
        this.buildMode = false;
      } else this.toast('Toca un sitio eriazo marcado para construir. Mientras eliges, el tiempo se detiene.');
    }
  }

  // ── Eventos del motor ──────────────────────────────────────────────────────

  private onEvent(e: GameEvent) {
    const s = this.s!;
    switch (e.type) {
      case 'fixed': {
        audio.fixed(e.streak);
        this.renderer!.burst(e.x, e.y, 'heart', 3 + Math.min(e.streak, 4));
        this.floatText(e.x, e.y, `+${e.gain.toFixed(1)}`, 'up');
        if (e.streak >= 3) this.floatText(e.x, e.y - 1, `¡Racha x${e.streak}!`, 'streak');
        if (Math.random() < 0.35) this.bubble(e.x, e.y, Math.random() < 0.6 ? HAPPY[e.kind] : HAPPY_GENERIC[Math.floor(Math.random() * HAPPY_GENERIC.length)], 'happy');
        if (this.hint === 'travel') {
          this.setHint('faces');
          window.setTimeout(() => this.hint === 'faces' && this.setHint(null), 7000);
        }
        break;
      }
      case 'expired':
        audio.expired();
        this.renderer!.burst(e.x, e.y, 'cloud', 1);
        this.bubble(e.x, e.y, ANGRY[Math.floor(Math.random() * ANGRY.length)], 'angry');
        break;
      case 'dispatch':
        audio.send();
        break;
      case 'nocrew': {
        audio.queued();
        if (!this.meta.tutorialDone && this.hint !== 'hire') this.setHint('hire');
        if (performance.now() - this.lastToast > 4000) {
          this.toast(`Sin cuadrillas libres de ${deptById(e.dept).name}: el problema queda en espera.`);
        }
        break;
      }
      case 'card':
        audio.card();
        this.openCard();
        break;
      case 'month': {
        if (e.net !== 0) {
          const chip = this.hud.moneyChip;
          const f = el('div', 'float-money ' + (e.net >= 0 ? 'up' : 'down'), `${e.net >= 0 ? '+' : ''}${e.net.toFixed(0)}`);
          chip.append(f);
          window.setTimeout(() => f.remove(), 1400);
          if (e.net > 0) audio.coin();
        }
        if (e.month === 2 && !this.meta.tutorialDone && freeLots(s).length === 18) this.setHint('build');
        void this.persist();
        break;
      }
      case 'yearEnd':
        if (e.year === 1 && !this.meta.tutorialDone) {
          this.meta.tutorialDone = true;
          void saveMeta(this.meta);
          this.setHint(null);
        }
        this.openYearEnd();
        break;
      case 'election':
        this.openElection();
        break;
      case 'built':
        audio.build();
        this.renderer!.burst(e.x, e.y, 'confetti', 18);
        this.floatText(e.x, e.y, '¡Inaugurado!', 'streak');
        break;
      case 'hired':
      case 'upgraded':
        audio.good();
        break;
      default:
        break;
    }
  }

  private posOf(tx: number, ty: number) {
    return { left: (tx * T + 8) * this.scale, top: (ty * T) * this.scale };
  }

  private floatText(tx: number, ty: number, text: string, cls: string) {
    const f = el('div', 'float ' + cls, text);
    const p = this.posOf(tx, ty);
    f.style.left = `${p.left}px`;
    f.style.top = `${p.top}px`;
    this.fx.append(f);
    window.setTimeout(() => f.remove(), 1300);
  }

  private bubble(tx: number, ty: number, text: string, mood: 'happy' | 'angry') {
    const b = el('div', 'bubble ' + mood, text);
    const p = this.posOf(tx, ty);
    const w = ART_W * this.scale;
    b.style.top = `${Math.max(0, p.top - 30)}px`;
    if (p.left > w * 0.55) {
      b.style.right = `${Math.max(2, w - p.left - 10)}px`;
      b.classList.add('tail-right');
    } else b.style.left = `${Math.max(2, p.left - 10)}px`;
    this.fx.append(b);
    window.setTimeout(() => b.remove(), 2400);
  }

  private toast(text: string) {
    this.lastToast = performance.now();
    this.root.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = el('div', 'toast', text);
    this.root.append(t);
    window.setTimeout(() => t.remove(), 2800);
  }

  private setHint(h: Hint) {
    this.hint = h;
    const text: Record<Exclude<Hint, null>, string> = {
      tap: '¡Hay un bache frente a la muni! Tócalo para mandar a la cuadrilla de Obras.',
      travel: 'La cuadrilla va en camino. Cada arreglo sube la aprobación del barrio.',
      faces: 'Cada barrio tiene su carita. Si un problema espera mucho, se vuelve reclamo y la carita se enoja.',
      build: 'Toca Construir y elige un sitio eriazo: CESFAM, plazas y luminarias hacen que el barrio mejore solo.',
      hire: 'No hay cuadrillas libres. Toca el departamento abajo para contratar otra o mejorar sus vehículos.'
    };
    // El aviso flota sobre el mapa sin bloquear los toques (pointer-events: none).
    if (!h) this.hintEl.classList.add('hidden');
    else {
      this.hintEl.textContent = text[h];
      this.hintEl.classList.remove('hidden');
    }
  }

  private explainMeter(what: 'appr' | 'transp' | 'partic') {
    const s = this.s!;
    const msg = {
      appr: `Aprobación: lo contentos que están los barrios (${fmt(avgApproval(s))}%). Sube al arreglar problemas y con obras.`,
      transp: `Transparencia: ${fmt(s.transparency)}%. Multiplica tus votos: con ella, cada vecino conforme te vota (×${trustFactor(s).toFixed(2)}).`,
      partic: `Participación: ${fmt(s.participation)}%. Sube cuando escuchas a los vecinos y suma votos.`
    }[what];
    this.toast(msg);
  }

  // ── Modales ────────────────────────────────────────────────────────────────

  private modal(cls = ''): { layer: HTMLElement; sheet: HTMLElement; close: () => void } {
    this.modalOpen = true;
    const layer = el('div', 'modal-layer');
    const sheet = el('div', 'sheet ' + cls);
    layer.append(sheet);
    this.root.append(layer);
    const close = () => {
      layer.remove();
      this.modalOpen = this.root.querySelectorAll('.modal-layer').length > 0;
    };
    return { layer, sheet, close };
  }

  private openPause() {
    if (this.modalOpen && this.paused) return;
    this.paused = true;
    const { sheet, close } = this.modal('small');
    sheet.append(el('h2', '', 'Pausa'));
    const s = this.s!;
    sheet.append(el('p', 'muted center', `${MONTH_NAMES[monthOfYear(s)]} del año ${year(s)} de ${YEARS}`));
    const stack = el('div', 'stack');
    stack.append(button('Seguir jugando', 'primary', () => {
      close();
      this.paused = false;
    }));
    stack.append(button('Fichas ciudadanas', '', () => this.openFichas()));
    stack.append(button('Ajustes', '', () => this.openSettings()));
    stack.append(button('Guardar y salir', '', () => {
      void this.persist().then(() => this.showTitle());
    }));
    sheet.append(stack);
  }

  private openDept(id: DeptId) {
    const s = this.s!;
    if (s.phase !== 'playing') return;
    const d = deptById(id);
    const { sheet, close } = this.modal('small');
    const head = el('div', 'sheet-head');
    head.append(pix(DEPT_ICONS[id], 4));
    head.append(el('h2', '', d.name));
    sheet.append(head);
    const kinds = KINDS.filter((k) => k.dept === id);
    const list = el('div', 'kinds');
    for (const k of kinds) {
      const r = el('div', 'kind');
      r.append(pix(ICONS[k.id], 2));
      r.append(el('span', '', k.label));
      list.append(r);
    }
    sheet.append(list);
    const crews = crewsOf(s, id);
    sheet.append(el('p', 'center', `Cuadrillas: <b>${crews.length}</b> de ${MAX_CREWS} · libres: ${crews.filter((c) => c.state === 'idle').length}`));
    const stack = el('div', 'stack');
    const hireBtn = button(`Contratar cuadrilla · ${money(HIRE_COST)} (+$${SALARY}M/mes)`, 'primary', () => {
      if (hire(s, id)) {
        if (this.hint === 'hire') this.setHint(null);
        close();
      }
    });
    hireBtn.disabled = !canHire(s, id);
    if (crews.length >= MAX_CREWS) hireBtn.textContent = 'Equipo completo';
    stack.append(hireBtn);
    const cost = upgradeCost(s, id);
    const upBtn = button(
      cost === null ? 'Vehículos al máximo' : `Mejores vehículos (nivel ${s.upgrades[id] + 1}) · ${money(cost)}`,
      '',
      () => {
        if (upgrade(s, id)) close();
      }
    );
    upBtn.disabled = cost === null || s.money < cost;
    stack.append(upBtn);
    stack.append(button('Cerrar', 'small', close));
    sheet.append(stack);
  }

  private openBuildMenu() {
    const s = this.s!;
    const lot = this.selected!;
    const { sheet, close } = this.modal('tall');
    const barrio = BARRIOS[barrioOf(lot.x, lot.y)];
    sheet.append(el('h2', '', `Construir en ${barrio.name}`));
    sheet.append(el('p', 'muted center', `Tienes ${money(s.money)}. Cada obra cuesta mantenerla todos los meses.`));
    const list = el('div', 'build-list');
    const season = seasonOf(monthOfYear(s));
    const here = new Set(s.buildings.filter((b) => b.barrio === barrio.id).map((b) => b.type));
    for (const b of BUILDINGS) {
      const item = el('button', 'build-item');
      item.type = 'button';
      item.append(pix(buildingArt(b.id, season), 3));
      const txt = el('div', 'build-text');
      txt.append(el('b', '', b.name + (here.has(b.id) ? ' <small>(ya hay uno)</small>' : '')));
      txt.append(el('span', '', b.desc));
      txt.append(el('em', '', `${money(b.cost)} · mantención $${b.upkeep}M/mes`));
      item.append(txt);
      item.disabled = !canBuild(s, lot.x, lot.y, b.id);
      item.addEventListener('click', () => {
        if (build(s, lot.x, lot.y, b.id)) {
          close();
          this.buildMode = false;
          this.selected = null;
        }
      });
      list.append(item);
    }
    sheet.append(list);
    sheet.append(button('Cancelar', 'small', () => {
      close();
      this.selected = null;
    }));
  }

  private effectsSummary(before: { money: number; appr: number; tr: number; pa: number }) {
    const s = this.s!;
    const row = el('div', 'effects');
    const add = (icon: HTMLCanvasElement, delta: number, label: string) => {
      if (Math.abs(delta) < 0.5) return;
      const c = el('span', 'eff ' + (delta > 0 ? 'pos' : 'neg'));
      c.append(pix(icon, 2), el('b', '', `${signed(delta)}${label}`));
      row.append(c);
    };
    add(UI_ICONS.money, s.money - before.money, 'M');
    add(UI_ICONS.heart, avgApproval(s) - before.appr, '');
    add(UI_ICONS.eye, s.transparency - before.tr, '');
    add(UI_ICONS.people, s.participation - before.pa, '');
    return row;
  }

  private snapshot() {
    const s = this.s!;
    return { money: s.money, appr: avgApproval(s), tr: s.transparency, pa: s.participation };
  }

  private lessonBox(id: string) {
    const l = lessonById(id);
    const isNew = !this.meta.lessons.includes(id);
    if (isNew) {
      this.meta.lessons.push(id);
      void saveMeta(this.meta);
    }
    const box = el('div', 'lesson');
    const head = el('div', 'lesson-head');
    head.append(pix(UI_ICONS.book, 2));
    head.append(el('b', '', `¿Sabías que? · ${l.title}`));
    if (isNew) head.append(el('span', 'new', '¡Ficha nueva!'));
    box.append(head);
    box.append(el('p', '', l.text));
    box.append(el('p', 'demand', `<b>Puedes exigir:</b> ${l.demand}`));
    return box;
  }

  private openCard() {
    const s = this.s!;
    const card = currentCard(s);
    if (!card) return;
    const { sheet, close } = this.modal('card');
    const head = el('div', 'card-head');
    head.append(pix(SPEAKERS[card.speaker], 3, 'portrait'));
    const ht = el('div');
    ht.append(el('small', '', card.who));
    ht.append(el('h2', '', card.title));
    head.append(ht);
    sheet.append(head);
    sheet.append(el('p', 'card-text', card.text.replace('Primo/a', s.title === 'Alcaldesa' ? 'Prima' : 'Primo')));
    const opts = el('div', 'stack');
    card.options.forEach((o, i) => {
      opts.append(button(o.label, 'option', () => {
        const before = this.snapshot();
        const chosen = chooseOption(s, i);
        if (!chosen) return;
        (chosen.good ? audio.good : audio.bad).call(audio);
        opts.remove();
        this.showResult(sheet, chosen, before, card.lesson, () => {
          close();
          closeCard(s);
          void this.persist();
        });
      }));
    });
    sheet.append(opts);
  }

  private showResult(sheet: HTMLElement, o: Option, before: ReturnType<App['snapshot']>, lesson: string, done: () => void) {
    sheet.append(el('p', 'result ' + (o.good ? 'good' : 'bad'), o.result));
    sheet.append(this.effectsSummary(before));
    sheet.append(this.lessonBox(lesson));
    sheet.append(button('Seguir', 'primary', done));
    sheet.scrollTop = 0;
  }

  private openYearEnd() {
    const s = this.s!;
    const y = s.years[s.years.length - 1];
    const n = s.years.length;
    const { sheet, close } = this.modal('card');
    sheet.append(el('small', 'eyebrow', `Fin del año ${n} de ${YEARS}`));
    sheet.append(el('h2', '', 'Cuenta pública'));
    const stats = el('div', 'stats');
    const stat = (label: string, value: string) => {
      const r = el('div', 'stat');
      r.append(el('span', '', label), el('b', '', value));
      stats.append(r);
    };
    stat('Problemas resueltos', fmt(y.fixed));
    stat('Se volvieron reclamo', fmt(y.expired));
    stat('Obras inauguradas', fmt(y.built));
    stat('Cuadrillas contratadas', fmt(y.hired));
    stat('Ingresos del año', money(y.income));
    stat('Gastos del año', money(y.spent));
    stat('Aprobación promedio', `${fmt(avgApproval(s))}%`);
    stat('Si la elección fuera hoy', `${fmt(voteShare(s))}%`);
    sheet.append(stats);
    const barrios = el('div', 'barrios');
    for (const b of BARRIOS) {
      const r = el('div', 'barrio-row');
      const a = s.approval[b.id];
      r.append(el('span', '', b.name));
      const bar = el('div', 'bar');
      const fill = el('i', a >= 60 ? 'ok' : a >= 40 ? 'mid' : 'low');
      fill.style.width = `${a}%`;
      bar.append(fill);
      r.append(bar, el('b', '', fmt(a)));
      barrios.append(r);
    }
    sheet.append(barrios);
    sheet.append(el('p', 'card-text', '¿Cómo presentas tu cuenta pública a la ciudad?'));
    const opts = el('div', 'stack');
    CUENTA_OPTIONS.forEach((o, i) => {
      opts.append(button(o.label, 'option', () => {
        const before = this.snapshot();
        const chosen = chooseCuenta(s, i);
        if (!chosen) return;
        (chosen.good ? audio.good : audio.bad).call(audio);
        opts.remove();
        this.showResult(sheet, chosen, before, 'cuenta', () => {
          close();
          continueAfterYear(s);
          void this.persist();
        });
      }));
    });
    sheet.append(opts);
  }

  private openElection() {
    const s = this.s!;
    void saveGame(null);
    audio.play('menu');
    const vote = voteShare(s);
    const win = vote > 50;
    this.meta.bestVote = Math.max(this.meta.bestVote, vote);
    if (win) this.meta.wins++;
    void saveMeta(this.meta);
    const { sheet } = this.modal('card');
    sheet.append(el('small', 'eyebrow', 'Elecciones municipales'));
    sheet.append(el('h2', '', '¡Talca votó!'));
    const race = el('div', 'race');
    const mine = el('div', 'race-row');
    mine.append(pix(AVATARS[s.avatar].art, 2), el('span', '', 'Tu gestión'));
    const mineBar = el('div', 'bar big');
    const mineFill = el('i', 'ok');
    mineBar.append(mineFill);
    const mineNum = el('b', '', '0%');
    mine.append(mineBar, mineNum);
    const rival = el('div', 'race-row');
    rival.append(pix(RIVAL, 2), el('span', '', 'Otra candidatura'));
    const rivalBar = el('div', 'bar big');
    const rivalFill = el('i', 'low');
    rivalBar.append(rivalFill);
    const rivalNum = el('b', '', '0%');
    rival.append(rivalBar, rivalNum);
    race.append(mine, rival);
    sheet.append(race);
    const verdict = el('h2', 'verdict hidden', win
      ? `¡${s.title === 'Alcaldesa' ? 'Reelecta' : 'Reelecto'}!`
      : 'Perdiste la elección');
    sheet.append(verdict);
    const why = el('div', 'why hidden');
    const a = avgApproval(s);
    const pillars: [string, number, string][] = [
      ['Servicio a los barrios', a, a >= 55 ? 'Los barrios sintieron tu trabajo.' : 'Muchos problemas quedaron sin resolver o faltaron obras.'],
      ['Confianza', s.transparency, s.transparency >= 60 ? 'Gestionaste con transparencia y probidad.' : 'Los tratos poco claros te pasaron la cuenta en las urnas.'],
      ['Participación', s.participation, s.participation >= 50 ? 'Los vecinos sintieron que los escuchabas.' : 'Faltó abrir la muni a los vecinos.']
    ];
    for (const [label, v, text] of pillars) {
      const r = el('div', 'pillar');
      const top = el('div', 'pillar-top');
      top.append(el('b', '', label), el('span', '', `${fmt(v)}/100`));
      const bar = el('div', 'bar');
      const fill = el('i', v >= 60 ? 'ok' : v >= 40 ? 'mid' : 'low');
      fill.style.width = `${v}%`;
      bar.append(fill);
      r.append(top, bar, el('p', 'muted', text));
      why.append(r);
    }
    const learned = el('div', 'learned');
    learned.append(el('h3', '', 'Lo que aprendimos a exigir'));
    const ul = el('ul');
    for (const id of s.lessons) ul.append(el('li', '', lessonById(id).demand));
    learned.append(ul);
    why.append(learned);
    why.append(el('p', 'closing', 'En la vida real, la municipalidad es de todos. Pide cuentas, participa en tu junta de vecinos y en el COSOC, revisa la transparencia de tu muni y vota informado. <b>¿Y si la próxima persona que lidere Talca eres tú?</b>'));
    const stack = el('div', 'stack');
    stack.append(button('Jugar otra vez', 'primary', () => this.showAvatar()));
    stack.append(button('Ver fichas ciudadanas', '', () => this.openFichas()));
    stack.append(button('Menú principal', 'small', () => void this.showTitle()));
    why.append(stack);
    sheet.append(why);

    // conteo animado
    const t0 = performance.now();
    const dur = 2600;
    const stepAnim = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - k) ** 3;
      mineFill.style.width = `${vote * e}%`;
      rivalFill.style.width = `${(100 - vote) * e}%`;
      mineNum.textContent = `${fmt(vote * e)}%`;
      rivalNum.textContent = `${fmt((100 - vote) * e)}%`;
      if (k < 1) requestAnimationFrame(stepAnim);
      else {
        audio.fanfare(win);
        verdict.classList.remove('hidden');
        verdict.classList.add(win ? 'win' : 'lose');
        why.classList.remove('hidden');
      }
    };
    requestAnimationFrame(stepAnim);
  }

  private openFichas() {
    const { sheet, close } = this.modal('tall');
    sheet.append(el('h2', '', 'Fichas ciudadanas'));
    sheet.append(el('p', 'muted center', `Tienes ${this.meta.lessons.length} de ${LESSONS.length}. Se ganan tomando decisiones en el juego.`));
    const grid = el('div', 'fichas');
    for (const l of LESSONS) {
      const got = this.meta.lessons.includes(l.id);
      const b = el('button', 'ficha ' + (got ? '' : 'locked'));
      b.type = 'button';
      b.append(pix(got ? UI_ICONS.book : UI_ICONS.star, 2));
      b.append(el('span', '', got ? l.title : '???'));
      b.addEventListener('click', () => {
        audio.tap();
        if (!got) {
          this.toast('Sigue gobernando para descubrir esta ficha.');
          return;
        }
        const m = this.modal('small');
        m.sheet.append(el('h2', '', l.title));
        m.sheet.append(el('p', '', l.text));
        m.sheet.append(el('p', 'demand', `<b>Puedes exigir:</b> ${l.demand}`));
        m.sheet.append(button('Cerrar', 'small', m.close));
      });
      grid.append(b);
    }
    sheet.append(grid);
    sheet.append(button('Cerrar', 'small', close));
  }

  private openSettings() {
    const { sheet, close } = this.modal('small');
    sheet.append(el('h2', '', 'Ajustes'));
    const stack = el('div', 'stack');
    const music = button(`Música: ${this.meta.music ? 'sí' : 'no'}`, '', () => {
      this.meta.music = !this.meta.music;
      audio.setMusic(this.meta.music);
      music.textContent = `Música: ${this.meta.music ? 'sí' : 'no'}`;
      void saveMeta(this.meta);
    });
    const sfx = button(`Sonidos: ${this.meta.sfx ? 'sí' : 'no'}`, '', () => {
      this.meta.sfx = !this.meta.sfx;
      audio.setSfx(this.meta.sfx);
      sfx.textContent = `Sonidos: ${this.meta.sfx ? 'sí' : 'no'}`;
      void saveMeta(this.meta);
    });
    const tut = button('Repetir el tutorial', '', () => {
      this.meta.tutorialDone = false;
      void saveMeta(this.meta);
      this.toast('El tutorial aparecerá en tu próxima partida.');
    });
    stack.append(music, sfx, tut, button('Cerrar', 'small', close));
    sheet.append(stack);
  }

  private openCredits() {
    const { sheet, close } = this.modal('small');
    sheet.append(el('h2', '', 'Créditos'));
    sheet.append(el('p', '', 'Idea y dirección: <b>Catalina Barrientos</b>. Programación, arte y música hechos con Claude.'));
    sheet.append(el('p', '', 'Juego gratuito, sin anuncios y sin recolectar datos: tu progreso se guarda solo en tu teléfono.'));
    sheet.append(el('p', 'muted', 'Los personajes y situaciones son ficticios y no representan a ninguna autoridad, persona ni partido real. Las fichas ciudadanas resumen leyes chilenas vigentes; para casos concretos, revisa las fuentes oficiales.'));
    sheet.append(el('p', 'muted', 'Tipografía Jersey 15 (licencia SIL Open Font).'));
    sheet.append(button('Cerrar', 'small', close));
  }

  private async persist() {
    if (!this.s || this.s.phase === 'ended') return;
    await saveGame(serialize(this.s));
  }
}
