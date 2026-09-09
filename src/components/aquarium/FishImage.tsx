"use client";

import { useState } from "react";
import { FISH_ASSET } from "@/lib/fish/asset";
import type { FishActivity, FishCue } from "@/lib/types";

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
  /** 대화가 만든 기분 — 움직임의 결을 바꾼다 */
  cue: FishCue;
  speaking?: boolean;
  className?: string;
}

/** 기분에 따른 움직임 배율 — 그림은 표정을 바꿀 수 없으니 몸짓으로 말한다 */
const TEMPO: Record<FishCue, { amp: number; speed: number }> = {
  playful: { amp: 1.8, speed: 1.7 },
  curious: { amp: 1.25, speed: 1.25 },
  warm: { amp: 1.1, speed: 1.05 },
  calm: { amp: 1, speed: 1 },
  steady: { amp: 0.8, speed: 0.85 },
  concerned: { amp: 0.65, speed: 0.7 },
  sleepy: { amp: 0.5, speed: 0.55 },
};

export function FishImage({ activity, cue, speaking, className }: Props) {
  const [failed, setFailed] = useState(false);

  // 그림이 아직 없을 때. 앱이 깨지는 것보다는 빈 어항이 낫다.
  if (failed) return <MissingAsset className={className} />;

  const sleeping = activity === "sleeping";
  const lively = activity === "playing";

  // 활동과 기분이 함께 흔들림의 폭과 속도를 정한다
  const t = sleeping ? TEMPO.sleepy : TEMPO[cue];
  const sway = (sleeping ? 1.2 : lively ? 5 : 2.6) * t.amp;
  const swayDur = (sleeping ? 11 : lively ? 2.6 : 6.2) / t.speed;
  const bob = (sleeping ? 1.5 : lively ? 7 : 3.4) * t.amp;
  const bobDur = (sleeping ? 9 : lively ? 2.1 : 5.1) / t.speed;
  const breathDur = (sleeping ? 7.5 : 3.8) / t.speed;

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

/**
 * public/fish/betta.png 가 없을 때.
 * 물고기를 흉내 내지 않는다 — 없으면 없다고 말하는 편이 정직하다.
 */
function MissingAsset({ className }: { className?: string }) {
  return (
    <div className={`${className ?? ""} grid place-items-center`}>
      <div className="rounded-2xl border border-dashed border-white/20 bg-black/40 px-4 py-3 text-center backdrop-blur-sm">
        <p className="text-[12px] leading-relaxed text-ink-dim">
          물고기 그림이 아직 없어요
          <br />
          <span className="text-ink-faint">public/fish/betta.png</span>
        </p>
      </div>
    </div>
  );
}
