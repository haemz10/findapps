"use client";

import { useId, useMemo } from "react";
import type { FishActivity } from "@/lib/types";
import {
  AXIS_Y,
  BODY,
  EYE,
  PECTORAL_ORIGIN,
  VENTRAL_ORIGIN,
  analFin,
  bodyPath,
  dorsalFin,
  gillCover,
  lateralLine,
  mouthPath,
  pectoralFin,
  scaleArcs,
  tailFin,
  ventralFin,
  type Fin,
} from "@/lib/fish/geometry";

/**
 * 베타 한 마리를 사실적으로 그린다.
 *
 * 만화가 되지 않게 지키는 것들:
 *  - 눈은 작다. 흰자 링도, 큼직한 하이라이트도 없다. 어두운 홍채에 아주 작은 반사 한 점.
 *  - 입은 분홍 입술이 아니라 위로 들린 가는 선이다.
 *  - 색은 형광이 아니라 물속에서 가라앉은 색. 발광은 거의 쓰지 않는다.
 *  - 비늘은 잘고, 아가미뚜껑과 옆줄이 있다.
 */

interface Props {
  activity: FishActivity;
  speaking?: boolean;
  className?: string;
}

/** 실제 베타의 흔한 색 — 짙은 청록 몸에 붉게 물드는 지느러미 */
const SKIN = {
  back: "#0d2740",
  flank: "#245b85",
  sheen: "#3f88ac",
  belly: "#7ba8bd",
  finRoot: "#1d4c86",
  finMid: "#5a4a9c",
  finEdge: "#a8443f",
  ray: "#7d5f9e",
  iris: "#3d2a18",
};

export function FishSprite({ activity, speaking, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${uid}`;

  const geo = useMemo(
    () => ({
      body: bodyPath(),
      gill: gillCover(),
      lateral: lateralLine(),
      mouth: mouthPath(),
      tail: tailFin(),
      dorsal: dorsalFin(),
      anal: analFin(),
      pectoral: pectoralFin(),
      ventral: ventralFin(),
      scales: scaleArcs(),
    }),
    []
  );

  const sleeping = activity === "sleeping";
  const lively = activity === "playing";
  const beat = sleeping ? 6.6 : lively ? 1.7 : 3.8;
  const flow = sleeping ? 0.3 : lively ? 1.5 : 1;
  const d = BODY.depth;

  return (
    <svg viewBox="-50 -20 322 220" className={className} style={{ overflow: "visible" }} aria-hidden="true">
      <defs>
        {/* 등은 어둡고 배는 밝다 — 물속 생물의 보호색(countershading) */}
        <linearGradient id={g("skin")} x1="0.45" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor={SKIN.back} />
          <stop offset="34%" stopColor={SKIN.flank} />
          <stop offset="56%" stopColor={SKIN.sheen} />
          <stop offset="74%" stopColor={SKIN.flank} />
          <stop offset="100%" stopColor={SKIN.belly} />
        </linearGradient>

        {/* 비늘의 무지갯빛 — 아주 옅게, 각도에 따라 흐른다 */}
        <linearGradient id={g("iridescent")} x1="0.1" y1="0.2" x2="0.9" y2="0.8">
          <stop offset="0%" stopColor="#4fd8e8" stopOpacity="0.16" />
          <stop offset="38%" stopColor="#7f8fe8" stopOpacity="0.08" />
          <stop offset="62%" stopColor="#d88fb8" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#6fe8c0" stopOpacity="0.14" />
          <animate attributeName="x1" values="0.1;0.5;0.1" dur="15s" repeatCount="indefinite" />
        </linearGradient>

        {/* 지느러미: 뿌리는 짙고 끝으로 가며 붉어지고 투명해진다 */}
        <radialGradient id={g("finTail")} cx="1" cy="0.5" r="1.05">
          <stop offset="0%" stopColor={SKIN.finRoot} stopOpacity="0.9" />
          <stop offset="30%" stopColor={SKIN.finRoot} stopOpacity="0.62" />
          <stop offset="62%" stopColor={SKIN.finMid} stopOpacity="0.44" />
          <stop offset="88%" stopColor={SKIN.finEdge} stopOpacity="0.34" />
          <stop offset="100%" stopColor={SKIN.finEdge} stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id={g("finUp")} cx="0.5" cy="1" r="1.05">
          <stop offset="0%" stopColor={SKIN.finRoot} stopOpacity="0.88" />
          <stop offset="38%" stopColor={SKIN.finRoot} stopOpacity="0.56" />
          <stop offset="72%" stopColor={SKIN.finMid} stopOpacity="0.4" />
          <stop offset="100%" stopColor={SKIN.finEdge} stopOpacity="0.16" />
        </radialGradient>
        <radialGradient id={g("finDown")} cx="0.5" cy="0" r="1.05">
          <stop offset="0%" stopColor={SKIN.finRoot} stopOpacity="0.88" />
          <stop offset="38%" stopColor={SKIN.finRoot} stopOpacity="0.56" />
          <stop offset="72%" stopColor={SKIN.finMid} stopOpacity="0.4" />
          <stop offset="100%" stopColor={SKIN.finEdge} stopOpacity="0.16" />
        </radialGradient>

        {/* 물결에 의한 미세한 왜곡 — 물속에 있다는 신호 */}
        <filter id={g("ripple")} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="5" result="n">
            <animate
              attributeName="baseFrequency"
              dur="23s"
              values="0.008 0.02; 0.012 0.016; 0.008 0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* 위에서 내려오는 빛 — 사각형으로 덮으면 몸 한가운데 가로선이 생긴다 */}
        <linearGradient id={g("shade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04101c" stopOpacity="0.42" />
          <stop offset="34%" stopColor="#04101c" stopOpacity="0.1" />
          <stop offset="56%" stopColor="#04101c" stopOpacity="0" />
          <stop offset="72%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.14" />
        </linearGradient>

        <clipPath id={g("clip")}>
          <path d={geo.body} />
        </clipPath>
      </defs>

      <g filter={`url(#${g("ripple")})`}>
        {/* ── 꼬리 ── */}
        <FinGroup
          fin={geo.tail}
          fill={`url(#${g("finTail")})`}
          origin={`${64}px ${AXIS_Y}px`}
          anim="tail-sway"
          dur={beat}
          flow={flow}
        />

        {/* ── 등지느러미 ── */}
        <FinGroup
          fin={geo.dorsal}
          fill={`url(#${g("finUp")})`}
          origin={`120px ${AXIS_Y - d}px`}
          anim="fin-wave"
          dur={beat * 1.25}
          flow={flow}
          opacity={0.9}
        />

        {/* ── 뒷지느러미 ── */}
        <FinGroup
          fin={geo.anal}
          fill={`url(#${g("finDown")})`}
          origin={`140px ${AXIS_Y + d}px`}
          anim="fin-wave"
          dur={beat * 1.45}
          flow={flow}
          reverse
          opacity={0.88}
        />

        {/* ── 몸통 ── */}
        <g>
          <path d={geo.body} fill={`url(#${g("skin")})`} />

          <g clipPath={`url(#${g("clip")})`}>
            {/* 비늘 — 잘게, 두 겹으로 (밝은 위쪽 테두리 + 아래쪽 그림자) */}
            <g fill="none" strokeLinecap="round">
              <g stroke="#ffffff" strokeOpacity="0.09" strokeWidth="0.7">
                {geo.scales.map((p, i) => (
                  <path key={i} d={p} />
                ))}
              </g>
              <g stroke="#04101c" strokeOpacity="0.11" strokeWidth="0.6" transform="translate(0 1)">
                {geo.scales.map((p, i) => (
                  <path key={i} d={p} />
                ))}
              </g>
            </g>

            <rect x="-60" y="-40" width="380" height="280" fill={`url(#${g("iridescent")})`} />

            {/* 등쪽 그늘에서 배쪽 반사로 끊김 없이 이어진다 */}
            <rect
              x="-60"
              y={AXIS_Y - d * 1.25}
              width="380"
              height={d * 2.5}
              fill={`url(#${g("shade")})`}
            />

            {/* 옆줄 */}
            <path
              d={geo.lateral}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.18"
              strokeWidth="1"
              strokeDasharray="1 4"
              strokeLinecap="round"
            />

            {/* 아가미뚜껑 — 숨을 쉰다 */}
            <g
              style={{
                transformOrigin: `${190}px ${AXIS_Y}px`,
                animation: `gill-breathe ${sleeping ? 5.6 : 2.8}s ease-in-out infinite`,
              }}
            >
              <path d={geo.gill} fill="none" stroke="#04101c" strokeOpacity="0.34" strokeWidth="2" strokeLinecap="round" />
              <path
                d={geo.gill}
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.2"
                strokeWidth="0.9"
                strokeLinecap="round"
                transform="translate(2 0)"
              />
            </g>
          </g>

          {/* 윤곽 — 물속의 빛이 등을 따라 흐른다 */}
          <path d={geo.body} fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />
        </g>

        {/* ── 배지느러미 ── */}
        <FinGroup
          fin={geo.ventral}
          fill={`url(#${g("finDown")})`}
          origin={`${VENTRAL_ORIGIN.x}px ${VENTRAL_ORIGIN.y}px`}
          anim="fin-wave"
          dur={beat * 0.85}
          flow={flow}
          opacity={0.62}
        />

        {/* ── 가슴지느러미 — 거의 투명하다 ── */}
        <g
          style={{
            transformOrigin: `${PECTORAL_ORIGIN.x}px ${PECTORAL_ORIGIN.y}px`,
            animation: `pectoral-flutter ${beat * 0.42}s ease-in-out infinite`,
          }}
        >
          <path d={geo.pectoral.membrane} fill={`url(#${g("finDown")})`} opacity="0.3" />
          <g fill="none" stroke={SKIN.ray} strokeOpacity="0.22" strokeWidth="0.7">
            {geo.pectoral.rays.map((p, i) => (
              <path key={i} d={p} />
            ))}
          </g>
        </g>

        {/* ── 얼굴 ── */}
        <Eye sleeping={sleeping} />
        <path
          d={geo.mouth}
          fill="none"
          stroke="#04101c"
          strokeOpacity="0.5"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          {speaking && !sleeping && (
            <animate attributeName="stroke-width" values="1.8;3.2;1.6;1.8" dur="0.8s" repeatCount="indefinite" />
          )}
        </path>

        {sleeping && (
          <g fill="#cfe0ff" fillOpacity="0.55" fontSize="16" fontWeight="600">
            <text x="214" y="30" style={{ animation: "sleep-z 4.6s ease-out infinite" }}>
              z
            </text>
            <text x="224" y="17" fontSize="11" style={{ animation: "sleep-z 4.6s ease-out infinite 1.6s" }}>
              z
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}

/* ─────────────────────────  지느러미 렌더  ───────────────────────── */

function FinGroup({
  fin,
  fill,
  origin,
  anim,
  dur,
  flow,
  reverse,
  opacity = 1,
}: {
  fin: Fin;
  fill: string;
  origin: string;
  anim: string;
  dur: number;
  flow: number;
  reverse?: boolean;
  opacity?: number;
}) {
  return (
    <g
      opacity={opacity}
      style={{
        transformOrigin: origin,
        animation: `${anim} ${dur}s ease-in-out infinite${reverse ? " reverse" : ""}`,
        // @ts-expect-error CSS 커스텀 프로퍼티
        "--flow": flow,
      }}
    >
      <path d={fin.membrane} fill={fill} />
      {/* 살 — 지느러미가 종잇조각이 아니라 뼈대 있는 기관으로 보이게 한다 */}
      <g fill="none" strokeLinecap="round">
        <g stroke={SKIN.ray} strokeOpacity="0.42" strokeWidth="1.1">
          {fin.rays.map((p, i) => (
            <path key={i} d={p} />
          ))}
        </g>
        <g stroke="#ffffff" strokeOpacity="0.14" strokeWidth="0.5" transform="translate(0 -0.7)">
          {fin.rays.map((p, i) => (
            <path key={i} d={p} />
          ))}
        </g>
      </g>
    </g>
  );
}

/* ─────────────────────────  눈  ───────────────────────── */

/**
 * 작고 어둡다. 물고기의 눈에는 흰자가 보이지 않고, 하이라이트는 아주 작은 점 하나다.
 * 여기를 키우는 순간 실물이 아니라 캐릭터가 된다.
 */
function Eye({ sleeping }: { sleeping: boolean }) {
  const { cx, cy, r } = EYE;

  if (sleeping) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="#0a1826" fillOpacity="0.55" />
        <path
          d={`M ${cx - r} ${cy} Q ${cx} ${cy + r * 0.7} ${cx + r} ${cy - 1}`}
          fill="none"
          stroke="#04101c"
          strokeOpacity="0.7"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g>
      {/* 눈두덩 그늘 */}
      <circle cx={cx} cy={cy} r={r + 1.6} fill="#04101c" fillOpacity="0.3" />
      {/* 홍채 */}
      <circle cx={cx} cy={cy} r={r} fill={SKIN.iris} />
      {/* 동공 */}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#050a12" />
      {/* 각막 반사 — 딱 한 점, 아주 작게 */}
      <circle cx={cx - r * 0.3} cy={cy - r * 0.34} r={r * 0.2} fill="#ffffff" fillOpacity="0.9" />
      {/* 젖은 표면의 넓은 반사 */}
      <ellipse cx={cx} cy={cy - r * 0.5} rx={r * 0.72} ry={r * 0.28} fill="#ffffff" fillOpacity="0.1" />
    </g>
  );
}
