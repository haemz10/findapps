"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { Room } from "@/components/aquarium/Room";
import { useApp } from "@/lib/store";

export default function Page() {
  const onboarded = useApp((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);

  // localStorage 복원 전에는 아무것도 그리지 않는다 — 온보딩이 깜빡이는 것을 막는다
  useEffect(() => {
    const unsub = useApp.persist.onFinishHydration(() => setHydrated(true));
    if (useApp.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="grid h-dvh place-items-center bg-abyss">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-sky-200/60"
              style={{ animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return onboarded ? <Room /> : <Onboarding />;
}
