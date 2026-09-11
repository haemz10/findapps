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

  // 내가 말을 더하면 아래로 따라간다
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
        className="scroll-y min-h-0 flex-1 space-y-2 px-1 pb-2"
      >
        {messages.length === 0 && (
          <p className="m-auto px-2 text-center text-[12.5px] leading-relaxed text-ink-faint">
            {awake
              ? `${fishName}가 유리 가까이 와 있어요. 오늘 어땠는지 아무렇게나 말해도 괜찮아요.`
              : `${fishName}는 지금 자고 있어요. 불을 끄거나, 그냥 말을 걸어보세요.`}
          </p>
        )}

        {messages.map((m) => (
          <UserLine key={m.id} text={m.text} />
        ))}

        {showCrisis && (
          <div className="pt-1">
            <CrisisCard domains={crisisDomains} onClose={onCloseCrisis} />
          </div>
        )}
      </div>

      <div className="relative mt-1 flex shrink-0 items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur">
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
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck={false}
          className="scroll-y max-h-[120px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5
                     text-[16px] leading-relaxed text-ink outline-none placeholder:text-ink-faint"
        />
        <button
          onClick={submit}
          disabled={!input.trim() || busy}
          aria-label="보내기"
          type="button"
          className="mb-0.5 h-11 shrink-0 rounded-xl bg-sky-300/85 px-5 text-[14px] font-semibold
                     text-slate-900 transition hover:bg-sky-200 active:scale-95
                     disabled:bg-white/8 disabled:text-ink-faint"
        >
          보내기
        </button>
      </div>
    </div>
  );
}

/* ─────────────────  내가 한 말  ───────────────── */

function UserLine({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-up justify-end">
      <div
        data-selectable
        className="max-w-[86%] whitespace-pre-wrap rounded-[15px] rounded-br-sm border
                   border-sky-200/25 bg-[#16283c] px-3.5 py-2 text-[13px] leading-relaxed text-ink/92"
      >
        {text}
      </div>
    </div>
  );
}
