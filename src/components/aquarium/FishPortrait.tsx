"use client";

import { useState } from "react";
import { FISH_ASSET } from "@/lib/fish/asset";

/**
 * 움직이지 않는 물고기 그림. 온보딩처럼 물고기를 그냥 보여주기만 하면 되는 곳에 쓴다.
 * 수조 안에서 헤엄치는 것은 FishImage 가 맡는다.
 */
export function FishPortrait({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className ?? ""} grid place-items-center`}>
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-4 text-center">
          <p className="text-[12px] leading-relaxed text-ink-faint">
            물고기 그림이 아직 없어요
            <br />
            public/fish/betta.png
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ animation: "fish-bob 5.4s ease-in-out infinite" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FISH_ASSET.src}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
