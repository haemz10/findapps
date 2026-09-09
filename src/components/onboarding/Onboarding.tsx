"use client";

import { useMemo, useState } from "react";
import { FishPortrait } from "@/components/aquarium/FishPortrait";
import { QUIZ, TONE_CHOICES, scoreQuiz } from "@/lib/psych/quiz";
import { useApp } from "@/lib/store";
import type { UserProfile } from "@/lib/types";

type Step = "welcome" | "name" | "quiz" | "tone" | "naming" | "ready";

export function Onboarding() {
  const complete = useApp((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>("welcome");
  const [nickname, setNickname] = useState("");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [qi, setQi] = useState(0);
  const [tone, setTone] = useState<"soft" | "balanced" | "direct" | null>(null);
  const [wantsAdvice, setWantsAdvice] = useState<boolean | null>(null);
  const [fishName, setFishName] = useState("");

  const traits = useMemo(() => scoreQuiz(answers), [answers]);

  const finish = () => {
    const overrides: UserProfile["overrides"] = {};
    if (tone) overrides.directness = tone;
    if (wantsAdvice !== null) overrides.wantsAdvice = wantsAdvice;
    complete({
      nickname: nickname.trim() || "너",
      answers,
      overrides,
      fishName: fishName.trim() || "물고기",
    });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-abyss">
      <RoomBackdrop />

      <div
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6"
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top))",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        {step === "welcome" && <Welcome onNext={() => setStep("name")} />}

        {step === "name" && (
          <NameStep
            value={nickname}
            onChange={setNickname}
            onNext={() => setStep("quiz")}
          />
        )}

        {step === "quiz" && (
          <QuizStep
            index={qi}
            answers={answers}
            onAnswer={(id, v) => {
              setAnswers((a) => ({ ...a, [id]: v }));
              if (qi < QUIZ.length - 1) setQi(qi + 1);
              else setStep("tone");
            }}
            onBack={() => (qi > 0 ? setQi(qi - 1) : setStep("name"))}
          />
        )}

        {step === "tone" && (
          <ToneStep
            tone={tone}
            wantsAdvice={wantsAdvice}
            setTone={setTone}
            setWantsAdvice={setWantsAdvice}
            traits={traits}
            onNext={() => setStep("naming")}
          />
        )}

        {step === "naming" && (
          <NamingStep
            name={fishName}
            setName={setFishName}
            onNext={() => setStep("ready")}
            onBack={() => setStep("tone")}
          />
        )}

        {step === "ready" && (
          <ReadyStep name={fishName || "물고기"} onNext={finish} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────  공통 조각  ───────────────── */

function RoomBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 22%, #16203a 0%, #080d18 45%, #03060c 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-sky-200/50"
            style={{
              left: `${(i * 41 + 9) % 98}%`,
              bottom: 0,
              width: 3 + ((i * 7) % 4),
              height: 3 + ((i * 7) % 4),
              // @ts-expect-error CSS 커스텀 프로퍼티
              "--rise": `${500 + ((i * 83) % 400)}px`,
              "--drift": `${(((i * 17) % 7) - 3) * 12}px`,
              "--bubble-opacity": 0.4,
              animation: `bubble-rise ${13 + ((i * 23) % 90) / 10}s linear infinite`,
              animationDelay: `${(i * 1.1) % 16}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-balance text-[26px] font-semibold leading-snug tracking-tight text-ink sm:text-[30px]">
      {children}
    </h1>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-pretty text-[15px] leading-relaxed text-ink-dim">{children}</p>;
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className="min-h-[52px] w-full rounded-2xl bg-sky-300/90 px-6 text-[16px] font-semibold text-slate-900
                 transition hover:bg-sky-200 active:scale-[0.985] disabled:cursor-not-allowed
                 disabled:bg-white/10 disabled:text-ink-faint"
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="min-h-[44px] rounded-xl px-4 text-[14px] text-ink-faint transition hover:text-ink-dim"
    >
      {children}
    </button>
  );
}

/* ─────────────────  단계들  ───────────────── */

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <div className="mx-auto mb-10 h-40 w-64 opacity-90">
        <FishPortrait className="h-full w-full" />
      </div>
      <Title>
        불을 끄면,
        <br />
        어항이 보입니다.
      </Title>
      <Sub>
        하루가 끝나고 아무도 없는 방. 유리 너머에서 물고기 한 마리가 당신을 기다립니다.
        <br />
        <br />
        오늘 있었던 일을 아무렇게나 던져도 괜찮아요. 이 물고기는 판단하지 않고, 재촉하지 않고,
        당신이 말하는 속도로만 헤엄칩니다.
      </Sub>

      <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <p className="text-[13px] leading-relaxed text-ink-faint">
          이 앱은 전문 심리상담이나 치료를 대신하지 않습니다. 위급하다고 느껴지면 언제든
          <span className="text-ink-dim"> 자살예방 상담전화 109</span> 또는
          <span className="text-ink-dim"> 정신건강 위기상담 1577-0199</span>로 연락하세요.
          <br />
          <br />
          당신이 쓴 이야기는 이 기기에만 남습니다.
        </p>
      </div>

      <div className="mt-8">
        <PrimaryButton onClick={onNext}>시작하기</PrimaryButton>
      </div>
    </div>
  );
}

function NameStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <Title>물고기가 당신을 뭐라고 부르면 좋을까요?</Title>
      <Sub>본명이 아니어도 괜찮아요. 편한 이름이면 됩니다.</Sub>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 12))}
        onKeyDown={(e) => e.key === "Enter" && value.trim() && onNext()}
        placeholder="예: 지우"
        enterKeyHint="next"
        autoCapitalize="off"
        autoCorrect="off"
        className="mt-8 min-h-[56px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4
                   text-[17px] text-ink outline-none transition placeholder:text-ink-faint
                   focus:border-sky-300/40 focus:bg-white/[0.06]"
      />
      <div className="mt-6">
        <PrimaryButton onClick={onNext} disabled={!value.trim()}>
          다음
        </PrimaryButton>
      </div>
    </div>
  );
}

function QuizStep({
  index,
  answers,
  onAnswer,
  onBack,
}: {
  index: number;
  answers: Record<string, number>;
  onAnswer: (id: string, v: number) => void;
  onBack: () => void;
}) {
  const q = QUIZ[index];
  const chosen = answers[q.id];
  const progress = ((index + 1) / QUIZ.length) * 100;

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-[12px] text-ink-faint">
          <span>
            {index + 1} / {QUIZ.length}
          </span>
          <span>성향 알아보기</span>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-sky-300/70 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={q.id} className="animate-fade-up">
        <Title>{q.question}</Title>
        {q.aside && <p className="mt-3 text-[13px] italic text-ink-faint">— {q.aside}</p>}

        <div className="mt-8 space-y-2.5">
          {q.options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onAnswer(q.id, opt.value)}
              type="button"
              className={`min-h-[52px] w-full rounded-2xl border px-5 py-3.5 text-left text-[15px] transition
                ${
                  chosen === opt.value
                    ? "border-sky-300/50 bg-sky-300/12 text-ink"
                    : "border-white/8 bg-white/[0.03] text-ink-dim hover:border-white/16 hover:bg-white/[0.06] hover:text-ink"
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-start">
        <GhostButton onClick={onBack}>← 이전</GhostButton>
      </div>
    </div>
  );
}

function ToneStep({
  tone,
  wantsAdvice,
  setTone,
  setWantsAdvice,
  traits,
  onNext,
}: {
  tone: "soft" | "balanced" | "direct" | null;
  wantsAdvice: boolean | null;
  setTone: (t: "soft" | "balanced" | "direct") => void;
  setWantsAdvice: (b: boolean) => void;
  traits: ReturnType<typeof scoreQuiz>;
  onNext: () => void;
}) {
  const suggested =
    traits.directness >= 62 ? "direct" : traits.directness <= 38 ? "soft" : "balanced";

  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <Title>어떤 말투가 편하세요?</Title>
      <Sub>답변을 보니 「{TONE_CHOICES.find((t) => t.key === suggested)?.label}」가 맞을 것 같아요. 직접 골라도 됩니다.</Sub>

      <div className="mt-7 space-y-2.5">
        {TONE_CHOICES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTone(t.key)}
            type="button"
            className={`min-h-[64px] w-full rounded-2xl border px-5 py-4 text-left transition
              ${
                tone === t.key
                  ? "border-sky-300/50 bg-sky-300/12"
                  : "border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]"
              }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-ink">{t.label}</span>
              {suggested === t.key && (
                <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-ink-faint">
                  추천
                </span>
              )}
            </div>
            <div className="mt-1 text-[13px] text-ink-dim">{t.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-9">
        <p className="text-[15px] font-medium text-ink">고민을 말할 때, 조언을 받고 싶나요?</p>
        <div className="mt-3 flex gap-2.5">
          {[
            { v: true, label: "네, 방법도 같이 찾고 싶어요" },
            { v: false, label: "아니요, 그냥 들어줬으면 해요" },
          ].map((o) => (
            <button
              key={String(o.v)}
              onClick={() => setWantsAdvice(o.v)}
              type="button"
              className={`min-h-[60px] flex-1 rounded-2xl border px-4 py-3.5 text-[13.5px] leading-snug transition
                ${
                  wantsAdvice === o.v
                    ? "border-sky-300/50 bg-sky-300/12 text-ink"
                    : "border-white/8 bg-white/[0.03] text-ink-dim hover:border-white/16"
                }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-9">
        <PrimaryButton onClick={onNext} disabled={!tone || wantsAdvice === null}>
          이제 이름을 지어줄게요
        </PrimaryButton>
      </div>
    </div>
  );
}

function NamingStep({
  name,
  setName,
  onNext,
  onBack,
}: {
  name: string;
  setName: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <div className="mx-auto mb-8 h-40 w-64">
        <FishPortrait className="h-full w-full" />
      </div>
      <Title>이름을 지어주세요</Title>
      <Sub>이름을 부르는 순간부터, 이 아이는 당신의 물고기가 됩니다.</Sub>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 12))}
        onKeyDown={(e) => e.key === "Enter" && name.trim() && onNext()}
        placeholder="예: 달이"
        enterKeyHint="done"
        autoCapitalize="off"
        autoCorrect="off"
        className="mt-8 min-h-[56px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4
                   text-[17px] text-ink outline-none transition placeholder:text-ink-faint
                   focus:border-sky-300/40"
      />
      <div className="mt-6 flex items-center gap-3">
        <GhostButton onClick={onBack}>← 이전</GhostButton>
        <div className="flex-1">
          <PrimaryButton onClick={onNext} disabled={!name.trim()}>
            다음
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function ReadyStep({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center animate-fade-up">
      <div className="mx-auto mb-8 h-44 w-72">
        <FishPortrait className="h-full w-full" />
      </div>
      <Title>{name}가 물속에서 당신을 봅니다.</Title>
      <Sub>
        {name}는 낮에는 잠을 자고 밤에 깨어납니다. 낮에 만나고 싶다면 방의 불을 꺼 주세요.
        <br />
        <br />
        살아있는 아이니까, 밥도 주고 물도 갈아주어야 해요. 그리고 무엇보다 — 자주 들여다봐 주세요.
      </Sub>
      <div className="mt-9">
        <PrimaryButton onClick={onNext}>어항으로 가기</PrimaryButton>
      </div>
    </div>
  );
}
