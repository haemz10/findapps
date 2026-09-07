"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tank } from "./Tank";
import { TopBar } from "@/components/ui/TopBar";
import { CareBar } from "@/components/ui/CareBar";
import { ChatDock } from "@/components/ui/ChatDock";
import { JournalSheet } from "@/components/ui/JournalSheet";
import { useApp } from "@/lib/store";
import { ambienceFor, defaultRoomLight, fishAwake, phaseOf } from "@/lib/daynight";
import { decideActivity } from "@/lib/fish/behavior";
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
    design,
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
  const greetedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const awake = fishAwake(time, roomLightOn);
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

  /* ── 활동 결정 ── */
  const activity = decideActivity({
    awake,
    hasFood: pendingFood > 0,
    speaking: streamingId !== null,
    userTyping: typing,
    waiting: busy,
    mood,
    clarity: care.waterClarity,
    fullness: care.fullness,
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
        s.addMessage({ role: "user", text });
        s.setCue(quickCue(text));

        // 규칙 기반 위기 선별은 서버 응답을 기다리지 않고 바로 UI에 반영한다
        const local = assessRisk(text);
        if (local.level === "high" || local.level === "moderate") {
          setCrisisDomains(local.domains);
          if (local.level === "high") s.setShowCrisis(true);
        }
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
            design,
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
    [busy, design, profile, care, bond, notes, digests, awake, time.label, usedTechniques]
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

      <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <TopBar
          fishName={design.name}
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

        {/* 어항 */}
        <div className="relative mt-3 h-[42dvh] min-h-[240px] shrink-0">
          {/* 수조에서 방으로 새어 나오는 빛 */}
          <div
            className="pointer-events-none absolute -inset-x-10 -bottom-14 -top-8 -z-10 transition-opacity duration-[1600ms]"
            style={{
              background: `radial-gradient(ellipse 62% 58% at 50% 50%, rgba(120,190,255,${(0.06 + amb.tankLight * 0.12).toFixed(3)}) 0%, transparent 70%)`,
              filter: "blur(22px)",
            }}
          />
          <Tank
            design={design}
            activity={activity}
            cue={cue}
            mood={mood}
            clarity={care.waterClarity}
            speaking={streamingId !== null}
            pendingFood={pendingFood}
            userTyping={typing}
            tankLight={amb.tankLight}
            onEatFood={s.consumeFood}
          />

          {!awake && (
            <button
              onClick={() => s.setRoomLight(false)}
              className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full border border-white/15
                         bg-black/55 px-4 py-2 text-[12px] text-ink-dim backdrop-blur transition
                         hover:border-white/30 hover:text-ink"
            >
              불을 끄고 {design.name}를 깨우기
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
            fishName={design.name}
            messages={messages}
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
