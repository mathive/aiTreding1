"use client";

import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`nexus_pref_${key}`);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch { /* Ignore invalid or unavailable browser storage. */ }
    finally { setLoaded(true); }
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`nexus_pref_${key}`, JSON.stringify(value));
  }, [key, value, loaded]);

  return [value, setValue] as const;
}
