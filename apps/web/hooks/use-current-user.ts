"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CURRENT_USER_STORAGE_KEY,
  DEFAULT_USER_ID,
  MOCK_USERS,
  type MockUser,
} from "@/lib/users";

/**
 * Lightweight mock "current user" selection persisted in localStorage.
 * Switch via `setCurrentUser`. No passwords / OAuth / Supabase Auth.
 */
export function useCurrentUser() {
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (stored && MOCK_USERS.some((u) => u.id === stored)) {
      setUserId(stored);
    }
    setHydrated(true);
  }, []);

  const setCurrentUser = useCallback((id: string) => {
    setUserId(id);
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, id);
    // Mirror to a cookie so server components (dashboard) can read it.
    document.cookie = `${CURRENT_USER_STORAGE_KEY}=${id}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const user: MockUser =
    MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];

  return { user, userId, setCurrentUser, hydrated };
}
