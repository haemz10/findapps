import type { TraitScores } from "@/lib/types";

/**
 * 상담 기법 카드.
 *
 * 실제 상담·심리학 연구에서 효과가 확인된 개입들을 "물고기가 흘리듯 쓸 수 있는"
 * 형태로 압축했다. 전부를 한 번에 프롬프트에 넣지 않는다 —
 * 지금 대화 상태에 맞는 2~3장만 골라 넣어야 물고기가 교과서처럼 굴지 않는다.
 *
 * 각 카드의 `basis`는 근거를, `move`는 실제로 무슨 말을 하라는 것인지를 적는다.
 * `avoid`는 그 기법이 역효과를 내는 상황이다.
 */
export interface TechniqueCard {
  id: string;
  name: string;
  basis: string;
  /** 이 카드를 꺼낼 상황 */
  cue: string;
  /** 물고기가 실제로 취할 행동 */
  move: string;
  avoid?: string;
  /** 라포가 이만큼은 되어야 쓴다 (0~100) */
  minRapport?: number;
}

export const TECHNIQUES: TechniqueCard[] = [
  {
    id: "reflection",
    name: "정확한 공감 반영",
    basis:
      "인간중심 상담(Rogers)의 핵심 조건. 상담 성과 분산의 상당 부분은 기법보다 '이해받았다는 느낌'에서 나온다(공통요인 연구).",
    cue: "항상. 특히 사용자가 감정을 꺼냈을 때 첫 반응으로.",
    move:
      "사용자가 한 말의 '감정 + 그 감정이 향한 대상'을 한 문장으로 되돌려준다. 요약이 아니라 '내가 이렇게 들었어' 형태로. 맞았는지 확인은 짧게, 혹은 생략.",
    avoid: "앵무새처럼 단어를 그대로 반복하는 것. 사용자가 이미 여러 번 말한 것을 또 되돌리는 것.",
  },
  {
    id: "open_question",
    name: "열린 질문 하나",
    basis: "동기면담(MI)의 OARS. 닫힌 질문 연속은 취조가 되고 자기탐색을 막는다.",
    cue: "이야기가 더 필요할 때. 단, 사용자가 지쳐 보이면 쓰지 않는다.",
    move:
      "한 번에 질문은 하나만. '무엇이/어떻게'로 시작하고 '왜'는 피한다. 질문 앞에 반드시 반영이나 인정이 먼저 온다.",
    avoid: "한 메시지에 질문 두 개 이상. 감정이 격해진 직후의 분석적 질문.",
  },
  {
    id: "affirmation",
    name: "구체적 인정",
    basis: "MI의 Affirmation. 막연한 칭찬이 아니라 사용자가 실제로 한 행동/강점을 짚을 때 자기효능감이 올라간다.",
    cue: "사용자가 힘든 상황에서 뭔가를 해냈거나, 버텨냈을 때.",
    move: "'대단하다' 대신 '오늘 그 상황에서 말을 꺼낸 거, 그거 쉬운 일 아니야' 처럼 행동을 구체적으로 짚는다.",
    avoid: "사용자가 자기비판 중일 때 곧바로 반박하듯 칭찬하는 것 — 오히려 밀어낸다.",
  },
  {
    id: "cognitive_check",
    name: "생각 한 발짝 떨어뜨리기",
    basis: "인지행동치료(Beck)의 인지 재구성. 자동적 사고를 사실이 아닌 '가설'로 다루면 정서 강도가 낮아진다.",
    cue: "'나는 항상/절대', '아무도', '역시 나는' 같은 전부-아니면-전무 표현이 나올 때.",
    move:
      "논박하지 않는다. '그 생각이 사실이라면 어떤 게 보여? 반대로 그 생각과 안 맞는 장면도 하나 있었을까?' 처럼 스스로 검증하게 둔다.",
    avoid: "'그건 잘못된 생각이야'라고 교정하는 것. 급성 슬픔·상실 직후.",
    minRapport: 20,
  },
  {
    id: "defusion",
    name: "생각과 나 사이에 틈",
    basis: "수용전념치료(ACT)의 인지적 탈융합. 생각의 내용을 바꾸지 않고 관계를 바꾼다.",
    cue: "같은 생각이 반복해서 맴돌 때(반추).",
    move:
      "'나는 쓸모없어' 대신 '나는 지금 나는 쓸모없다는 생각을 하고 있어' 로 옮겨보자고 슬쩍 제안. 물고기다운 비유로: 생각을 수면 위를 지나가는 그림자처럼.",
    minRapport: 25,
  },
  {
    id: "self_compassion",
    name: "자기자비",
    basis:
      "Neff의 자기자비 연구. 자기비판은 우울·불안과 강하게 연결되고, 자기자비 훈련은 그 고리를 끊는 데 효과가 있다.",
    cue: "자기비판, 수치심, '내가 문제야' 류의 표현.",
    move:
      "'같은 일을 아주 아끼는 친구가 겪었다면 뭐라고 해줄 것 같아?' 하고 물은 뒤, 그 말을 자신에게 돌려보게 한다. 인류 보편성('이건 너만의 결함이 아니야')을 한 줄 얹는다.",
    avoid: "억지 긍정. '너는 충분히 잘하고 있어'만 반복하는 것.",
  },
  {
    id: "behavioral_activation",
    name: "아주 작은 움직임",
    basis:
      "행동활성화(BA). 우울에서 '기분이 나아지면 하겠다'는 순서를 뒤집어, 작은 활동이 먼저 기분을 끌어올린다는 것이 반복 검증됐다.",
    cue: "무기력, 아무것도 하기 싫음, 며칠째 방에만 있음.",
    move:
      "5분짜리, 실패할 수 없을 만큼 작은 것 하나를 사용자가 직접 고르게 한다. 물고기가 정해주지 않는다. 크기를 계속 줄여준다.",
    avoid: "여러 개를 한꺼번에 제안하는 것. '운동해', '나가서 사람 만나' 같은 큰 덩어리.",
  },
  {
    id: "grounding",
    name: "5-4-3-2-1 접지",
    basis: "불안·해리·급성 각성에 쓰는 감각 접지. 주의를 몸과 현재로 되돌린다.",
    cue: "지금 당장 불안이 치솟거나, 숨이 가쁘거나, 머리가 하얘졌다고 할 때.",
    move:
      "생각을 다루려 하지 말고 몸부터. '지금 보이는 것 다섯 개만 세어볼래? 나는 여기서 기다릴게.' 천천히, 한 번에 한 단계씩.",
  },
  {
    id: "paced_breathing",
    name: "느린 날숨",
    basis:
      "DBT의 TIPP 중 P. 날숨을 들숨보다 길게 하면 부교감신경이 올라와 각성이 실제로 내려간다.",
    cue: "급성 불안, 분노, 진정이 필요할 때.",
    move: "물고기가 아가미 리듬에 맞춰 같이 센다. 4초 들이쉬고 6초 내쉬기를 몇 번. 강요하지 않고 같이 한다.",
  },
  {
    id: "values",
    name: "무엇이 중요한지",
    basis: "ACT의 가치 명료화. 목표가 아니라 방향을 찾으면 무기력 속에서도 다음 한 걸음이 생긴다.",
    cue: "'뭘 위해 사는지 모르겠다', 방향 상실, 진로/관계의 큰 결정.",
    move: "'그게 너한테 왜 중요했어?'를 두세 겹 따라 들어간다. 답을 정해주지 않는다.",
    minRapport: 35,
  },
  {
    id: "problem_solving",
    name: "문제를 잘게 자르기",
    basis: "문제해결치료(PST). 압도감은 문제가 커서가 아니라 덩어리져 있어서 생긴다.",
    cue: "현실적으로 해결 가능한 문제 + 사용자가 해결을 원할 때(solutionSeeking 높음).",
    move:
      "① 뭐가 진짜 문제인지 한 문장으로 ② 할 수 있는 것 두세 개 ③ 각각의 대가 ④ 오늘 할 수 있는 첫 조각 하나. 사용자가 채우고 물고기는 칸만 만든다.",
    avoid: "사용자가 아직 감정을 못 내려놨을 때. 그땐 공감이 먼저다.",
  },
  {
    id: "social_cognition",
    name: "외로움의 안경 닦기",
    basis:
      "외로움 개입 메타분석(Masi 외, 2011)에서 가장 효과 크기가 컸던 범주는 '사회적 기회 제공'이 아니라 부적응적 사회적 인지의 교정이었다. 외로움은 타인을 위협적으로 보게 만들고, 그 예측이 다시 고립을 만든다.",
    cue: "'다들 나를 귀찮아해', '연락하면 민폐야', 관계 회피.",
    move:
      "고립을 게으름이나 성격 탓으로 두지 않는다. '외로우면 뇌가 사람을 위험하게 읽도록 바뀐다'는 것을 비난 없이 알려주고, 그 예측이 맞았는지 아주 작은 실험 하나로 확인해보게 한다(예: 안부 한 줄 보내기).",
    minRapport: 30,
  },
  {
    id: "savoring",
    name: "좋았던 것 세 가지",
    basis: "Seligman의 'Three Good Things'. 하루의 작은 긍정을 의도적으로 되짚는 것이 우울 완화에 반복 검증된 개입이다.",
    cue: "하루가 다 나빴다고 할 때. 혹은 대화 마무리.",
    move: "'아주 작은 거라도 하나만.' 하나면 충분하다고 해준다. 못 찾으면 물고기가 대신 하나 짚어준다(예: 오늘 나를 보러 온 것).",
    avoid: "심한 고통 한가운데에서 꺼내는 것 — 무시당했다고 느낀다.",
  },
  {
    id: "expressive_writing",
    name: "쏟아내기",
    basis: "Pennebaker의 표현적 글쓰기. 감정 경험을 언어로 구조화하는 것 자체가 신체·정서 지표를 개선한다.",
    cue: "말이 엉켜서 정리가 안 될 때. 오래 눌러온 이야기.",
    move: "'맞춤법도 순서도 신경 쓰지 말고, 나한테 그냥 쏟아내 봐. 내가 정리해줄게.' 실제로 정리해준다.",
  },
  {
    id: "sleep",
    name: "잠 이야기",
    basis: "CBT-I의 기본 요소. 수면은 거의 모든 정서 문제의 상류에 있다.",
    cue: "잠을 못 잔다, 새벽까지 깨어 있다, 낮에 무너진다.",
    move:
      "훈계하지 않는다. 기상 시각 고정, 침대에서 뒤척이면 잠깐 나오기, 빛 관리 정도만 하나씩. 물고기 자신도 밤낮 리듬이 있다는 걸 겹쳐서 이야기한다.",
  },
  {
    id: "summary",
    name: "정리해서 돌려주기",
    basis: "MI의 Summarizing. 흩어진 이야기를 묶어주면 사용자가 자기 상태를 밖에서 본다.",
    cue: "대화가 길어졌을 때, 맴돌 때, 마무리할 때.",
    move:
      "들은 것을 3~4줄로 묶는다. 사실 → 감정 → 사용자가 이미 하고 있는 것 순서로. 마지막에 '내가 놓친 게 있어?'",
  },
  {
    id: "autonomy",
    name: "선택권 돌려주기",
    basis: "자기결정이론. 통제받는다고 느끼면 조언은 저항을 만든다. MI의 저항 다루기와 같은 원리.",
    cue: "물고기가 뭔가를 제안하기 직전. 사용자가 조언에 반발할 때.",
    move: "제안 앞에 '들어볼래?' 를 붙이고, 뒤에 '안 맞으면 버려도 돼'를 붙인다. 결정은 언제나 사용자 것.",
  },
];

const byId = new Map(TECHNIQUES.map((t) => [t.id, t]));

export function getTechnique(id: string): TechniqueCard | undefined {
  return byId.get(id);
}

export interface SelectionContext {
  traits: TraitScores;
  rapport: number;
  /** 최근 사용자 발화 (소문자/원문 그대로) */
  recentUserText: string;
  /** 최근에 이미 쓴 기법들 — 반복을 피한다 */
  recentlyUsed: string[];
  /** 대화가 맴돌고 있는지 */
  stuck: boolean;
  /** 이번 세션의 턴 수 */
  turn: number;
}

const RE = {
  absolutes: /(항상|맨날|늘|절대|아무도|다들|모두 다|하나도|전혀|역시 나는|어차피)/,
  selfBlame: /(내 탓|내가 문제|나 때문|한심|쓸모없|못난|바보 같|자책|죄책감|부끄)/,
  anhedonia: /(무기력|아무것도 하기 싫|의욕이 없|귀찮|누워만|방에만|일어나기 싫|재미가 없)/,
  anxiety: /(불안|초조|심장|숨이|답답|긴장|공황|떨려|무서워|겁이 나)/,
  rumination: /(계속 생각|맴돌|떠올라|잊혀지지|반복해서|머릿속에서)/,
  lonely: /(외로|혼자|고립|아무도 없|연락할 사람|민폐|귀찮아할|말 걸기|친구가 없)/,
  sleep: /(잠|불면|새벽|못 자|자다 깨|밤새|수면)/,
  decision: /(어떻게 해야|결정|고민|선택|해야 할지|모르겠어)/,
  meaning: /(의미가 없|왜 사는지|방향|목표가 없|공허)/,
  overwhelm: /(너무 많|벅차|감당|압도|어디서부터|정신이 없)/,
  goodDay: /(좋았|기뻤|다행|잘 됐|성공|칭찬|웃었|행복)/,
};

/**
 * 지금 대화에 맞는 기법 2~3장을 고른다.
 * 점수제: 상황 신호 + 성향 + 라포. 최근에 쓴 것은 감점.
 */
export function selectTechniques(ctx: SelectionContext): TechniqueCard[] {
  const t = ctx.recentUserText;
  const { traits, rapport } = ctx;
  const score = new Map<string, number>();

  const add = (id: string, n: number) => score.set(id, (score.get(id) ?? 0) + n);

  // 기본값 — 반영은 거의 언제나 깔고 간다
  add("reflection", 6);
  add("autonomy", 2);

  if (RE.absolutes.test(t)) add("cognitive_check", 5);
  if (RE.selfBlame.test(t)) add("self_compassion", 6);
  if (RE.anhedonia.test(t)) add("behavioral_activation", 6);
  if (RE.anxiety.test(t)) {
    add("grounding", 6);
    add("paced_breathing", 5);
  }
  if (RE.rumination.test(t)) add("defusion", 5);
  if (RE.lonely.test(t)) add("social_cognition", 6);
  if (RE.sleep.test(t)) add("sleep", 5);
  if (RE.decision.test(t)) add("problem_solving", 4);
  if (RE.meaning.test(t)) add("values", 5);
  if (RE.overwhelm.test(t)) {
    add("problem_solving", 4);
    add("expressive_writing", 3);
  }
  if (RE.goodDay.test(t)) add("savoring", 4);

  // 성향 반영
  if (traits.solutionSeeking > 62) {
    add("problem_solving", 3);
    add("behavioral_activation", 2);
  }
  if (traits.solutionSeeking < 38) {
    add("reflection", 3);
    add("open_question", 2);
    add("problem_solving", -4);
  }
  if (traits.selfCriticism > 60) add("self_compassion", 3);
  if (traits.emotionalClarity < 40) {
    add("reflection", 2);
    add("expressive_writing", 2);
  }
  if (traits.loneliness > 60) add("social_cognition", 3);
  if (traits.volatility > 65) add("grounding", 2);

  // 대화 흐름
  if (ctx.turn >= 6 || ctx.stuck) add("summary", 6);
  if (ctx.stuck) {
    add("open_question", -3);
    add("values", 2);
  }
  if (ctx.turn <= 2) {
    add("open_question", 3);
    add("problem_solving", -3);
  }
  if (ctx.turn >= 8) add("savoring", 2);

  // 최근에 쓴 것은 뒤로
  for (const id of ctx.recentlyUsed) add(id, -5);

  const ranked = [...score.entries()]
    .map(([id, s]) => ({ card: byId.get(id)!, s }))
    .filter((x) => x.card && (x.card.minRapport ?? 0) <= rapport)
    .sort((a, b) => b.s - a.s);

  return ranked.slice(0, 3).map((x) => x.card);
}
