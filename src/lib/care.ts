import type { CareState } from "@/lib/types";

const HOUR = 3600_000;

/** 시간당 감소량 — 하루 이틀 안 들여다봐도 죽지는 않되, 티는 나도록 */
const FULLNESS_PER_HOUR = 3.2;
const CLARITY_PER_HOUR = 1.6;

export const FEED_COOLDOWN = 3 * HOUR;
export const WATER_COOLDOWN = 20 * HOUR;

export function initialCare(now = Date.now()): CareState {
  return {
    fullness: 78,
    waterClarity: 92,
    lastFedAt: now - 6 * HOUR,
    lastWaterChangeAt: now - 10 * HOUR,
    lastTickAt: now,
  };
}

/** 마지막 계산 시점부터 흐른 실제 시간만큼 상태를 깎는다 */
export function tickCare(care: CareState, now = Date.now()): CareState {
  const elapsed = Math.max(0, now - care.lastTickAt);
  if (elapsed < 60_000) return care;
  const hours = elapsed / HOUR;
  return {
    ...care,
    fullness: clamp(care.fullness - FULLNESS_PER_HOUR * hours),
    waterClarity: clamp(care.waterClarity - CLARITY_PER_HOUR * hours),
    lastTickAt: now,
  };
}

export function feed(care: CareState, now = Date.now()): CareState {
  return {
    ...care,
    fullness: clamp(care.fullness + 34),
    // 먹이를 주면 물이 아주 조금 탁해진다 — 실제 어항처럼
    waterClarity: clamp(care.waterClarity - 2),
    lastFedAt: now,
    lastTickAt: now,
  };
}

export function changeWater(care: CareState, now = Date.now()): CareState {
  return {
    ...care,
    waterClarity: 100,
    lastWaterChangeAt: now,
    lastTickAt: now,
  };
}

export function canFeed(care: CareState, now = Date.now()): boolean {
  return now - care.lastFedAt >= FEED_COOLDOWN && care.fullness < 96;
}

export function canChangeWater(care: CareState, now = Date.now()): boolean {
  return now - care.lastWaterChangeAt >= WATER_COOLDOWN || care.waterClarity < 70;
}

/**
 * 기분 = 돌봄 상태 + 관계.
 * 물고기의 움직임과 애교 빈도를 결정한다.
 */
export function moodOf(care: CareState, rapport: number): number {
  const body = care.fullness * 0.45 + care.waterClarity * 0.35;
  const heart = rapport * 0.2;
  return clamp(body + heart);
}

export function careHint(care: CareState): string | null {
  if (care.waterClarity < 28) return "물이 많이 탁해졌어요";
  if (care.fullness < 22) return "배가 고파 보여요";
  if (care.waterClarity < 50) return "물을 갈아줄 때가 됐어요";
  if (care.fullness < 45) return "밥 줄 시간이에요";
  return null;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}
