import type { FishActivity } from "@/lib/types";

/**
 * 물고기가 지금 무엇을 하고 있는가.
 *
 * 물고기는 그림에 박혀 있어 헤엄치지 않는다. 그래서 여기서 정하는 것은
 * 위치가 아니라 "상태"다 — 그 상태가 어항 위에 얹히는 것들(사라짐·숨결·빛)을 바꾼다.
 */
export function decideActivity(o: {
  awake: boolean;
  hasFood: boolean;
  speaking: boolean;
  userTyping: boolean;
  waiting: boolean;
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

/**
 * 물고기가 얼마나 물에 녹아 있는가 (0 = 또렷함, 1 = 사라짐).
 *
 * 체셔 고양이처럼 어둠 속에서 나타났다 사라진다. 다만 규칙이 있다:
 *  - 밝은 방에서는 사라지지 않는다. 어둠 속에서만 벌어지는 일이다.
 *  - 사용자가 말을 걸고 있거나 물고기가 말하는 중이면 반드시 또렷하다.
 *  - 힘든 이야기를 하는 중에는 절대 사라지지 않는다. 그때 필요한 건 곁에 있는 것이다.
 */
export function dissolveLevel(o: {
  activity: FishActivity;
  roomDark: boolean;
  /** 마지막 상호작용 이후 흐른 시간(ms) */
  idleMs: number;
  /** 지금 무거운 이야기 중인가 */
  serious: boolean;
}): number {
  if (o.serious) return 0;
  if (!o.roomDark) return 0;

  switch (o.activity) {
    case "speaking":
    case "listening":
    case "approaching":
    case "eating":
      return 0;
    case "sleeping":
      // 자는 동안에는 어스름하게 잠겨 있다
      return 0.34;
    default:
      break;
  }

  // 가만히 두면 서서히 물에 잠긴다. 35초쯤부터 옅어지기 시작해 100초가 지나면 거의 사라진다.
  if (o.idleMs < IDLE_BEFORE_FADE_MS) return 0;
  const t = Math.min(1, (o.idleMs - IDLE_BEFORE_FADE_MS) / FADE_SPAN_MS);
  // 완전히 0 으로 두지 않는다 — 체셔 고양이의 미소처럼 자국이 남는다
  return t * 0.94;
}

/** 가만히 둔 지 이만큼이 지나면 물에 잠기기 시작한다 */
export const IDLE_BEFORE_FADE_MS = 35_000;
/** 다 잠기기까지 걸리는 시간 */
export const FADE_SPAN_MS = 70_000;

/** 체셔다운 뜸 — 말하기 전의 한 박자 */
export const CHESHIRE_BEAT_MS = 520;

/**
 * 말풍선이 머무는 시간. 이 뒤에는 말도 물에 풀리듯 걷히고 아래 기록으로 내려간다.
 * 말풍선이 계속 떠 있으면 물고기가 사라질 틈이 없다.
 */
export const SAYING_LINGER_MS = 28_000;
