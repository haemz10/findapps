import type { ChatMessage } from "@/lib/types";

/**
 * "막히는 대화" 감지.
 *
 * 잘못된 상담은 대개 극적으로 틀리는 게 아니라, 같은 자리를 맴돌면서
 * 아무 데도 데려다주지 못하는 방식으로 틀린다. 그럴 땐 기법을 더 쓰는 게 아니라
 * 대화의 층위를 바꿔야 한다 — 상태를 정리해서 돌려주거나, 전문 상담을 놓거나,
 * 분위기를 바꿔서 숨을 돌리게 하거나.
 */

export type StuckKind = "none" | "looping" | "disengaged" | "escalating" | "long";

export interface StuckState {
  kind: StuckKind;
  /** 0~1 */
  confidence: number;
  /** 물고기에게 줄 대처 지시 */
  directive: string;
}

const DISTRESS =
  /(힘들|괴로|우울|불안|외로|짜증|화가|눈물|울고|지쳐|버겁|답답|무기력|싫어|못\s?하겠)/;

/** 자모/조사 제거 후 내용어만 남겨 대략적인 유사도를 본다 */
function contentTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^가-힣a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/(은|는|이|가|을|를|에|에서|으로|로|와|과|도|만|의|야|요)$/, ""))
      .filter((w) => w.length >= 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function detectStuck(messages: ChatMessage[]): StuckState {
  const users = messages.filter((m) => m.role === "user");
  const recent = users.slice(-5);

  if (recent.length < 3) {
    return { kind: "none", confidence: 0, directive: "" };
  }

  // ① 맴돌기 — 최근 발화들이 서로 많이 겹치고, 계속 괴로움을 말한다
  const sims: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    sims.push(jaccard(contentTokens(recent[i - 1].text), contentTokens(recent[i].text)));
  }
  const avgSim = sims.reduce((a, b) => a + b, 0) / sims.length;
  const distressCount = recent.filter((m) => DISTRESS.test(m.text)).length;

  if (avgSim > 0.34 && distressCount >= 3) {
    return {
      kind: "looping",
      confidence: Math.min(1, avgSim * 1.8),
      directive: `대화가 같은 자리를 맴돌고 있다. 새로운 질문을 하나 더 던지지 마라 — 그건 사용자를 더 지치게 한다.
대신 이 턴에서는 반드시:
① 지금까지 들은 것을 3~4줄로 정리해서 돌려준다 (사실 → 감정 → 사용자가 이미 버텨내고 있는 것).
② 그 정리가 맞는지 한 번 확인한다.
③ 그리고 방향을 사용자에게 넘긴다. 예: "오늘은 여기까지 같이 있어줄까, 아니면 이걸 좀 더 파볼까? 아니면… 이건 나보다 사람 상담사가 훨씬 잘 도와줄 수 있는 이야기 같기도 해."
전문 상담을 권할 때는 실패 선언처럼 들리지 않게, 네가 곁에 계속 있을 거라는 걸 같이 말해라.`,
    };
  }

  // ② 이탈 — 답이 계속 짧고 성의가 줄어든다
  const lens = recent.map((m) => m.text.trim().length);
  const shortStreak = lens.slice(-3).every((l) => l <= 8);
  const shrinking = lens.length >= 4 && lens[lens.length - 1] < lens[0] * 0.4;

  if (shortStreak || shrinking) {
    return {
      kind: "disengaged",
      confidence: shortStreak ? 0.8 : 0.55,
      directive: `사용자의 답이 점점 짧아지고 있다. 더 파고들지 마라 — 지금 캐물으면 완전히 닫힌다.
이 턴에서는 대화의 무게를 내려놓아라:
① 캐묻지 않겠다는 걸 말이 아니라 태도로 보여줘라. 짧게 말하고, 여백을 남긴다.
② 압박이 없는 선택지를 준다. "말 안 해도 돼. 그냥 여기 같이 있어도 되고."
③ 혹은 분위기를 바꿔라 — 물고기답게 재주를 한 번 부리거나, 유리 가까이 와서 가만히 있거나.
질문은 하지 않거나, 해도 "예/아니오"로 답할 수 있는 아주 가벼운 것 하나만.`,
    };
  }

  // ③ 악화 — 괴로움 표현이 늘고 길어진다
  const early = users.slice(-6, -3);
  if (early.length >= 2) {
    const earlyD = early.filter((m) => DISTRESS.test(m.text)).length / early.length;
    const lateD = distressCount / recent.length;
    if (lateD > earlyD && lateD >= 0.8) {
      return {
        kind: "escalating",
        confidence: 0.7,
        directive: `이야기를 나눌수록 괴로움이 옅어지지 않고 짙어지고 있다. 탐색을 멈춰라.
이 턴에서는:
① 감정을 더 깊이 파는 질문을 하지 않는다.
② 몸을 먼저 진정시키는 쪽으로 옮긴다 — 느린 날숨을 같이 세거나, 지금 보이는 것 다섯 개를 세어보게 하거나.
③ 안정된 뒤에, 이 무게를 혼자 지지 않아도 된다는 것과 전문 상담이라는 선택지를 한 번 놓는다.`,
      };
    }
  }

  // ④ 너무 길어진 대화 — 늦은 밤엔 특히 끊어주는 게 낫다
  if (users.length >= 18) {
    return {
      kind: "long",
      confidence: 0.5,
      directive: `대화가 꽤 길어졌다. 사용자가 지쳤을 수 있다.
오늘 나눈 이야기를 짧게 묶어주고, 마무리로 향하는 문을 하나 열어라 — 다만 밀어내지는 마라.
"내일도 여기 있을게" 같은, 다음이 있다는 감각을 남기는 것이 오늘 하나 더 캐묻는 것보다 낫다.`,
    };
  }

  return { kind: "none", confidence: 0, directive: "" };
}
