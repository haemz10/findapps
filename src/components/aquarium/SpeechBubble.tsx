"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * 물고기 얼굴에서 나오는 말풍선.
 *
 * 물고기는 rAF 로 계속 움직이므로 말풍선도 따라다녀야 한다.
 * 다만 매 프레임 리렌더하면 60fps 가 무너지므로, 위치는 DOM 스타일을 직접 건드리고
 * 내용이 바뀔 때만 리렌더한다.
 *
 * 말풍선은 수조 밖으로 나가면 안 되므로, 실제 크기를 재서 안쪽으로 밀어 넣는다.
 */

export interface HeadPos {
  x: number;
  y: number;
  dir: 1 | -1;
  scale: number;
}

interface Props {
  head: HeadPos | null;
  text: string;
  streaming: boolean;
  /** 몸짓 묘사 — 말풍선 위에 기울임으로 */
  gestures: string[];
  onDismiss: () => void;
}

export function SpeechBubble({ head, text, streaming, gestures, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // 내용이 바뀌면 크기를 다시 잰다
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
  }, [text, gestures.length]);

  // 위치 갱신 — 리렌더 없이
  useEffect(() => {
    const el = ref.current;
    if (!el || !head) return;
    const parent = el.parentElement;
    if (!parent) return;
    const pr = parent.getBoundingClientRect();
    if (!pr.width) return;

    const w = size.w || 200;
    const h = size.h || 60;

    const pad = 10;
    const gapY = 12;
    const hx = head.x * pr.width;
    const hy = head.y * pr.height;

    // ① 얼굴 위 — 기본. 물고기가 말할 때는 아래쪽에 자리잡으므로 대개 여기가 된다.
    let top = hy - h - gapY;
    let left = hx - w / 2 + head.dir * w * 0.18;
    let below = false;

    if (top < pad) {
      // ② 위가 좁으면 옆으로 — 몸통을 덮는 것보다 낫다
      const sideLeft = head.dir === 1 ? hx - w - 12 : hx + 12;
      if (sideLeft >= pad && sideLeft + w <= pr.width - pad) {
        left = sideLeft;
        top = Math.min(pr.height - h - pad, Math.max(pad, hy - h / 2));
      } else {
        // ③ 그것도 안 되면 아래로
        top = Math.min(pr.height - h - pad, hy + 34);
        below = true;
      }
    }

    left = Math.min(pr.width - w - pad, Math.max(pad, left));
    top = Math.min(pr.height - h - pad, Math.max(pad, top));

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    // 꼬리는 얼굴을 향한다
    const tail = el.querySelector<HTMLElement>("[data-tail]");
    if (tail) {
      const tx = Math.min(w - 24, Math.max(16, hx - left));
      tail.style.left = `${tx}px`;
      tail.style.top = below ? "-6px" : "auto";
      tail.style.bottom = below ? "auto" : "-6px";
    }
  }, [head, size.w, size.h]);

  if (!head || (!text && !streaming && gestures.length === 0)) return null;

  return (
    <div
      ref={ref}
      className="absolute z-30 w-[min(72%,14.5rem)] animate-fade-up"
      style={{ left: -9999, top: -9999 }}
    >
      <div className="relative">
        {/* 꼬리 — 얼굴을 향한다 */}
        <span
          data-tail
          aria-hidden="true"
          className="absolute block h-3.5 w-3.5 rotate-45 rounded-[2px] border border-white/25
                     bg-[#0d1a2c]"
          style={{ bottom: -6 }}
        />
        <div
          data-selectable
          className="scroll-y relative max-h-[6.2rem] rounded-[20px] border border-white/25
                     bg-[#0d1a2c]/95 py-2.5 pl-3.5 pr-7 text-[12.8px] leading-[1.55] text-ink
                     shadow-[0_6px_28px_rgba(0,0,0,0.6)]"
        >
          {gestures.length > 0 && (
            <span className="text-[11.2px] italic text-sky-100/70">
              {gestures.join(" · ")}{"  "}
            </span>
          )}
          <span className="whitespace-pre-wrap">{text}</span>
          {streaming && (
            <span
              className="ml-0.5 inline-block h-[13px] w-[2px] translate-y-[2px]
                         animate-[soft-pulse_1s_ease-in-out_infinite] bg-sky-200/80"
            />
          )}
        </div>

        {/* 닫기 — 본문을 눌러 실수로 닫히지 않게 따로 둔다 */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="말풍선 접기"
          className="absolute -right-1.5 -top-1.5 grid h-11 w-11 place-items-center rounded-full
                     text-[16px] leading-none text-ink-faint transition hover:text-ink active:scale-90"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/** 말에서 몸짓(*...*)을 떼어낸다 */
export function splitGesture(text: string): { gestures: string[]; speech: string } {
  const gestures: string[] = [];
  const speech = text
    .replace(/\*([^*]+)\*/g, (_, g: string) => {
      gestures.push(g.trim());
      return " ";
    })
    // 말풍선 하나에 들어가야 한다 — 빈 줄도 줄바꿈도 만들지 않는다
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { gestures, speech };
}
