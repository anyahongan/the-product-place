import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { GRADUATION_YEARS, PRODUCT_ROLES } from "@/data/apply";
import { countActiveFilters } from "@/components/apply/filterJobs";
import type { EmploymentType, JobFiltersState, JobSort, WorkMode } from "@/types/apply";

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterPanel({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="border-2 border-ink bg-paper">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-ink flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left outline-none hover:bg-blue-wash"
      >
        <span className="font-display text-[0.95rem] font-black uppercase tracking-[-0.02em]">
          {title}
        </span>
        <span className="tag text-ink-faint">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
            className="overflow-hidden border-t-2 border-ink"
          >
            <div className="space-y-2 p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-ink tag border-2 border-ink px-2.5 py-1.5 text-left outline-none transition-colors",
        active ? "bg-blue text-paper" : "bg-paper text-ink hover:bg-yellow-wash",
      )}
    >
      {children}
    </button>
  );
}

export function JobFiltersForm({
  filters,
  onChange,
  idPrefix = "filter",
}: {
  filters: JobFiltersState;
  onChange: (next: JobFiltersState) => void;
  idPrefix?: string;
}) {
  const [open, setOpen] = useState<string | null>("role");

  const set = (patch: Partial<JobFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="tag text-ink-soft">Search</span>
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Company, role, source…"
          className="focus-ink mt-1.5 w-full border-2 border-ink bg-paper px-3 py-2.5 text-[0.98rem] outline-none placeholder:text-ink-faint"
        />
      </label>

      <FilterPanel
        title="Product role"
        open={open === "role"}
        onToggle={() => setOpen(open === "role" ? null : "role")}
      >
        <div className="flex flex-wrap gap-2">
          {PRODUCT_ROLES.map((role) => (
            <Chip
              key={role}
              active={filters.productRoles.includes(role)}
              onClick={() => set({ productRoles: toggleIn(filters.productRoles, role) })}
            >
              {role}
            </Chip>
          ))}
        </div>
      </FilterPanel>

      <FilterPanel
        title="Graduation year"
        open={open === "grad"}
        onToggle={() => setOpen(open === "grad" ? null : "grad")}
      >
        <div className="flex flex-wrap gap-2">
          <Chip
            active={filters.graduationYear === null}
            onClick={() => set({ graduationYear: null })}
          >
            Any year
          </Chip>
          {GRADUATION_YEARS.map((year) => (
            <Chip
              key={year}
              active={filters.graduationYear === year}
              onClick={() => set({ graduationYear: year })}
            >
              ’{String(year).slice(2)}
            </Chip>
          ))}
        </div>
      </FilterPanel>

      <FilterPanel
        title="Location / work mode"
        open={open === "loc"}
        onToggle={() => setOpen(open === "loc" ? null : "loc")}
      >
        <label className="block">
          <span className="tag text-ink-soft">Location search</span>
          <input
            type="search"
            value={filters.locationQuery}
            onChange={(e) => set({ locationQuery: e.target.value })}
            placeholder="City, state, remote…"
            className="focus-ink mt-1.5 w-full border-2 border-ink bg-paper px-3 py-2 text-[0.95rem] outline-none placeholder:text-ink-faint"
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          {(["remote", "hybrid", "in person"] as WorkMode[]).map((mode) => (
            <Chip
              key={mode}
              active={filters.workModes.includes(mode)}
              onClick={() => set({ workModes: toggleIn(filters.workModes, mode) })}
            >
              {mode}
            </Chip>
          ))}
        </div>
      </FilterPanel>

      <FilterPanel
        title="Employment type"
        open={open === "emp"}
        onToggle={() => setOpen(open === "emp" ? null : "emp")}
      >
        <div className="flex flex-wrap gap-2">
          {(["internship", "part-time", "full-time"] as EmploymentType[]).map((type) => (
            <Chip
              key={type}
              active={filters.employmentTypes.includes(type)}
              onClick={() => set({ employmentTypes: toggleIn(filters.employmentTypes, type) })}
            >
              {type}
            </Chip>
          ))}
        </div>
      </FilterPanel>

      <FilterPanel
        title="Sort"
        open={open === "sort"}
        onToggle={() => setOpen(open === "sort" ? null : "sort")}
      >
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["newest", "Newest"],
              ["oldest", "Oldest"],
              ["deadline", "Deadline soonest"],
            ] as [JobSort, string][]
          ).map(([id, label]) => (
            <Chip key={id} active={filters.sort === id} onClick={() => set({ sort: id })}>
              {label}
            </Chip>
          ))}
        </div>
      </FilterPanel>
    </div>
  );
}

export function JobFiltersDesktop({
  filters,
  onChange,
  onClear,
}: {
  filters: JobFiltersState;
  onChange: (next: JobFiltersState) => void;
  onClear: () => void;
}) {
  const active = countActiveFilters(filters);
  return (
    <aside className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-[1.4rem] font-black uppercase leading-none">Filters</h2>
        {active > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="focus-ink tag text-blue outline-none underline-offset-2 hover:underline"
          >
            Clear ({active})
          </button>
        )}
      </div>
      <JobFiltersForm filters={filters} onChange={onChange} idPrefix="desk" />
    </aside>
  );
}

export function JobFiltersMobileSheet({
  open,
  onClose,
  filters,
  onChange,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: JobFiltersState;
  onChange: (next: JobFiltersState) => void;
  onClear: () => void;
}) {
  const reduced = useReducedMotion();
  const active = countActiveFilters(filters);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40 sm:hidden"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Filters"
            initial={reduced ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduced ? { y: 0 } : { y: "100%" }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
            className="max-h-[88vh] overflow-y-auto border-t-2 border-ink bg-paper px-5 pb-8 pt-5 shadow-hard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-[1.5rem] font-black uppercase">Filters</h2>
              <button
                type="button"
                onClick={onClose}
                className="focus-ink border-2 border-ink bg-yellow px-3 py-1.5 font-display text-sm font-black uppercase outline-none"
              >
                Done
              </button>
            </div>
            <JobFiltersForm filters={filters} onChange={onChange} idPrefix="mob" />
            {active > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="focus-ink tag mt-4 text-blue outline-none underline-offset-2 hover:underline"
              >
                Clear filters ({active})
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
