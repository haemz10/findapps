import { z } from "zod";

/**
 * 클라이언트 → 서버로 넘어오는 페이로드의 형태.
 * 브라우저에서 오는 값은 전부 신뢰하지 않고 여기서 한 번 거른다.
 */

export const FishDesignSchema = z.object({
  name: z.string().max(24),
  bodyShape: z.enum(["slender", "round", "teardrop", "broad"]),
  eyeShape: z.enum(["round", "almond", "droopy", "sparkle", "sleepy"]),
  eyeColor: z.string().max(24),
  mouthShape: z.enum(["small", "pout", "smile", "wide"]),
  scalePattern: z.enum(["plain", "pearl", "marble", "net", "speckle", "iridescent"]),
  finStyle: z.enum(["veil", "crown", "halfmoon", "delta", "feather"]),
  bodyTop: z.string().max(24),
  bodyMid: z.string().max(24),
  bodyBottom: z.string().max(24),
  finInner: z.string().max(24),
  finOuter: z.string().max(24),
  size: z.number().min(0.5).max(2),
  finFlow: z.number().min(0.3).max(2),
  glow: z.number().min(0).max(1),
});

const Score = z.number().min(0).max(100);

export const TraitsSchema = z.object({
  directness: Score,
  solutionSeeking: Score,
  emotionalClarity: Score,
  extraversion: Score,
  volatility: Score,
  selfCriticism: Score,
  closenessComfort: Score,
  pace: Score,
  loneliness: Score,
});

export const ProfileSchema = z.object({
  nickname: z.string().max(24),
  createdAt: z.number(),
  traits: TraitsSchema,
  answers: z.record(z.string(), z.number()).default({}),
  overrides: z.object({
    directness: z.enum(["soft", "balanced", "direct"]).optional(),
    wantsAdvice: z.boolean().optional(),
  }),
});

export const CareSchema = z.object({
  fullness: Score,
  waterClarity: Score,
  lastFedAt: z.number(),
  lastWaterChangeAt: z.number(),
  lastTickAt: z.number(),
});

export const BondSchema = z.object({
  rapport: Score,
  visitDays: z.number(),
  streak: z.number(),
  lastVisitDate: z.string().nullable(),
  exchanges: z.number(),
});

export const NoteSchema = z.object({
  id: z.string(),
  at: z.number(),
  summary: z.string().max(300),
  topics: z.array(z.string().max(40)).max(8),
  kind: z.enum(["theme", "value", "person", "event", "progress"]),
});

export const DigestSchema = z.object({
  id: z.string(),
  date: z.string(),
  at: z.number(),
  mood: z.string().max(40),
  summary: z.string().max(500),
  topics: z.array(z.string().max(40)).max(8),
  followUp: z.string().max(200).nullable(),
});

export const TurnSchema = z.object({
  role: z.enum(["user", "fish"]),
  text: z.string().max(4000),
});

export const ChatRequestSchema = z.object({
  design: FishDesignSchema,
  profile: ProfileSchema,
  care: CareSchema,
  bond: BondSchema,
  notes: z.array(NoteSchema).max(80).default([]),
  digests: z.array(DigestSchema).max(40).default([]),
  /** 마지막 사용자 발화를 포함한 최근 대화 */
  history: z.array(TurnSchema).max(60),
  awake: z.boolean(),
  /** 사용자 로컬 시각 문자열 (예: "23:14") */
  clock: z.string().max(10),
  timeLabel: z.string().max(20),
  daysSinceLastVisit: z.number().nullable(),
  recentlyUsed: z.array(z.string().max(40)).max(10).default([]),
  /** 첫 인사 자동 생성 요청 */
  greeting: z.boolean().default(false),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ReflectRequestSchema = z.object({
  history: z.array(TurnSchema).max(30),
  traits: TraitsSchema,
  rapport: Score,
  existingNotes: z.array(z.string().max(300)).max(60).default([]),
  /** 대화를 마무리하며 하루치 요약도 함께 만들지 */
  makeDigest: z.boolean().default(false),
});

export type ReflectRequest = z.infer<typeof ReflectRequestSchema>;
