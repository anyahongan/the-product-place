import {
  readRouteScroll,
  routeSessionKey,
  saveRouteScroll,
} from "@/lib/navigation/pageSession";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/** Persists scroll position per route in sessionStorage for SPA tab switches. */
export function PageSessionManager() {
  const { pathname, searchStr } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      searchStr: s.location.searchStr,
    }),
  });
  const routeKey = routeSessionKey(pathname, searchStr);
  const routeKeyRef = useRef(routeKey);

  useEffect(() => {
    routeKeyRef.current = routeKey;
    const saved = readRouteScroll(routeKey);
    if (saved != null) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved, left: 0, behavior: "instant" });
        });
      });
    }

    return () => {
      saveRouteScroll(routeKey, window.scrollY);
    };
  }, [routeKey]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        saveRouteScroll(routeKeyRef.current, window.scrollY);
      }, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
