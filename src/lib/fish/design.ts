import type {
  BodyShape,
  EyeShape,
  FinStyle,
  FishDesign,
  MouthShape,
  ScalePattern,
} from "@/lib/types";

/** 꾸미기 화면에서 쓰는 선택지 정의 */

export interface Choice<T> {
  value: T;
  label: string;
  hint?: string;
}

export const BODY_SHAPES: Choice<BodyShape>[] = [
  { value: "slender", label: "가느다란", hint: "물살을 가르는 몸" },
  { value: "round", label: "동그란", hint: "품이 넉넉한 몸" },
  { value: "teardrop", label: "물방울", hint: "머리가 크고 뒤로 갈수록 좁아지는" },
  { value: "broad", label: "넓적한", hint: "묵직하고 든든한" },
];

export const EYE_SHAPES: Choice<EyeShape>[] = [
  { value: "round", label: "동그란 눈", hint: "호기심 많아 보여요" },
  { value: "almond", label: "아몬드 눈", hint: "차분하고 총명한" },
  { value: "droopy", label: "처진 눈", hint: "다정하고 편안한" },
  { value: "sparkle", label: "반짝이는 눈", hint: "빛이 고여 있는" },
  { value: "sleepy", label: "졸린 눈", hint: "나른하고 느긋한" },
];

export const MOUTH_SHAPES: Choice<MouthShape>[] = [
  { value: "small", label: "작은 입" },
  { value: "pout", label: "오므린 입", hint: "뽀끔뽀끔" },
  { value: "smile", label: "웃는 입" },
  { value: "wide", label: "큰 입", hint: "표정이 잘 보여요" },
];

export const SCALE_PATTERNS: Choice<ScalePattern>[] = [
  { value: "plain", label: "매끈한" },
  { value: "pearl", label: "진주빛" },
  { value: "marble", label: "대리석" },
  { value: "net", label: "그물무늬" },
  { value: "speckle", label: "점박이" },
  { value: "iridescent", label: "오로라" },
];

export const FIN_STYLES: Choice<FinStyle>[] = [
  { value: "veil", label: "베일테일", hint: "길게 흐르는 천처럼" },
  { value: "crown", label: "크라운테일", hint: "왕관처럼 갈라진" },
  { value: "halfmoon", label: "하프문", hint: "펼치면 반달" },
  { value: "delta", label: "델타", hint: "단정한 삼각" },
  { value: "feather", label: "깃털", hint: "부드럽게 흩날리는" },
];

/** 색 팔레트 — 어두운 방에서 빛나 보이도록 채도와 명도를 맞춰 뒀다 */
export interface Palette {
  id: string;
  label: string;
  bodyTop: string;
  bodyMid: string;
  bodyBottom: string;
  /** 지느러미: 뿌리 → 중간 → 끝 */
  finInner: string;
  finMid: string;
  finOuter: string;
  eye: string;
}

export const PALETTES: Palette[] = [
  {
    // 기본값 — 푸른 몸에 지느러미가 보라를 거쳐 산호빛으로 번진다
    id: "moonlit",
    label: "달빛",
    bodyTop: "#a5c2f5",
    bodyMid: "#6b8fe2",
    bodyBottom: "#333f8c",
    finInner: "#4f74e8",
    finMid: "#a878e0",
    finOuter: "#f4796a",
    eye: "#1b5fd0",
  },
  {
    id: "ember",
    label: "잉걸불",
    bodyTop: "#ffd6ad",
    bodyMid: "#ec8558",
    bodyBottom: "#b0384a",
    finInner: "#e8613f",
    finMid: "#f0a05f",
    finOuter: "#ffd9a0",
    eye: "#5a1a1a",
  },
  {
    id: "aurora",
    label: "오로라",
    bodyTop: "#aef2e0",
    bodyMid: "#5fcdb6",
    bodyBottom: "#2f6f9c",
    finInner: "#3f9fd8",
    finMid: "#68d8c0",
    finOuter: "#c8f5a8",
    eye: "#0e5f7a",
  },
  {
    id: "amethyst",
    label: "자수정",
    bodyTop: "#dcc0f7",
    bodyMid: "#a06fd8",
    bodyBottom: "#5a3a96",
    finInner: "#7b4fd0",
    finMid: "#c07de8",
    finOuter: "#ffc0e8",
    eye: "#3a1a70",
  },
  {
    id: "koi",
    label: "비단잉어",
    bodyTop: "#ffe9d6",
    bodyMid: "#f2a070",
    bodyBottom: "#d2503a",
    finInner: "#e0603f",
    finMid: "#f7a878",
    finOuter: "#fff0e0",
    eye: "#4a1f14",
  },
  {
    id: "abyss",
    label: "심해",
    bodyTop: "#9dbde8",
    bodyMid: "#4a68a8",
    bodyBottom: "#18244a",
    finInner: "#2c4a90",
    finMid: "#5f7fd0",
    finOuter: "#9ad8f0",
    eye: "#0a2a60",
  },
  {
    id: "blossom",
    label: "밤벚꽃",
    bodyTop: "#fcd2e4",
    bodyMid: "#e890b6",
    bodyBottom: "#a05888",
    finInner: "#d068a0",
    finMid: "#f0a0c8",
    finOuter: "#fff0d8",
    eye: "#5a1a44",
  },
  {
    id: "jade",
    label: "옥",
    bodyTop: "#cdf0ba",
    bodyMid: "#82c07c",
    bodyBottom: "#37785c",
    finInner: "#4a9070",
    finMid: "#8fd0a0",
    finOuter: "#e8f0a0",
    eye: "#14401f",
  },
];

export const DEFAULT_DESIGN: FishDesign = {
  name: "",
  bodyShape: "teardrop",
  eyeShape: "round",
  eyeColor: "#1b5fd0",
  mouthShape: "pout",
  scalePattern: "speckle",
  finStyle: "veil",
  bodyTop: "#a5c2f5",
  bodyMid: "#6b8fe2",
  bodyBottom: "#333f8c",
  finInner: "#4f74e8",
  finMid: "#a878e0",
  finOuter: "#f4796a",
  size: 1,
  finFlow: 1,
  glow: 0.55,
};

export function applyPalette(design: FishDesign, p: Palette): FishDesign {
  return {
    ...design,
    bodyTop: p.bodyTop,
    bodyMid: p.bodyMid,
    bodyBottom: p.bodyBottom,
    finInner: p.finInner,
    finMid: p.finMid,
    finOuter: p.finOuter,
    eyeColor: p.eye,
  };
}

export function randomDesign(): FishDesign {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
  const p = pick(PALETTES);
  return applyPalette(
    {
      ...DEFAULT_DESIGN,
      bodyShape: pick(BODY_SHAPES).value,
      eyeShape: pick(EYE_SHAPES).value,
      mouthShape: pick(MOUTH_SHAPES).value,
      scalePattern: pick(SCALE_PATTERNS).value,
      finStyle: pick(FIN_STYLES).value,
      size: 0.85 + Math.random() * 0.45,
      finFlow: 0.75 + Math.random() * 0.6,
      glow: 0.35 + Math.random() * 0.5,
    },
    p
  );
}

/**
 * 외형에서 성격 인상을 뽑아낸다.
 * 사용자가 고른 생김새가 물고기의 말투에 실제로 반영되어야
 * "내가 만든 아이"라는 감각이 생긴다.
 */
export function personaFromDesign(d: FishDesign): string {
  const bits: string[] = [];

  const eye: Record<EyeShape, string> = {
    round: "눈이 동그래서 무엇이든 궁금해하는 인상",
    almond: "눈매가 길고 차분해서 오래 지켜보는 인상",
    droopy: "눈꼬리가 내려가 늘 다정해 보이는 인상",
    sparkle: "눈에 빛이 고여 있어 잘 감탄하는 인상",
    sleepy: "반쯤 감긴 눈으로 서두르는 법이 없는 인상",
  };
  bits.push(eye[d.eyeShape]);

  const mouth: Record<MouthShape, string> = {
    small: "말수가 적고 한 마디를 아껴 쓴다",
    pout: "입을 오므리고 뽀끔거리는 버릇이 있다",
    smile: "말끝이 늘 조금 올라간다",
    wide: "감정이 입에 그대로 드러난다",
  };
  bits.push(mouth[d.mouthShape]);

  const body: Record<BodyShape, string> = {
    slender: "몸이 가늘어 움직임이 재빠르고 예민하다",
    round: "몸이 둥글어 곁에 있으면 품이 넓게 느껴진다",
    teardrop: "물방울 같은 몸으로 조용히 미끄러진다",
    broad: "넓적한 몸이라 든든하고 잘 흔들리지 않는다",
  };
  bits.push(body[d.bodyShape]);

  const fin: Record<FinStyle, string> = {
    veil: "긴 베일 같은 지느러미가 말끝마다 천천히 흔들린다",
    crown: "왕관처럼 갈라진 지느러미를 가끔 활짝 편다",
    halfmoon: "감정이 올라오면 지느러미가 반달처럼 펼쳐진다",
    delta: "단정한 지느러미를 필요한 만큼만 움직인다",
    feather: "깃털 같은 지느러미가 물결에 계속 흩날린다",
  };
  bits.push(fin[d.finStyle]);

  if (d.size > 1.15) bits.push("몸집이 커서 존재감이 있다");
  if (d.size < 0.92) bits.push("작아서 유리 가까이 와야 표정이 보인다");
  if (d.glow > 0.7) bits.push("어두울수록 몸에서 은은한 빛이 난다");

  return bits.join(", ") + ".";
}
