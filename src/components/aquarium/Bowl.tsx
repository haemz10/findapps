"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BOWL } from "@/lib/fish/asset";
import { SpeechBubble, splitGesture } from "./SpeechBubble";
import type { FishActivity, FishCue } from "@/lib/types";

/**
 * 어항.
 *
 * 그림 한 장을 **고치지 않고** 그대로 쓴다. 물고기가 그림에 박혀 있으므로
 * 헤엄치게 만들 수는 없다. 대신 그림 위에 얹는 것들로 살아있게 한다:
 *
 *  - 사라짐: 물고기가 있는 자리만 물처럼 흐려진다(backdrop blur + 안개).
 *    체셔 고양이처럼 지워지는 게 아니라 물에 녹아든다.
 *  - 숨결: 어항 전체가 아주 느리게 부풀었다 가라앉는다.
 *  - 물의 탁함·시간대의 빛: 유리 원 안에만 얹는다.
 *  - 먹이: 수면에서 떨어져 가라앉는다.
 *
 * 그림이 정사각형이므로 컨테이너도 정사각으로 잡는다.
 * 그래야 그림 기준 좌표(입·눈·유리 원)가 화면 좌표로 그대로 옮겨진다.
 */

interface Props {
  activity: FishActivity;
  cue: FishCue;
  clarity: number;
  tankLight: number;
  pendingFood: number;
  speaking: boolean;
  /** 물고기가 지금 하는 말 */
  saying: string;
  onDismissSaying: () => void;
  onEatFood: () => void;
  /** 0~1. 1이면 물에 완전히 녹아 보이지 않는다 */
  dissolve: number;
}

export function Bowl({
  activity,
  cue,
  clarity,
  tankLight,
  pendingFood,
  speaking,
  saying,
  onDismissSaying,
  onEatFood,
  dissolve,
}: Props) {
  const [box, setBox] = useState({ w: 0, h: 0, side: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const { gestures, speech } = useMemo(() => splitGesture(saying), [saying]);

  // 정사각형 한 변 = 가용 공간의 짧은 쪽
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({
        w: r.width,
        h: r.height,
        side: Math.floor(Math.min(r.width, r.height)),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 먹이를 먹는 동안 일정 간격으로 하나씩 삼킨다
  useEffect(() => {
    if (pendingFood <= 0 || activity !== "eating") return;
    const id = window.setInterval(onEatFood, 620);
    return () => window.clearInterval(id);
  }, [pendingFood, activity, onEatFood]);

  const sleeping = activity === "sleeping";
  const murk = 1 - clarity / 100;

  // 기분에 따른 숨결의 속도
  const breath =
    sleeping ? 9 : cue === "playful" ? 3.4 : cue === "concerned" ? 7 : 5.2;

  // 정사각형은 바깥 상자 가운데 놓인다. 입의 위치를 바깥 상자 기준으로 옮긴다.
  const mouthInBox = useMemo(() => {
    if (!box.side || !box.w || !box.h) return null;
    const left = (box.w - box.side) / 2;
    const top = (box.h - box.side) / 2;
    return {
      x: (left + BOWL.speakFrom.x * box.side) / box.w,
      y: (top + BOWL.speakFrom.y * box.side) / box.h,
      dir: 1 as const,
      scale: 1,
    };
  }, [box]);

  const pct = (n: number) => `${n * 100}%`;
  const fishW = BOWL.fish.x1 - BOWL.fish.x0;
  const fishH = BOWL.fish.y1 - BOWL.fish.y0;

  return (
    <div ref={boxRef} className="relative grid h-full w-full place-items-center">
      <div
        className="relative"
        style={{ width: box.side || "100%", height: box.side || "100%" }}
      >
        {/* 어항이 방으로 흘리는 빛 */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-full transition-opacity duration-[1600ms]"
          style={{
            background: `radial-gradient(circle at 50% 52%, rgba(170,190,255,${(0.05 + tankLight * 0.13).toFixed(3)}) 0%, transparent 66%)`,
            filter: "blur(18px)",
          }}
        />

        {/* 어항 — 원본 그대로, 시간대에 따라 밝기만 달라진다 */}
        <div
          className="absolute inset-0"
          style={{
            animation: `bowl-breathe ${breath}s ease-in-out infinite`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BOWL.src}
            alt="유리 어항 속의 물고기"
            draggable={false}
            className="h-full w-full select-none object-contain"
            style={{
              filter: sleeping
                ? `brightness(${0.5 + tankLight * 0.28}) saturate(0.7)`
                : `brightness(${0.72 + tankLight * 0.34}) saturate(${0.9 + tankLight * 0.2})`,
              transition: "filter 1.4s ease",
            }}
          />

          {/* ── 사라짐 ── 물고기 자리만 물처럼 흐려진다 */}
          <div
            className="pointer-events-none absolute"
            aria-hidden="true"
            style={{
              left: pct(BOWL.fish.x0),
              top: pct(BOWL.fish.y0),
              width: pct(fishW),
              height: pct(fishH),
              opacity: dissolve,
              transition: "opacity 1.5s cubic-bezier(0.4, 0, 0.3, 1)",
              // 가장자리를 부드럽게 — 네모난 자국이 보이면 마법이 아니라 버그로 보인다
              // 지느러미 끝까지 덮어야 한다 — 몸만 지우면 유령처럼 남는다
              WebkitMaskImage:
                "radial-gradient(ellipse 62% 62% at 50% 50%, #000 52%, transparent 94%)",
              maskImage:
                "radial-gradient(ellipse 62% 62% at 50% 50%, #000 52%, transparent 94%)",
              backdropFilter: "blur(30px) saturate(0.18) brightness(1.16) contrast(0.8)",
              WebkitBackdropFilter: "blur(30px) saturate(0.18) brightness(1.16) contrast(0.8)",
            }}
          />
          {/* 녹아든 자리에 남는 옅은 안개 */}
          <div
            className="pointer-events-none absolute"
            aria-hidden="true"
            style={{
              left: pct(BOWL.fish.x0),
              top: pct(BOWL.fish.y0),
              width: pct(fishW),
              height: pct(fishH),
              opacity: dissolve * 0.58,
              transition: "opacity 1.5s cubic-bezier(0.4, 0, 0.3, 1)",
              // 주변 물빛과 같은 톤이어야 안개로 보이지, 흰 얼룩으로 보이지 않는다
              background:
                "radial-gradient(ellipse 56% 56% at 50% 50%, rgba(223,219,235,0.9) 0%, rgba(214,211,230,0.6) 46%, rgba(206,205,224,0.24) 72%, transparent 92%)",
            }}
          />

          {/* 물의 탁함 — 유리 원 안에만 */}
          {murk > 0.15 && (
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
              aria-hidden="true"
              style={{
                background: `radial-gradient(circle at ${pct(BOWL.glass.cx)} ${pct(BOWL.glass.cy)}, rgba(126,140,74,${(murk * 0.34).toFixed(3)}) 0%, rgba(96,110,58,${(murk * 0.4).toFixed(3)}) ${pct(BOWL.glass.r * 0.9)}, transparent ${pct(BOWL.glass.r)})`,
              }}
            />
          )}

          {/* 먹이 */}
          <FoodPellets count={pendingFood} />
        </div>

      </div>

      {/* 말풍선 — 물고기 입에서 나오되, 자리가 없으면 어항 밖 어둠까지 쓴다.
          얼굴을 덮는 것보다는 유리 너머로 새어 나가는 편이 낫다. */}
      {saying && box.side > 0 && (
        <SpeechBubble
          head={mouthInBox}
          text={speech}
          streaming={speaking}
          gestures={gestures}
          onDismiss={onDismissSaying}
        />
      )}
    </div>
  );
}

/* ─────────────────  먹이  ───────────────── */

function FoodPellets({ count }: { count: number }) {
  const seeds = useRef<{ left: number; delay: number; hue: number }[]>([]);

  useEffect(() => {
    while (seeds.current.length < count) {
      seeds.current.push({
        left: 40 + Math.random() * 22,
        delay: Math.random() * 1.4,
        hue: 22 + Math.random() * 26,
      });
    }
    if (count === 0) seeds.current = [];
  }, [count]);

  if (count === 0) return null;

  const sink = (BOWL.floor - BOWL.surface) * 100;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {seeds.current.slice(0, count).map((s, i) => (
        <span
          key={i}
          className="absolute block rounded-[2px]"
          style={{
            left: `${s.left}%`,
            top: `${BOWL.surface * 100}%`,
            width: "0.5%",
            aspectRatio: "1.2",
            background: `hsl(${s.hue} 66% 56%)`,
            boxShadow: `0 0 5px hsl(${s.hue} 72% 50% / 0.65)`,
            // @ts-expect-error CSS 커스텀 프로퍼티
            "--sink": `${sink}%`,
            animation: "food-sink 8s cubic-bezier(0.3,0,0.7,1) forwards",
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
