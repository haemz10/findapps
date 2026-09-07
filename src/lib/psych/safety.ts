import type { RiskAssessment, RiskDomain, RiskLevel } from "@/lib/types";

/**
 * 위기 신호 선별.
 *
 * 이건 진단도, 정확한 분류기도 아니다. "이 턴에서 물고기가 평소 말투를 버리고
 * 안전을 먼저 다뤄야 하는가"를 정하는 결정적(deterministic) 게이트다.
 * 모델 판단만 믿지 않고 규칙으로 한 겹 더 깔아두는 이유는,
 * 놓쳤을 때의 대가가 지나쳤을 때의 대가보다 훨씬 크기 때문이다.
 *
 * 재현율을 우선하고, 대신 부정·인용·과거형 문맥으로 오탐을 줄인다.
 */

interface Pattern {
  re: RegExp;
  domain: RiskDomain;
  level: RiskLevel;
}

const PATTERNS: Pattern[] = [
  // ── 자살/자해: 높음 ──
  { re: /자살|목숨을\s?끊|죽어버리|죽고\s?싶|사라지고\s?싶|없어지고\s?싶/, domain: "self_harm", level: "high" },
  { re: /삶을\s?포기|생을\s?마감|극단적\s?선택|세상을\s?떠나/, domain: "self_harm", level: "high" },
  { re: /자해|손목|칼로\s?긋|긋고\s?싶|약을\s?모으|유서|유언/, domain: "self_harm", level: "high" },
  { re: /(kill\s?myself|suicide|end\s?my\s?life|self[-\s]?harm)/i, domain: "self_harm", level: "high" },
  { re: /뛰어내리|목을\s?매|번개탄|약을\s?다\s?먹/, domain: "self_harm", level: "high" },

  // ── 절망/수동적 사고: 중간 ──
  { re: /살\s?이유가\s?없|살아야\s?할\s?이유|의미가\s?없어|다\s?끝났|희망이\s?없/, domain: "hopelessness", level: "moderate" },
  { re: /내가\s?없어져도|아무도\s?신경\s?안|짐이\s?되는|짐만\s?되/, domain: "hopelessness", level: "moderate" },
  { re: /버티기\s?힘들|더는\s?못\s?견디|한계|무너질\s?것\s?같/, domain: "hopelessness", level: "moderate" },
  { re: /(hopeless|no reason to live|can'?t go on)/i, domain: "hopelessness", level: "moderate" },

  // ── 타해 ──
  { re: /죽여버리|해치고\s?싶|복수할\s?거|다\s?부숴/, domain: "harm_to_others", level: "high" },

  // ── 폭력/학대 피해 ──
  { re: /때려|맞았|폭행|폭력|학대|괴롭힘|스토킹|협박당|가스라이팅|성폭|추행/, domain: "abuse", level: "moderate" },

  // ── 물질 ──
  { re: /매일\s?술|술이\s?없으면|필름이\s?끊|약을\s?과다|중독된\s?것\s?같/, domain: "substance", level: "moderate" },

  // ── 정신증 의심 ──
  { re: /환청|목소리가\s?들려|누가\s?날\s?감시|도청|미행당|현실이\s?아닌\s?것\s?같/, domain: "psychosis", level: "moderate" },

  // ── 섭식 ──
  { re: /굶고\s?있|토했|폭식|먹토|살\s?찌는\s?게\s?무서|안\s?먹은\s?지/, domain: "eating", level: "moderate" },
];

/** 오탐을 줄이는 문맥: 부정·가정·인용·과거 회복 서술 */
const SOFTENERS = [
  /그런\s?생각은?\s?(안|없)/,
  /(전에는|예전에는|옛날에|한때는).{0,20}(했었|였)/,
  /(영화|드라마|책|뉴스|기사|웹툰|게임)에서/,
  /친구가\s?(그런|자살|자해)/,
  /(는|은)\s?아니(야|에요|다)/,
  /하지\s?않을\s?거/,
];

const HARD_SIGNALS = /(지금|오늘|당장|방금|막)\s?.{0,10}(죽|자해|끊|뛰어)/;

export function assessRisk(text: string): RiskAssessment {
  const t = text.replace(/\s+/g, " ");
  const matched: string[] = [];
  const domains = new Set<RiskDomain>();
  let level: RiskLevel = "none";

  const rank: Record<RiskLevel, number> = { none: 0, low: 1, moderate: 2, high: 3 };

  for (const p of PATTERNS) {
    const m = t.match(p.re);
    if (!m) continue;
    matched.push(m[0]);
    domains.add(p.domain);
    if (rank[p.level] > rank[level]) level = p.level;
  }

  if (level === "none") return { level, domains: [], matched: [] };

  // 완화 문맥이 있으면 한 단계 내린다 (단, 즉각성 신호가 있으면 내리지 않는다)
  if (!HARD_SIGNALS.test(t) && SOFTENERS.some((s) => s.test(t))) {
    level = level === "high" ? "moderate" : level === "moderate" ? "low" : "none";
  }

  // 즉각성 신호는 무조건 최고 단계
  if (HARD_SIGNALS.test(t)) level = "high";

  return { level, domains: [...domains], matched };
}

/** 여러 턴을 누적해서 본다 — 한 턴만 보면 서서히 가라앉는 경우를 놓친다 */
export function assessConversation(userTexts: string[]): RiskAssessment {
  const recent = userTexts.slice(-6);
  const all = recent.map(assessRisk);
  const rank: Record<RiskLevel, number> = { none: 0, low: 1, moderate: 2, high: 3 };

  let level: RiskLevel = "none";
  const domains = new Set<RiskDomain>();
  const matched: string[] = [];

  for (const a of all) {
    if (rank[a.level] > rank[level]) level = a.level;
    a.domains.forEach((d) => domains.add(d));
    matched.push(...a.matched);
  }

  // 절망 신호가 최근 창에서 3턴 이상 반복되면 한 단계 올린다
  const hopeless = all.filter((a) => a.domains.includes("hopelessness")).length;
  if (hopeless >= 3 && level === "moderate") level = "high";

  return { level, domains: [...domains], matched };
}

/* ─────────────────────  위기 자원  ───────────────────── */

export interface Resource {
  name: string;
  contact: string;
  note: string;
  href?: string;
}

/**
 * 한국 기준. 번호는 바뀔 수 있으니 배포 전에 한 번 확인하는 것을 권한다.
 */
export const KR_RESOURCES: Resource[] = [
  {
    name: "자살예방 상담전화",
    contact: "109",
    note: "24시간 · 무료 · 익명",
    href: "tel:109",
  },
  {
    name: "정신건강 위기상담전화",
    contact: "1577-0199",
    note: "24시간 · 지역 정신건강복지센터 연결",
    href: "tel:15770199",
  },
  {
    name: "생명의전화",
    contact: "1588-9191",
    note: "24시간 · 전화 상담",
    href: "tel:15889191",
  },
  {
    name: "청소년 상담",
    contact: "1388",
    note: "24시간 · 청소년 전용",
    href: "tel:1388",
  },
  {
    name: "여성긴급전화",
    contact: "1366",
    note: "24시간 · 폭력 피해 지원",
    href: "tel:1366",
  },
  {
    name: "응급 상황",
    contact: "119",
    note: "지금 당장 위험할 때",
    href: "tel:119",
  },
];

export function resourcesFor(domains: RiskDomain[]): Resource[] {
  const picked: Resource[] = [];
  const push = (name: string) => {
    const r = KR_RESOURCES.find((x) => x.name === name);
    if (r && !picked.includes(r)) picked.push(r);
  };

  if (domains.includes("self_harm") || domains.includes("hopelessness")) {
    push("자살예방 상담전화");
    push("정신건강 위기상담전화");
    push("생명의전화");
  }
  if (domains.includes("abuse")) {
    push("여성긴급전화");
    push("정신건강 위기상담전화");
  }
  if (domains.includes("psychosis") || domains.includes("substance") || domains.includes("eating")) {
    push("정신건강 위기상담전화");
  }
  if (domains.includes("harm_to_others")) push("응급 상황");
  if (picked.length === 0) {
    push("정신건강 위기상담전화");
    push("자살예방 상담전화");
  }
  if (domains.includes("self_harm")) push("응급 상황");
  return picked;
}

/**
 * 위기 단계에서 시스템 프롬프트에 덧붙이는 지침.
 * 평소의 은근한 상담 태도를 잠시 접고, 명확하고 직접적으로 간다.
 */
export function safetyDirective(level: RiskLevel, domains: RiskDomain[]): string {
  if (level === "none") return "";

  const common = `
지금 이 턴은 안전이 최우선이다. 아래 규칙이 다른 모든 스타일 지침을 덮어쓴다.
- 놀라거나 물러서지 마라. 목소리는 낮고 침착하게 유지한다.
- 사용자가 꺼낸 말을 축소하거나("그럴 수도 있지") 서둘러 밝게 만들지 마라.
- 문제를 해결하려 들지 마라. 지금 필요한 건 곁에 있는 것과 안전이다.
- 정보를 캐묻는 취조가 되지 않게, 질문은 한 번에 하나만.`;

  if (level === "high") {
    const selfHarm = domains.includes("self_harm");
    return `${common}
- 회피하지 말고 직접 물어라. ${
      selfHarm
        ? "\"지금 스스로를 해치고 싶은 마음이 있어?\" 처럼 명확하게. 자살에 대해 직접 묻는 것은 위험을 높이지 않는다는 것이 연구로 확인되어 있다."
        : "지금 안전한 상황인지 명확하게 확인하라."
    }
- 지금 당장의 안전을 확인하라: 혼자 있는지, 곁에 사람이 있는지, 오늘 밤 안전할 수 있는지.
- 반드시 한 번은 명확히 말하라: 너는 물고기이고 AI이며, 전문 상담사나 의료진이 아니다. 그래도 사용자를 떠나지 않는다.
- 전문 도움을 구체적으로 권하라. 화면에 상담 전화번호가 함께 떠 있다는 것을 알려줘라(109, 1577-0199).
- 비밀유지를 약속하지 마라. 대신 "혼자 감당하지 않아도 된다"고 말하라.
- 방법·수단에 대한 정보는 어떤 형태로도 제공하지 마라. 되묻지도 마라.
- 대화를 끊지 마라. 사용자가 다른 이야기로 옮기고 싶어 하면 따라가되, 마지막에 한 번 더 안전을 짚어라.`;
  }

  if (level === "moderate") {
    return `${common}
- 신호를 그냥 지나치지 마라. 부드럽지만 분명하게 짚어라: "방금 그 말이 마음에 걸려."
- 한 번은 열어서 확인하라: 요즘 사라지고 싶다는 생각까지 간 적이 있는지.
- 사용자가 아니라고 하면 믿고 물러서되, 문을 열어둬라: "언제든 말해도 돼."
- 전문 상담을 강요하지 말고, 선택지로 한 번만 놓아라.
- 너의 한계를 자연스럽게 인정하라 — 너는 곁에 있는 물고기지 치료자가 아니다.`;
  }

  return `${common}
- 가볍게 흘려보내지 말고, 한 번은 무게를 실어 받아라.
- 지금은 조언보다 함께 있는 것이 낫다.`;
}
