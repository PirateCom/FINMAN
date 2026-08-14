"use client";

import { useRouter } from "next/navigation";
import { startAppLoading } from "@/lib/loading";

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        startAppLoading();
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
      aria-label="Go back"
      className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--card)] text-[var(--foreground)]"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 5 8 12l7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
