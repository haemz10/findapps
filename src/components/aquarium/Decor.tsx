"use client";

/**
 * 수조 장식 — 돌멩이, 산호초, 수초, 산소 호흡기.
 * 유료 아이템이 붙을 자리를 대비해 목록으로 두고 렌더한다.
 */

export interface DecorItem {
  id: string;
  kind: "rock" | "coral" | "plant" | "airstone" | "driftwood";
  /** 0~1 수조 가로 위치 */
  x: number;
  /** 원근 — 0(뒤) ~ 1(앞) */
  depth: number;
  scale: number;
  hue: number;
  flip?: boolean;
}

export const DEFAULT_DECOR: DecorItem[] = [
  { id: "r1", kind: "rock", x: 0.16, depth: 0.22, scale: 1.1, hue: 215 },
  { id: "r2", kind: "rock", x: 0.62, depth: 0.16, scale: 0.8, hue: 208 },
  { id: "d1", kind: "driftwood", x: 0.84, depth: 0.28, scale: 0.95, hue: 26 },
  { id: "c1", kind: "coral", x: 0.9, depth: 0.62, scale: 0.9, hue: 340 },
  { id: "c2", kind: "coral", x: 0.08, depth: 0.5, scale: 0.72, hue: 190 },
  { id: "p1", kind: "plant", x: 0.03, depth: 0.72, scale: 1.2, hue: 150 },
  { id: "p2", kind: "plant", x: 0.72, depth: 0.4, scale: 0.85, hue: 158, flip: true },
  { id: "p3", kind: "plant", x: 0.97, depth: 0.7, scale: 1.05, hue: 145 },
  { id: "a1", kind: "airstone", x: 0.3, depth: 0.14, scale: 1, hue: 210 },
];

export function Decor({ items = DEFAULT_DECOR }: { items?: DecorItem[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {[...items]
        .sort((a, b) => a.depth - b.depth)
        .map((it) => (
          <DecorPiece key={it.id} item={it} />
        ))}
    </div>
  );
}

function DecorPiece({ item }: { item: DecorItem }) {
  // 뒤에 있을수록 작고 흐리고 파랗게 — 물의 원근
  const scale = (0.62 + item.depth * 0.55) * item.scale;
  const blur = (1 - item.depth) * 2.6;
  const opacity = 0.42 + item.depth * 0.5;

  const style: React.CSSProperties = {
    left: `${item.x * 100}%`,
    transform: `translateX(-50%) scale(${scale}) ${item.flip ? "scaleX(-1)" : ""}`,
    filter: `blur(${blur}px) brightness(${(0.45 + item.depth * 0.5).toFixed(2)}) saturate(${(0.5 + item.depth * 0.4).toFixed(2)})`,
    opacity,
    zIndex: Math.round(item.depth * 10),
  };

  return (
    <div className="absolute bottom-0 origin-bottom" style={style}>
      {item.kind === "rock" && <Rock hue={item.hue} />}
      {item.kind === "coral" && <Coral hue={item.hue} />}
      {item.kind === "plant" && <Plant hue={item.hue} />}
      {item.kind === "driftwood" && <Driftwood hue={item.hue} />}
      {item.kind === "airstone" && <AirStone hue={item.hue} />}
    </div>
  );
}

function Rock({ hue }: { hue: number }) {
  return (
    <svg width="150" height="86" viewBox="0 0 150 86" aria-hidden="true">
      <defs>
        <linearGradient id={`rock${hue}`} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 16% 22%)`} />
          <stop offset="60%" stopColor={`hsl(${hue} 20% 12%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 24% 6%)`} />
        </linearGradient>
      </defs>
      <path
        d="M4 86 C6 58 24 34 52 24 C82 13 118 22 134 46 C142 58 146 72 148 86 Z"
        fill={`url(#rock${hue})`}
      />
      <path
        d="M44 30 C62 20 88 22 104 34"
        stroke="#cfe4ff"
        strokeOpacity="0.16"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="66" cy="46" rx="20" ry="9" fill="#000" opacity="0.16" />
    </svg>
  );
}

function Driftwood({ hue }: { hue: number }) {
  return (
    <svg width="190" height="130" viewBox="0 0 190 130" aria-hidden="true">
      <defs>
        <linearGradient id={`wood${hue}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 18% 17%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 22% 7%)`} />
        </linearGradient>
      </defs>
      <path
        d="M18 130 C26 96 48 74 74 62 C58 52 46 34 48 16 C64 30 82 40 100 42 C118 30 140 26 162 32 C144 44 130 60 124 78 C142 84 160 100 168 130 Z"
        fill={`url(#wood${hue})`}
      />
      <path
        d="M60 118 C70 92 88 74 110 66"
        stroke="#000"
        strokeOpacity="0.28"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

function Coral({ hue }: { hue: number }) {
  return (
    <svg width="112" height="150" viewBox="0 0 112 150" aria-hidden="true">
      <defs>
        <linearGradient id={`coral${hue}`} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor={`hsl(${hue} 22% 9%)`} />
          <stop offset="55%" stopColor={`hsl(${hue} 30% 20%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 42% 34%)`} />
        </linearGradient>
      </defs>
      <g
        style={{ transformOrigin: "56px 150px", animation: "plant-sway 8.5s ease-in-out infinite" }}
        stroke={`url(#coral${hue})`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M56 150 L56 96" />
        <path d="M56 108 C42 96 34 76 36 54" />
        <path d="M56 104 C70 92 80 70 78 46" />
        <path d="M56 120 C46 112 38 100 34 86" />
        <path d="M56 116 C68 108 76 96 82 84" />
        <path d="M36 54 C30 46 28 36 30 26" strokeWidth="6" />
        <path d="M78 46 C84 38 86 28 84 18" strokeWidth="6" />
      </g>
      <g fill={`hsl(${hue} 50% 46%)`} opacity="0.32">
        <circle cx="30" cy="24" r="4" />
        <circle cx="84" cy="16" r="4.5" />
        <circle cx="56" cy="92" r="3.5" />
      </g>
    </svg>
  );
}

function Plant({ hue }: { hue: number }) {
  const blades = [
    { d: "M40 170 C22 130 16 84 26 40", w: 9, delay: 0 },
    { d: "M40 170 C36 128 34 82 40 34", w: 11, delay: 0.9 },
    { d: "M40 170 C54 132 66 90 62 46", w: 8, delay: 1.7 },
    { d: "M40 170 C50 138 58 108 60 78", w: 6, delay: 2.4 },
    { d: "M40 170 C28 142 20 116 18 92", w: 6, delay: 3.1 },
  ];
  return (
    <svg width="80" height="170" viewBox="0 0 80 170" aria-hidden="true">
      <defs>
        <linearGradient id={`plant${hue}`} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor={`hsl(${hue} 24% 7%)`} />
          <stop offset="70%" stopColor={`hsl(${hue} 26% 17%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 32% 27%)`} />
        </linearGradient>
      </defs>
      {blades.map((b, i) => (
        <path
          key={i}
          d={b.d}
          stroke={`url(#plant${hue})`}
          strokeWidth={b.w}
          strokeLinecap="round"
          fill="none"
          style={{
            transformOrigin: "40px 170px",
            animation: `plant-sway ${6 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </svg>
  );
}

function AirStone({ hue }: { hue: number }) {
  return (
    <div className="relative">
      <svg width="76" height="26" viewBox="0 0 76 26" aria-hidden="true">
        <defs>
          <linearGradient id={`air${hue}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue} 10% 24%)`} />
            <stop offset="100%" stopColor={`hsl(${hue} 14% 9%)`} />
          </linearGradient>
        </defs>
        <rect x="0" y="8" width="76" height="18" rx="8" fill={`url(#air${hue})`} />
        <rect x="6" y="10" width="64" height="4" rx="2" fill="#fff" opacity="0.12" />
      </svg>
      {/* 산소 방울 기둥 */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 h-px w-16 -translate-x-1/2">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-white/30"
            style={{
              left: `${8 + ((i * 37) % 46)}%`,
              width: 3 + ((i * 7) % 5),
              height: 3 + ((i * 7) % 5),
              // @ts-expect-error CSS 커스텀 프로퍼티
              "--rise": `${300 + ((i * 53) % 180)}px`,
              "--drift": `${((i % 5) - 2) * 9}px`,
              "--bubble-opacity": 0.45,
              animation: `bubble-rise ${5.5 + ((i * 11) % 40) / 10}s linear infinite`,
              animationDelay: `${(i * 0.42) % 6}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
