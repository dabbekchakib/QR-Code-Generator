"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { CloudProfileRow } from "@/features/qr/cloud/types";
import { mapCloudProfile } from "@/features/qr/cloud/mappers";
import { translateAuthError, authErrorKey } from "./errors";
import { qrService } from "@/features/qr/service/qr-service";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  profile: CloudProfileRow | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ i18nKey: string | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ i18nKey: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  forgotPassword: (
    email: string
  ) => Promise<{ i18nKey: string | null; sent: boolean }>;
  resetPassword: (
    password: string
  ) => Promise<{ i18nKey: string | null }>;
  updateDisplayName: (
    displayName: string
  ) => Promise<{ i18nKey: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CloudProfileRow | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const mounted = useRef(true);

  // Fetch and persist the profile row.
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        if (!mounted.current) return;
        if (error || !data) {
          setProfile(null);
          return;
        }
        setProfile(mapCloudProfile(data));
      } catch {
        if (mounted.current) setProfile(null);
      }
    },
    [supabase]
  );

  // Initialize session on mount.
  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted.current) return;
      setSession(s);
      setStatus(s ? "authenticated" : "anonymous");
      if (s?.user) {
        qrService.bindAuth(supabase, s.user.id);
        void fetchProfile(s.user.id);
      } else {
        qrService.clearAuth();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted.current) return;

      if (event === "SIGNED_IN") {
        setSession(s);
        setStatus("authenticated");
        if (s?.user) {
          qrService.bindAuth(supabase, s.user.id);
          void fetchProfile(s.user.id);
          // Trigger cloud reconcile after sign-in.
          qrService.syncNow().catch(() => {});
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        setStatus("anonymous");
        qrService.clearAuth();
      }
      // TOKEN_REFRESHED, PASSWORD_RECOVERY: session state is up to date
      // but we don't need to change our status.
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        const code = translateAuthError(error.message);
        return { i18nKey: authErrorKey(code) };
      }
      return { i18nKey: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        const code = translateAuthError(error.message);
        return { i18nKey: authErrorKey(code), needsEmailConfirmation: false };
      }
      const needsConfirmation =
        data.session === null && !data.user?.email_confirmed_at;
      return { i18nKey: null, needsEmailConfirmation: needsConfirmation };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const forgotPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        const code = translateAuthError(error.message);
        return { i18nKey: authErrorKey(code), sent: false };
      }
      return { i18nKey: null, sent: true };
    },
    [supabase]
  );

  const resetPassword = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const code = translateAuthError(error.message);
        return { i18nKey: authErrorKey(code) };
      }
      return { i18nKey: null };
    },
    [supabase]
  );

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!session?.user) {
        return { i18nKey: authErrorKey("unknown") };
      }
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName } as never)
        .eq("id", session.user.id);
      if (profileErr) {
        return { i18nKey: authErrorKey(translateAuthError(profileErr.message)) };
      }
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (metaErr) {
        return { i18nKey: authErrorKey(translateAuthError(metaErr.message)) };
      }
      await fetchProfile(session.user.id);
      return { i18nKey: null };
    },
    [supabase, session, fetchProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (session?.user) await fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      profile,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      updateDisplayName,
      refreshProfile,
    }),
    [
      status,
      session,
      profile,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      resetPassword,
      updateDisplayName,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };