"use client";

import { useEffect, useRef, useState } from "react";
import { canChangeWater, canFeed, careHint } from "@/lib/care";
import type { CareState } from "@/lib/types";

/**
 * 돌봄 상태와 두 개의 행동.
 *
 * 모바일에서는 비활성 버튼이 최악이다 — 눌러도 아무 일이 없고, title 툴팁은 뜨지 않아서
 * 왜 안 되는지 알 길이 없다. 그래서 버튼은 항상 누를 수 있게 두고, 아직 할 필요가
 * 없을 때는 이유를 짧게 말해준다.
 */
export function CareBar({
  care,
  awake,
  onFeed,
  onWater,
}: {
  care: CareState;
  awake: boolean;
  onFeed: () => void;
  onWater: () => void;
}) {
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const say = (msg: string) => {
    setNote(msg);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(null), 2600);
  };

  const feedable = canFeed(care) && awake;
  const waterable = canChangeWater(care);
  const hint = note ?? careHint(care);

  const handleFeed = () => {
    if (!awake) return say("자는 중이에요. 불을 끄면 깨어나요");
    if (!canFeed(care)) return say("아직 배가 불러요");
    onFeed();
    say("먹이를 줬어요");
  };

  const handleWater = () => {
    if (!waterable) return say("물이 아직 맑아요");
    onWater();
    say("물을 갈았어요");
  };

  return (
    <div>
      <div className="flex items-center gap-3">
      <Gauge label="배" value={care.fullness} hue={30} />
      <Gauge label="물" value={care.waterClarity} hue={190} />

      <div className="ml-auto flex items-center gap-2">
        {hint && (
          <span
            role="status"
            className="hidden max-w-[9rem] truncate text-[12px] text-amber-200/75 sm:inline"
          >
            {hint}
          </span>
        )}
        <ActionButton onClick={handleFeed} dim={!feedable}>
          먹이
        </ActionButton>
        <ActionButton onClick={handleWater} dim={!waterable}>
          물갈이
        </ActionButton>
        </div>
      </div>
      {/* 좁은 화면에서는 버튼 아래로 내려 보여준다 */}
      {hint && (
        <p role="status" className="mt-1.5 text-right text-[12px] text-amber-200/75 sm:hidden">
          {hint}
        </p>
      )}
    </div>
  );
}

function Gauge({ label, value, hue }: { label: string; value: number; hue: number }) {
  const low = value < 35;
  return (
    <div
      className="flex items-center gap-1.5"
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={`text-[11px] ${low ? "text-amber-200/80" : "text-ink-faint"}`}>{label}</span>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(3, value)}%`,
            background: low ? "hsl(38 80% 58%)" : `hsl(${hue} 62% 62%)`,
          }}
        />
      </div>
    </div>
  );
}

/**
 * 할 필요가 없을 때는 흐리게 보이되 여전히 눌린다.
 * disabled 를 쓰면 터치에 아무 반응이 없어 고장난 것처럼 느껴진다.
 */
function ActionButton({
  children,
  onClick,
  dim,
}: {
  children: React.ReactNode;
  onClick: () => void;
  /** 지금은 할 필요가 없다 — 흐리게 보이되 눌리기는 한다 */
  dim?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-full border px-5 text-[13px] transition active:scale-95
        ${
          dim
            ? "border-white/6 bg-white/[0.02] text-ink-faint/60"
            : "border-white/12 bg-white/[0.06] text-ink-dim hover:border-white/25 hover:text-ink"
        }`}
    >
      {children}
    </button>
  );
}
