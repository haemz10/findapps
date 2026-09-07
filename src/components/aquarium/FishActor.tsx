"use client";

import { useEffect, useRef, useState } from "react";
import { FishSprite } from "./FishSprite";
import { initialState, step, type BehaviorState, cueToTempo } from "@/lib/fish/behavior";
import type { FishActivity, FishCue, FishDesign } from "@/lib/types";

/**
 * 물고기를 실제로 움직이는 부분.
 *
 * React 상태로 매 프레임을 렌더하면 60fps에서 버벅이므로,
 * requestAnimationFrame 안에서 DOM 스타일을 직접 건드린다.
 * 활동(activity)이 바뀔 때만 리렌더가 일어난다.
 */

/** 스프라이트 상자 크기 — 위치 제한 계산의 기준 */
const SPRITE_W = 300;
const SPRITE_H = 200;

interface Props {
  design: FishDesign;
  activity: FishActivity;
  cue: FishCue;
  mood: number;
  clarity: number;
  speaking: boolean;
  hasFood: boolean;
  userTyping: boolean;
  onEatFood?: () => void;
}

export function FishActor({
  design,
  activity,
  cue,
  mood,
  clarity,
  speaking,
  hasFood,
  userTyping,
  onEatFood,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<BehaviorState>(initialState());
  const inputRef = useRef({ activity, mood, hasFood, userTyping, speaking, clarity });
  const eatTimer = useRef(0);
  const boxRef = useRef({ w: 0, h: 0 });
  const [, force] = useState(0);

  inputRef.current = { activity, mood, hasFood, userTyping, speaking, clarity };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const s = step(stateRef.current, inputRef.current, dt);
      stateRef.current = s;

      // 먹이를 먹는 중이면 일정 간격으로 하나씩 삼킨다
      if (inputRef.current.hasFood && s.activity === "eating") {
        eatTimer.current += dt;
        if (eatTimer.current > 0.55) {
          eatTimer.current = 0;
          onEatFood?.();
        }
      } else {
        eatTimer.current = 0;
      }

      const el = wrapRef.current;
      if (el) {
        // 깊이 → 크기·흐림·밝기. 뒤로 갈수록 물에 잠긴다.
        const depth = s.z;
        const scale = (0.5 + depth * 0.72) * design.size;
        const blur = (1 - depth) * 2.5;
        const opacity = 0.42 + depth * 0.58;
        const bright = 0.62 + depth * 0.48;

        // 유리에 몸이 잘리지 않도록, 지금 크기를 기준으로 활동 범위를 좁힌다.
        // 수조 크기는 화면마다 다르므로 매 프레임 실제 크기에서 계산한다.
        const parent = el.parentElement;
        if (parent) {
          const r = parent.getBoundingClientRect();
          if (r.width) boxRef.current = { w: r.width, h: r.height };
        }
        const { w, h } = boxRef.current;
        const marginX = w ? Math.min(0.42, (SPRITE_W * scale * 0.46) / w) : 0.2;
        const marginY = h ? Math.min(0.4, (SPRITE_H * scale * 0.46) / h) : 0.2;
        const x = Math.min(1 - marginX, Math.max(marginX, s.x));
        const y = Math.min(1 - marginY, Math.max(marginY, s.y));

        el.style.left = `${x * 100}%`;
        el.style.top = `${y * 100}%`;
        el.style.transform =
          `translate(-50%, -50%) scale(${scale}) scaleX(${s.dir}) ` +
          `rotate(${s.tilt}deg) rotateY(${s.roll}deg)`;
        el.style.filter = `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(2)})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(5 + Math.round(depth * 8));
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [design.size, onEatFood]);

  // 활동이 바뀌면 스프라이트를 다시 그린다 (지느러미 속도 등)
  useEffect(() => {
    force((n) => n + 1);
  }, [activity, cue]);

  const tempo = cueToTempo(cue);
  const tuned: FishDesign = { ...design, finFlow: design.finFlow * tempo.finFlow };

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute will-change-transform"
      style={{
        left: "50%",
        top: "45%",
        width: SPRITE_W,
        height: SPRITE_H,
        transformStyle: "preserve-3d",
        transition: "none",
      }}
    >
      <FishSprite
        design={tuned}
        activity={activity}
        speaking={speaking}
        className="h-full w-full"
      />
    </div>
  );
}
