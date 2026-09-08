"use client";

import { KR_RESOURCES, resourcesFor } from "@/lib/psych/safety";
import type { RiskDomain } from "@/lib/types";

/**
 * 위기 신호가 잡히면 대화 위로 조용히 떠오르는 카드.
 * 경고음이나 붉은 색을 쓰지 않는다 — 놀라게 하려는 게 아니라 손을 내미는 것이다.
 */
export function CrisisCard({
  domains,
  onClose,
}: {
  domains: RiskDomain[];
  onClose: () => void;
}) {
  const list = domains.length ? resourcesFor(domains) : KR_RESOURCES.slice(0, 3);

  return (
    <div className="animate-fade-up rounded-2xl border border-sky-300/25 bg-sky-950/50 p-4 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-sky-100">혼자 감당하지 않아도 돼요</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-sky-200/70">
            지금 많이 힘든 것 같아요. 물고기는 곁에 있어 줄 수 있지만, 사람만이 해줄 수 있는 것도
            있어요. 아래는 24시간 열려 있고, 무료이고, 이름을 말하지 않아도 됩니다.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          type="button"
          className="-mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[20px]
                     leading-none text-sky-200/40 transition hover:bg-white/8 hover:text-sky-200"
        >
          ×
        </button>
      </div>

      <div className="mt-3.5 grid gap-1.5">
        {list.map((r) => (
          <a
            key={r.name}
            href={r.href}
            className="flex min-h-[56px] items-center justify-between rounded-xl border border-white/8
                       bg-white/[0.04] px-4 transition hover:border-sky-300/30 hover:bg-white/[0.07]
                       active:scale-[0.99]"
          >
            <div>
              <div className="text-[13px] text-ink">{r.name}</div>
              <div className="text-[11px] text-ink-faint">{r.note}</div>
            </div>
            <div className="text-[15px] font-semibold tracking-wide text-sky-200">{r.contact}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
