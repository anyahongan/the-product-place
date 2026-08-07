import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/apply", label: "Apply", color: "pink" },
  { to: "/network", label: "Network", color: "blue" },
  { to: "/learn", label: "Learn", color: "green" },
  { to: "/create", label: "Create", color: "purple" },
  { to: "/practice", label: "Practice", color: "yellow" },
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
        "sticky top-0 z-50 border-b-2 border-ink bg-paper/95 backdrop-blur-[2px] transition-[padding] duration-300",
        condensed ? "py-1.5" : "py-3",
      )}
    >
      <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="focus-ink shrink-0 border-2 border-ink bg-ink px-2.5 py-1 font-display text-[0.9rem] font-black uppercase tracking-[-0.02em] text-paper transition-transform hover:-translate-y-[2px] focus:outline-none sm:text-[1rem]"
        >
          The Product Place
        </Link>

        <nav className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto sm:gap-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="focus-ink shrink-0 border-2 border-transparent px-2 py-1 font-display text-[0.78rem] font-extrabold uppercase tracking-[0.04em] text-ink transition-colors hover:border-ink focus:outline-none sm:text-[0.86rem]"
              activeProps={{
                className: "border-ink",
                style: { background: `var(--${item.color})` },
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
