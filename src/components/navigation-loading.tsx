"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getAppLoading,
  startAppLoading,
  stopAppLoading,
  subscribeAppLoading,
} from "@/lib/loading";

function sameDestination(href: string) {
  const next = new URL(href, window.location.href);
  return (
    next.origin === window.location.origin &&
    next.pathname === window.location.pathname &&
    next.search === window.location.search
  );
}

let fetchPatched = false;
let originalFetch: typeof window.fetch | null = null;

function patchFetch() {
  if (fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;
  originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (typeof Request !== "undefined" && input instanceof Request) {
      input.headers.forEach((value, key) => {
        if (!headers.has(key)) headers.set(key, value);
      });
    }
    const isAction = headers.has("Next-Action") || headers.has("next-action");
    const isPrefetch =
      headers.get("Next-Router-Prefetch") === "1" || headers.get("next-router-prefetch") === "1";
    const isNav =
      !isPrefetch && (headers.get("RSC") === "1" || headers.get("rsc") === "1");
    if (isAction || isNav) startAppLoading();
    try {
      return await originalFetch!(input, init);
    } catch (error) {
      if (isAction || isNav) stopAppLoading();
      throw error;
    } finally {
      if (isAction) {
        window.setTimeout(() => stopAppLoading(), 200);
      }
    }
  };
}

export function NavigationLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loading = useSyncExternalStore(subscribeAppLoading, getAppLoading, () => false);
  const url = `${pathname}?${searchParams.toString()}`;
  const first = useRef(true);
  const safety = useRef<number | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    stopAppLoading();
  }, [url]);

  useEffect(() => {
    patchFetch();

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (/^https?:/i.test(href) && !href.startsWith(window.location.origin)) return;
      if (sameDestination(href)) return;
      startAppLoading();
    }

    function onPopState() {
      startAppLoading();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      if (safety.current) window.clearTimeout(safety.current);
      safety.current = null;
      return;
    }
    safety.current = window.setTimeout(() => stopAppLoading(), 12000);
    return () => {
      if (safety.current) window.clearTimeout(safety.current);
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative h-full w-full max-w-[430px]">
        <div className="absolute inset-0 bg-[var(--surface)]/35 backdrop-blur-md dark:bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/icon.svg"
            alt=""
            width={80}
            height={80}
            className="app-loading-icon h-20 w-20 rounded-[20px] shadow-[0_12px_40px_rgba(15,61,62,0.28)]"
          />
        </div>
      </div>
    </div>
  );
}
