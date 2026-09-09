/**
 * 물고기 형태 생성 — 베타(Betta splendens) 한 마리, 고정.
 *
 * 실물처럼 보이게 하는 것은 화려함이 아니라 비례다. 만화 물고기와 실제 물고기를
 * 가르는 것은 대개 눈이다. 실제 베타의 눈은 머리 높이의 1/5 남짓이고,
 * 입은 위로 살짝 들린 가는 선이며, 아가미뚜껑의 경계가 뚜렷하다.
 *
 * 지느러미는 두 방식으로 만든다.
 *  - 부채(fan): 꼬리·가슴처럼 좁은 밑동에서 방사형으로 퍼지는 것
 *  - 빗살(comb): 등·배처럼 등줄기를 따라 살이 줄지어 선 것
 */

export interface Pt {
  x: number;
  y: number;
}

export const AXIS_Y = 90;
export const TAIL_X = 56;
export const SNOUT_X = 232;

/* ─────────────────────────  몸통  ───────────────────────── */

/** 실제 베타의 몸 높이는 몸 길이의 1/3 언저리다 */
export const BODY = {
  depth: 31,
  bellyDrop: 1.12,
  peduncle: 9,
  headFull: 0.72,
} as const;

type Cubic = [Pt, Pt, Pt, Pt];

function curves() {
  const d = BODY.depth;
  const belly = d * BODY.bellyDrop;

  // 등: 꼬리자루 → 등마루 → 머리. 베타는 등이 완만하고 머리가 뭉툭하다.
  const back: Cubic = [
    { x: TAIL_X, y: AXIS_Y - BODY.peduncle },
    { x: TAIL_X + 40, y: AXIS_Y - d * 1.02 },
    { x: 156, y: AXIS_Y - d * 1.08 },
    { x: SNOUT_X - 24, y: AXIS_Y - d * BODY.headFull },
  ];

  // 주둥이: 위로 살짝 들린 입 (상향구, superior mouth)
  const snout: Cubic = [
    back[3],
    { x: SNOUT_X - 4, y: AXIS_Y - d * 0.56 },
    { x: SNOUT_X + 2, y: AXIS_Y - d * 0.16 },
    { x: SNOUT_X - 12, y: AXIS_Y + d * 0.34 },
  ];

  const bellyC: Cubic = [
    snout[3],
    { x: 176, y: AXIS_Y + belly * 0.94 },
    { x: TAIL_X + 40, y: AXIS_Y + belly * 0.92 },
    { x: TAIL_X, y: AXIS_Y + BODY.peduncle },
  ];

  return { back, snout, belly: bellyC };
}

function c(p: Cubic) {
  return `C ${r(p[1].x)} ${r(p[1].y)} ${r(p[2].x)} ${r(p[2].y)} ${r(p[3].x)} ${r(p[3].y)}`;
}

export function bodyPath(): string {
  const { back, snout, belly } = curves();
  return `M ${r(back[0].x)} ${r(back[0].y)} ${c(back)} ${c(snout)} ${c(belly)} Z`;
}

/** 아가미뚜껑 경계 — 실제 물고기에는 반드시 있다 */
export function gillCover(): string {
  const d = BODY.depth;
  return `M ${SNOUT_X - 44} ${AXIS_Y - d * 0.66} C ${SNOUT_X - 58} ${AXIS_Y - d * 0.2} ${SNOUT_X - 58} ${AXIS_Y + d * 0.34} ${SNOUT_X - 40} ${AXIS_Y + d * 0.72}`;
}

/** 옆줄(측선) — 몸을 따라 흐르는 감각기관 */
export function lateralLine(): string {
  const d = BODY.depth;
  return `M 72 ${AXIS_Y - 1} C 118 ${AXIS_Y - d * 0.24} 164 ${AXIS_Y - d * 0.3} 198 ${AXIS_Y - d * 0.2}`;
}

function at(p: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const cc = 3 * u * t * t;
  const dd = t * t * t;
  return {
    x: a * p[0].x + b * p[1].x + cc * p[2].x + dd * p[3].x,
    y: a * p[0].y + b * p[1].y + cc * p[2].y + dd * p[3].y,
  };
}

function tangent(p: Cubic, t: number): Pt {
  const u = 1 - t;
  const x =
    3 * u * u * (p[1].x - p[0].x) + 6 * u * t * (p[2].x - p[1].x) + 3 * t * t * (p[3].x - p[2].x);
  const y =
    3 * u * u * (p[1].y - p[0].y) + 6 * u * t * (p[2].y - p[1].y) + 3 * t * t * (p[3].y - p[2].y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

function r(n: number) {
  return Math.round(n * 10) / 10;
}

/* ─────────────────────────  지느러미 공통  ───────────────────────── */

export interface Fin {
  membrane: string;
  rays: string[];
}

/** 양 끝의 살을 짧게 해 외곽선을 둥글게 — 없으면 종이를 오린 것처럼 보인다 */
function edgeSoften(t: number): number {
  return Math.min(1, Math.pow(Math.sin(Math.PI * t), 0.18) * 1.04);
}

function buildFin(bases: Pt[], tips: Pt[], membraneTips: Pt[]): Fin {
  const parts: string[] = [`M ${r(bases[0].x)} ${r(bases[0].y)}`, `L ${r(membraneTips[0].x)} ${r(membraneTips[0].y)}`];
  for (let i = 1; i < membraneTips.length; i++) {
    const prev = membraneTips[i - 1];
    const cur = membraneTips[i];
    const base = bases[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    // 살 사이의 막은 바깥으로 아주 살짝 부푼다
    parts.push(
      `Q ${r(base.x + (mx - base.x) * 1.05)} ${r(base.y + (my - base.y) * 1.05)} ${r(cur.x)} ${r(cur.y)}`
    );
  }
  for (let i = bases.length - 1; i >= 0; i--) parts.push(`L ${r(bases[i].x)} ${r(bases[i].y)}`);
  parts.push("Z");

  const rays = tips.map((tp, i) => {
    const b = bases[i];
    const mx = (b.x + tp.x) / 2;
    const my = (b.y + tp.y) / 2;
    const nx = -(tp.y - b.y);
    const ny = tp.x - b.x;
    const nl = Math.hypot(nx, ny) || 1;
    const k = 2.5;
    return `M ${r(b.x)} ${r(b.y)} Q ${r(mx + (nx / nl) * k)} ${r(my + (ny / nl) * k)} ${r(tp.x)} ${r(tp.y)}`;
  });

  return { membrane: parts.join(" "), rays };
}

/* ─────────────────────────  꼬리  ───────────────────────── */

/**
 * 베일테일 — 넓게 퍼지되 아래쪽이 길게 늘어진다.
 * 좁은 꼬리자루에서 시작해야 몸과 이어져 보인다.
 */
export function tailFin(): Fin {
  const count = 21;
  const len = 92;
  const rootHalf = BODY.peduncle * 1.3;
  const rootX = TAIL_X + 8;
  const upper = 52;
  const lower = 70;

  const bases: Pt[] = [];
  const tips: Pt[] = [];
  const mTips: Pt[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const by = AXIS_Y - rootHalf + 2 * rootHalf * t;
    const bx = rootX - Math.sin(t * Math.PI) * 2.5;
    const a = ((180 + upper + (180 - lower - (180 + upper)) * t) * Math.PI) / 180;
    // 아래로 갈수록 길게 흐른다
    const profile = 0.7 + 0.5 * Math.pow(t, 1.2);
    const l = len * profile * edgeSoften(t);
    bases.push({ x: bx, y: by });
    tips.push({ x: bx + Math.cos(a) * l, y: by + Math.sin(a) * l });
    mTips.push({ x: bx + Math.cos(a) * l * 0.98, y: by + Math.sin(a) * l * 0.98 });
  }
  return buildFin(bases, tips, mTips);
}

/* ─────────────────────────  빗살형 (등·배)  ───────────────────────── */

interface CombSpec {
  curve: Cubic;
  t0: number;
  t1: number;
  side: -1 | 1;
  len: number;
  count: number;
  profile: (t: number) => number;
  sweep: number;
  rootDepth?: number;
}

function comb(s: CombSpec): Fin {
  const bases: Pt[] = [];
  const tips: Pt[] = [];
  const mTips: Pt[] = [];
  const sweep = (s.sweep * Math.PI) / 180;

  for (let i = 0; i < s.count; i++) {
    const u = i / (s.count - 1);
    const t = s.t0 + (s.t1 - s.t0) * u;
    const p = at(s.curve, t);
    const tg = tangent(s.curve, t);

    // 곡선을 어느 방향으로 샘플했든 원하는 쪽(위/아래)을 향하게 뒤집는다
    let nx = -tg.y;
    let ny = tg.x;
    if ((s.side === -1 && ny > 0) || (s.side === 1 && ny < 0)) {
      nx = -nx;
      ny = -ny;
    }

    // 살은 꼬리 쪽으로 눕는다
    const cs = Math.cos(sweep);
    const sn = Math.sin(sweep);
    const rx = nx * cs - ny * sn;
    const ry = nx * sn + ny * cs;
    nx = rx;
    ny = ry;

    const len = s.len * s.profile(u) * edgeSoften(u);
    const root = s.rootDepth ?? 10;
    bases.push({ x: p.x - nx * root, y: p.y - ny * root });
    tips.push({ x: p.x + nx * len, y: p.y + ny * len });
    mTips.push({ x: p.x + nx * len * 0.98, y: p.y + ny * len * 0.98 });
  }
  return buildFin(bases, tips, mTips);
}

/** 등지느러미 — 몸 뒤쪽 절반에 얹히고 뒤로 흐른다 */
export function dorsalFin(): Fin {
  const { back } = curves();
  return comb({
    curve: back,
    // 등선은 꼬리(0) → 머리(1)
    t0: 0.12,
    t1: 0.62,
    side: -1,
    len: 44,
    count: 17,
    // 꼬리 쪽(u=0)이 높고 머리 쪽으로 낮아진다
    profile: (u) => 0.42 + 0.72 * (1 - u),
    sweep: -26,
  });
}

/** 뒷지느러미 — 배 뒤쪽을 길게 덮는다. 베타는 이게 특히 넓다. */
export function analFin(): Fin {
  const { belly } = curves();
  return comb({
    curve: belly,
    // 배선은 머리(0) → 꼬리(1)
    t0: 0.3,
    t1: 0.9,
    side: 1,
    len: 50,
    count: 19,
    profile: (u) => 0.44 + 0.68 * u,
    sweep: 24,
  });
}

/* ─────────────────────────  부채형 (가슴·배)  ───────────────────────── */

interface FanSpec {
  origin: Pt;
  aFrom: number;
  aTo: number;
  len: number;
  count: number;
  profile: (t: number) => number;
}

function fan(s: FanSpec): Fin {
  const bases: Pt[] = [];
  const tips: Pt[] = [];
  const mTips: Pt[] = [];
  for (let i = 0; i < s.count; i++) {
    const t = i / (s.count - 1);
    const a = ((s.aFrom + (s.aTo - s.aFrom) * t) * Math.PI) / 180;
    const len = s.len * s.profile(t) * edgeSoften(t);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    bases.push({ x: s.origin.x + dx * 2, y: s.origin.y + dy * 2 });
    tips.push({ x: s.origin.x + dx * len, y: s.origin.y + dy * len });
    mTips.push({ x: s.origin.x + dx * len * 0.97, y: s.origin.y + dy * len * 0.97 });
  }
  return buildFin(bases, tips, mTips);
}

/** 가슴지느러미 — 아가미 바로 뒤에서 쉬지 않고 팔랑거린다 */
export const PECTORAL_ORIGIN: Pt = { x: 178, y: AXIS_Y + BODY.depth * 0.34 };

export function pectoralFin(): Fin {
  return fan({
    origin: PECTORAL_ORIGIN,
    aFrom: 34,
    aTo: 128,
    len: 30,
    count: 11,
    profile: (t) => 0.66 + 0.4 * Math.sin(t * Math.PI),
  });
}

/** 배지느러미 — 턱 아래로 늘어지는 두 가닥. 베타의 특징이다. */
export const VENTRAL_ORIGIN: Pt = { x: 194, y: AXIS_Y + BODY.depth * 0.62 };

export function ventralFin(): Fin {
  return fan({
    origin: VENTRAL_ORIGIN,
    aFrom: 84,
    aTo: 106,
    len: 52,
    count: 5,
    profile: (t) => 0.72 + 0.4 * t,
  });
}

/* ─────────────────────────  비늘  ───────────────────────── */

/** 실제 비늘은 잘고 촘촘하다. 크면 곧바로 만화가 된다. */
export function scaleArcs(): string[] {
  const { back, belly } = curves();
  const arcs: string[] = [];
  const cols = 17;
  const rows = 11;

  for (let ci = 0; ci < cols; ci++) {
    const u = 0.04 + (ci / (cols - 1)) * 0.9;
    const top = at(back, u);
    const bot = at(belly, 1 - u);
    const x = (top.x + bot.x) / 2;
    const h = (bot.y - top.y) / 2;
    const midY = (top.y + bot.y) / 2;

    for (let ri = 0; ri < rows; ri++) {
      const t = (ri / (rows - 1)) * 2 - 1;
      const y = midY + t * h * 0.84;
      const w = 5.4 - Math.abs(t) * 1.2;
      const stagger = ci % 2 === 0 ? 0 : (h * 1.68) / (rows - 1) / 2;
      arcs.push(
        `M ${r(x - w)} ${r(y + stagger)} Q ${r(x)} ${r(y + stagger - w * 1.05)} ${r(x + w)} ${r(y + stagger)}`
      );
    }
  }
  return arcs;
}

/* ─────────────────────────  얼굴  ───────────────────────── */

/** 눈. 실제 베타의 눈은 머리 높이의 1/5 남짓 — 이 값이 실물감을 좌우한다. */
export const EYE = {
  cx: 202,
  cy: AXIS_Y - BODY.depth * 0.34,
  r: 6.6,
} as const;

/** 입 — 위로 들린 가는 선 */
export function mouthPath(): string {
  return `M ${SNOUT_X - 16} ${AXIS_Y - 2} Q ${SNOUT_X - 8} ${AXIS_Y - 1} ${SNOUT_X - 3} ${AXIS_Y - 6}`;
}
