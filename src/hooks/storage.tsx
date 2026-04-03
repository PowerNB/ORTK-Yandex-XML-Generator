import type { StoredState } from "../types";

export const readLocalStorage = (key: string, fallback: StoredState | null): StoredState | null => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as StoredState;
  } catch (err) {
    return fallback;
  }
};

export const writeLocalStorage = (key: string, value: StoredState): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // ignore
  }
};
