"use client";

import { useEffect, useState } from "react";

export function useCountdown(target: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [target]);

  return target ? Math.max(0, Math.ceil((target - now) / 1000)) : 0;
}

export const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
