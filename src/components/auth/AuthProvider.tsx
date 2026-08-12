import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { migrateLocalPersonalData } from "@/lib/supabase/migrateLocalPersonalData";

type AuthContextValue = {
  configured: boolean;
  ready: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  migrationStatus: "idle" | "running" | "done" | "error";
  migrationMessage: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  useEffect(() => {
    if (!configured || !session?.user) return;
    let cancelled = false;
    setMigrationStatus("running");
    void migrateLocalPersonalData(session.user.id)
      .then((result) => {
        if (cancelled) return;
        setMigrationStatus(result.skipped ? "done" : "done");
        setMigrationMessage(result.message);
      })
      .catch((e) => {
        if (cancelled) return;
        setMigrationStatus("error");
        setMigrationMessage(e instanceof Error ? e.message : "Migration failed");
      });
    return () => {
      cancelled = true;
    };
  }, [configured, session?.user?.id]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return { error: "Supabase is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setMigrationStatus("idle");
    setMigrationMessage(null);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      ready,
      session,
      user: session?.user ?? null,
      signUp,
      signIn,
      signOut,
      migrationStatus,
      migrationMessage,
    }),
    [
      configured,
      ready,
      session,
      signUp,
      signIn,
      signOut,
      migrationStatus,
      migrationMessage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
