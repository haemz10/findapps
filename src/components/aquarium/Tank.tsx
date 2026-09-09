"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Decor } from "./Decor";
import { FishActor } from "./FishActor";
import { SpeechBubble, splitGesture, type HeadPos } from "./SpeechBubble";
import type { FishActivity, FishCue } from "@/lib/types";

/**
 * 어항. 커다랗고 조용하다.
 *
 * 층: 뒤유리 → 물 그라디언트 → 코스틱(수면에서 굴절된 빛) → 뒤 장식
 *     → 물고기 → 앞 장식 → 먹이 → 앞유리 반사 → 프레임
 */

interface Props {
  activity: FishActivity;
  cue: FishCue;
  mood: number;
  clarity: number;
  speaking: boolean;
  pendingFood: number;
  userTyping: boolean;
  tankLight: number;
  onEatFood: () => void;
  /** 물고기가 지금 하고 있는 말 — 얼굴에서 말풍선으로 나온다 */
  saying: string;
  onDismissSaying: () => void;
}

export function Tank({
  activity,
  cue,
  mood,
  clarity,
  speaking,
  pendingFood,
  userTyping,
  tankLight,
  onEatFood,
  saying,
  onDismissSaying,
}: Props) {
  const [head, setHead] = useState<HeadPos | null>(null);
  const { gestures, speech } = useMemo(() => splitGesture(saying), [saying]);
  // 물이 탁해지면 뿌옇고 누렇게
  const murk = 1 - clarity / 100;

  return (
    <div className="relative h-full w-full select-none">
      {/* 수조 유리 프레임 */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[18px]"
        style={{
          background: `linear-gradient(180deg, var(--water-top) 0%, var(--water-bottom) 100%)`,
          boxShadow: `
            inset 0 0 90px rgba(0,0,0,0.55),
            inset 0 40px 90px rgba(120,200,255,${0.05 + tankLight * 0.09}),
            0 30px 90px rgba(0,0,0,0.7)`,
        }}
      >
        {/* 수면에서 내려오는 빛기둥 */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{
            background: `linear-gradient(180deg, rgba(170,220,255,${0.07 * tankLight}) 0%, transparent 72%)`,
          }}
        />

        <Caustics intensity={tankLight} />

        {/* 물의 탁함 */}
        {murk > 0.12 && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
            style={{
              background: `radial-gradient(ellipse at 50% 60%, rgba(120,140,80,${murk * 0.3}) 0%, rgba(60,70,40,${murk * 0.42}) 100%)`,
              backdropFilter: `blur(${murk * 1.6}px)`,
            }}
          />
        )}

        <Decor />

        <FishActor
          activity={activity}
          cue={cue}
          mood={mood}
          clarity={clarity}
          speaking={speaking}
          hasFood={pendingFood > 0}
          userTyping={userTyping}
          onEatFood={onEatFood}
          onHead={setHead}
        />

        {saying && (
          <SpeechBubble
            head={head}
            text={speech}
            streaming={speaking}
            gestures={gestures}
            onDismiss={onDismissSaying}
          />
        )}

        <FoodPellets count={pendingFood} />

        <AmbientBubbles />

        {/* 바닥 자갈 */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[16%]"
          style={{
            background: `linear-gradient(180deg, transparent, rgba(10,16,28,0.85) 45%, rgba(6,10,18,0.98))`,
          }}
        />
        <Gravel />

        {/* 앞유리 반사 — 이게 있어야 '유리 너머'로 보인다 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(118deg,
              rgba(255,255,255,0.09) 0%,
              rgba(255,255,255,0.02) 18%,
              transparent 34%,
              transparent 70%,
              rgba(255,255,255,0.035) 84%,
              rgba(255,255,255,0.06) 100%)`,
          }}
        />
        {/* 유리 모서리 */}
        <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/10" />
      </div>

      {/* 수조 테두리(실리콘 실링) */}
      <div className="pointer-events-none absolute -inset-[3px] rounded-[21px] ring-2 ring-black/70" />
      <div className="pointer-events-none absolute -inset-px rounded-[19px] ring-1 ring-white/10" />
    </div>
  );
}

/* ─────────────────  수면 굴절광  ───────────────── */

function Caustics({ intensity }: { intensity: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 mix-blend-screen"
      style={{ opacity: 0.03 + intensity * 0.055 }}
      aria-hidden="true"
    >
      <svg className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <filter id="caustic-f">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.1"
              numOctaves="2"
              seed="21"
              result="n"
            >
              <animate
                attributeName="baseFrequency"
                dur="26s"
                values="0.03 0.1; 0.042 0.078; 0.03 0.1"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 0.6
                      0 0 0 0 0.86
                      0 0 0 0 1
                      0 0 0 -4.2 1.9"
            />
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#caustic-f)"
          style={{ animation: "caustic-drift 30s ease-in-out infinite" }}
        />
      </svg>
    </div>
  );
}

/* ─────────────────  떠다니는 방울들  ───────────────── */

function AmbientBubbles() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: ((i * 37 + 11) % 97) + 1,
        size: 2 + ((i * 13) % 6),
        rise: 320 + ((i * 71) % 260),
        drift: (((i * 29) % 7) - 3) * 10,
        dur: 9 + ((i * 17) % 70) / 10,
        delay: (i * 1.37) % 14,
        opacity: 0.18 + ((i * 7) % 5) / 20,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-0 block rounded-full border border-white/30 bg-white/10"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            // @ts-expect-error CSS 커스텀 프로퍼티
            "--rise": `${b.rise}px`,
            "--drift": `${b.drift}px`,
            "--bubble-opacity": b.opacity,
            animation: `bubble-rise ${b.dur}s linear infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────  먹이  ───────────────── */

function FoodPellets({ count }: { count: number }) {
  const seeds = useRef<{ left: number; delay: number; sink: number; hue: number }[]>([]);

  useEffect(() => {
    while (seeds.current.length < count) {
      seeds.current.push({
        left: 28 + Math.random() * 44,
        delay: Math.random() * 1.2,
        sink: 180 + Math.random() * 160,
        hue: 22 + Math.random() * 24,
      });
    }
    if (count === 0) seeds.current = [];
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {seeds.current.slice(0, count).map((s, i) => (
        <span
          key={i}
          className="absolute top-[8%] block rounded-[2px]"
          style={{
            left: `${s.left}%`,
            width: 5,
            height: 4,
            background: `hsl(${s.hue} 62% 52%)`,
            boxShadow: `0 0 6px hsl(${s.hue} 70% 46% / 0.6)`,
            // @ts-expect-error CSS 커스텀 프로퍼티
            "--sink": `${s.sink}px`,
            animation: `food-sink 9s cubic-bezier(0.3,0,0.7,1) forwards`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────  바닥 자갈  ───────────────── */

function Gravel() {
  const stones = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: ((i * 23 + 7) % 100),
        bottom: ((i * 13) % 9),
        w: 8 + ((i * 11) % 11),
        h: 6 + ((i * 7) % 6),
        l: 7 + ((i * 5) % 9),
        hue: 205 + ((i * 17) % 30),
        rot: (i * 31) % 180,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[13%]" aria-hidden="true">
      {stones.map((s, i) => (
        <span
          key={i}
          className="absolute block rounded-[46%]"
          style={{
            left: `${s.left}%`,
            bottom: `${s.bottom}%`,
            width: s.w,
            height: s.h,
            background: `hsl(${s.hue} 12% ${s.l}%)`,
            transform: `rotate(${s.rot}deg)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}
