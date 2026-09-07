import { cn } from "@/lib/utils";
import type { ApplicationMaterialsRequired } from "@/lib/apply/types";

const ITEMS: { key: keyof ApplicationMaterialsRequired; label: string }[] = [
  { key: "resume", label: "Resume" },
  { key: "coverLetter", label: "Cover Letter" },
  { key: "transcript", label: "Transcript" },
  { key: "gpa", label: "GPA" },
];

export function ApplicationMaterialsChecklist({
  value,
  onChange,
}: {
  value: ApplicationMaterialsRequired;
  onChange: (next: ApplicationMaterialsRequired) => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      {ITEMS.map((item) => {
        const checked = value[item.key];
        return (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-3 text-[0.95rem] text-ink-soft"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange({ ...value, [item.key]: !checked })}
              className="h-4 w-4 border-2 border-ink accent-blue"
            />
            <span className={cn(checked && "font-medium text-ink")}>{item.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function materialsRequiredSummary(value: ApplicationMaterialsRequired): string | null {
  const labels = ITEMS.filter((i) => value[i.key]).map((i) => i.label);
  if (labels.length === 0) return null;
  return labels.join(" · ");
}
