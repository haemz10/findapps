import type { TraitScores, TraitKey } from "@/lib/types";

/**
 * 성향 파악 문항.
 *
 * 진단이 아니다. 확립된 심리학 구성개념(5요인 모형의 외향성·정서적 동요,
 * ULS 계열의 외로움, 자기비판/자기자비, 지지 선호 유형)을 아주 짧게 축약해
 * "이 사람에게 어떤 말투가 편할까"를 정하는 데만 쓴다.
 *
 * 각 문항은 하나의 축에 가중치를 실어 준다. 역채점 문항은 weight가 음수다.
 */

export interface QuizOption {
  label: string;
  /** -2 ~ +2 */
  value: number;
}

export interface QuizItem {
  id: string;
  /** 화면에 보이는 질문 */
  question: string;
  /** 물고기가 곁들이는 짧은 말 */
  aside?: string;
  options: QuizOption[];
  /** 이 문항이 기여하는 축들 */
  weights: Partial<Record<TraitKey, number>>;
}

const AGREE_5: QuizOption[] = [
  { label: "전혀 아니에요", value: -2 },
  { label: "별로 아니에요", value: -1 },
  { label: "그때그때 달라요", value: 0 },
  { label: "조금 그래요", value: 1 },
  { label: "많이 그래요", value: 2 },
];

export const QUIZ: QuizItem[] = [
  {
    id: "direct_feedback",
    question: "힘든 일을 털어놨을 때, 상대가 돌려 말하지 않고 솔직하게 짚어주는 편이 낫다.",
    aside: "물살을 돌아갈지, 가로지를지의 이야기예요.",
    options: AGREE_5,
    weights: { directness: 1 },
  },
  {
    id: "soft_landing",
    question: "누가 내 이야기에 바로 조언부터 하면 마음이 닫힌다.",
    options: AGREE_5,
    weights: { directness: -0.6, solutionSeeking: -1 },
  },
  {
    id: "want_solution",
    question: "고민을 말할 때 나는 사실 '어떻게 하면 좋을지'를 듣고 싶다.",
    options: AGREE_5,
    weights: { solutionSeeking: 1 },
  },
  {
    id: "just_listen",
    question: "그냥 들어주기만 해도 마음이 풀릴 때가 많다.",
    options: AGREE_5,
    weights: { solutionSeeking: -1 },
  },
  {
    id: "name_feelings",
    question: "내가 지금 무슨 감정인지 스스로 알아차리고 말로 옮길 수 있다.",
    aside: "물속에서는 자기 색을 보기가 어렵죠.",
    options: AGREE_5,
    weights: { emotionalClarity: 1 },
  },
  {
    id: "fog",
    question: "기분이 안 좋은데 왜 그런지 모르겠는 날이 잦다.",
    options: AGREE_5,
    weights: { emotionalClarity: -1 },
  },
  {
    id: "social_energy",
    question: "사람들과 어울리고 나면 기운이 차오르는 쪽이다.",
    options: AGREE_5,
    weights: { extraversion: 1 },
  },
  {
    id: "recharge_alone",
    question: "혼자 있는 시간이 있어야 겨우 숨이 쉬어진다.",
    options: AGREE_5,
    weights: { extraversion: -1 },
  },
  {
    id: "mood_swing",
    question: "작은 일에도 마음이 크게 흔들린다.",
    options: AGREE_5,
    weights: { volatility: 1 },
  },
  {
    id: "self_blame",
    question: "일이 잘못되면 우선 내 탓부터 한다.",
    aside: "스스로에게 제일 차가운 사람들이 있어요.",
    options: AGREE_5,
    weights: { selfCriticism: 1 },
  },
  {
    id: "self_kind",
    question: "실수했을 때 나 자신에게도 친구에게 하듯 말해줄 수 있다.",
    options: AGREE_5,
    weights: { selfCriticism: -1 },
  },
  {
    id: "closeness",
    question: "누군가 가까이 다가오면 부담스럽기보다 반갑다.",
    options: AGREE_5,
    weights: { closenessComfort: 1 },
  },
  {
    id: "guarded",
    question: "속마음을 꺼내 보이는 건 아무래도 위험하게 느껴진다.",
    options: AGREE_5,
    weights: { closenessComfort: -1 },
  },
  {
    id: "pace_fast",
    question: "대화는 여백 없이 빠르게 이어지는 쪽이 편하다.",
    options: AGREE_5,
    weights: { pace: 1 },
  },
  {
    id: "uls_company",
    question: "요즘, 함께 있어 줄 사람이 없다고 느낀다.",
    aside: "이건 부끄러운 대답이 아니에요.",
    options: AGREE_5,
    weights: { loneliness: 1 },
  },
  {
    id: "uls_left_out",
    question: "요즘, 사람들 사이에서 겉도는 기분이 든다.",
    options: AGREE_5,
    weights: { loneliness: 1 },
  },
  {
    id: "uls_understood",
    question: "요즘, 나를 정말로 이해해 주는 사람이 있다.",
    options: AGREE_5,
    weights: { loneliness: -1 },
  },
];

/** 사용자가 직접 조정하는 마무리 선택 (퀴즈보다 우선) */
export const TONE_CHOICES = [
  {
    key: "soft" as const,
    label: "부드럽게",
    desc: "천천히, 먼저 마음부터 받아줘요",
  },
  {
    key: "balanced" as const,
    label: "균형 있게",
    desc: "들어주다가, 필요할 땐 짚어줘요",
  },
  {
    key: "direct" as const,
    label: "솔직하게",
    desc: "돌려 말하지 않고 바로 이야기해요",
  },
];

const DEFAULT_TRAITS: TraitScores = {
  directness: 50,
  solutionSeeking: 50,
  emotionalClarity: 50,
  extraversion: 50,
  volatility: 50,
  selfCriticism: 50,
  closenessComfort: 50,
  pace: 50,
  loneliness: 50,
};

/**
 * 응답 → 0~100 점수.
 * 각 축마다 (실제 가중합) / (가능한 최대 가중합) 을 -1~1 로 정규화한 뒤 50±50 으로 옮긴다.
 * 응답하지 않은 축은 50(중립)으로 남는다.
 */
export function scoreQuiz(answers: Record<string, number>): TraitScores {
  const sum: Partial<Record<TraitKey, number>> = {};
  const max: Partial<Record<TraitKey, number>> = {};

  for (const item of QUIZ) {
    const raw = answers[item.id];
    if (typeof raw !== "number") continue;
    for (const [k, w] of Object.entries(item.weights) as [TraitKey, number][]) {
      sum[k] = (sum[k] ?? 0) + raw * w;
      max[k] = (max[k] ?? 0) + 2 * Math.abs(w);
    }
  }

  const out = { ...DEFAULT_TRAITS };
  for (const key of Object.keys(DEFAULT_TRAITS) as TraitKey[]) {
    const m = max[key];
    if (!m) continue;
    const norm = (sum[key] ?? 0) / m; // -1 ~ 1
    out[key] = Math.round(Math.min(100, Math.max(0, 50 + norm * 50)));
  }
  return out;
}

export function isQuizComplete(answers: Record<string, number>): boolean {
  return QUIZ.every((q) => typeof answers[q.id] === "number");
}
