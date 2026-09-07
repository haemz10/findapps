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
  finInner: string;
  finOuter: string;
  eye: string;
}

export const PALETTES: Palette[] = [
  {
    id: "moonlit",
    label: "달빛",
    bodyTop: "#9fc6f5",
    bodyMid: "#6f8fd8",
    bodyBottom: "#3d4f96",
    finInner: "#a8c4f0",
    finOuter: "#5f6fc4",
    eye: "#1b2a52",
  },
  {
    id: "ember",
    label: "잉걸불",
    bodyTop: "#ffd8a8",
    bodyMid: "#f08a5d",
    bodyBottom: "#b23a48",
    finInner: "#ffb88c",
    finOuter: "#c94c5a",
    eye: "#3a1420",
  },
  {
    id: "aurora",
    label: "오로라",
    bodyTop: "#b8f5e6",
    bodyMid: "#6fd8c4",
    bodyBottom: "#3a7fa8",
    finInner: "#c3f0ff",
    finOuter: "#5aa8d8",
    eye: "#123040",
  },
  {
    id: "amethyst",
    label: "자수정",
    bodyTop: "#e4c4f7",
    bodyMid: "#a878d8",
    bodyBottom: "#5f3f96",
    finInner: "#d8b4f0",
    finOuter: "#8a5fc4",
    eye: "#2a1440",
  },
  {
    id: "koi",
    label: "비단잉어",
    bodyTop: "#fff4e8",
    bodyMid: "#f5a86f",
    bodyBottom: "#d4553a",
    finInner: "#ffe4d0",
    finOuter: "#e08060",
    eye: "#3a1c12",
  },
  {
    id: "abyss",
    label: "심해",
    bodyTop: "#7fa8d8",
    bodyMid: "#3f5f96",
    bodyBottom: "#1a2848",
    finInner: "#6f96c8",
    finOuter: "#2a3f6f",
    eye: "#0a1428",
  },
  {
    id: "blossom",
    label: "밤벚꽃",
    bodyTop: "#ffd8e8",
    bodyMid: "#f0a0c0",
    bodyBottom: "#a85f88",
    finInner: "#ffc8dd",
    finOuter: "#c47fa8",
    eye: "#3a1428",
  },
  {
    id: "jade",
    label: "옥",
    bodyTop: "#d8f5c4",
    bodyMid: "#8ac48a",
    bodyBottom: "#3f7a5f",
    finInner: "#c4f0d0",
    finOuter: "#5f9a78",
    eye: "#12301f",
  },
];

export const DEFAULT_DESIGN: FishDesign = {
  name: "",
  bodyShape: "teardrop",
  eyeShape: "round",
  eyeColor: "#1b2a52",
  mouthShape: "pout",
  scalePattern: "iridescent",
  finStyle: "veil",
  bodyTop: "#9fc6f5",
  bodyMid: "#6f8fd8",
  bodyBottom: "#3d4f96",
  finInner: "#a8c4f0",
  finOuter: "#5f6fc4",
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
