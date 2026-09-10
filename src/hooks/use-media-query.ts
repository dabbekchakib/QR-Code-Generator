"use client";

import { useSyncExternalStore } from "react";

function createMediaQuerySubscription(query: string) {
  return (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    createMediaQuerySubscription(query),
    () => window.matchMedia(query).matches,
    () => false
  );
}
