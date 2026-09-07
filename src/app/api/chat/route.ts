import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, chatEffort, FALLBACK_BETA, hasCredentials, MODEL } from "@/lib/anthropic";
import { ChatRequestSchema } from "@/lib/api-schema";
import { buildStablePrefix, buildTurnContext } from "@/lib/psych/prompt";
import { selectTechniques } from "@/lib/psych/frameworks";
import { assessConversation } from "@/lib/psych/safety";
import { detectStuck } from "@/lib/psych/stuck";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasCredentials()) {
    return NextResponse.json(
      {
        error: "no_credentials",
        message:
          "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 에 키를 넣고 서버를 다시 시작해 주세요.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_request", detail: parsed.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  const r = parsed.data;
  const userTurns = r.history.filter((h) => h.role === "user");
  const lastUser = userTurns.at(-1)?.text ?? "";

  // ── 안전 게이트: 모델보다 먼저, 규칙으로 ──
  const risk = assessConversation(userTurns.map((u) => u.text));

  // ── 대화가 맴돌고 있는가 ──
  const asMessages: ChatMessage[] = r.history.map((h, i) => ({
    id: String(i),
    role: h.role,
    text: h.text,
    at: 0,
  }));
  const stuck = detectStuck(asMessages);

  // ── 이번 턴에 쓸 기법 ──
  const techniques = selectTechniques({
    traits: r.profile.traits,
    rapport: r.bond.rapport,
    recentUserText: lastUser,
    recentlyUsed: r.recentlyUsed,
    stuck: stuck.kind !== "none",
    turn: userTurns.length,
  });

  const stablePrefix = buildStablePrefix(r.design, r.profile.nickname);
  const turnContext = buildTurnContext({
    design: r.design,
    profile: r.profile,
    care: r.care,
    bond: r.bond,
    notes: r.notes,
    digests: r.digests,
    techniques,
    risk,
    awake: r.awake,
    timeLabel: r.timeLabel,
    clock: r.clock,
    daysSinceLastVisit: r.daysSinceLastVisit,
    stuckDirective: stuck.directive,
    turn: userTurns.length,
  });

  const messages: Anthropic.Beta.BetaMessageParam[] = r.history.map((h) => ({
    role: h.role === "user" ? ("user" as const) : ("assistant" as const),
    content: h.text,
  }));

  // 첫 인사는 사용자 발화 없이 시작하므로 마중물 한 줄을 넣는다
  if (r.greeting || messages.length === 0 || messages[0].role !== "user") {
    messages.unshift({
      role: "user",
      content:
        "(사용자가 방에 들어와 어항 앞에 앉았다. 아직 아무 말도 하지 않았다. 네가 먼저 짧게 인사를 건네라.)",
    });
  }

  const client = anthropic();

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort: chatEffort() },
      system: [
        // 캐시 대상: 헌장 + 물고기 정체성. 매 요청 바이트가 같아야 한다.
        { type: "text", text: stablePrefix, cache_control: { type: "ephemeral" } },
        // 매 턴 바뀌는 상태
        { type: "text", text: turnContext },
      ],
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === "refusal") {
            controller.enqueue(
              encoder.encode(
                "\n\n*지느러미를 천천히 접는다* …이 이야기는 내가 받아내기가 어렵네. 미안해. 다른 이야기라면 얼마든지 들을게."
              )
            );
          }
        } catch (err) {
          console.error("[chat] stream error", err);
          controller.enqueue(
            encoder.encode("\n\n*물살이 잠시 흔들린다* …잠깐 말이 끊겼어. 다시 말해줄래?")
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Risk-Level": risk.level,
        "X-Risk-Domains": risk.domains.join(","),
        "X-Technique": techniques[0]?.id ?? "",
        "X-Stuck": stuck.kind,
      },
    });
  } catch (err) {
    console.error("[chat] request failed", err);
    const status =
      typeof err === "object" && err && "status" in err
        ? Number((err as { status: unknown }).status)
        : 500;
    return NextResponse.json(
      {
        error: "upstream",
        message:
          status === 429
            ? "요청이 몰렸어요. 잠시 뒤에 다시 말을 걸어 주세요."
            : "물고기에게 말이 닿지 않았어요. 잠시 뒤 다시 시도해 주세요.",
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
