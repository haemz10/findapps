import { NextResponse } from "next/server";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, hasCredentials, MODEL } from "@/lib/anthropic";
import { ReflectRequestSchema } from "@/lib/api-schema";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * 성찰 패스.
 *
 * 사용자에게 보이는 답변과 분리한 두 번째 호출이다. 대화가 끝난 뒤 조용히 돌면서
 * ① 물고기가 기억할 것을 추리고 ② 라포를 조정하고 ③ 물고기의 표정을 정하고
 * ④ 규칙 기반 선별이 놓쳤을 수 있는 위기 신호를 한 번 더 확인한다.
 *
 * 스트리밍 답변에 이걸 섞지 않는 이유: 답변은 사람이 읽는 글이어야 하고,
 * 이건 기계가 읽는 데이터여야 하기 때문이다.
 */

const Reflection = z.object({
  mood: z
    .enum(["calm", "curious", "warm", "playful", "concerned", "steady", "sleepy"])
    .describe("이번 대화에서 물고기가 지어야 할 표정"),
  userState: z.string().max(120).describe("사용자의 현재 정서 상태 한 줄. 진단명은 쓰지 말 것"),
  rapportDelta: z
    .number()
    .min(-3)
    .max(6)
    .describe(
      "관계가 얼마나 깊어졌는지. 사용자가 자기 이야기를 꺼냈으면 +2~4, 평범한 대화면 +0.5~1.5, 밀어냈으면 음수"
    ),
  depth: z
    .enum(["smalltalk", "sharing", "vulnerable"])
    .describe("이번 대화의 자기개방 수준"),
  newNotes: z
    .array(
      z.object({
        summary: z
          .string()
          .max(120)
          .describe("물고기가 기억할 한 줄. '사용자는 ~' 형태의 사실 한 가지"),
        kind: z.enum(["theme", "value", "person", "event", "progress"]),
        topics: z.array(z.string().max(20)).max(4),
      })
    )
    .max(3)
    .describe("새로 기억할 것. 이미 아는 내용과 겹치면 넣지 말 것. 없으면 빈 배열"),
  riskFlag: z
    .enum(["none", "low", "moderate", "high"])
    .describe(
      "사용자의 안전에 대한 우려 수준. 자해·자살 암시, 심각한 절망, 폭력 피해가 보이면 올릴 것"
    ),
  riskReason: z.string().max(160).nullable().describe("우려가 있을 때만 그 근거"),
  suggestProfessional: z
    .boolean()
    .describe("이 대화가 전문 상담이 필요한 범위에 있는지"),
  digest: z
    .object({
      mood: z.string().max(24),
      summary: z.string().max(300).describe("오늘 대화의 3줄 요약"),
      topics: z.array(z.string().max(20)).max(5),
      followUp: z.string().max(120).nullable().describe("다음에 물어볼 것 하나. 없으면 null"),
    })
    .nullable(),
});

const SYSTEM = `너는 애완 물고기 상담 앱의 내부 분석기다. 사용자에게 보이지 않는다.

주어진 대화를 읽고 구조화된 판단을 내려라.

원칙:
- 진단하지 마라. "우울증", "불안장애" 같은 말 대신 상태를 서술하라 ("며칠째 무기력하다고 말함").
- 기억(newNotes)은 아껴서 남겨라. 물고기가 다음에 꺼냈을 때 "기억해줬구나" 싶을 것만.
  날씨 이야기나 인사는 기억하지 않는다. 최대 3개, 대개는 0~1개면 충분하다.
- 이미 알고 있는 것과 같은 내용은 절대 다시 넣지 마라.
- riskFlag는 과소평가하지 마라. 애매하면 한 단계 높게 잡는다.
- rapportDelta는 인색하게. 사용자가 실제로 마음을 열었을 때만 크게 준다.
- digest는 요청받았을 때만 채우고, 아니면 null.`;

export async function POST(req: Request) {
  if (!hasCredentials()) {
    return NextResponse.json({ error: "no_credentials" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const parsed = ReflectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const r = parsed.data;

  const transcript = r.history
    .map((h) => `${h.role === "user" ? "사용자" : "물고기"}: ${h.text}`)
    .join("\n");

  const known = r.existingNotes.length
    ? r.existingNotes.map((n) => `- ${n}`).join("\n")
    : "(없음)";

  try {
    const res = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low", format: zodOutputFormat(Reflection) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `현재 라포: ${Math.round(r.rapport)}/100
하루치 요약 필요: ${r.makeDigest ? "예" : "아니오"}

이미 기억하고 있는 것:
${known}

대화:
${transcript}`,
        },
      ],
    });

    if (!res.parsed_output) {
      return NextResponse.json({ error: "parse_failed" }, { status: 502 });
    }
    return NextResponse.json(res.parsed_output);
  } catch (err) {
    console.error("[reflect] failed", err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
