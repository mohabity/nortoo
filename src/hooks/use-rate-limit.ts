"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for tracking rate-limit cooldown state.
 * Provides a countdown timer and a handler to trigger cooldown.
 */
export function useRateLimit() {
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!cooldownUntil) {
      setRemainingSeconds(0);
      return;
    }

    function tick() {
      const remaining = Math.max(
        0,
        Math.ceil((cooldownUntil! - Date.now()) / 1000)
      );
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setCooldownUntil(null);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldownUntil]);

  const handleRateLimit = useCallback((retryAfterSeconds: number) => {
    setCooldownUntil(Date.now() + retryAfterSeconds * 1000);
  }, []);

  const isLimited = remainingSeconds > 0;

  return { isLimited, remainingSeconds, handleRateLimit };
}
