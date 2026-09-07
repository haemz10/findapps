"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Bond,
  CareState,
  ChatMessage,
  FishActivity,
  FishCue,
  FishDesign,
  MemoryNote,
  RiskLevel,
  SessionDigest,
  UserProfile,
} from "@/lib/types";
import { DEFAULT_DESIGN } from "@/lib/fish/design";
import { changeWater, feed, initialCare, tickCare } from "@/lib/care";
import { scoreQuiz } from "@/lib/psych/quiz";

const emptyProfile: UserProfile = {
  nickname: "",
  createdAt: 0,
  traits: scoreQuiz({}),
  answers: {},
  overrides: {},
};

const emptyBond: Bond = {
  rapport: 0,
  visitDays: 0,
  streak: 0,
  lastVisitDate: null,
  exchanges: 0,
};

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((db - da) / 86400_000);
}

export interface AppState {
  /* ── 온보딩 ── */
  onboarded: boolean;
  profile: UserProfile;
  design: FishDesign;

  /* ── 지속 상태 ── */
  care: CareState;
  bond: Bond;
  notes: MemoryNote[];
  digests: SessionDigest[];

  /* ── 이번 세션(저장 안 함) ── */
  messages: ChatMessage[];
  activity: FishActivity;
  cue: FishCue;
  roomLightOn: boolean;
  lightTouched: boolean;
  pendingFood: number;
  busy: boolean;
  lastRisk: RiskLevel;
  showCrisis: boolean;
  soundOn: boolean;
  usedTechniques: string[];

  /* ── 액션 ── */
  completeOnboarding: (p: {
    nickname: string;
    answers: Record<string, number>;
    overrides: UserProfile["overrides"];
    design: FishDesign;
  }) => void;
  resetAll: () => void;

  setRoomLight: (on: boolean) => void;
  setSound: (on: boolean) => void;
  setActivity: (a: FishActivity) => void;
  setCue: (c: FishCue) => void;
  setBusy: (b: boolean) => void;
  setShowCrisis: (b: boolean) => void;

  tick: () => void;
  registerVisit: () => void;

  doFeed: () => void;
  doWaterChange: () => void;
  consumeFood: () => void;

  addMessage: (m: Omit<ChatMessage, "id" | "at"> & { id?: string; at?: number }) => string;
  appendToMessage: (id: string, chunk: string) => void;
  patchMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clearMessages: () => void;

  applyReflection: (r: {
    rapportDelta?: number;
    notes?: Omit<MemoryNote, "id" | "at">[];
    digest?: Omit<SessionDigest, "id" | "at" | "date">;
    technique?: string;
    cue?: FishCue;
    risk?: RiskLevel;
  }) => void;
}

const nid = () => Math.random().toString(36).slice(2, 10);

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profile: emptyProfile,
      design: DEFAULT_DESIGN,
      care: initialCare(),
      bond: emptyBond,
      notes: [],
      digests: [],

      messages: [],
      activity: "drifting",
      cue: "calm",
      roomLightOn: true,
      lightTouched: false,
      pendingFood: 0,
      busy: false,
      lastRisk: "none",
      showCrisis: false,
      soundOn: false,
      usedTechniques: [],

      completeOnboarding: ({ nickname, answers, overrides, design }) =>
        set({
          onboarded: true,
          profile: {
            nickname,
            createdAt: Date.now(),
            traits: scoreQuiz(answers),
            answers,
            overrides,
          },
          design,
          care: initialCare(),
          bond: { ...emptyBond, rapport: 4 },
        }),

      resetAll: () =>
        set({
          onboarded: false,
          profile: emptyProfile,
          design: DEFAULT_DESIGN,
          care: initialCare(),
          bond: emptyBond,
          notes: [],
          digests: [],
          messages: [],
          usedTechniques: [],
          showCrisis: false,
          lastRisk: "none",
        }),

      setRoomLight: (on) => set({ roomLightOn: on, lightTouched: true }),
      setSound: (on) => set({ soundOn: on }),
      setActivity: (a) => set({ activity: a }),
      setCue: (c) => set({ cue: c }),
      setBusy: (b) => set({ busy: b }),
      setShowCrisis: (b) => set({ showCrisis: b }),

      tick: () => set({ care: tickCare(get().care) }),

      registerVisit: () => {
        const today = todayKey();
        const bond = get().bond;
        if (bond.lastVisitDate === today) return;
        const gap = bond.lastVisitDate ? daysBetween(bond.lastVisitDate, today) : null;
        const streak = gap === 1 ? bond.streak + 1 : 1;
        // 매일 오는 것 자체가 관계를 쌓는다. 연속일수록 조금 더.
        const gain = 1.5 + Math.min(3, streak * 0.4);
        set({
          bond: {
            ...bond,
            lastVisitDate: today,
            visitDays: bond.visitDays + 1,
            streak,
            rapport: Math.min(100, bond.rapport + gain),
          },
        });
      },

      doFeed: () =>
        set((s) => ({
          care: feed(s.care),
          pendingFood: s.pendingFood + 6,
          bond: { ...s.bond, rapport: Math.min(100, s.bond.rapport + 0.6) },
        })),

      doWaterChange: () =>
        set((s) => ({
          care: changeWater(s.care),
          bond: { ...s.bond, rapport: Math.min(100, s.bond.rapport + 1.2) },
        })),

      consumeFood: () => set((s) => ({ pendingFood: Math.max(0, s.pendingFood - 1) })),

      addMessage: (m) => {
        const id = m.id ?? nid();
        set((s) => ({
          messages: [...s.messages, { ...m, id, at: m.at ?? Date.now() }],
          bond:
            m.role === "user"
              ? { ...s.bond, exchanges: s.bond.exchanges + 1 }
              : s.bond,
        }));
        return id;
      },

      appendToMessage: (id, chunk) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, text: m.text + chunk } : m
          ),
        })),

      patchMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      clearMessages: () => set({ messages: [], usedTechniques: [] }),

      applyReflection: ({ rapportDelta, notes, digest, technique, cue, risk }) =>
        set((s) => {
          const now = Date.now();
          const newNotes = (notes ?? []).map((n) => ({ ...n, id: nid(), at: now }));

          // 같은 이야기를 중복 저장하지 않는다
          const existing = new Set(s.notes.map((n) => n.summary));
          const merged = [...s.notes, ...newNotes.filter((n) => !existing.has(n.summary))];

          return {
            bond: {
              ...s.bond,
              rapport: Math.min(100, Math.max(0, s.bond.rapport + (rapportDelta ?? 0))),
            },
            notes: merged.slice(-60),
            digests: digest
              ? [
                  ...s.digests,
                  { ...digest, id: nid(), at: now, date: todayKey() },
                ].slice(-30)
              : s.digests,
            usedTechniques: technique
              ? [...s.usedTechniques, technique].slice(-6)
              : s.usedTechniques,
            cue: cue ?? s.cue,
            lastRisk: risk ?? s.lastRisk,
            showCrisis: risk === "high" ? true : s.showCrisis,
          };
        }),
    }),
    {
      name: "moonlit-fish/v1",
      storage: createJSONStorage(() => localStorage),
      // 대화 내용은 저장하지 않는다. 남는 것은 물고기의 "기억"뿐.
      partialize: (s) => ({
        onboarded: s.onboarded,
        profile: s.profile,
        design: s.design,
        care: s.care,
        bond: s.bond,
        notes: s.notes,
        digests: s.digests,
        soundOn: s.soundOn,
      }),
    }
  )
);
