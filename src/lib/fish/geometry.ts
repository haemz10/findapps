import type { BodyShape, FinStyle } from "@/lib/types";

/**
 * 물고기 형태를 계산으로 만든다.
 *
 * 두 가지 지느러미가 있다.
 *  - 부채(fan): 꼬리·가슴처럼 한 점에서 방사형으로 퍼지는 것
 *  - 빗살(comb): 등·배처럼 등줄기를 따라 늘어선 살들이 바깥으로 뻗는 것
 *
 * 둘을 구분하지 않으면 등지느러미가 손부채처럼 보인다. 실제 물고기의 등지느러미는
 * 등선(back line) 위에 살들이 줄지어 서 있고, 그 살들이 뒤로 살짝 눕는다.
 *
 * 좌표계: 오른쪽을 보는 물고기. y=90 이 중심선.
 */

export interface Pt {
  x: number;
  y: number;
}

export const AXIS_Y = 90;
export const TAIL_X = 56;
export const SNOUT_X = 230;

/* ─────────────────────────  몸통  ───────────────────────── */

interface BodySpec {
  depth: number;
  bellyDrop: number;
  peduncle: number;
  /** 머리가 둥근 정도 */
  headFull: number;
}

const BODY: Record<BodyShape, BodySpec> = {
  slender: { depth: 28, bellyDrop: 1.04, peduncle: 8, headFull: 0.52 },
  round: { depth: 42, bellyDrop: 1.14, peduncle: 12, headFull: 0.64 },
  teardrop: { depth: 35, bellyDrop: 1.08, peduncle: 9, headFull: 0.62 },
  broad: { depth: 47, bellyDrop: 1.18, peduncle: 14, headFull: 0.58 },
};

type Cubic = [Pt, Pt, Pt, Pt];

function curves(shape: BodyShape) {
  const b = BODY[shape];
  const d = b.depth;
  const belly = d * b.bellyDrop;

  const back: Cubic = [
    { x: TAIL_X, y: AXIS_Y - b.peduncle },
    { x: TAIL_X + 34, y: AXIS_Y - d * 1.08 },
    { x: 158, y: AXIS_Y - d * 1.14 },
    { x: SNOUT_X - 16, y: AXIS_Y - d * b.headFull },
  ];

  // 주둥이 — 머리 끝에서 턱까지
  const snout: Cubic = [
    back[3],
    { x: SNOUT_X + 4, y: AXIS_Y - d * b.headFull * 0.42 },
    { x: SNOUT_X + 4, y: AXIS_Y + d * 0.3 },
    { x: SNOUT_X - 20, y: AXIS_Y + belly * 0.5 },
  ];

  const bellyC: Cubic = [
    snout[3],
    { x: 168, y: AXIS_Y + belly * 1.12 },
    { x: TAIL_X + 34, y: AXIS_Y + belly * 1.0 },
    { x: TAIL_X, y: AXIS_Y + b.peduncle },
  ];

  return { back, snout, belly: bellyC, spec: b };
}

function c(p: Cubic) {
  return `C ${r(p[1].x)} ${r(p[1].y)} ${r(p[2].x)} ${r(p[2].y)} ${r(p[3].x)} ${r(p[3].y)}`;
}

export function bodyPath(shape: BodyShape): string {
  const { back, snout, belly } = curves(shape);
  return `M ${r(back[0].x)} ${r(back[0].y)} ${c(back)} ${c(snout)} ${c(belly)} Z`;
}

export function bodyMetrics(shape: BodyShape) {
  const b = BODY[shape];
  return { ...b, backY: AXIS_Y - b.depth, bellyY: AXIS_Y + b.depth * b.bellyDrop };
}

/** 베지에 위의 한 점 */
function at(p: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u,
    bb = 3 * u * u * t,
    cc = 3 * u * t * t,
    dd = t * t * t;
  return {
    x: a * p[0].x + bb * p[1].x + cc * p[2].x + dd * p[3].x,
    y: a * p[0].y + bb * p[1].y + cc * p[2].y + dd * p[3].y,
  };
}

/** 접선 방향 (정규화) */
function tangent(p: Cubic, t: number): Pt {
  const u = 1 - t;
  const x =
    3 * u * u * (p[1].x - p[0].x) + 6 * u * t * (p[2].x - p[1].x) + 3 * t * t * (p[3].x - p[2].x);
  const y =
    3 * u * u * (p[1].y - p[0].y) + 6 * u * t * (p[2].y - p[1].y) + 3 * t * t * (p[3].y - p[2].y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

/* ─────────────────────────  지느러미 공통  ───────────────────────── */

export interface Fin {
  membrane: string;
  rays: string[];
}

/** 스타일별 살 길이 프로파일. t=0 이 앞(또는 위), t=1 이 뒤(또는 아래). */
const PROFILES: Record<FinStyle, (t: number) => number> = {
  veil: (t) => 0.6 + 0.66 * Math.pow(t, 1.3),
  crown: (t) => (Math.round(t * 16) % 2 === 0 ? 1.0 : 0.7) * (0.9 + 0.14 * Math.sin(t * Math.PI)),
  halfmoon: (t) => 0.9 + 0.16 * Math.sin(t * Math.PI),
  delta: (t) => 0.52 + 0.5 * (1 - Math.abs(2 * t - 1)),
  feather: (t) => 0.74 + 0.28 * Math.sin(t * Math.PI * 1.35) + 0.07 * Math.sin(t * 11),
};

const RAY_COUNT: Record<FinStyle, number> = {
  veil: 15,
  crown: 17,
  halfmoon: 19,
  delta: 13,
  feather: 21,
};

/** 막이 살보다 얼마나 짧은가 — 크라운테일은 살이 삐죽 튀어나온다 */
const MEMBRANE_RATIO: Record<FinStyle, number> = {
  veil: 0.97,
  crown: 0.82,
  halfmoon: 0.99,
  delta: 0.96,
  feather: 0.88,
};

function buildFin(bases: Pt[], tips: Pt[], membraneTips: Pt[]): Fin {
  const parts: string[] = [`M ${r(bases[0].x)} ${r(bases[0].y)}`];
  parts.push(`L ${r(membraneTips[0].x)} ${r(membraneTips[0].y)}`);
  for (let i = 1; i < membraneTips.length; i++) {
    const prev = membraneTips[i - 1];
    const cur = membraneTips[i];
    const base = bases[i];
    // 살 사이의 막은 바깥으로 살짝 부푼다
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    const ox = mx - base.x;
    const oy = my - base.y;
    parts.push(`Q ${r(base.x + ox * 1.06)} ${r(base.y + oy * 1.06)} ${r(cur.x)} ${r(cur.y)}`);
  }
  // 살 뿌리를 따라 되돌아온다
  for (let i = bases.length - 1; i >= 0; i--) {
    parts.push(`L ${r(bases[i].x)} ${r(bases[i].y)}`);
  }
  parts.push("Z");

  const rays = tips.map((tp, i) => {
    const b = bases[i];
    const mx = (b.x + tp.x) / 2;
    const my = (b.y + tp.y) / 2;
    const nx = -(tp.y - b.y);
    const ny = tp.x - b.x;
    const nl = Math.hypot(nx, ny) || 1;
    const k = 3;
    return `M ${r(b.x)} ${r(b.y)} Q ${r(mx + (nx / nl) * k)} ${r(my + (ny / nl) * k)} ${r(tp.x)} ${r(tp.y)}`;
  });

  return { membrane: parts.join(" "), rays };
}

function r(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * 지느러미 양 끝의 살을 짧게 만들어 외곽선을 둥글게 만든다.
 * 이게 없으면 첫/마지막 살이 그대로 직선 절단면이 되어 부채처럼 보인다.
 */
function edgeSoften(t: number): number {
  return Math.min(1, Math.pow(Math.sin(Math.PI * t), 0.2) * 1.04);
}

/* ─────────────────────────  부채형  ───────────────────────── */

interface FanSpec {
  origin: Pt;
  /** 도(度). SVG 기준: 0=오른쪽, 양수=아래쪽 */
  aFrom: number;
  aTo: number;
  len: number;
  count: number;
  profile: (t: number) => number;
  membraneRatio?: number;
  inset?: number;
  jitter?: number;
}

function fan(s: FanSpec): Fin {
  const inset = s.inset ?? 2;
  const mr = s.membraneRatio ?? 0.97;
  const bases: Pt[] = [];
  const tips: Pt[] = [];
  const mTips: Pt[] = [];

  for (let i = 0; i < s.count; i++) {
    const t = s.count === 1 ? 0 : i / (s.count - 1);
    const a = ((s.aFrom + (s.aTo - s.aFrom) * t) * Math.PI) / 180;
    const j = s.jitter ? Math.sin(i * 12.9898) * s.jitter : 0;
    const len = (s.len * s.profile(t) + j) * edgeSoften(t);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    bases.push({ x: s.origin.x + dx * inset, y: s.origin.y + dy * inset });
    tips.push({ x: s.origin.x + dx * len, y: s.origin.y + dy * len });
    mTips.push({ x: s.origin.x + dx * len * mr, y: s.origin.y + dy * len * mr });
  }
  return buildFin(bases, tips, mTips);
}

/* ─────────────────────────  빗살형  ───────────────────────── */

interface CombSpec {
  curve: Cubic;
  /** 등선 위에서 지느러미가 차지하는 구간 */
  t0: number;
  t1: number;
  /** 바깥 방향: -1 = 위(등), +1 = 아래(배) */
  side: -1 | 1;
  len: number;
  count: number;
  profile: (t: number) => number;
  /** 살이 뒤로 눕는 각도(도) */
  sweep: number;
  membraneRatio?: number;
  jitter?: number;
  /** 살 뿌리가 몸통 안으로 파고드는 깊이 */
  rootDepth?: number;
}

function comb(s: CombSpec): Fin {
  const mr = s.membraneRatio ?? 0.97;
  const bases: Pt[] = [];
  const tips: Pt[] = [];
  const mTips: Pt[] = [];
  const sweep = (s.sweep * Math.PI) / 180;

  for (let i = 0; i < s.count; i++) {
    const u = s.count === 1 ? 0 : i / (s.count - 1);
    const t = s.t0 + (s.t1 - s.t0) * u;
    const p = at(s.curve, t);
    const tg = tangent(s.curve, t);

    // 곡선의 법선. 곡선을 어느 방향으로 샘플했든 원하는 쪽(위/아래)을 향하게 뒤집는다.
    let nx = -tg.y;
    let ny = tg.x;
    if ((s.side === -1 && ny > 0) || (s.side === 1 && ny < 0)) {
      nx = -nx;
      ny = -ny;
    }

    // 뒤로 눕히기 — 살이 꼬리 쪽으로 눕는다
    const cs = Math.cos(sweep);
    const sn = Math.sin(sweep);
    const rx = nx * cs - ny * sn;
    const ry = nx * sn + ny * cs;
    nx = rx;
    ny = ry;

    const j = s.jitter ? Math.sin(i * 12.9898) * s.jitter : 0;
    // profile 의 t 는 앞→뒤 순서여야 하므로 뒤집는다 (등줄기는 꼬리→머리 방향으로 샘플됨)
    const len = (s.len * s.profile(1 - u) + j) * edgeSoften(u);

    // 살 뿌리를 몸통 깊숙이 넣는다 — 지느러미가 몸에서 자라난 것처럼 보이게
    const root = s.rootDepth ?? 11;
    bases.push({ x: p.x - nx * root, y: p.y - ny * root });
    tips.push({ x: p.x + nx * len, y: p.y + ny * len });
    mTips.push({ x: p.x + nx * len * mr, y: p.y + ny * len * mr });
  }
  return buildFin(bases, tips, mTips);
}

/* ─────────────────────────  각 지느러미  ───────────────────────── */

/** 꼬리지느러미 — 위/아래로 얼마나 벌어지는가 */
const TAIL_SPREAD: Record<FinStyle, [number, number]> = {
  veil: [50, 68],
  crown: [60, 64],
  halfmoon: [76, 76],
  delta: [40, 42],
  feather: [56, 70],
};

const TAIL_LEN: Record<FinStyle, number> = {
  veil: 104,
  crown: 82,
  halfmoon: 96,
  delta: 72,
  feather: 92,
};

const JITTER: Record<FinStyle, number> = {
  veil: 0,
  crown: 1.4,
  halfmoon: 0,
  delta: 0,
  feather: 2.2,
};

/**
 * 꼬리지느러미.
 *
 * 한 점에서 퍼지게 하면 밑동의 직선 절단면이 몸통 밖으로 드러나 종이처럼 보인다.
 * 실제 꼬리는 좁은 꼬리자루에 붙어 뒤로 갈수록 퍼진다 — 그래서 밑동을 짧은 선분으로 둔다.
 */
export function tailFin(style: FinStyle, shape: BodyShape): Fin {
  const [up, down] = TAIL_SPREAD[style];
  const b = BODY[shape];
  const rootHalf = b.peduncle * 1.35;
  const rootX = TAIL_X + 8;
  const len = TAIL_LEN[style] + b.depth * 0.2;
  const mr = MEMBRANE_RATIO[style];
  const count = RAY_COUNT[style];

  const bases: Pt[] = [];
  const tips: Pt[] = [];
  const mTips: Pt[] = [];

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    // 밑동 위 위치: 위쪽 살은 꼬리자루 위, 아래쪽 살은 아래
    const by = AXIS_Y - rootHalf + 2 * rootHalf * t;
    // 밑동은 살짝 볼록하다
    const bx = rootX - Math.sin(t * Math.PI) * 2.5;
    const a = ((180 + up + (180 - down - (180 + up)) * t) * Math.PI) / 180;
    const j = JITTER[style] ? Math.sin(i * 12.9898) * JITTER[style] : 0;
    const l = (len * PROFILES[style](t) + j) * edgeSoften(t);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    bases.push({ x: bx, y: by });
    tips.push({ x: bx + dx * l, y: by + dy * l });
    mTips.push({ x: bx + dx * l * mr, y: by + dy * l * mr });
  }

  return buildFin(bases, tips, mTips);
}

export function dorsalFin(style: FinStyle, shape: BodyShape): Fin {
  const { back, spec: b } = curves(shape);
  const long = style === "veil" || style === "halfmoon" || style === "feather";
  const base = PROFILES[style];
  return comb({
    curve: back,
    // 등선은 꼬리(t=0) → 머리(t=1) 로 간다. 지느러미는 등 중간에서 꼬리쪽으로.
    t0: 0.16,
    t1: 0.68,
    side: -1,
    len: (long ? 2.15 : 1.1) * (7 + b.depth * 0.44),
    count: Math.max(11, Math.round(RAY_COUNT[style] * 0.95)),
    // 머리 쪽은 낮고 꼬리 쪽으로 갈수록 높아진다 (t=0 이 꼬리 쪽)
    profile: (t) => base(t) * (0.42 + 0.66 * (1 - t)),
    sweep: -30,
    membraneRatio: MEMBRANE_RATIO[style],
    jitter: JITTER[style] * 0.6,
  });
}

export function analFin(style: FinStyle, shape: BodyShape): Fin {
  const { belly, spec: b } = curves(shape);
  const long = style === "veil" || style === "halfmoon";
  const base = PROFILES[style];
  return comb({
    curve: belly,
    // 배선은 머리(t=0) → 꼬리(t=1) 로 간다
    t0: 0.34,
    t1: 0.9,
    side: 1,
    len: (long ? 1.95 : 1.05) * (6 + b.depth * 0.4),
    count: Math.max(11, Math.round(RAY_COUNT[style] * 0.9)),
    // 배선은 머리(t=0) → 꼬리(t=1). 꼬리 쪽이 길어야 부채가 이어진다.
    profile: (t) => base(1 - t) * (0.42 + 0.66 * t),
    sweep: 27,
    membraneRatio: MEMBRANE_RATIO[style],
    jitter: JITTER[style] * 0.6,
  });
}

/** 가슴지느러미 — 아가미 뒤에서 팔랑거린다 */
export function pectoralFin(shape: BodyShape): Fin {
  const b = BODY[shape];
  return fan({
    origin: { x: 172, y: AXIS_Y + b.depth * 0.38 },
    aFrom: 52,
    aTo: 128,
    len: 16 + b.depth * 0.16,
    count: 9,
    profile: (t) => 0.66 + 0.4 * Math.sin(t * Math.PI),
    inset: 1,
  });
}

/** 배지느러미 — 턱 아래로 늘어지는 가는 두 가닥 */
export function ventralFin(shape: BodyShape): Fin {
  const b = BODY[shape];
  return fan({
    origin: { x: 188, y: AXIS_Y + b.depth * 0.66 },
    aFrom: 78,
    aTo: 104,
    len: 20 + b.depth * 0.2,
    count: 5,
    profile: (t) => 0.8 + 0.3 * t,
    inset: 1,
  });
}

/* ─────────────────────────  비늘  ───────────────────────── */

export function scaleArcs(shape: BodyShape): string[] {
  const { back, belly, spec } = curves(shape);
  const arcs: string[] = [];
  const cols = 13;
  const rows = 9;

  for (let ci = 0; ci < cols; ci++) {
    // 등선과 배선을 같은 x 대역에서 샘플해 몸 두께를 알아낸다
    const u = 0.06 + (ci / (cols - 1)) * 0.88;
    const top = at(back, u);
    const bot = at(belly, 1 - u);
    const x = (top.x + bot.x) / 2;
    const yTop = top.y;
    const yBot = bot.y;
    const h = (yBot - yTop) / 2;
    const midY = (yTop + yBot) / 2;

    for (let ri = 0; ri < rows; ri++) {
      const t = (ri / (rows - 1)) * 2 - 1;
      // 가장자리에 붙지 않게 안쪽으로 조금 당긴다
      const y = midY + t * h * 0.82;
      const w = 7.2 - Math.abs(t) * 1.8;
      const stagger = ci % 2 === 0 ? 0 : (h * 1.64) / (rows - 1) / 2;
      arcs.push(
        `M ${r(x - w)} ${r(y + stagger)} Q ${r(x)} ${r(y + stagger - w * 1.2)} ${r(x + w)} ${r(y + stagger)}`
      );
    }
  }
  void spec;
  return arcs;
}
