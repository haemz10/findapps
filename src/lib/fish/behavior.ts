import type { FishActivity } from "@/lib/types";

/**
 * 물고기의 움직임.
 *
 * 목표 지점을 정해두고 매 프레임 조금씩 다가간다. z는 깊이 —
 * 앞으로 나오면 커지고 선명해지고, 뒤로 물러나면 작아지고 흐려진다.
 * "스윽 나와서 밥을 받아먹고 다시 스윽 사라지는" 감각이 여기서 나온다.
 */

export interface FishPose {
  /** 0~1, 수조 왼쪽→오른쪽 */
  x: number;
  /** 0~1, 수조 위→아래 */
  y: number;
  /** 0(뒤) ~ 1(유리 바로 앞) */
  z: number;
  /** 1 = 오른쪽을 봄, -1 = 왼쪽 */
  dir: 1 | -1;
  /** 진행 방향에 따른 기울기(도) */
  tilt: number;
  /** 재주 부리는 중 회전(도) */
  roll: number;
}

export interface BehaviorState extends FishPose {
  target: { x: number; y: number; z: number };
  activity: FishActivity;
  /** 다음 목표를 정할 때까지 남은 시간(ms) */
  restMs: number;
  /** 재주 남은 시간(ms) */
  trickMs: number;
}

export function initialState(): BehaviorState {
  return {
    x: 0.5,
    y: 0.45,
    z: 0.35,
    dir: -1,
    tilt: 0,
    roll: 0,
    target: { x: 0.35, y: 0.45, z: 0.35 },
    activity: "drifting",
    restMs: 1200,
    trickMs: 0,
  };
}

export interface BehaviorInput {
  activity: FishActivity;
  /** 0~100 */
  mood: number;
  /** 먹이가 떠 있는가 */
  hasFood: boolean;
  /** 사용자가 입력창에 타이핑 중 */
  userTyping: boolean;
  /** 물고기가 말하는 중 */
  speaking: boolean;
  /** 물이 탁한 정도 0~100 (100 = 맑음) */
  clarity: number;
}

/** 활동별 목표 지점 */
function pickTarget(a: FishActivity, mood: number): { x: number; y: number; z: number } {
  const r = Math.random();
  switch (a) {
    case "sleeping":
      // 바닥 근처 구석에서 거의 움직이지 않는다
      return { x: 0.26 + r * 0.16, y: 0.7 + Math.random() * 0.08, z: 0.3 };
    case "waking":
      return { x: 0.35 + r * 0.3, y: 0.5 + Math.random() * 0.15, z: 0.5 };
    case "approaching":
    case "listening":
    case "speaking":
      // 유리 바로 앞, 가운데 아래쪽. 머리 위를 비워 말풍선이 앉을 자리를 만든다.
      return { x: 0.46 + (r - 0.5) * 0.12, y: 0.64 + (Math.random() - 0.5) * 0.08, z: 0.92 };
    case "eating":
      return { x: 0.46 + (r - 0.5) * 0.26, y: 0.28 + Math.random() * 0.18, z: 0.78 };
    case "playing":
      return { x: 0.3 + r * 0.4, y: 0.28 + Math.random() * 0.32, z: 0.62 + Math.random() * 0.3 };
    case "retreating":
      return { x: 0.28 + r * 0.44, y: 0.38 + Math.random() * 0.28, z: 0.24 };
    case "sulking":
      return { x: r < 0.5 ? 0.24 : 0.76, y: 0.6 + Math.random() * 0.16, z: 0.3 };
    default: {
      // 유유히 배회 — 기분이 좋으면 조금 더 앞쪽, 넓게 돈다
      const front = 0.42 + (mood / 100) * 0.36;
      return {
        x: 0.2 + r * 0.6,
        y: 0.26 + Math.random() * 0.44,
        z: Math.min(0.95, front + Math.random() * 0.2),
      };
    }
  }
}

function restFor(a: FishActivity, mood: number): number {
  switch (a) {
    case "sleeping":
      return 9000 + Math.random() * 8000;
    case "playing":
      return 700 + Math.random() * 700;
    case "eating":
      return 500 + Math.random() * 500;
    case "approaching":
    case "listening":
    case "speaking":
      return 2600 + Math.random() * 2600;
    default:
      return (2400 - mood * 8) + Math.random() * 3200;
  }
}

/** 활동별 이동 속도 계수 */
function speedFor(a: FishActivity, clarity: number): number {
  const drag = 0.55 + (clarity / 100) * 0.45; // 물이 탁하면 느려진다
  switch (a) {
    case "sleeping":
      return 0.12 * drag;
    case "waking":
      return 0.5 * drag;
    case "eating":
      return 2.2 * drag;
    case "playing":
      return 2.6 * drag;
    case "approaching":
      return 1.5 * drag;
    case "retreating":
      return 0.9 * drag;
    default:
      return 0.7 * drag;
  }
}

/**
 * 한 프레임 전진. dt는 초 단위.
 */
export function step(s: BehaviorState, input: BehaviorInput, dt: number): BehaviorState {
  const next: BehaviorState = { ...s, target: { ...s.target } };
  const dtms = dt * 1000;

  // 활동이 바뀌면 목표를 즉시 새로 잡는다
  if (input.activity !== s.activity) {
    next.activity = input.activity;
    next.target = pickTarget(input.activity, input.mood);
    next.restMs = restFor(input.activity, input.mood);
    if (input.activity === "playing") next.trickMs = 1400 + Math.random() * 900;
  }

  next.restMs -= dtms;
  if (next.restMs <= 0) {
    next.target = pickTarget(next.activity, input.mood);
    next.restMs = restFor(next.activity, input.mood);
  }

  // 재주 — 기분이 아주 좋을 때 가끔, 한 바퀴 돈다
  if (next.trickMs > 0) {
    next.trickMs -= dtms;
    next.roll = ((1 - Math.max(0, next.trickMs) / 1400) * 360) % 360;
    if (next.trickMs <= 0) next.roll = 0;
  } else if (
    next.activity === "drifting" &&
    input.mood > 72 &&
    Math.random() < dt * 0.035
  ) {
    next.trickMs = 1400;
  }

  const speed = speedFor(next.activity, input.clarity);
  // 지수 감쇠 보간 — 프레임레이트와 무관하게 같은 느낌
  const k = 1 - Math.exp(-speed * dt);

  const dx = next.target.x - next.x;
  const dy = next.target.y - next.y;
  const dz = next.target.z - next.z;

  next.x += dx * k;
  next.y += dy * k;
  // 앞뒤 이동은 조금 더 느리게 — "스윽" 하는 느낌
  next.z += dz * (1 - Math.exp(-speed * 0.75 * dt));

  // 미세한 부유 — 가만히 있어도 물결에 흔들린다
  const t = Date.now() / 1000;
  const bobAmp = next.activity === "sleeping" ? 0.004 : 0.008;
  next.y += Math.sin(t * 0.9 + next.x * 6) * bobAmp * dt;
  next.x += Math.cos(t * 0.6) * 0.004 * dt;

  // 방향은 히스테리시스를 둬서 덜덜 떨지 않게
  if (Math.abs(dx) > 0.035) next.dir = dx > 0 ? 1 : -1;

  // 기울기 — 위로 가면 머리를 든다
  const targetTilt = Math.max(-22, Math.min(22, dy * 90 * next.dir));
  next.tilt += (targetTilt - next.tilt) * Math.min(1, dt * 3);

  return next;
}

/** 지금 어떤 활동을 해야 하는가 — 상태들의 우선순위 */
export function decideActivity(o: {
  awake: boolean;
  hasFood: boolean;
  speaking: boolean;
  userTyping: boolean;
  waiting: boolean;
  mood: number;
  clarity: number;
  fullness: number;
}): FishActivity {
  if (!o.awake) return "sleeping";
  if (o.hasFood) return "eating";
  if (o.speaking) return "speaking";
  if (o.waiting) return "listening";
  if (o.userTyping) return "approaching";
  if (o.clarity < 25 || o.fullness < 15) return "sulking";
  return "drifting";
}
