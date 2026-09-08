"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { CrisisCard } from "./CrisisCard";
import type { RiskDomain } from "@/lib/types";

/**
 * 대화창. 어항 아래에 얹히는 유리판처럼.
 * 물고기 말은 왼쪽에 여백 있게, 사용자 말은 오른쪽에 작게.
 */

interface Props {
  fishName: string;
  messages: ChatMessage[];
  streamingId: string | null;
  busy: boolean;
  awake: boolean;
  showCrisis: boolean;
  crisisDomains: RiskDomain[];
  onCloseCrisis: () => void;
  onSend: (text: string) => void;
  onTypingChange: (typing: boolean) => void;
  input: string;
  setInput: (v: string) => void;
}

export function ChatDock({
  fishName,
  messages,
  streamingId,
  busy,
  awake,
  showCrisis,
  crisisDomains,
  onCloseCrisis,
  onSend,
  onTypingChange,
  input,
  setInput,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<number | null>(null);

  // 새 메시지나 스트리밍 중이면 아래로 따라간다
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, streamingId]);

  // textarea 자동 높이
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(120, ta.scrollHeight)}px`;
  }, [input]);

  const handleChange = (v: string) => {
    setInput(v);
    onTypingChange(v.length > 0);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => onTypingChange(false), 2600);
  };

  const submit = () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    onTypingChange(false);
    onSend(t);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 pb-3"
      >
        {messages.length === 0 && !busy && (
          <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-ink-faint">
            {awake
              ? `${fishName}가 유리 가까이 와 있어요.\n오늘 어땠는지 아무렇게나 말해도 괜찮아요.`
              : `${fishName}는 지금 자고 있어요.\n방의 불을 끄거나, 그냥 말을 걸어보세요.`}
          </p>
        )}

        {messages.map((m) =>
          m.role === "fish" ? (
            <FishLine
              key={m.id}
              name={fishName}
              text={m.text}
              streaming={m.id === streamingId}
            />
          ) : (
            <UserLine key={m.id} text={m.text} />
          )
        )}

        {busy && !streamingId && <Typing name={fishName} />}

        {showCrisis && (
          <div className="pt-1">
            <CrisisCard domains={crisisDomains} onClose={onCloseCrisis} />
          </div>
        )}
      </div>

      <div className="relative mt-1 flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur">
        <textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={awake ? "여기에 오늘을 적어보세요" : "말을 걸면 방이 어두워져요"}
          className="max-h-[120px] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed
                     text-ink outline-none placeholder:text-ink-faint"
        />
        <button
          onClick={submit}
          disabled={!input.trim() || busy}
          aria-label="보내기"
          className="mb-0.5 shrink-0 rounded-xl bg-sky-300/85 px-4 py-2.5 text-[13px] font-semibold
                     text-slate-900 transition hover:bg-sky-200 active:scale-95
                     disabled:bg-white/8 disabled:text-ink-faint"
        >
          보내기
        </button>
      </div>
    </div>
  );
}

/* ─────────────────  말풍선  ───────────────── */

/**
 * 물고기의 말에서 몸짓(*지느러미를 흔든다*)을 분리한다.
 * 몸짓은 말이 아니라 행동이므로 말풍선 밖에, 흐리게 둔다.
 */
function splitGesture(text: string): { gestures: string[]; speech: string } {
  const gestures: string[] = [];
  const speech = text
    .replace(/\*([^*]+)\*/g, (_, g: string) => {
      gestures.push(g.trim());
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { gestures, speech };
}

function FishLine({
  name,
  text,
  streaming,
}: {
  name: string;
  text: string;
  streaming: boolean;
}) {
  const { gestures, speech } = splitGesture(text);

  return (
    <div className="animate-fade-up">
      <div className="mb-1.5 px-1 text-[11px] tracking-wide text-ink-faint">{name}</div>

      {gestures.map((g, i) => (
        <div key={i} className="mb-1.5 px-1 text-[12.5px] italic leading-relaxed text-ink-faint/85">
          {g}
        </div>
      ))}

      {(speech || streaming) && (
        <div className="relative max-w-[88%] pb-1.5">
          {/* 꼬리 — 아래 모서리에서 왼쪽으로 흘러나온다 */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-2 block h-3.5 w-3.5 -translate-x-1/2 rotate-45
                       rounded-[2px] border-b border-l border-white/10 bg-[#0c1524]"
          />
          <div
            className="relative whitespace-pre-wrap text-pretty rounded-2xl rounded-bl-sm border
                       border-white/10 bg-[#0c1524] px-4 py-3 text-[15px] leading-[1.75]
                       text-ink shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            {speech}
            {streaming && (
              <span
                className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px]
                           animate-[soft-pulse_1s_ease-in-out_infinite] bg-sky-200/80"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserLine({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-up justify-end">
      <div className="relative max-w-[82%] pb-1.5">
        {/* 꼬리 */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-2 block h-3.5 w-3.5 translate-x-1/2 rotate-45
                     rounded-[2px] border-b border-r border-sky-200/18 bg-[#16283c]"
        />
        <div
          className="relative whitespace-pre-wrap rounded-2xl rounded-br-sm border border-sky-200/18
                     bg-[#16283c] px-4 py-2.5 text-[14.5px] leading-relaxed text-ink/90"
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function Typing({ name }: { name: string }) {
  return (
    <div className="animate-fade-up">
      <div className="mb-1.5 px-1 text-[11px] tracking-wide text-ink-faint">{name}</div>
      <div className="relative w-fit pb-1.5">
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-2 block h-3.5 w-3.5 -translate-x-1/2 rotate-45
                     rounded-[2px] border-b border-l border-white/10 bg-[#0c1524]"
        />
        <div className="relative flex gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-[#0c1524] px-4 py-3.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-sky-200"
              style={{ animation: `typing-dot 1.3s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
