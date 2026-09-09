"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { rapportStage } from "@/lib/types";
import { KR_RESOURCES } from "@/lib/psych/safety";

/**
 * 물고기가 기억하고 있는 것 + 설정.
 * "내 데이터가 어디 있는지" 사용자가 언제든 볼 수 있어야 한다.
 */
export function JournalSheet({ onClose }: { onClose: () => void }) {
  const { fish, profile, bond, notes, digests, resetAll } = useApp();
  const [tab, setTab] = useState<"memory" | "me" | "settings">("memory");
  const [confirmReset, setConfirmReset] = useState(false);
  const stage = rapportStage(bond.rapport);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className="relative flex max-h-[88dvh] w-full max-w-lg animate-fade-up flex-col overflow-hidden
                   rounded-t-3xl border border-white/10 bg-[#080d18] sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* 시트 손잡이 — 아래에서 올라온 창이라는 신호 */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="block h-1 w-9 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          {(
            [
              { id: "memory", label: "기억" },
              { id: "me", label: "나" },
              { id: "settings", label: "설정" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              type="button"
              className={`min-h-[42px] rounded-full px-4 text-[14px] transition ${
                tab === t.id ? "bg-white/12 text-ink" : "text-ink-faint hover:text-ink-dim"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={onClose}
            aria-label="닫기"
            type="button"
            className="ml-auto grid h-11 w-11 place-items-center rounded-full text-[22px] leading-none
                       text-ink-faint transition hover:bg-white/8 hover:text-ink active:scale-95"
          >
            ×
          </button>
        </div>

        <div className="scroll-y min-h-0 flex-1 px-5 py-5">
          {tab === "memory" && (
            <div className="space-y-6">
              <div>
                <Label>{fish.name}와의 관계</Label>
                <div className="mt-2 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[15px] font-medium text-ink">{stage.label}</span>
                    <span className="text-[12px] text-ink-faint">{stage.level}단계</span>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-dim">{stage.desc}</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-sky-300/70 transition-all duration-700"
                      style={{ width: `${bond.rapport}%` }}
                    />
                  </div>
                  <div className="mt-3 flex gap-4 text-[12px] text-ink-faint">
                    <span>함께한 날 {bond.visitDays}일</span>
                    <span>연속 {bond.streak}일</span>
                    <span>나눈 이야기 {bond.exchanges}번</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>{fish.name}가 기억하는 것</Label>
                {notes.length === 0 ? (
                  <Empty>아직 기억하는 게 없어요. 이야기를 나눌수록 하나씩 늘어납니다.</Empty>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {[...notes].reverse().map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl border border-white/6 bg-white/[0.025] px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-dim"
                      >
                        {n.summary}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <Label>지난 밤들</Label>
                {digests.length === 0 ? (
                  <Empty>대화를 마치면 그날의 기록이 여기 남아요.</Empty>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {[...digests].reverse().map((d) => (
                      <li
                        key={d.id}
                        className="rounded-xl border border-white/6 bg-white/[0.025] px-3.5 py-3"
                      >
                        <div className="flex items-baseline gap-2 text-[11px] text-ink-faint">
                          <span>{d.date}</span>
                          <span className="rounded-full bg-white/6 px-2 py-0.5">{d.mood}</span>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{d.summary}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {tab === "me" && (
            <div className="space-y-5">
              <p className="text-[13px] leading-relaxed text-ink-dim">
                처음에 답한 내용으로 {fish.name}가 말투를 맞추고 있어요. 이건 진단이 아니라,
                대화를 편하게 만들기 위한 설정값입니다.
              </p>
              <div className="space-y-3">
                <Trait label="솔직하게 ↔ 부드럽게" value={100 - profile.traits.directness} left="솔직" right="부드럽" />
                <Trait label="공감 ↔ 해결" value={profile.traits.solutionSeeking} left="공감" right="해결" />
                <Trait label="감정을 알아차리는 정도" value={profile.traits.emotionalClarity} />
                <Trait label="사회적 에너지" value={profile.traits.extraversion} />
                <Trait label="감정의 진폭" value={profile.traits.volatility} />
                <Trait label="자기비판" value={profile.traits.selfCriticism} />
                <Trait label="가까움에 대한 편안함" value={profile.traits.closenessComfort} />
                <Trait label="외로움" value={profile.traits.loneliness} />
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-6">
              <div>
                <Label>내 이야기는 어디에 있나요</Label>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                  대화 내용은 어디에도 저장하지 않습니다. 이 창을 닫으면 사라져요.
                  {fish.name}가 기억하는 짧은 메모와 프로필만 이 브라우저 안에 남고, 서버에는
                  보관하지 않습니다. 답변을 만드는 순간에만 대화가 AI 모델로 전송됩니다.
                </p>
              </div>

              <div>
                <Label>도움이 필요할 때</Label>
                <div className="mt-2 grid gap-1.5">
                  {KR_RESOURCES.map((r) => (
                    <a
                      key={r.name}
                      href={r.href}
                      className="flex min-h-[56px] items-center justify-between rounded-xl border border-white/8
                                 bg-white/[0.03] px-4 transition hover:border-white/18 active:scale-[0.99]"
                    >
                      <div>
                        <div className="text-[13px] text-ink-dim">{r.name}</div>
                        <div className="text-[11px] text-ink-faint">{r.note}</div>
                      </div>
                      <div className="text-[14px] font-medium text-sky-200/90">{r.contact}</div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/8 pt-5">
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    type="button"
                    className="min-h-[44px] text-[14px] text-red-300/60 transition hover:text-red-300"
                  >
                    모두 지우고 처음부터 시작하기
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-400/25 bg-red-950/25 p-3.5">
                    <p className="text-[13px] text-red-100/85">
                      {fish.name}와 쌓은 기억과 관계가 전부 사라집니다. 되돌릴 수 없어요.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          resetAll();
                          onClose();
                        }}
                        type="button"
                        className="min-h-[44px] rounded-lg bg-red-400/85 px-4 text-[14px] font-medium text-red-950"
                      >
                        정말 지울게요
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        type="button"
                        className="min-h-[44px] rounded-lg px-4 text-[14px] text-ink-dim"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] tracking-wide text-ink-faint">{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-xl border border-dashed border-white/8 px-3.5 py-4 text-center text-[12px] text-ink-faint">
      {children}
    </p>
  );
}

function Trait({
  label,
  value,
  left,
  right,
}: {
  label: string;
  value: number;
  left?: string;
  right?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
        <span className="text-ink-dim">{label}</span>
        {left && right && (
          <span className="text-ink-faint">
            {left} · {right}
          </span>
        )}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-ink-dim/60"
          style={{ width: `${Math.max(3, value)}%` }}
        />
      </div>
    </div>
  );
}
