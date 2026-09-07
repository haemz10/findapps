"use client";

import { canChangeWater, canFeed, careHint } from "@/lib/care";
import type { CareState } from "@/lib/types";

/**
 * 돌봄 상태와 두 개의 행동. 게임 UI처럼 보이지 않게,
 * 수치는 작게 두고 물고기의 상태를 말로 알려준다.
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
  const hint = careHint(care);
  const feedable = canFeed(care) && awake;
  const waterable = canChangeWater(care);

  return (
    <div className="flex items-center gap-2.5">
      <Gauge label="배" value={care.fullness} hue={30} />
      <Gauge label="물" value={care.waterClarity} hue={190} />

      <div className="ml-auto flex items-center gap-2">
        {hint && <span className="hidden text-[12px] text-amber-200/70 sm:inline">{hint}</span>}
        <ActionButton
          onClick={onFeed}
          disabled={!feedable}
          title={
            !awake ? "자는 중이에요" : !canFeed(care) ? "아직 배가 불러요" : "먹이 주기"
          }
        >
          먹이
        </ActionButton>
        <ActionButton
          onClick={onWater}
          disabled={!waterable}
          title={waterable ? "물 갈기" : "물이 아직 맑아요"}
        >
          물갈이
        </ActionButton>
      </div>
    </div>
  );
}

function Gauge({ label, value, hue }: { label: string; value: number; hue: number }) {
  const low = value < 35;
  return (
    <div className="flex items-center gap-1.5" title={`${label} ${Math.round(value)}%`}>
      <span className={`text-[11px] ${low ? "text-amber-200/80" : "text-ink-faint"}`}>{label}</span>
      <div className="h-1 w-11 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(2, value)}%`,
            background: low ? "hsl(38 80% 58%)" : `hsl(${hue} 62% 62%)`,
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[12px] text-ink-dim
                 transition hover:border-white/20 hover:text-ink active:scale-95
                 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-ink-faint/50 disabled:hover:border-white/5"
    >
      {children}
    </button>
  );
}
