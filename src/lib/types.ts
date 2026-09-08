/**
 * 달빛 어항 — 공용 타입 정의
 *
 * 이 앱의 데이터는 전부 사용자 기기(localStorage)에 남는다.
 * 서버로 가는 것은 응답을 만드는 데 필요한 대화 맥락뿐이다.
 */

/* ─────────────────────────  물고기 외형  ───────────────────────── */

export type BodyShape = "slender" | "round" | "teardrop" | "broad";
export type EyeShape = "round" | "almond" | "droopy" | "sparkle" | "sleepy";
export type MouthShape = "small" | "pout" | "smile" | "wide";
export type ScalePattern =
  | "plain"
  | "pearl"
  | "marble"
  | "net"
  | "speckle"
  | "iridescent";
export type FinStyle = "veil" | "crown" | "halfmoon" | "delta" | "feather";

export interface FishDesign {
  name: string;
  bodyShape: BodyShape;
  eyeShape: EyeShape;
  eyeColor: string;
  mouthShape: MouthShape;
  scalePattern: ScalePattern;
  finStyle: FinStyle;
  /** 몸통 그라디언트 (머리 → 꼬리) */
  bodyTop: string;
  bodyMid: string;
  bodyBottom: string;
  /** 지느러미 그라디언트 — 뿌리 → 중간 → 끝. 베타처럼 색이 번지게 하려면 셋이 필요하다. */
  finInner: string;
  /** 예전 저장 데이터에는 없을 수 있다 */
  finMid?: string;
  finOuter: string;
  /** 0.8 ~ 1.35 */
  size: number;
  /** 지느러미가 흔들리는 폭 0.6 ~ 1.4 */
  finFlow: number;
  /** 발광 정도 0 ~ 1 */
  glow: number;
}

/* ─────────────────────────  성향 프로필  ───────────────────────── */

/**
 * 각 축은 0~100. 심리학의 확립된 구성개념을 짧게 축약한 것으로,
 * 진단 도구가 아니라 "말투를 맞추기 위한" 대화 설정값이다.
 */
export interface TraitScores {
  /** 직설적 ↔ 완곡한 (100 = 매우 직설적인 피드백 선호) */
  directness: number;
  /** 지금 필요한 것: 공감(0) ↔ 해결(100) */
  solutionSeeking: number;
  /** 감정을 알아차리고 말로 옮기는 정도 */
  emotionalClarity: number;
  /** 사회적 에너지 (외향성) */
  extraversion: number;
  /** 정서적 동요 폭 (신경증 경향) */
  volatility: number;
  /** 자기비판 강도 */
  selfCriticism: number;
  /** 가까워지는 것에 대한 편안함 (100 = 매우 편안) */
  closenessComfort: number;
  /** 대화 속도 선호 (100 = 빠르고 밀도 높게) */
  pace: number;
  /** 외로움 지표 (ULS 계열 3문항 축약) */
  loneliness: number;
}

export type TraitKey = keyof TraitScores;

export interface UserProfile {
  nickname: string;
  createdAt: number;
  traits: TraitScores;
  /** 퀴즈 원본 응답 (재계산/재설정용) */
  answers: Record<string, number>;
  /** 사용자가 직접 고른 것 — 퀴즈보다 우선한다 */
  overrides: {
    directness?: "soft" | "balanced" | "direct";
    wantsAdvice?: boolean;
  };
}

/* ─────────────────────────  돌봄 상태  ───────────────────────── */

export interface CareState {
  /** 100 = 배부름 */
  fullness: number;
  /** 100 = 물이 맑음 */
  waterClarity: number;
  /** 마지막 먹이 시각 */
  lastFedAt: number;
  /** 마지막 물갈이 시각 */
  lastWaterChangeAt: number;
  /** 상태 감소 계산의 기준 시각 */
  lastTickAt: number;
}

/* ─────────────────────────  관계  ───────────────────────── */

export interface Bond {
  /** 0~100 라포 */
  rapport: number;
  /** 총 방문 일수 */
  visitDays: number;
  /** 연속 방문 일수 */
  streak: number;
  /** 마지막 방문 날짜 (YYYY-MM-DD, 로컬) */
  lastVisitDate: string | null;
  /** 총 주고받은 대화 수 */
  exchanges: number;
}

export interface RapportStage {
  min: number;
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  desc: string;
}

export const RAPPORT_STAGES: RapportStage[] = [
  { min: 0, level: 1, label: "낯선 사이", desc: "아직 유리 너머에서 지켜보는 중" },
  { min: 15, level: 2, label: "익숙한 얼굴", desc: "가까이 다가오기 시작했다" },
  { min: 35, level: 3, label: "이야기 친구", desc: "먼저 말을 걸어온다" },
  { min: 60, level: 4, label: "마음의 친구", desc: "깊은 이야기를 나눌 수 있다" },
  { min: 85, level: 5, label: "가장 조용한 신뢰", desc: "말하지 않아도 알아차린다" },
];

export function rapportStage(rapport: number): RapportStage {
  let stage = RAPPORT_STAGES[0];
  for (const s of RAPPORT_STAGES) if (rapport >= s.min) stage = s;
  return stage;
}

/* ─────────────────────────  대화  ───────────────────────── */

export type Role = "user" | "fish";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  at: number;
  /** 이 메시지가 위기 대응으로 전환된 턴인지 */
  safety?: RiskLevel;
  /** 물고기가 이 턴에 쓴 기법 (성찰 패스가 채운다) */
  technique?: string;
}

/* ─────────────────────────  안전  ───────────────────────── */

export type RiskLevel = "none" | "low" | "moderate" | "high";

export type RiskDomain =
  | "self_harm"
  | "hopelessness"
  | "harm_to_others"
  | "abuse"
  | "substance"
  | "psychosis"
  | "eating"
  | "minor_crisis";

export interface RiskAssessment {
  level: RiskLevel;
  domains: RiskDomain[];
  /** 판단 근거가 된 표현 (UI에는 노출하지 않음, 디버그용) */
  matched: string[];
}

/* ─────────────────────────  기억  ───────────────────────── */

export interface MemoryNote {
  id: string;
  at: number;
  /** 한 줄 요약 */
  summary: string;
  /** 주제 태그 */
  topics: string[];
  /** 사용자가 소중히 여기는 것 / 반복되는 패턴 */
  kind: "theme" | "value" | "person" | "event" | "progress";
}

export interface SessionDigest {
  id: string;
  date: string;
  at: number;
  mood: string;
  summary: string;
  topics: string[];
  /** 다음에 물어볼 것 하나 */
  followUp: string | null;
}

/* ─────────────────────────  물고기 행동  ───────────────────────── */

export type FishActivity =
  | "sleeping"
  | "waking"
  | "drifting"
  | "approaching"
  | "listening"
  | "speaking"
  | "eating"
  | "playing"
  | "retreating"
  | "sulking";

export type FishCue =
  | "calm"
  | "curious"
  | "warm"
  | "playful"
  | "concerned"
  | "steady"
  | "sleepy";

/* ─────────────────────────  시간대  ───────────────────────── */

export type DayPhase = "dawn" | "morning" | "afternoon" | "dusk" | "night" | "deepNight";
