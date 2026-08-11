import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { NetworkCompany } from "@/types/network";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";

export function CompanySelector({
  companies,
  catalog,
  value,
  onChange,
  onToggleVisible,
  onAddCompany,
}: {
  companies: NetworkCompany[];
  catalog: NetworkCompany[];
  value: string;
  onChange: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onAddCompany: (name: string) => void;
}) {
  const reduced = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visibleIds = useMemo(() => new Set(companies.map((c) => c.id)), [companies]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((c) => c.name.toLowerCase().includes(q));
  }, [catalog, query]);

  const exactMatch = catalog.some((c) => c.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Companies"
        className="flex w-full flex-wrap items-center gap-2 border-2 border-ink bg-pink-wash p-2 shadow-hard-sm"
      >
        {companies.map((company) => {
          const active = value === company.id;
          return (
            <button
              key={company.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(company.id)}
              className={cn(
                "focus-ink relative z-10 min-w-[6.5rem] px-4 py-3 text-left outline-none",
                active ? "text-ink" : "text-ink-soft hover:bg-yellow-wash",
              )}
            >
              {active && (
                <motion.span
                  {...(reduced ? {} : { layoutId: "network-company-tab" })}
                  className="absolute inset-0 z-[-1] border-2 border-ink bg-yellow"
                  transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
                />
              )}
              <span className="font-display text-[1.05rem] font-black uppercase leading-none tracking-[-0.03em] sm:text-[1.25rem]">
                {company.name}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex flex-wrap items-center gap-1.5 self-center">
          <PinkHoverButton
            variant="xs"
            onClick={() => {
              setEditOpen((v) => !v);
              setSearchOpen(false);
            }}
            style={editOpen ? { background: "var(--pink)", color: "var(--paper)" } : undefined}
          >
            Edit bar
          </PinkHoverButton>
          <PinkHoverButton
            variant="xs"
            onClick={() => {
              setSearchOpen((v) => !v);
              setEditOpen(false);
            }}
            style={searchOpen ? { background: "var(--pink)", color: "var(--paper)" } : undefined}
          >
            Search company
          </PinkHoverButton>
        </div>
      </div>

      {editOpen && (
        <div className="border-2 border-ink bg-paper px-4 py-4 shadow-hard-sm">
          <p className="tag text-ink-faint">Edit companies on this bar</p>
          <p className="mt-1 text-[0.95rem] text-ink-soft">
            Toggle which companies appear. At least one must stay visible.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {catalog.map((company) => {
              const on = visibleIds.has(company.id);
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => onToggleVisible(company.id)}
                  className={cn(
                    "focus-ink border-2 border-ink px-3 py-2 font-display text-xs font-black uppercase outline-none",
                    on
                      ? "bg-yellow text-ink"
                      : "bg-paper text-ink hover:!bg-[var(--pink)] hover:!text-[var(--paper)]",
                  )}
                >
                  {on ? "On · " : "Off · "}
                  {company.name}
                </button>
              );
            })}
          </div>
          <PinkHoverButton variant="closeSm" className="mt-4" onClick={() => setEditOpen(false)}>
            Close
          </PinkHoverButton>
        </div>
      )}

      {searchOpen && (
        <div className="border-2 border-ink bg-paper px-4 py-4 shadow-hard-sm">
          <p className="tag text-ink-faint">Find another company</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type a new company"
            className="mt-2 w-full border-2 border-ink bg-paper-2 px-3 py-2 outline-none focus:bg-yellow-wash"
          />
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {searchHits.map((company) => (
              <li key={company.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!visibleIds.has(company.id)) onToggleVisible(company.id);
                    onChange(company.id);
                    setSearchOpen(false);
                    setQuery("");
                  }}
                  className="focus-ink flex w-full items-center justify-between border-2 border-ink bg-paper px-3 py-2 text-left outline-none hover:!bg-[var(--pink)] hover:!text-[var(--paper)]"
                >
                  <span className="font-display text-sm font-black uppercase">{company.name}</span>
                  <span className="tag opacity-70">
                    {visibleIds.has(company.id) ? "On bar" : "Add + select"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {query.trim() && !exactMatch && (
            <button
              type="button"
              onClick={() => {
                onAddCompany(query.trim());
                setQuery("");
                setSearchOpen(false);
              }}
              className="focus-ink mt-3 border-2 border-ink bg-yellow px-3 py-2 font-display text-xs font-black uppercase outline-none hover:!bg-[var(--pink)] hover:!text-[var(--paper)]"
            >
              Add “{query.trim()}” to Network
            </button>
          )}
          <PinkHoverButton variant="closeSm" className="mt-4" onClick={() => setSearchOpen(false)}>
            Close
          </PinkHoverButton>
        </div>
      )}
    </div>
  );
}
