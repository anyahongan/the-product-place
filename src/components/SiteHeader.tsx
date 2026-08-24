import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";

const nav = [
  { to: "/apply", label: "Apply", color: "blue", onColor: "paper" },
  { to: "/network", label: "Network", color: "pink", onColor: "ink" },
  { to: "/profile", label: "Profile", color: "yellow", onColor: "ink" },
  { to: "/learn", label: "Learn", color: "green", onColor: "ink" },
  { to: "/create", label: "Create", color: "purple", onColor: "paper" },
  { to: "/practice", label: "Practice", color: "yellow", onColor: "ink" },
] as const;

export function SiteHeader() {
  const [condensed, setCondensed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { configured, user, signOut, migrationStatus, migrationMessage } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onSetup = pathname === "/setup";

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur-[2px] transition-[padding] duration-300",
          condensed ? "py-1.5" : "py-3",
        )}
      >
        <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-5 sm:px-8">
          {onSetup ? (
            <span className="shrink-0 border-2 border-ink bg-ink px-2.5 py-1 font-display text-[0.9rem] font-black uppercase tracking-[-0.02em] text-paper sm:text-[1rem]">
              The Product Place
            </span>
          ) : (
            <Link
              to="/"
              className="focus-ink shrink-0 border-2 border-ink bg-ink px-2.5 py-1 font-display text-[0.9rem] font-black uppercase tracking-[-0.02em] text-paper transition-transform hover:-translate-y-[2px] focus:outline-none sm:text-[1rem]"
            >
              The Product Place
            </Link>
          )}

          <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto sm:gap-2">
            {!onSetup &&
              nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="focus-ink shrink-0 border-2 border-transparent px-2 py-1 font-display text-[0.78rem] font-extrabold uppercase tracking-[0.04em] text-ink transition-colors hover:border-ink focus:outline-none sm:text-[0.86rem]"
                  activeProps={{
                    className: cn(
                      "border-ink",
                      item.onColor === "paper" ? "text-paper" : "text-ink",
                    ),
                    style: { background: `var(--${item.color})` },
                  }}
                >
                  {item.label}
                </Link>
              ))}
            {onSetup && <span className="tag shrink-0 px-2 text-ink-faint">Account setup</span>}
            {configured &&
              (user ? (
                <PinkHoverButton
                  variant="xs"
                  onClick={() => void signOut()}
                  title={migrationMessage ?? user.email ?? "Signed in"}
                >
                  Sign out
                </PinkHoverButton>
              ) : (
                <PinkHoverButton
                  variant="xs"
                  hoverAccent="yellow"
                  onClick={() => setAuthOpen(true)}
                >
                  Sign in
                </PinkHoverButton>
              ))}
          </nav>
        </div>
        {user && migrationStatus === "running" && (
          <p className="border-t-2 border-ink bg-yellow-wash px-5 py-1 text-center tag text-ink">
            Syncing local recruiting data to your account…
          </p>
        )}
      </header>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
