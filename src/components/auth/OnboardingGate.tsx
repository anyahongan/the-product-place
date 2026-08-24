import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/components/auth/AuthProvider";
import { loadOnboardingCompleted } from "@/lib/profile/profileRepository";
import { Sheet } from "@/components/paper/Paper";

type GateStatus = "loading" | "anon" | "incomplete" | "complete";

/**
 * Routes authenticated users with incomplete Account Setup to /setup,
 * and keeps completed users out of /setup. Avoids redirect loops.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { configured, ready, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [status, setStatus] = useState<GateStatus>("loading");

  useEffect(() => {
    if (!ready) return;

    if (!configured || !user) {
      setStatus("anon");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    void loadOnboardingCompleted(user.id)
      .then((completed) => {
        if (cancelled) return;
        setStatus(completed ? "complete" : "incomplete");
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed into setup so new accounts are not skipped on transient errors.
        setStatus("incomplete");
      });

    return () => {
      cancelled = true;
    };
  }, [ready, configured, user?.id, pathname]);

  useEffect(() => {
    if (!ready || status === "loading") return;

    if (status === "incomplete" && pathname !== "/setup") {
      void navigate({ to: "/setup" });
      return;
    }
    if (status === "complete" && pathname === "/setup") {
      void navigate({ to: "/" });
      return;
    }
    if (status === "anon" && pathname === "/setup") {
      void navigate({ to: "/" });
    }
  }, [ready, status, pathname, navigate]);

  const blocking =
    !ready ||
    (Boolean(user) && status === "loading") ||
    (status === "incomplete" && pathname !== "/setup") ||
    (status === "complete" && pathname === "/setup") ||
    (status === "anon" && pathname === "/setup");

  if (blocking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-5 py-16">
        <Sheet tone="paper" shadow="hard-sm" className="px-6 py-5">
          <p className="font-display text-[1.2rem] font-black uppercase">Loading workspace…</p>
          <p className="tag mt-2 text-ink-faint">Checking your account setup</p>
        </Sheet>
      </div>
    );
  }

  return children;
}
