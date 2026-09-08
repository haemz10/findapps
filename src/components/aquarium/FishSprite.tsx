"use client";

import { useId, useMemo } from "react";
import type { FishActivity, FishDesign } from "@/lib/types";
import {
  AXIS_Y,
  analFin,
  bodyMetrics,
  bodyPath,
  dorsalFin,
  pectoralFin,
  scaleArcs,
  tailFin,
  ventralFin,
  type Fin,
} from "@/lib/fish/geometry";

/**
 * 물고기 그리기.
 *
 * 모든 형태는 geometry.ts 가 계산한다. 여기서는 색과 빛만 얹는다.
 * 살아있어 보이게 만드는 것은 결국 네 가지다 —
 * 눈의 하이라이트, 지느러미를 통과하는 빛, 비늘의 미세한 반사, 그리고 숨(아가미).
 */

interface Props {
  design: FishDesign;
  activity: FishActivity;
  speaking?: boolean;
  className?: string;
}

export function FishSprite({ design, activity, speaking, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${uid}`;

  const geo = useMemo(
    () => ({
      body: bodyPath(design.bodyShape),
      metrics: bodyMetrics(design.bodyShape),
      tail: tailFin(design.finStyle, design.bodyShape),
      dorsal: dorsalFin(design.finStyle, design.bodyShape),
      anal: analFin(design.finStyle, design.bodyShape),
      pectoral: pectoralFin(design.bodyShape),
      ventral: ventralFin(design.bodyShape),
      scales: scaleArcs(design.bodyShape),
    }),
    [design.bodyShape, design.finStyle]
  );

  // 예전에 저장된 물고기에는 중간색이 없다 — 양 끝을 섞어서 채운다
  const finMid = design.finMid ?? mixHex(design.finInner, design.finOuter, 0.5);

  const sleeping = activity === "sleeping";
  const flow = design.finFlow * (sleeping ? 0.25 : activity === "playing" ? 1.55 : 1);
  const beat = sleeping ? 6.4 : activity === "playing" ? 1.6 : activity === "eating" ? 2.1 : 3.6;

  const eyeOpen = sleeping ? 0 : design.eyeShape === "sleepy" ? 0.6 : 1;
  const m = geo.metrics;

  return (
    <svg
      viewBox="-52 -18 320 216"
      className={className}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        {/* 몸통 — 등은 진하고 배는 밝다 (실제 물고기의 countershading) */}
        <linearGradient id={g("body")} x1="0.42" y1="0" x2="0.58" y2="1">
          <stop offset="0%" stopColor={design.bodyBottom} />
          <stop offset="22%" stopColor={design.bodyMid} />
          <stop offset="50%" stopColor={design.bodyTop} />
          <stop offset="62%" stopColor={design.bodyMid} />
          <stop offset="100%" stopColor={design.bodyBottom} />
        </linearGradient>

        {/* 머리 쪽 스포트라이트 */}
        <radialGradient id={g("head")} cx="0.8" cy="0.3" r="0.4">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* 등쪽 그림자 */}
        <linearGradient id={g("dorsalShade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#03060c" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#03060c" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#03060c" stopOpacity="0" />
        </linearGradient>

        {/* 배쪽 반사 */}
        <linearGradient id={g("belly")} x1="0" y1="0.5" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
        </linearGradient>

        {/* 지느러미 막 — 뿌리에서 끝으로 가며 색이 번지고 투명해진다.
            베타의 지느러미가 아름다운 이유는 이 색 번짐 때문이다. */}
        <radialGradient id={g("finTail")} cx="1" cy="0.5" r="1.05">
          <stop offset="0%" stopColor={design.finInner} stopOpacity="0.92" />
          <stop offset="26%" stopColor={design.finInner} stopOpacity="0.66" />
          <stop offset="56%" stopColor={finMid} stopOpacity="0.5" />
          <stop offset="82%" stopColor={design.finOuter} stopOpacity="0.4" />
          <stop offset="100%" stopColor={design.finOuter} stopOpacity="0.14" />
        </radialGradient>
        <radialGradient id={g("finUp")} cx="0.5" cy="1" r="1.05">
          <stop offset="0%" stopColor={design.finInner} stopOpacity="0.88" />
          <stop offset="34%" stopColor={design.finInner} stopOpacity="0.6" />
          <stop offset="66%" stopColor={finMid} stopOpacity="0.46" />
          <stop offset="100%" stopColor={design.finOuter} stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id={g("finDown")} cx="0.5" cy="0" r="1.05">
          <stop offset="0%" stopColor={design.finInner} stopOpacity="0.88" />
          <stop offset="34%" stopColor={design.finInner} stopOpacity="0.6" />
          <stop offset="66%" stopColor={finMid} stopOpacity="0.46" />
          <stop offset="100%" stopColor={design.finOuter} stopOpacity="0.18" />
        </radialGradient>

        {/* 홍채 */}
        <radialGradient id={g("iris")} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0%" stopColor={lighten(design.eyeColor, 0.45)} />
          <stop offset="48%" stopColor={design.eyeColor} />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>

        {/* 발광 */}
        <filter id={g("glow")} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={1.4 + design.glow * 3.6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* 물결에 의한 미세한 왜곡 */}
        <filter id={g("ripple")} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.022" numOctaves="2" seed="9" result="n">
            <animate
              attributeName="baseFrequency"
              dur="21s"
              values="0.009 0.022; 0.013 0.017; 0.009 0.022"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <clipPath id={g("clip")}>
          <path d={geo.body} />
        </clipPath>

        <ScaleFill id={g("scaleFill")} design={design} />
      </defs>

      <g filter={design.glow > 0.1 ? `url(#${g("glow")})` : undefined}>
        <g filter={`url(#${g("ripple")})`}>
          {/* ───── 꼬리 (맨 뒤) ───── */}
          <FinGroup
            fin={geo.tail}
            fill={`url(#${g("finTail")})`}
            rayColor={finMid}
            origin="66px 90px"
            anim="tail-sway"
            dur={beat}
            flow={flow}
            opacity={0.95}
          />

          {/* ───── 등지느러미 ───── */}
          <FinGroup
            fin={geo.dorsal}
            fill={`url(#${g("finUp")})`}
            rayColor={finMid}
            origin={`130px ${AXIS_Y - m.depth * 0.86}px`}
            anim="fin-wave"
            dur={beat * 1.2}
            flow={flow}
            opacity={0.82}
          />

          {/* ───── 뒷지느러미 ───── */}
          <FinGroup
            fin={geo.anal}
            fill={`url(#${g("finDown")})`}
            rayColor={finMid}
            origin={`138px ${AXIS_Y + m.depth * m.bellyDrop * 0.86}px`}
            anim="fin-wave"
            dur={beat * 1.35}
            flow={flow}
            reverse
            opacity={0.78}
          />

          {/* ───── 몸통 ───── */}
          <g>
            <path d={geo.body} fill={`url(#${g("body")})`} />

            <g clipPath={`url(#${g("clip")})`}>
              {/* 비늘 */}
              <g
                fill="none"
                stroke="#ffffff"
                strokeOpacity={design.scalePattern === "plain" ? 0 : 0.08}
                strokeWidth="1.1"
                strokeLinecap="round"
              >
                {geo.scales.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g
                fill="none"
                stroke="#04070e"
                strokeOpacity={design.scalePattern === "plain" ? 0 : 0.07}
                strokeWidth="1"
                transform="translate(0 1.4)"
              >
                {geo.scales.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>

              {/* 무늬 오버레이 */}
              <rect x="-60" y="-30" width="360" height="260" fill={`url(#${g("scaleFill")})`} />
              {/* 빛 */}
              <rect x="-60" y="-30" width="360" height="260" fill={`url(#${g("head")})`} />
              <rect x="-60" y={AXIS_Y} width="360" height="140" fill={`url(#${g("belly")})`} />

              {/* 옆줄(측선) — 물고기에는 반드시 있다 */}
              <path
                d={`M 74 ${AXIS_Y - 2} C 120 ${AXIS_Y - m.depth * 0.2} 168 ${AXIS_Y - m.depth * 0.26} 206 ${AXIS_Y - m.depth * 0.14}`}
                fill="none"
                stroke="#ffffff"
                strokeOpacity="0.2"
                strokeWidth="1.4"
                strokeDasharray="1 5"
                strokeLinecap="round"
              />

              {/* 아가미 뚜껑 — 숨 쉰다 */}
              <g
                style={{
                  transformOrigin: `196px ${AXIS_Y}px`,
                  animation: `gill-breathe ${sleeping ? 5.8 : 2.7}s ease-in-out infinite`,
                }}
              >
                <path
                  d={`M 190 ${AXIS_Y - m.depth * 0.62} C 178 ${AXIS_Y - m.depth * 0.2} 178 ${AXIS_Y + m.depth * 0.3} 192 ${AXIS_Y + m.depth * 0.6}`}
                  fill="none"
                  stroke="#03060c"
                  strokeOpacity="0.3"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d={`M 192 ${AXIS_Y - m.depth * 0.6} C 181 ${AXIS_Y - m.depth * 0.2} 181 ${AXIS_Y + m.depth * 0.28} 194 ${AXIS_Y + m.depth * 0.56}`}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.22"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </g>

              {/* 등쪽 그림자 — 입체감 */}
              <path
                d={`M 60 ${AXIS_Y - m.depth} L 240 ${AXIS_Y - m.depth} L 240 ${AXIS_Y - m.depth * 0.42} C 180 ${AXIS_Y - m.depth * 0.62} 110 ${AXIS_Y - m.depth * 0.6} 60 ${AXIS_Y - m.depth * 0.3} Z`}
                fill="#03060c"
                fillOpacity="0.2"
              />
            </g>

            {/* 윤곽 — 물속의 빛이 몸을 따라 흐른다 */}
            <path d={geo.body} fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.3" />
            <path
              d={geo.body}
              fill="none"
              stroke={design.bodyTop}
              strokeOpacity="0.2"
              strokeWidth="2"
              style={{ filter: "blur(2px)" }}
            />
          </g>

          {/* ───── 배지느러미 (몸통 앞) ───── */}
          <FinGroup
            fin={geo.ventral}
            fill={`url(#${g("finDown")})`}
            rayColor={finMid}
            origin={`188px ${AXIS_Y + m.depth * 0.66}px`}
            anim="fin-wave"
            dur={beat * 0.9}
            flow={flow}
            opacity={0.3}
          />

          {/* ───── 가슴지느러미 ───── */}
          <g
            style={{
              transformOrigin: `172px ${AXIS_Y + m.depth * 0.38}px`,
              animation: `pectoral-flutter ${beat * 0.5}s ease-in-out infinite`,
            }}
          >
            <path d={geo.pectoral.membrane} fill={`url(#${g("finDown")})`} opacity="0.5" />
            <g fill="none" stroke={design.finOuter} strokeOpacity="0.24" strokeWidth="0.9">
              {geo.pectoral.rays.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
          </g>

          {/* ───── 얼굴 ───── */}
          <Eye
            shape={design.eyeShape}
            color={design.eyeColor}
            irisId={g("iris")}
            open={eyeOpen}
            depth={m.depth}
          />
          <Mouth shape={design.mouthShape} speaking={!!speaking && !sleeping} depth={m.depth} />

          {sleeping && <SleepZ />}
        </g>
      </g>
    </svg>
  );
}

/* ─────────────────────────  지느러미 렌더  ───────────────────────── */

function FinGroup({
  fin,
  fill,
  rayColor,
  origin,
  anim,
  dur,
  flow,
  reverse,
  opacity = 1,
}: {
  fin: Fin;
  fill: string;
  rayColor: string;
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
      {/* 살 — 이게 있어야 종잇조각이 아니라 지느러미로 보인다 */}
      <g fill="none" strokeLinecap="round">
        <g stroke={rayColor} strokeOpacity="0.5" strokeWidth="1.6">
          {fin.rays.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g stroke="#ffffff" strokeOpacity="0.24" strokeWidth="0.7" transform="translate(0 -0.8)">
          {fin.rays.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </g>
      {/* 지느러미 가장자리 빛 */}
      <path d={fin.membrane} fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />
    </g>
  );
}

/* ─────────────────────────  눈  ───────────────────────── */

function Eye({
  shape,
  color,
  irisId,
  open,
  depth,
}: {
  shape: FishDesign["eyeShape"];
  color: string;
  irisId: string;
  open: number;
  depth: number;
}) {
  const cx = 196;
  const cy = AXIS_Y - depth * 0.26;
  // 눈은 크게 — 이 물고기의 매력은 눈에서 온다 — 다만 머리를 넘지는 않게
  const R = Math.max(11, Math.min(17, depth * 0.4));

  const geom: Record<FishDesign["eyeShape"], { rx: number; ry: number; lid?: string }> = {
    round: { rx: R, ry: R },
    almond: { rx: R * 1.08, ry: R * 0.74 },
    droopy: {
      rx: R,
      ry: R * 0.86,
      lid: `M ${cx - R - 1} ${cy - R * 0.36} Q ${cx - 1} ${cy - R * 1.15} ${cx + R} ${cy - R * 0.18}`,
    },
    sparkle: { rx: R * 1.06, ry: R * 1.06 },
    sleepy: {
      rx: R,
      ry: R * 0.77,
      lid: `M ${cx - R - 1} ${cy - R * 0.18} Q ${cx} ${cy - R * 0.84} ${cx + R} ${cy - R * 0.06}`,
    },
  };
  const { rx, ry, lid } = geom[shape];
  const ry2 = ry * open;

  if (open <= 0.02) {
    return (
      <g>
        <path
          d={`M ${cx - rx} ${cy - 2} Q ${cx} ${cy + rx * 0.5} ${cx + rx} ${cy - 3}`}
          stroke={color}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d={`M ${cx - rx} ${cy - 3.4} Q ${cx} ${cy + rx * 0.5 - 1.4} ${cx + rx} ${cy - 4.4}`}
          stroke="#ffffff"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.28"
        />
      </g>
    );
  }

  return (
    <g>
      {/* 눈두덩 — 얇고 어둡게. 흰 링을 두르면 만화 눈이 된다. */}
      <ellipse cx={cx} cy={cy} rx={rx + 2.6} ry={ry + 2.6} fill="#0a1322" fillOpacity="0.55" />
      <ellipse cx={cx} cy={cy} rx={rx + 1.1} ry={ry + 1.1} fill="#0a1322" fillOpacity="0.9" />
      {/* 홍채 */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry2} fill={`url(#${irisId})`} />
      {/* 동공 */}
      <ellipse cx={cx} cy={cy} rx={rx * 0.44} ry={ry2 * 0.44} fill="#04070e" />
      {/* 하이라이트 — 살아있음의 대부분이 여기서 온다. 크면 만화가 된다. */}
      <circle cx={cx - rx * 0.36} cy={cy - ry2 * 0.42} r={rx * 0.2} fill="#fff" fillOpacity="0.98" />
      <circle cx={cx + rx * 0.34} cy={cy + ry2 * 0.36} r={rx * 0.1} fill="#fff" fillOpacity="0.55" />
      {/* 각막 반사 */}
      <ellipse
        cx={cx}
        cy={cy - ry * 0.55}
        rx={rx * 0.72}
        ry={ry * 0.3}
        fill="#fff"
        fillOpacity="0.16"
      />
      {shape === "sparkle" && (
        <>
          <circle cx={cx + rx * 0.08} cy={cy - ry2 * 0.66} r={rx * 0.1} fill="#fff" fillOpacity="0.9" />
          <circle cx={cx - rx * 0.6} cy={cy + ry2 * 0.34} r={rx * 0.08} fill="#fff" fillOpacity="0.75" />
        </>
      )}
      {lid && (
        <path d={lid} stroke={color} strokeOpacity="0.55" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}

/* ─────────────────────────  입  ───────────────────────── */

function Mouth({
  shape,
  speaking,
  depth,
}: {
  shape: FishDesign["mouthShape"];
  speaking: boolean;
  depth: number;
}) {
  const x = 222;
  const y = AXIS_Y + depth * 0.2;
  const dur = "0.78s";

  if (shape === "pout") {
    return (
      <g>
        <ellipse cx={x} cy={y} rx="7.5" ry="6.4" fill="#3a1220" fillOpacity="0.35" />
        <ellipse cx={x} cy={y} rx="6" ry="5" fill="#ff8fa8" fillOpacity="0.72">
          {speaking && <animate attributeName="ry" values="5;2.2;5.8;5" dur={dur} repeatCount="indefinite" />}
        </ellipse>
        <ellipse cx={x} cy={y + 1.2} rx="3.6" ry="2" fill="#c4536e" fillOpacity="0.4" />
        <ellipse cx={x} cy={y - 1.8} rx="3" ry="1.4" fill="#fff" fillOpacity="0.4" />
      </g>
    );
  }

  if (shape === "smile") {
    const base = `M ${x - 16} ${y - 6} Q ${x - 5} ${y + 9} ${x + 6} ${y - 5}`;
    return (
      <g>
        <path d={base} stroke="#2a0d18" strokeOpacity="0.5" strokeWidth="3.4" fill="none" strokeLinecap="round">
          {speaking && (
            <animate
              attributeName="d"
              values={`${base};M ${x - 16} ${y - 5} Q ${x - 5} ${y + 3} ${x + 6} ${y - 5};${base}`}
              dur={dur}
              repeatCount="indefinite"
            />
          )}
        </path>
        <path
          d={`M ${x - 15} ${y - 8} Q ${x - 5} ${y + 5} ${x + 5} ${y - 7}`}
          stroke="#fff"
          strokeOpacity="0.18"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (shape === "wide") {
    return (
      <g>
        <path
          d={`M ${x - 20} ${y - 7} Q ${x - 6} ${y + 13} ${x + 7} ${y - 5} Q ${x - 6} ${y + 4} ${x - 20} ${y - 7}`}
          fill="#2a0d18"
          fillOpacity="0.6"
        >
          {speaking && (
            <animate attributeName="opacity" values="0.6;1;0.5;0.6" dur={dur} repeatCount="indefinite" />
          )}
        </path>
        <path
          d={`M ${x - 20} ${y - 7} Q ${x - 6} ${y + 13} ${x + 7} ${y - 5}`}
          stroke="#2a0d18"
          strokeOpacity="0.55"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${x - 17} ${y - 4} Q ${x - 6} ${y + 6} ${x + 4} ${y - 4}`}
          stroke="#ff9db4"
          strokeOpacity="0.35"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g>
      <path
        d={`M ${x - 11} ${y - 3} Q ${x - 4} ${y + 5} ${x + 4} ${y - 2}`}
        stroke="#2a0d18"
        strokeOpacity="0.5"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      >
        {speaking && (
          <animate attributeName="stroke-width" values="3;4.8;2.4;3" dur={dur} repeatCount="indefinite" />
        )}
      </path>
    </g>
  );
}

/* ─────────────────────────  잠  ───────────────────────── */

function SleepZ() {
  return (
    <g fill="#cfe0ff" fillOpacity="0.65" fontSize="19" fontWeight="600">
      <text x="212" y="34" style={{ animation: "sleep-z 4.4s ease-out infinite" }}>
        z
      </text>
      <text x="222" y="20" fontSize="13" style={{ animation: "sleep-z 4.4s ease-out infinite 1.5s" }}>
        z
      </text>
    </g>
  );
}

/* ─────────────────────────  비늘 무늬  ───────────────────────── */

function ScaleFill({ id, design }: { id: string; design: FishDesign }) {
  switch (design.scalePattern) {
    case "plain":
      return (
        <linearGradient id={id}>
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      );

    case "pearl":
      return (
        <radialGradient id={id} cx="0.62" cy="0.36" r="0.7">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="45%" stopColor="#e8f4ff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#c0d8ff" stopOpacity="0.04" />
        </radialGradient>
      );

    case "net":
      return (
        <pattern id={id} width="17" height="17" patternUnits="userSpaceOnUse">
          <path
            d="M8.5 0 L17 8.5 L8.5 17 L0 8.5 Z"
            fill="none"
            stroke="#050a14"
            strokeOpacity="0.3"
            strokeWidth="1.6"
          />
        </pattern>
      );

    case "speckle":
      return (
        <pattern id={id} width="19" height="19" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r="1.7" fill="#ff9a5c" fillOpacity="0.4" />
          <circle cx="13" cy="10" r="2.1" fill="#ffffff" fillOpacity="0.42" />
          <circle cx="8" cy="16" r="1.3" fill="#ffb87a" fillOpacity="0.34" />
          <circle cx="17" cy="3" r="1.1" fill="#ffffff" fillOpacity="0.3" />
          <circle cx="1" cy="13" r="1.5" fill="#7fc4ff" fillOpacity="0.28" />
        </pattern>
      );

    case "marble":
      return (
        <>
          <filter id={`${id}-f`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024" numOctaves="4" seed="12" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.04
                      0 0 0 0 0.07
                      0 0 0 0 0.14
                      0 0 0 0.55 0"
            />
          </filter>
          <pattern id={id} width="300" height="260" patternUnits="userSpaceOnUse">
            <rect width="300" height="260" filter={`url(#${id}-f)`} />
          </pattern>
        </>
      );

    case "iridescent":
      return (
        <linearGradient id={id} x1="0.05" y1="0.1" x2="0.95" y2="0.9">
          <stop offset="0%" stopColor="#7ff0ff" stopOpacity="0.3" />
          <stop offset="24%" stopColor="#b18cff" stopOpacity="0.2" />
          <stop offset="48%" stopColor={design.bodyTop} stopOpacity="0.04" />
          <stop offset="70%" stopColor="#ffc2e8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8cf5cf" stopOpacity="0.28" />
          <animate attributeName="x1" values="0.05;0.55;0.05" dur="13s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0.95;1.45;0.95" dur="13s" repeatCount="indefinite" />
        </linearGradient>
      );
  }
}

/* ─────────────────────────  유틸  ───────────────────────── */

/** 두 색을 t 비율로 섞는다 */
function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const m = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t);
  return `#${((m(0) << 16) | (m(1) << 8) | m(2)).toString(16).padStart(6, "0")}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** #rrggbb 를 흰색 쪽으로 섞는다 */
function lighten(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
