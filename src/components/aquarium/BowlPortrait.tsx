"use client";

import { BOWL } from "@/lib/fish/asset";

/** 온보딩처럼 어항을 그냥 보여주기만 하면 되는 곳 */
export function BowlPortrait({ className }: { className?: string }) {
  return (
    <div
      className={`${className ?? ""} grid place-items-center`}
      style={{ animation: "bowl-breathe 6.2s ease-in-out infinite" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BOWL.src}
        alt="유리 어항 속의 물고기"
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </div>
  );
}
