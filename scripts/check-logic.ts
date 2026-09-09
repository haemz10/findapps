/**
 * 서버 쪽 판단 로직 점검 스크립트.
 *
 *   npx tsx scripts/check-logic.ts
 *
 * 모델 호출 없이, 안전 선별 · 기법 선택 · 막힘 감지 · 성향 채점이
 * 의도한 대로 도는지 확인한다. 상담 로직은 눈으로 보고 고쳐야 하므로
 * 프롬프트 조립 결과도 함께 찍는다.
 */
import { assessRisk, assessConversation, resourcesFor } from "../src/lib/psych/safety";
import { selectTechniques } from "../src/lib/psych/frameworks";
import { detectStuck } from "../src/lib/psych/stuck";
import { scoreQuiz, QUIZ } from "../src/lib/psych/quiz";
import { buildStablePrefix, buildTurnContext } from "../src/lib/psych/prompt";
import { initialCare, moodOf } from "../src/lib/care";
import { phaseOf, fishAwake, ambienceFor } from "../src/lib/daynight";
import { dissolveLevel, IDLE_BEFORE_FADE_MS, FADE_SPAN_MS } from "../src/lib/fish/behavior";
import type { ChatMessage } from "../src/lib/types";

let failed = 0;
function check(name: string, ok: boolean, extra?: unknown) {
  console.log(`${ok ? "  ok  " : " FAIL "} ${name}`);
  if (!ok) {
    failed++;
    if (extra !== undefined) console.log("        →", JSON.stringify(extra));
  }
}

console.log("\n── 위기 선별 ──");
const highCases = [
  "요즘 그냥 다 죽고 싶어",
  "자살하고 싶다는 생각이 계속 들어",
  "오늘 밤에 자해할 것 같아",
  "손목을 긋고 싶어",
];
for (const t of highCases) {
  const a = assessRisk(t);
  check(`high: "${t}" → ${a.level}`, a.level === "high", a);
}

const moderateCases = ["살아야 할 이유를 모르겠어", "내가 없어져도 아무도 모를 거야", "남자친구가 자꾸 때려"];
for (const t of moderateCases) {
  const a = assessRisk(t);
  check(`moderate 이상: "${t}" → ${a.level}`, a.level === "moderate" || a.level === "high", a);
}

const noneCases = [
  "오늘 회사에서 발표를 망쳤어",
  "친구랑 오랜만에 밥 먹었어",
  "고양이가 자꾸 새벽에 깨워",
];
for (const t of noneCases) {
  const a = assessRisk(t);
  check(`none: "${t}" → ${a.level}`, a.level === "none", a);
}

const softened = [
  "예전에는 죽고 싶다는 생각도 했었는데 지금은 아니야",
  "드라마에서 자살하는 장면이 나와서 좀 그랬어",
];
for (const t of softened) {
  const a = assessRisk(t);
  check(`완화 문맥으로 단계 하향: "${t}" → ${a.level}`, a.level !== "high", a);
}

const urgent = assessRisk("지금 당장 죽어버리고 싶어. 예전 얘기는 아니야");
check("즉각성 신호는 완화되지 않는다", urgent.level === "high", urgent);

const creeping = assessConversation([
  "요즘 좀 힘들어",
  "살아야 할 이유가 없는 것 같아",
  "다 끝났다는 생각이 들어",
  "희망이 없어",
]);
check("절망이 반복되면 단계가 올라간다", creeping.level === "high", creeping);

check("자원 매칭", resourcesFor(["self_harm"]).some((r) => r.contact === "109"));

console.log("\n── 기법 선택 ──");
const base = { rapport: 50, recentlyUsed: [], stuck: false, turn: 4 };
const traits = scoreQuiz({});

const selfBlame = selectTechniques({
  ...base,
  traits,
  recentUserText: "다 내 탓인 것 같아. 나는 참 한심해",
});
check(
  "자기비판 → 자기자비",
  selfBlame.some((t) => t.id === "self_compassion"),
  selfBlame.map((t) => t.id)
);

const anxious = selectTechniques({
  ...base,
  traits,
  recentUserText: "심장이 너무 빨리 뛰고 숨이 안 쉬어져. 불안해",
});
check(
  "급성 불안 → 접지/호흡",
  anxious.some((t) => t.id === "grounding" || t.id === "paced_breathing"),
  anxious.map((t) => t.id)
);

const lonely = selectTechniques({
  ...base,
  traits,
  recentUserText: "연락하면 다들 귀찮아할 것 같아서 못 하겠어",
});
check(
  "외로움 → 사회적 인지 교정",
  lonely.some((t) => t.id === "social_cognition"),
  lonely.map((t) => t.id)
);

const wantsTalk = selectTechniques({
  ...base,
  traits: { ...traits, solutionSeeking: 20 },
  recentUserText: "어떻게 해야 할지 모르겠어",
});
check(
  "공감형에게는 문제해결을 앞세우지 않는다",
  wantsTalk[0]?.id !== "problem_solving",
  wantsTalk.map((t) => t.id)
);

const repeated = selectTechniques({
  ...base,
  traits,
  recentUserText: "다 내 탓이야",
  recentlyUsed: ["self_compassion", "reflection"],
});
check(
  "최근에 쓴 기법은 뒤로 밀린다",
  repeated[0]?.id !== "self_compassion",
  repeated.map((t) => t.id)
);

const lowRapport = selectTechniques({
  ...base,
  rapport: 5,
  traits,
  recentUserText: "왜 사는지 모르겠어",
});
check(
  "라포가 낮으면 깊은 기법을 쓰지 않는다",
  !lowRapport.some((t) => (t.minRapport ?? 0) > 5),
  lowRapport.map((t) => t.id)
);

console.log("\n── 막힘 감지 ──");
const msg = (role: "user" | "fish", text: string): ChatMessage => ({
  id: Math.random().toString(36),
  role,
  text,
  at: 0,
});

const looping = detectStuck([
  msg("user", "회사에서 너무 힘들고 괴로워"),
  msg("fish", "..."),
  msg("user", "회사 일이 진짜 너무 괴롭고 힘들어"),
  msg("fish", "..."),
  msg("user", "회사가 너무 괴로워 진짜 힘들어"),
  msg("fish", "..."),
]);
check(`맴돌기 감지 → ${looping.kind}`, looping.kind === "looping", looping.kind);

const short = detectStuck([
  msg("user", "그냥 좀 그래"),
  msg("fish", "..."),
  msg("user", "몰라"),
  msg("fish", "..."),
  msg("user", "응"),
  msg("fish", "..."),
  msg("user", "ㅇㅇ"),
]);
check(`이탈 감지 → ${short.kind}`, short.kind === "disengaged", short.kind);

const healthy = detectStuck([
  msg("user", "오늘 회사에서 발표를 했는데 생각보다 잘 됐어"),
  msg("fish", "..."),
  msg("user", "준비를 많이 했거든. 근데 끝나고 나니까 좀 허무하더라"),
  msg("fish", "..."),
  msg("user", "주말에는 오랜만에 자전거를 탈까 해"),
]);
check(`정상 대화는 막힘으로 보지 않는다 → ${healthy.kind}`, healthy.kind === "none", healthy.kind);

console.log("\n── 성향 채점 ──");
const allAgree = Object.fromEntries(QUIZ.map((q) => [q.id, 2]));
const s1 = scoreQuiz(allAgree);
check("모두 '많이 그래요' → 직설 성향 상승", s1.directness > 50, s1.directness);
check("역채점이 작동한다 (감정명료성은 중립 근처)", Math.abs(s1.emotionalClarity - 50) < 25, s1.emotionalClarity);
const neutral = scoreQuiz(Object.fromEntries(QUIZ.map((q) => [q.id, 0])));
check("모두 중립 → 전부 50", Object.values(neutral).every((v) => v === 50), neutral);
check("무응답 → 기본 50", Object.values(scoreQuiz({})).every((v) => v === 50));

console.log("\n── 돌봄 · 시간 ──");
const care = initialCare();
check("초기 기분은 양호", moodOf(care, 10) > 50, moodOf(care, 10));
const t = phaseOf(new Date("2026-01-01T23:00:00"));
check(`23시는 밤 → ${t.label}`, t.isNight);
check("밤이면 불이 켜져 있어도 깨어 있다", fishAwake(t, true));
const noon = phaseOf(new Date("2026-01-01T13:00:00"));
check("낮에 불이 켜져 있으면 잔다", !fishAwake(noon, true));
check("낮이라도 불을 끄면 깨어난다", fishAwake(noon, false));
check("불을 끄면 수조 조명이 강해진다", ambienceFor(noon.phase, false).tankLight > ambienceFor(noon.phase, true).tankLight);

console.log("\n── 나타났다 사라짐 ──");
const far = IDLE_BEFORE_FADE_MS + FADE_SPAN_MS + 10_000;
check(
  "밝은 방에서는 사라지지 않는다",
  dissolveLevel({ activity: "drifting", roomDark: false, idleMs: far, serious: false }) === 0
);
check(
  "어둠 속에서 가만히 두면 사라진다",
  dissolveLevel({ activity: "drifting", roomDark: true, idleMs: far, serious: false }) > 0.85
);
check(
  "자국은 남는다 (완전히 0이 되지 않는다)",
  dissolveLevel({ activity: "drifting", roomDark: true, idleMs: far, serious: false }) < 1
);
check(
  "말하는 중에는 또렷하다",
  dissolveLevel({ activity: "speaking", roomDark: true, idleMs: far, serious: false }) === 0
);
check(
  "사용자를 기다리는 중에는 또렷하다",
  dissolveLevel({ activity: "listening", roomDark: true, idleMs: far, serious: false }) === 0
);
check(
  "무거운 이야기 중에는 절대 사라지지 않는다",
  dissolveLevel({ activity: "drifting", roomDark: true, idleMs: far, serious: true }) === 0
);
check(
  "막 대화를 마친 직후에는 또렷하다",
  dissolveLevel({ activity: "drifting", roomDark: true, idleMs: 1_000, serious: false }) === 0
);

console.log("\n── 프롬프트 조립 ──");
const prefix = buildStablePrefix({ name: "달이" }, "지우");
check("고정 프리픽스에 이름이 들어간다", prefix.includes("달이") && prefix.includes("지우"));
check("프리픽스에 시각 같은 가변값이 없다", !/\d{2}:\d{2}/.test(prefix));

const ctx = buildTurnContext({
  fish: { name: "달이" },
  profile: {
    nickname: "지우",
    createdAt: 0,
    traits: { ...traits, directness: 85, selfCriticism: 75 },
    answers: {},
    overrides: { directness: "direct", wantsAdvice: true },
  },
  care,
  bond: { rapport: 40, visitDays: 5, streak: 3, lastVisitDate: "2026-01-01", exchanges: 12 },
  notes: [{ id: "n1", at: 0, summary: "사용자는 고양이를 키운다", topics: ["고양이"], kind: "event" }],
  digests: [],
  techniques: selfBlame,
  risk: assessRisk("죽고 싶어"),
  awake: true,
  timeLabel: "밤",
  clock: "23:14",
  daysSinceLastVisit: 2,
  stuckDirective: "",
  turn: 4,
});
check("직설 성향이 지시로 반영된다", ctx.includes("돌려 말하는 걸 답답해한다"));
check("자기비판 지시가 들어간다", ctx.includes("자기를 몰아세우는"));
check("연속 방문을 알고 있다", ctx.includes("3일 연속"));
check("기억이 들어간다", ctx.includes("고양이"));
check("위기 지시가 최우선으로 붙는다", ctx.includes("안전 — 최우선") && ctx.includes("109"));
check("기법 이름을 말하지 말라는 지시", ctx.includes("기법의 이름은 절대 말하지 마라"));

console.log("\n── 물고기의 결 ──");
check("수수께끼를 쓸 때와 쓰면 안 될 때가 모두 있다", prefix.includes("수수께끼를 써도 될 때") && prefix.includes("수수께끼를 절대 쓰면 안 될 때"));
check("힘들 때는 수수께끼 금지", prefix.includes("괴로운 사람에게 수수께끼는 조롱이 된다"));
check("못 알아들으면 바로 풀어준다", prefix.includes("두 번은 없다"));
check("임상적 깊이가 지시되어 있다", prefix.includes("감정 뒤의 감정") && prefix.includes("되풀이되는 무늬"));
check("학위·경력을 주장하지 않는다", prefix.includes("학위·경력·자격증·소속을 말하지 마라"));
check("무엇이냐 물으면 AI라고 답한다", prefix.includes("물고기이고, AI다"));

console.log(`\n${failed === 0 ? "모두 통과" : `${failed}건 실패`}\n`);
process.exit(failed === 0 ? 0 : 1);
