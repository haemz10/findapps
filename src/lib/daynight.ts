import type { DayPhase } from "@/lib/types";

/**
 * 실제 시계를 따라간다. 물고기는 야행성이다 —
 * 낮에는 자고, 밤에 깨어난다. 다만 방의 불을 끄면 낮에도 만날 수 있다.
 */

export interface TimeState {
  phase: DayPhase;
  /** 0~1, 자정 0.0 */
  dayFraction: number;
  /** 천문학적 의미의 밤인가 */
  isNight: boolean;
  label: string;
}

export function phaseOf(d: Date = new Date()): TimeState {
  const h = d.getHours() + d.getMinutes() / 60;
  const dayFraction = h / 24;

  let phase: DayPhase;
  let label: string;

  if (h >= 5 && h < 7) {
    phase = "dawn";
    label = "새벽";
  } else if (h >= 7 && h < 12) {
    phase = "morning";
    label = "아침";
  } else if (h >= 12 && h < 17) {
    phase = "afternoon";
    label = "낮";
  } else if (h >= 17 && h < 19.5) {
    phase = "dusk";
    label = "해질녘";
  } else if (h >= 19.5 || h < 1.5) {
    phase = "night";
    label = "밤";
  } else {
    phase = "deepNight";
    label = "깊은 밤";
  }

  const isNight = phase === "night" || phase === "deepNight" || phase === "dawn";
  return { phase, dayFraction, isNight, label };
}

/** 물고기가 깨어 있는가 — 밤이거나, 방이 어둡거나 */
export function fishAwake(time: TimeState, roomLightOn: boolean): boolean {
  return time.isNight || !roomLightOn;
}

/** 방의 기본 조명 상태 — 밤에는 꺼져 있는 것이 자연스럽다 */
export function defaultRoomLight(time: TimeState): boolean {
  return !time.isNight;
}

/** 시간대별 방 분위기 (CSS 변수로 나간다) */
export interface Ambience {
  /** 방 벽 그라디언트 */
  roomTop: string;
  roomBottom: string;
  /** 수조 물색 */
  waterTop: string;
  waterBottom: string;
  /** 수조 조명 세기 0~1 */
  tankLight: number;
  /** 방 전체 어둠 0~1 (1 = 완전한 어둠) */
  darkness: number;
}

const AMBIENCE: Record<DayPhase, Ambience> = {
  dawn: {
    roomTop: "#101828",
    roomBottom: "#070b14",
    waterTop: "#1a3a5c",
    waterBottom: "#08131f",
    tankLight: 0.55,
    darkness: 0.72,
  },
  morning: {
    roomTop: "#4a5567",
    roomBottom: "#262e3c",
    waterTop: "#2c5f83",
    waterBottom: "#12253a",
    tankLight: 0.28,
    darkness: 0.14,
  },
  afternoon: {
    roomTop: "#57627a",
    roomBottom: "#2e3747",
    waterTop: "#33688c",
    waterBottom: "#152a3f",
    tankLight: 0.22,
    darkness: 0.1,
  },
  dusk: {
    roomTop: "#1d1f33",
    roomBottom: "#0d0e18",
    waterTop: "#22456b",
    waterBottom: "#0a1624",
    tankLight: 0.5,
    darkness: 0.55,
  },
  night: {
    roomTop: "#0a0e1a",
    roomBottom: "#04060c",
    waterTop: "#0f3352",
    waterBottom: "#040a13",
    tankLight: 0.85,
    darkness: 0.86,
  },
  deepNight: {
    roomTop: "#06080f",
    roomBottom: "#020308",
    waterTop: "#0e2c48",
    waterBottom: "#03080f",
    tankLight: 0.95,
    darkness: 0.93,
  },
};


export function ambienceFor(phase: DayPhase, roomLightOn: boolean): Ambience {
  const base = AMBIENCE[phase];
  if (roomLightOn) return base;
  // 불을 끄면 방은 더 어두워지고 수조 빛만 남는다
  return {
    ...base,
    roomTop: "#05070d",
    roomBottom: "#010204",
    tankLight: Math.max(base.tankLight, 0.92),
    darkness: 0.95,
  };
}

/** 다음에 물고기가 깨어나는 시각 (사용자에게 안내용) */
export function nextWakeLabel(d: Date = new Date()): string {
  const h = d.getHours();
  if (h >= 19 || h < 5) return "지금 깨어 있어요";
  const hoursLeft = 19 - h;
  return `${hoursLeft}시간쯤 뒤에 깨어나요`;
}
