"use client";

import { rapportStage } from "@/lib/types";
import type { Bond } from "@/lib/types";

export function TopBar({
  fishName,
  timeLabel,
  clock,
  awake,
  bond,
  roomLightOn,
  soundOn,
  onToggleLight,
  onToggleSound,
  onOpenJournal,
}: {
  fishName: string;
  timeLabel: string;
  clock: string;
  awake: boolean;
  bond: Bond;
  roomLightOn: boolean;
  soundOn: boolean;
  onToggleLight: () => void;
  onToggleSound: () => void;
  onOpenJournal: () => void;
}) {
  const stage = rapportStage(bond.rapport);

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="truncate text-[15px] font-medium text-ink">{fishName}</h1>
          <span className="shrink-0 text-[11px] text-ink-faint">
            {awake ? stage.label : "자는 중"}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span>
            {clock} · {timeLabel}
          </span>
          {bond.streak > 1 && (
            <>
              <span className="opacity-40">·</span>
              <span>{bond.streak}일 연속</span>
            </>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <IconButton
          onClick={onToggleLight}
          active={!roomLightOn}
          label={roomLightOn ? "불 끄기" : "불 켜기"}
        >
          {roomLightOn ? <SunIcon /> : <MoonIcon />}
        </IconButton>
        <IconButton onClick={onToggleSound} active={soundOn} label={soundOn ? "소리 끄기" : "소리 켜기"}>
          {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
        </IconButton>
        <IconButton onClick={onOpenJournal} label="기억 보기">
          <BookIcon />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      type="button"
      className={`grid h-11 w-11 place-items-center rounded-full border transition active:scale-95
        ${
          active
            ? "border-sky-300/35 bg-sky-300/12 text-sky-100"
            : "border-white/10 bg-white/[0.04] text-ink-dim hover:border-white/20 hover:text-ink"
        }`}
    >
      {children}
    </button>
  );
}

/* ── 아이콘 (인라인 SVG — 외부 의존성 없이) ── */

const S = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function SunIcon() {
  return (
    <svg {...S}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...S}>
      <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg {...S}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg {...S}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M22 9l-6 6M16 9l6 6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...S}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}
