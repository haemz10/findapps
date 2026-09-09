"use client";

import { useState } from "react";
import { FISH_ASSET } from "@/lib/fish/asset";
import type { FishActivity } from "@/lib/types";

/**
 * 그림 한 장으로 그리는 물고기.
 *
 * 계산으로 그리던 물고기와 달리 지느러미를 따로 흔들 수 없으므로,
 * 살아있는 느낌은 전부 몸 전체의 움직임에서 나와야 한다 —
 * 아주 느린 좌우 흔들림, 위아래 부유, 숨 쉬듯한 크기 변화.
 * 이 셋의 주기를 서로 어긋나게 두면 기계적으로 보이지 않는다.
 */

interface Props {
  activity: FishActivity;
  speaking?: boolean;
  /** 그림을 못 불러왔을 때 대신 보여줄 것 */
  fallback: React.ReactNode;
  className?: string;
}

export function FishImage({ activity, speaking, fallback, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  const sleeping = activity === "sleeping";
  const lively = activity === "playing";

  // 활동에 따라 흔들림의 폭과 속도가 달라진다
  const sway = sleeping ? 1.2 : lively ? 5 : 2.6;
  const swayDur = sleeping ? 11 : lively ? 2.6 : 6.2;
  const bob = sleeping ? 1.5 : lively ? 7 : 3.4;
  const bobDur = sleeping ? 9 : lively ? 2.1 : 5.1;
  const breathDur = sleeping ? 7.5 : 3.8;

  return (
    <div
      className={className}
      style={{
        // 세 겹의 어긋난 주기 — 하나만 쓰면 시계추처럼 보인다
        animation: `fish-sway ${swayDur}s ease-in-out infinite`,
        // @ts-expect-error CSS 커스텀 프로퍼티
        "--sway": `${sway}deg`,
      }}
    >
      <div
        style={{
          height: "100%",
          animation: `fish-bob ${bobDur}s ease-in-out infinite`,
          // @ts-expect-error CSS 커스텀 프로퍼티
          "--bob": `${bob}px`,
        }}
      >
        <div
          style={{
            height: "100%",
            animation: `fish-breathe ${breathDur}s ease-in-out infinite`,
            // 말할 때는 아주 살짝 앞뒤로 — 말을 하고 있다는 신호
            ...(speaking && !sleeping
              ? { animation: `fish-breathe ${breathDur}s ease-in-out infinite, fish-talk 0.9s ease-in-out infinite` }
              : null),
          }}
        >
          {/* next/image 대신 평범한 img — 매 프레임 변형되는 스프라이트라
              최적화 파이프라인을 거칠 이유가 없고, 어떤 파일을 넣어도 그대로 뜬다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FISH_ASSET.src}
            alt=""
            draggable={false}
            onError={() => setFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              // 잠들면 색이 가라앉는다
              filter: sleeping ? "brightness(0.7) saturate(0.75)" : undefined,
              transition: "filter 1.2s ease",
            }}
          />
        </div>
      </div>

      {sleeping && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[68%] top-[8%] text-[15px] font-semibold text-sky-100/70"
        >
          <span className="absolute" style={{ animation: "sleep-z 4.4s ease-out infinite" }}>
            z
          </span>
          <span
            className="absolute text-[11px]"
            style={{ left: 9, top: -8, animation: "sleep-z 4.4s ease-out infinite 1.5s" }}
          >
            z
          </span>
        </div>
      )}
    </div>
  );
}
