"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAllTemplatePreferences,
  markTemplateUsed,
  setTemplateFavorite,
  type TemplatePreference,
} from "../storage/preferences";
import { getTemplateById } from "../registry";

const RECENT_LIMIT = 6;

interface TemplatePreferences {
  favorites: Set<string>;
  recent: string[];
  ready: boolean;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  markUsed: (id: string) => void;
}

export function useTemplatePreferences(): TemplatePreferences {
  const [prefs, setPrefs] = useState<Record<string, TemplatePreference>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      getAllTemplatePreferences().then((all) => {
        if (cancelled) return;
        setPrefs(all);
        setReady(true);
      });
    }, 0);
    return () => {
      clearTimeout(id);
      cancelled = true;
    };
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setPrefs((prev) => {
      const current = prev[id]?.favorite ?? false;
      void setTemplateFavorite(id, !current);
      return { ...prev, [id]: { id, favorite: !current, lastUsedAt: prev[id]?.lastUsedAt ?? 0 } };
    });
  }, []);

  const markUsed = useCallback((id: string) => {
    if (!getTemplateById(id)) return;
    setPrefs((prev) => {
      void markTemplateUsed(id);
      return {
        ...prev,
        [id]: { id, favorite: prev[id]?.favorite ?? false, lastUsedAt: Date.now() },
      };
    });
  }, []);

  const favorites = new Set(
    Object.values(prefs)
      .filter((p) => p.favorite && getTemplateById(p.id))
      .map((p) => p.id)
  );

  const recent = Object.values(prefs)
    .filter((p) => p.lastUsedAt > 0 && getTemplateById(p.id))
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, RECENT_LIMIT)
    .map((p) => p.id);

  return {
    favorites,
    recent,
    ready,
    isFavorite: (id) => favorites.has(id),
    toggleFavorite,
    markUsed,
  };
}