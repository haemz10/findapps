"use client";

import { useEffect, useRef, useState } from "react";
import { FishSprite } from "./FishSprite";
import { FishImage } from "./FishImage";
import { FISH_ASSET } from "@/lib/fish/asset";
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
  /** 얼굴이 어디 있는지 알려준다 — 말풍선이 여기서 나온다 (수조 대비 0~1) */
  onHead?: (p: { x: number; y: number; dir: 1 | -1; scale: number }) => void;
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
  onHead,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<BehaviorState>(initialState());
  const inputRef = useRef({ activity, mood, hasFood, userTyping, speaking, clarity });
  const eatTimer = useRef(0);
  const boxRef = useRef({ w: 0, h: 0 });
  const headRef = useRef({ x: -1, y: -1 });
  const onHeadRef = useRef(onHead);
  const [, force] = useState(0);

  onHeadRef.current = onHead;

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
        const parent = el.parentElement;
        if (parent) {
          const r = parent.getBoundingClientRect();
          if (r.width) boxRef.current = { w: r.width, h: r.height };
        }

        // 깊이 → 크기·흐림·밝기. 뒤로 갈수록 물에 잠긴다.
        const depth = s.z;
        // 수조가 작으면 물고기도 작아야 한다. 작은 화면에서 물고기가 유리를 꽉 채우면
        // 헤엄칠 공간이 사라지고 잘려 보인다.
        const fit = boxRef.current.w
          ? Math.max(0.62, Math.min(1.12, boxRef.current.w / 420))
          : 1;
        const scale = (0.54 + depth * 0.7) * design.size * fit;
        // 흐림은 아주 뒤로 물러났을 때만. 물속이라는 느낌만 주면 되고,
        // 물고기를 들여다보는 게 이 앱의 전부이므로 대부분의 시간은 선명해야 한다.
        const blur = Math.max(0, 0.62 - depth) * 2.6;
        const opacity = 0.68 + depth * 0.32;
        const bright = 0.82 + depth * 0.26;

        // 유리에 몸이 잘리지 않도록, 지금 크기를 기준으로 활동 범위를 좁힌다.
        // 수조 크기는 화면마다 다르므로 매 프레임 실제 크기에서 계산한다.
        const { w, h } = boxRef.current;
        const marginX = w ? Math.min(0.42, (SPRITE_W * scale * 0.46) / w) : 0.2;
        const marginY = h ? Math.min(0.4, (SPRITE_H * scale * 0.46) / h) : 0.2;
        const x = Math.min(1 - marginX, Math.max(marginX, s.x));
        const y = Math.min(1 - marginY, Math.max(marginY, s.y));

        el.style.left = `${x * 100}%`;
        el.style.top = `${y * 100}%`;
        // 정면을 보는 그림은 뒤집으면 어색하다 — 방향은 살짝 기우는 것으로만 표현한다
        const flip = FISH_ASSET.frontFacing ? 1 : s.dir;
        const lean = FISH_ASSET.frontFacing ? s.dir * 3 : 0;
        el.style.transform =
          `translate(-50%, -50%) scale(${scale}) scaleX(${flip}) ` +
          `rotate(${s.tilt + lean}deg) rotateY(${s.roll}deg)`;
        el.style.filter = `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(2)})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(5 + Math.round(depth * 8));

        // 얼굴 위치를 바깥에 알려준다. 매 프레임 부모를 리렌더하면 60fps 가 무너지므로
        // 눈에 띄게 움직였을 때만 보고한다.
        if (onHeadRef.current && w && h) {
          // 주둥이는 그림 안에서 어디 있는지가 정해져 있다 (asset.ts)
          const mouthX = FISH_ASSET.mouth.x - 0.5;
          const mouthY = FISH_ASSET.mouth.y - 0.5;
          const hx = x + (SPRITE_W * mouthX * scale * (FISH_ASSET.frontFacing ? 1 : s.dir)) / w;
          const hy = y + (SPRITE_H * mouthY * scale) / h;
          if (
            Math.abs(hx - headRef.current.x) > 0.006 ||
            Math.abs(hy - headRef.current.y) > 0.006
          ) {
            headRef.current = { x: hx, y: hy };
            onHeadRef.current({ x: hx, y: hy, dir: s.dir, scale });
          }
        }
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
      {/* 그림이 있으면 그림으로, 없으면 계산해서 그린 물고기로 */}
      <FishImage
        activity={activity}
        speaking={speaking}
        className="relative h-full w-full"
        fallback={
          <FishSprite
            design={tuned}
            activity={activity}
            speaking={speaking}
            className="h-full w-full"
          />
        }
      />
    </div>
  );
}
