import { Container, Graphics, Text } from 'pixi.js';
import type { CustomerDTO, CustomerState } from '../core/types';
import type { MatchResult } from './scoring';

const ORDERING_DELAY = 1.1;
const EATING_DURATION = 3;
const WALK_SPEED = 260;

export type DeliverHandler = (customer: Customer) => void;

export class Customer {
  public readonly container = new Container();
  public readonly bubble = new Container();
  public readonly patienceBar = new Graphics();
  public dto: CustomerDTO;

  private readonly orderText: Text;
  private readonly patienceFill: Graphics;
  private readonly onDeliver: DeliverHandler;

  private targetX = 0;
  private targetY = 0;
  private stateTimer = 0;
  private lastPatienceRatio = 1;
  private result: MatchResult | null = null;
  private departureHandled = false;

  constructor(dto: CustomerDTO, orderLabel: string, onDeliver: DeliverHandler) {
    this.dto = dto;
    this.onDeliver = onDeliver;

    const body = new Graphics();
    body.roundRect(-26, -44, 52, 88, 22);
    body.fill({ color: 0x5c3d2e });
    body.stroke({ color: 0x3a2419, width: 4, alignment: 0.5 });
    this.container.addChild(body);

    const face = new Graphics();
    face.circle(0, -24, 20);
    face.fill({ color: 0xffe0bd });
    this.container.addChild(face);

    this.bubble.y = -110;
    const bubbleBody = new Graphics();
    bubbleBody.roundRect(-68, -44, 136, 80, 18);
    bubbleBody.fill({ color: 0xffffff, alpha: 0.92 });
    bubbleBody.stroke({ color: 0x2f2f2f, width: 2, alpha: 0.7 });
    this.bubble.addChild(bubbleBody);

    const tail = new Graphics();
    tail.moveTo(-12, 32);
    tail.lineTo(0, 46);
    tail.lineTo(14, 32);
    tail.fill({ color: 0xffffff, alpha: 0.92 });
    tail.stroke({ color: 0x2f2f2f, width: 2, alpha: 0.7 });
    this.bubble.addChild(tail);

    this.orderText = new Text({
      text: orderLabel,
      style: {
        fill: 0x1f1f1f,
        fontFamily: 'Inter',
        fontSize: 12,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 120
      }
    });
    this.orderText.anchor.set(0.5);
    this.bubble.addChild(this.orderText);
    this.container.addChild(this.bubble);
    this.bubble.visible = false;

    this.patienceBar.y = -16;
    this.patienceBar.roundRect(-40, 0, 80, 8, 4);
    this.patienceBar.fill({ color: 0x000000, alpha: 0.2 });
    this.patienceFill = new Graphics();
    this.patienceFill.roundRect(-38, 1, 76, 6, 3);
    this.patienceFill.fill({ color: 0x3fb950 });
    this.patienceBar.addChild(this.patienceFill);
    this.patienceBar.visible = false;
    this.container.addChild(this.patienceBar);

    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this.container.on('pointertap', () => {
      if (this.dto.state === 'Ordering') {
        this.onDeliver(this);
      }
    });
  }

  get state(): CustomerState {
    return this.dto.state;
  }

  setTarget(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  setQueuePosition(index: number, baseX: number, spacing: number, y: number) {
    this.setTarget(baseX + spacing * index, y);
  }

  seatAt(x: number, y: number) {
    this.setTarget(x, y);
    this.dto.state = 'Seated';
    this.stateTimer = 0;
  }

  startOrdering() {
    this.dto.state = 'Ordering';
    this.stateTimer = 0;
    this.bubble.visible = true;
    this.patienceBar.visible = true;
    this.refreshPatience();
  }

  update(dt: number) {
    this.moveTowards(dt);
    this.stateTimer += dt;

    if (this.dto.state === 'Arriving' && this.reachedTarget()) {
      this.dto.state = 'Waiting';
      this.stateTimer = 0;
    }

    if (this.dto.state === 'Seated' && this.stateTimer >= ORDERING_DELAY) {
      this.startOrdering();
    }

    if (this.dto.state === 'Ordering') {
      this.dto.patience = Math.max(0, this.dto.patience - dt);
      this.refreshPatience();
      if (this.dto.patience <= 0) {
        this.leaveAngry();
      }
    }

    if (this.dto.state === 'Eating' && this.stateTimer >= EATING_DURATION) {
      this.dto.state = 'Leaving';
      this.stateTimer = 0;
      this.setTarget(this.container.x + 420, this.container.y);
    }

    if (this.dto.state === 'Leaving' || this.dto.state === 'AngryLeaving') {
      this.bubble.visible = false;
      this.patienceBar.visible = false;
    }
  }

  reachedTarget(): boolean {
    const dx = this.targetX - this.container.x;
    const dy = this.targetY - this.container.y;
    return Math.hypot(dx, dy) < 6;
  }

  private moveTowards(dt: number) {
    const dx = this.targetX - this.container.x;
    const dy = this.targetY - this.container.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      this.container.x = this.targetX;
      this.container.y = this.targetY;
      return;
    }
    const step = Math.min(distance, WALK_SPEED * dt);
    const nx = dx / (distance || 1);
    const ny = dy / (distance || 1);
    this.container.x += nx * step;
    this.container.y += ny * step;
  }

  receive(match: MatchResult, patienceRatio: number) {
    this.result = match;
    const satisfied = match.match >= 0.7;
    this.dto.served = satisfied;
    this.dto.state = satisfied ? 'Eating' : 'AngryLeaving';
    this.stateTimer = 0;
    this.bubble.visible = false;
    this.patienceBar.visible = false;
    if (!satisfied) {
      this.setTarget(this.container.x + 420, this.container.y);
    }
    this.departureHandled = false;
  }

  leaveAngry() {
    this.dto.state = 'AngryLeaving';
    this.dto.served = false;
    this.stateTimer = 0;
    this.setTarget(this.container.x + 420, this.container.y);
    this.bubble.visible = false;
    this.patienceBar.visible = false;
    this.departureHandled = false;
  }

  refreshPatience() {
    const ratio = Math.max(0, Math.min(1, this.dto.patience / this.dto.patienceMax));
    if (Math.abs(ratio - this.lastPatienceRatio) < 0.01) {
      return;
    }
    this.lastPatienceRatio = ratio;
    this.patienceFill.clear();
    this.patienceFill.roundRect(-38, 1, 76 * ratio, 6, 3);
    const color = ratio > 0.6 ? 0x3fb950 : ratio > 0.3 ? 0xffa629 : 0xff4f4f;
    this.patienceFill.fill({ color });
  }

  getResult(): MatchResult | null {
    return this.result;
  }

  hasNotifiedDeparture(): boolean {
    return this.departureHandled;
  }

  markDepartureHandled() {
    this.departureHandled = true;
  }

  shouldRemove(viewWidth: number): boolean {
    return this.container.x > viewWidth + 200;
  }
}
