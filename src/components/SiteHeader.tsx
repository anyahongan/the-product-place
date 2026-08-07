import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/apply", label: "Apply" },
  { to: "/network", label: "Network" },
  { to: "/learn", label: "Learn" },
  { to: "/create", label: "Create" },
  { to: "/practice", label: "Practice" },
] as const;

export function SiteHeader() {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/70 bg-cream/85 backdrop-blur-[2px] transition-[padding,box-shadow] duration-500",
        condensed ? "py-2 shadow-[0_6px_18px_-16px_rgba(90,70,40,0.7)]" : "py-4",
      )}
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="focus-ink group flex shrink-0 items-baseline gap-2 focus:outline-none"
        >
          <span className="font-display text-[1.05rem] leading-none tracking-tight text-ink sm:text-[1.2rem]">
            The Product Place
          </span>
          <span className="hand hidden text-[0.95rem] text-ink-faint transition-colors group-hover:text-pink sm:inline">
            ↩ home
          </span>
        </Link>

        <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="focus-ink ink-underline shrink-0 px-2 py-1 text-[0.82rem] font-medium uppercase tracking-[0.14em] text-ink-soft transition-colors hover:text-ink focus:outline-none sm:text-[0.86rem]"
              activeProps={{ className: "text-ink ink-underline-on" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
