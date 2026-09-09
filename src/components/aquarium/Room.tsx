"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bowl } from "./Bowl";
import { TopBar } from "@/components/ui/TopBar";
import { CareBar } from "@/components/ui/CareBar";
import { ChatDock } from "@/components/ui/ChatDock";
import { JournalSheet } from "@/components/ui/JournalSheet";
import { useApp } from "@/lib/store";
import { ambienceFor, defaultRoomLight, fishAwake, phaseOf } from "@/lib/daynight";
import {
  CHESHIRE_BEAT_MS,
  SAYING_LINGER_MS,
  decideActivity,
  dissolveLevel,
} from "@/lib/fish/behavior";
import { moodOf } from "@/lib/care";
import { assessRisk } from "@/lib/psych/safety";
import type { FishCue, RiskDomain } from "@/lib/types";
import { ambience } from "@/lib/audio/ambience";

/** 사용자가 보낼 때 바로 반영할 수 있는 표정 추정 — 성찰 응답이 오기 전까지의 임시값 */
function quickCue(text: string): FishCue {
  if (/(힘들|우울|괴로|외로|슬프|눈물|죽|불안|무섭)/.test(text)) return "concerned";
  if (/(좋았|기뻐|행복|다행|웃|성공|고마워|재밌)/.test(text)) return "playful";
  if (/\?|어떻게|왜|뭐야|뭘까/.test(text)) return "curious";
  return "calm";
}

export function Room() {
  const s = useApp();
  const {
    fish,
    profile,
    care,
    bond,
    notes,
    digests,
    messages,
    cue,
    roomLightOn,
    lightTouched,
    pendingFood,
    busy,
    showCrisis,
    lastRisk,
    soundOn,
    usedTechniques,
  } = s;

  const [time, setTime] = useState(() => phaseOf());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [crisisDomains, setCrisisDomains] = useState<RiskDomain[]>([]);
  const [error, setError] = useState<string | null>(null);
  // 물고기가 "지금 말하고 있는" 메시지. 얼굴 말풍선으로 나가고, 아래 기록에서는 빠진다.
  const [sayingId, setSayingId] = useState<string | null>(null);
  // 마지막으로 사용자가 움직인 시각 — 가만히 두면 물고기가 물에 잠긴다
  const [lastTouch, setLastTouch] = useState(() => Date.now());
  const [idleMs, setIdleMs] = useState(0);
  const greetedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const awake = fishAwake(time, roomLightOn);
  const sayingMessage = sayingId ? messages.find((m) => m.id === sayingId) : undefined;
  // 얼굴에서 말하는 중인 줄은 아래 기록에 겹쳐 보이지 않게 뺀다
  const logMessages = sayingId ? messages.filter((m) => m.id !== sayingId) : messages;
  const mood = moodOf(care, bond.rapport);
  const amb = useMemo(() => ambienceFor(time.phase, roomLightOn), [time.phase, roomLightOn]);

  /* ── 시계 ── */
  useEffect(() => {
    const id = window.setInterval(() => setTime(phaseOf()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  /* ── 첫 진입: 시간대에 맞춰 조명, 방문 기록, 돌봄 상태 갱신 ── */
  useEffect(() => {
    s.tick();
    s.registerVisit();
    if (!lightTouched) s.setRoomLight(defaultRoomLight(phaseOf()));
    // 최초 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 돌봄 상태는 실제 시간을 따라 천천히 줄어든다 ── */
  useEffect(() => {
    const id = window.setInterval(() => s.tick(), 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 방 분위기를 CSS 변수로 ── */
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--room-top", amb.roomTop);
    r.setProperty("--room-bottom", amb.roomBottom);
    r.setProperty("--water-top", amb.waterTop);
    r.setProperty("--water-bottom", amb.waterBottom);
    r.setProperty("--tank-light", String(amb.tankLight));
    r.setProperty("--darkness", String(amb.darkness));
  }, [amb]);

  /* ── 소리 ── */
  useEffect(() => {
    const a = ambience();
    if (soundOn) a.start(0.55).catch(() => {});
    else a.stop();
    return () => {
      // 페이지를 떠날 때만 멈춘다
    };
  }, [soundOn]);

  useEffect(() => () => ambience().stop(), []);

  /* ── 물고기가 먼저 인사한다 ── */
  useEffect(() => {
    if (greetedRef.current || !awake || messages.length > 0) return;
    greetedRef.current = true;
    void send(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awake]);

  /* ── 가만히 있는 시간을 센다 ── */
  useEffect(() => {
    const id = window.setInterval(() => setIdleMs(Date.now() - lastTouch), 2000);
    return () => window.clearInterval(id);
  }, [lastTouch]);

  useEffect(() => {
    if (typing || busy || streamingId) {
      setLastTouch(Date.now());
      setIdleMs(0);
    }
  }, [typing, busy, streamingId]);

  /* ── 말도 물에 풀린다 ── 한참 두면 말풍선이 걷히고 아래 기록으로 내려간다 */
  useEffect(() => {
    if (!sayingId || streamingId || busy) return;
    const id = window.setTimeout(() => setSayingId(null), SAYING_LINGER_MS);
    return () => window.clearTimeout(id);
  }, [sayingId, streamingId, busy]);

  /* ── 활동 결정 ── */
  const activity = decideActivity({
    awake,
    hasFood: pendingFood > 0,
    speaking: streamingId !== null,
    userTyping: typing,
    waiting: busy || sayingId !== null,
    clarity: care.waterClarity,
    fullness: care.fullness,
  });

  // 무거운 이야기 중이면 절대 사라지지 않는다 — 그때 필요한 건 곁에 있는 것이다
  const dissolve = dissolveLevel({
    activity,
    roomDark: !roomLightOn,
    idleMs,
    serious: lastRisk !== "none" || showCrisis,
  });

  useEffect(() => {
    s.setActivity(activity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity]);

  /* ─────────────────  대화  ───────────────── */

  const send = useCallback(
    async (text: string | null) => {
      if (busy) return;
      setError(null);

      const greeting = text === null;

      // 자고 있는데 말을 걸면, 방의 불을 낮춰 깨운다.
      // 여기서 막아버리면 "말하고 싶은데 못 하는" 상태가 되어버린다.
      if (!awake && !greeting) {
        s.setRoomLight(false);
      }
      if (!greeting) {
        setSayingId(null);
        s.addMessage({ role: "user", text });
        s.setCue(quickCue(text));

        // 규칙 기반 위기 선별은 서버 응답을 기다리지 않고 바로 UI에 반영한다
        const local = assessRisk(text);
        if (local.level === "high" || local.level === "moderate") {
          setCrisisDomains(local.domains);
          if (local.level === "high") s.setShowCrisis(true);
        }
      }

      // 체셔다운 뜸. 사람이라면 못 견딜 반 박자가, 물고기에게는 신비로움이 된다.
      // 위기 상황에서는 뜸을 들이지 않는다 — 그때의 침묵은 신비가 아니라 방치다.
      if (!greeting && assessRisk(text).level === "none") {
        await new Promise((r) => setTimeout(r, CHESHIRE_BEAT_MS));
      }

      s.setBusy(true);

      const history = [
        ...useApp.getState().messages.map((m) => ({ role: m.role, text: m.text })),
      ];

      const now = new Date();
      const daysSince = bond.lastVisitDate
        ? Math.max(
            0,
            Math.round(
              (Date.parse(`${todayKey(now)}T00:00:00`) -
                Date.parse(`${bond.lastVisitDate}T00:00:00`)) /
                86400_000
            )
          )
        : null;

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      let fishId: string | null = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            fish,
            profile,
            care,
            bond,
            notes,
            digests,
            history,
            awake,
            clock: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
            timeLabel: time.label,
            daysSinceLastVisit: daysSince,
            recentlyUsed: usedTechniques,
            greeting,
          }),
        });

        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.message ?? "물고기에게 말이 닿지 않았어요.");
        }

        const level = res.headers.get("X-Risk-Level");
        const domains = (res.headers.get("X-Risk-Domains") ?? "")
          .split(",")
          .filter(Boolean) as RiskDomain[];
        if (domains.length) setCrisisDomains(domains);
        if (level === "high") s.setShowCrisis(true);

        fishId = s.addMessage({ role: "fish", text: "" });
        setStreamingId(fishId);
        setSayingId(fishId);

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          s.appendToMessage(fishId, dec.decode(value, { stream: true }));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "알 수 없는 문제가 생겼어요.";
        setError(msg);
        if (fishId) {
          const cur = useApp.getState().messages.find((m) => m.id === fishId);
          if (cur && !cur.text) {
            s.patchMessage(fishId, {
              text: "*물살이 흐려진다* …지금은 말이 잘 안 나오네. 잠시 뒤에 다시 불러줄래?",
            });
          }
        }
      } finally {
        setStreamingId(null);
        s.setBusy(false);
        abortRef.current = null;
      }

      // 답변이 끝난 뒤 조용히 성찰
      if (!greeting) void reflect();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, fish, profile, care, bond, notes, digests, awake, time.label, usedTechniques]
  );

  const reflect = useCallback(async () => {
    const st = useApp.getState();
    const history = st.messages.slice(-12).map((m) => ({ role: m.role, text: m.text }));
    if (history.length < 2) return;

    try {
      const res = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          traits: st.profile.traits,
          rapport: st.bond.rapport,
          existingNotes: st.notes.map((n) => n.summary),
          makeDigest: st.messages.filter((m) => m.role === "user").length % 6 === 0,
        }),
      });
      if (!res.ok) return;

      const r = await res.json();
      st.applyReflection({
        rapportDelta: r.rapportDelta,
        notes: (r.newNotes ?? []).map(
          (n: { summary: string; kind: string; topics: string[] }) => ({
            summary: n.summary,
            kind: n.kind as "theme" | "value" | "person" | "event" | "progress",
            topics: n.topics ?? [],
          })
        ),
        digest: r.digest
          ? {
              mood: r.digest.mood,
              summary: r.digest.summary,
              topics: r.digest.topics ?? [],
              followUp: r.digest.followUp ?? null,
            }
          : undefined,
        cue: r.mood as FishCue,
        risk: r.riskFlag,
      });

      if (r.riskFlag === "high" || (r.riskFlag === "moderate" && r.suggestProfessional)) {
        useApp.getState().setShowCrisis(true);
      }
    } catch {
      // 성찰은 실패해도 대화에는 영향이 없다 — 조용히 넘어간다
    }
  }, []);

  /* ── 돌봄 ── */
  const handleFeed = () => {
    s.doFeed();
    if (soundOn) ambience().plop();
  };

  const handleWater = () => {
    s.doWaterChange();
    if (soundOn) ambience().pour();
  };

  /* ─────────────────  화면  ───────────────── */

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, var(--room-top), var(--room-bottom))`,
      }}
    >
      {/* 방 안의 어둠 — 수조 주변만 빛난다 */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-[1600ms]"
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% 34%, transparent 0%, rgba(0,0,0,${amb.darkness * 0.82}) 78%)`,
        }}
      />

      <div
        className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col px-4"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <TopBar
          fishName={fish.name}
          timeLabel={time.label}
          clock={`${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`}
          awake={awake}
          bond={bond}
          roomLightOn={roomLightOn}
          soundOn={soundOn}
          onToggleLight={() => s.setRoomLight(!roomLightOn)}
          onToggleSound={() => s.setSound(!soundOn)}
          onOpenJournal={() => setJournalOpen(true)}
        />

        {/* 어항 — 대화가 시작되면 조금 물러나 말풍선에 자리를 내준다 */}
        <div
          className={`relative mt-3 min-h-[104px] shrink transition-[height] duration-700 ease-out ${
            messages.length > 1 ? "h-[40dvh]" : "h-[50dvh]"
          }`}
        >
          {/* 수조에서 방으로 새어 나오는 빛 */}
          <div
            className="pointer-events-none absolute -inset-x-10 -bottom-14 -top-8 -z-10 transition-opacity duration-[1600ms]"
            style={{
              background: `radial-gradient(ellipse 62% 58% at 50% 50%, rgba(120,190,255,${(0.06 + amb.tankLight * 0.12).toFixed(3)}) 0%, transparent 70%)`,
              filter: "blur(22px)",
            }}
          />
          <Bowl
            activity={activity}
            cue={cue}
            clarity={care.waterClarity}
            tankLight={amb.tankLight}
            pendingFood={pendingFood}
            speaking={streamingId !== null}
            saying={sayingMessage?.text ?? ""}
            onDismissSaying={() => setSayingId(null)}
            onEatFood={s.consumeFood}
            dissolve={dissolve}
          />

          {!awake && (
            <button
              onClick={() => s.setRoomLight(false)}
              type="button"
              className="absolute inset-x-0 bottom-3 mx-auto min-h-[44px] w-fit rounded-full border
                         border-white/20 bg-black/65 px-5 text-[13px] text-ink-dim backdrop-blur
                         transition hover:border-white/30 hover:text-ink active:scale-95"
            >
              불을 끄고 {fish.name}를 깨우기
            </button>
          )}
        </div>

        <div className="mt-3 shrink-0">
          <CareBar care={care} awake={awake} onFeed={handleFeed} onWater={handleWater} />
        </div>

        {error && (
          <div className="mt-2 shrink-0 rounded-xl border border-amber-300/20 bg-amber-950/25 px-3.5 py-2 text-[12px] text-amber-100/80">
            {error}
          </div>
        )}

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <ChatDock
            fishName={fish.name}
            messages={logMessages}
            streamingId={streamingId}
            busy={busy}
            awake={awake}
            showCrisis={showCrisis}
            crisisDomains={crisisDomains}
            onCloseCrisis={() => s.setShowCrisis(false)}
            onSend={(t) => void send(t)}
            onTypingChange={setTyping}
            input={input}
            setInput={setInput}
          />
        </div>
      </div>

      {journalOpen && <JournalSheet onClose={() => setJournalOpen(false)} />}
    </div>
  );
}

function todayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
