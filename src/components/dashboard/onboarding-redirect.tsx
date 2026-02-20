"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Client-side redirect: if merchant hasn't completed onboarding,
 * redirect them to /onboarding. Renders nothing visible.
 */
export function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;

    async function check() {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.data?.completed && json.data?.currentStep < 6) {
          router.replace("/onboarding");
        }
      } catch {
        // silently fail — don't block dashboard
      } finally {
        setChecked(true);
      }
    }

    // Don't check if we're on a "just connected" page
    if (pathname.includes("connected=true") || pathname.includes("welcome=true")) {
      setChecked(true);
      return;
    }

    check();
  }, [checked, router, pathname]);

  return null;
}
