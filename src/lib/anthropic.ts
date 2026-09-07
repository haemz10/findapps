import Anthropic from "@anthropic-ai/sdk";

/**
 * 서버 전용. 클라이언트 번들에 들어가면 안 된다.
 */

export const MODEL = process.env.FISH_MODEL ?? "claude-opus-5";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

const VALID_EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

export function chatEffort(): Effort {
  const e = process.env.FISH_EFFORT as Effort | undefined;
  return e && VALID_EFFORTS.includes(e) ? e : "medium";
}

/**
 * 자격 증명은 SDK가 환경에서 찾는다 (ANTHROPIC_API_KEY → ANTHROPIC_AUTH_TOKEN → ant 프로필).
 * 여기서 키를 하드코딩하지 않는다.
 */
let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function hasCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** 서버 폴백을 켠 채로 쓰기 위한 공통 베타 플래그 */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";
