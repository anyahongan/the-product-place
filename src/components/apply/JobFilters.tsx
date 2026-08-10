import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  COMMON_LOCATIONS,
  EMPLOYMENT_TYPE_LABELS,
  GRADUATION_YEARS,
  PRODUCT_ROLES,
  SPECIALIZATION_FILTERS,
  WORK_MODE_LABELS,
} from "@/data/apply";
import { countActiveFilters } from "@/components/apply/filterJobs";
import type { EmploymentType, JobFiltersState, JobSort, ProductRole, WorkMode } from "@/types/apply";

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CheckRow({
  checked,
  onChange,
  children,
  name,
  radio,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  name?: string;
  radio?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-sm px-1 py-1.5 hover:bg-blue-wash">
      <input
        type={radio ? "radio" : "checkbox"}
        name={name}
        checked={checked}
        onChange={onChange}
        className="focus-ink mt-0.5 size-4 shrink-0 accent-[var(--blue)] outline-none"
      />
      <span className="text-[0.95rem] leading-snug text-ink">{children}</span>
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 border-2 border-ink bg-paper p-3">
      <legend className="px-1.5 font-display text-[0.9rem] font-black uppercase tracking-[-0.02em]">
        {title}
      </legend>
      <div className="mt-1 space-y-0.5">{children}</div>
    </fieldset>
  );
}

const SORT_OPTIONS: { id: JobSort; label: string }[] = [
  { id: "best-match", label: "Best match" },
  { id: "due-date", label: "Due date" },
  { id: "opening-date", label: "Opening date (newest)" },
  { id: "oldest-opening", label: "Opening date (oldest)" },
  { id: "company", label: "Company A to Z" },
];

export function JobFiltersForm({
  filters,
  onChange,
  idPrefix = "filter",
}: {
  filters: JobFiltersState;
  onChange: (next: JobFiltersState) => void;
  idPrefix?: string;
}) {
  const set = (patch: Partial<JobFiltersState>) => onChange({ ...filters, ...patch });
  const moreRoles = PRODUCT_ROLES.filter((role) => !SPECIALIZATION_FILTERS.includes(role));

  return (
    <div className="space-y-4">
      <button
        type="button"
        aria-pressed={filters.savedOnly}
        onClick={() => set({ savedOnly: !filters.savedOnly })}
        className={cn(
          "focus-ink inline-flex items-center gap-2.5 border-2 border-ink px-3 py-2.5 outline-none transition-colors",
          filters.savedOnly ? "bg-yellow text-ink" : "bg-paper hover:bg-yellow-wash",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center border-2 border-ink font-display text-[0.7rem] font-black leading-none",
            filters.savedOnly ? "bg-ink text-paper" : "bg-paper",
          )}
        >
          {filters.savedOnly ? "✓" : ""}
        </span>
        <span className="font-display text-sm font-black uppercase tracking-[-0.02em]">Saved</span>
      </button>

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FilterGroup title="Graduation year">
          {GRADUATION_YEARS.map((year) => (
            <CheckRow
              key={year}
              checked={filters.graduationYears.includes(year)}
              onChange={() => set({ graduationYears: toggleIn(filters.graduationYears, year) })}
            >
              Class of ’{String(year).slice(2)}
            </CheckRow>
          ))}
        </FilterGroup>

        <FilterGroup title="Location">
          <label className="mb-2 block px-1">
            <span className="tag text-ink-soft">Search city</span>
            <input
              id={`${idPrefix}-location-search`}
              type="search"
              value={filters.locationQuery}
              onChange={(e) => set({ locationQuery: e.target.value })}
              placeholder="City, State"
              className="focus-ink mt-1.5 w-full border-2 border-ink bg-paper px-2.5 py-2 text-[0.92rem] outline-none placeholder:text-ink-faint"
            />
          </label>
          {COMMON_LOCATIONS.map((loc) => (
            <CheckRow
              key={loc}
              checked={filters.locations.includes(loc)}
              onChange={() => set({ locations: toggleIn(filters.locations, loc) })}
            >
              {loc}
            </CheckRow>
          ))}
        </FilterGroup>

        <FilterGroup title="Product specialization">
          {SPECIALIZATION_FILTERS.map((role) => (
            <CheckRow
              key={role}
              checked={filters.productRoles.includes(role)}
              onChange={() => set({ productRoles: toggleIn(filters.productRoles, role) })}
            >
              {role}
            </CheckRow>
          ))}
          <p className="tag mt-2 text-ink-faint">More</p>
          {moreRoles.map((role: ProductRole) => (
            <CheckRow
              key={role}
              checked={filters.productRoles.includes(role)}
              onChange={() => set({ productRoles: toggleIn(filters.productRoles, role) })}
            >
              {role}
            </CheckRow>
          ))}
        </FilterGroup>

        <div className="space-y-3">
          <FilterGroup title="Sort by">
            {SORT_OPTIONS.map((opt) => (
              <CheckRow
                key={opt.id}
                radio
                name={`${idPrefix}-sort`}
                checked={filters.sort === opt.id}
                onChange={() => set({ sort: opt.id })}
              >
                {opt.label}
              </CheckRow>
            ))}
          </FilterGroup>

          <FilterGroup title="Work mode">
            {(["remote", "hybrid", "in-person"] as WorkMode[]).map((mode) => (
              <CheckRow
                key={mode}
                checked={filters.workModes.includes(mode)}
                onChange={() => set({ workModes: toggleIn(filters.workModes, mode) })}
              >
                {WORK_MODE_LABELS[mode]}
              </CheckRow>
            ))}
          </FilterGroup>

          <FilterGroup title="Employment type">
            {(["internship", "part-time", "full-time"] as EmploymentType[]).map((type) => (
              <CheckRow
                key={type}
                checked={filters.employmentTypes.includes(type)}
                onChange={() =>
                  set({ employmentTypes: toggleIn(filters.employmentTypes, type) })
                }
              >
                {EMPLOYMENT_TYPE_LABELS[type]}
              </CheckRow>
            ))}
          </FilterGroup>
        </div>
      </div>
    </div>
  );
}

export function JobFiltersPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: JobFiltersState;
  onChange: (next: JobFiltersState) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const active = countActiveFilters(filters);

  return (
    <div className="border-2 border-ink bg-paper shadow-hard-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "focus-ink group flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left outline-none",
          expanded ? "bg-blue text-paper" : "bg-paper text-ink hover:bg-blue-wash",
        )}
      >
        <span className="flex items-center gap-3">
          <motion.span
            animate={reduced ? { rotate: 0 } : { rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
            className={cn(
              "inline-flex size-8 items-center justify-center border-2 font-display text-lg font-black",
              expanded ? "border-paper text-paper" : "border-ink text-ink",
            )}
            aria-hidden
          >
            ›
          </motion.span>
          <span>
            <span className="font-display text-[1.2rem] font-black uppercase tracking-[-0.03em]">
              Filters
            </span>
            {active > 0 && (
              <span
                className={cn(
                  "tag ml-2 inline-block border-2 px-2 py-0.5",
                  expanded ? "border-paper text-paper" : "border-ink bg-yellow text-ink",
                )}
              >
                {active} active
              </span>
            )}
          </span>
        </span>
        <span className={cn("tag", expanded ? "text-paper/80" : "text-ink-faint")}>
          {expanded ? "Hide" : "Expand"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="filters-body"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
            className="overflow-hidden border-t-2 border-ink"
          >
            <div className="space-y-4 px-4 py-4">
              <JobFiltersForm filters={filters} onChange={onChange} idPrefix="panel" />
              {active > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="focus-ink tag text-blue outline-none underline-offset-2 hover:underline"
                >
                  Clear filters ({active})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
