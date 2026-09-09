"use client";

import { useState } from "react";
import { FISH_ASSET } from "@/lib/fish/asset";
import { FishSprite } from "./FishSprite";

/**
 * 움직이지 않는 물고기 그림. 온보딩처럼 물고기를 그냥 보여주기만 하면 되는 곳에 쓴다.
 * 수조 안에서 헤엄치는 것은 FishImage 가 맡는다.
 */
export function FishPortrait({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!FISH_ASSET.enabled || failed) {
    return <FishSprite activity="drifting" className={className} />;
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
