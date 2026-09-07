import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { parseAppliedImportText } from "@/lib/apply/parseAppliedImport";
import { parseAppliedImportImageFn } from "@/lib/apply/parseAppliedImportImage.server";
import {
  planAppliedImport,
  type AppliedImportPlan,
} from "@/lib/apply/planAppliedImport";
import type { ApplicationRecord, JobListingView } from "@/lib/apply/types";

export function AppliedImportPanel({
  jobs,
  apps,
  onImport,
  busy = false,
}: {
  jobs: JobListingView[];
  apps: ApplicationRecord[];
  onImport: (plan: AppliedImportPlan) => Promise<void>;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [plan, setPlan] = useState<AppliedImportPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const previewRows = useMemo(() => plan?.preview.slice(0, 12) ?? [], [plan]);

  const applyPlan = (rows: AppliedImportPlan["records"][number]["row"][]) => {
    if (rows.length === 0) {
      setPlan(null);
      return;
    }
    setPlan(planAppliedImport(rows, jobs, apps));
  };

  const handleText = (text: string, name: string) => {
    setError(null);
    setFileName(name);
    const parsed = parseAppliedImportText(text);
    setParseWarnings(parsed.warnings);
    applyPlan(parsed.rows);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPlan(null);
    setParseWarnings([]);
    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      setParsing(true);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const result = await parseAppliedImportImageFn({
          data: { imageDataUrl: dataUrl, fileName: file.name },
        });
        setParseWarnings(result.warnings);
        applyPlan(result.rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not parse that screenshot.");
      } finally {
        setParsing(false);
      }
      return;
    }

    try {
      const text = await file.text();
      handleText(text, file.name);
    } catch {
      setError("Could not read that file. Export Google Sheets or Excel as CSV first.");
    }
  };

  const reset = () => {
    setPlan(null);
    setFileName(null);
    setParseWarnings([]);
    setError(null);
  };

  return (
    <Sheet tone="paper" shadow="hard-sm" className="px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="tag text-ink-faint">Import · Application tracker</p>
          <h3 className="mt-1 font-display text-[1.35rem] font-black uppercase leading-none">
            Upload your list
          </h3>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-soft">
            Upload a CSV export from Google Sheets, Excel, or a screenshot of your tracker. We parse
            company, role, status, and dates — then save them to your applications and hide matching
            roles from Discover.
          </p>
        </div>
        <PinkHoverButton variant="paper" hoverAccent="blue" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Import"}
        </PinkHoverButton>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t-2 border-ink/15 pt-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy || parsing}
              onClick={() => inputRef.current?.click()}
              className="focus-ink border-2 border-ink bg-blue px-3 py-2 font-display text-xs font-black uppercase text-paper outline-none transition-colors hover:bg-ink disabled:opacity-50"
            >
              {parsing ? "Parsing…" : "Choose file"}
            </button>
            {fileName && <span className="tag text-ink-faint">{fileName}</span>}
            {plan && (
              <button
                type="button"
                onClick={reset}
                className="tag text-blue underline-offset-2 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-[0.88rem] text-ink-faint">
            Expected columns: Company, Title, Status (optional), Date Applied, Posted / Open date,
            Due / Deadline, Apply URL. Excel users: File → Save As → CSV.
          </p>

          {error && <p className="text-[0.92rem] text-ink">{error}</p>}
          {parseWarnings.map((w) => (
            <p key={w} className="text-[0.92rem] text-ink-faint">
              {w}
            </p>
          ))}

          {plan && (
            <div className="space-y-3">
              <p className="font-display text-sm font-black uppercase">
                Ready to import · {plan.createCount} new · {plan.updateCount} update ·{" "}
                {plan.skipCount} skip
              </p>
              <ul className="max-h-56 space-y-2 overflow-y-auto border-2 border-ink/15 bg-paper-2 p-3 text-[0.9rem]">
                {previewRows.map((row, i) => (
                  <li key={`${row.row.company}-${row.row.title}-${i}`} className="flex gap-2">
                    <span className="tag shrink-0 uppercase text-ink-faint">{row.action}</span>
                    <span>
                      {row.row.company} · {row.row.title}
                      <span className="text-ink-faint"> — {row.reason}</span>
                    </span>
                  </li>
                ))}
                {plan.preview.length > previewRows.length && (
                  <li className="tag text-ink-faint">
                    + {plan.preview.length - previewRows.length} more
                  </li>
                )}
              </ul>
              <PinkHoverButton
                variant="paper"
                hoverAccent="blue"
                disabled={busy || parsing || plan.records.length === 0}
                onClick={() => void onImport(plan).then(() => reset())}
              >
                Import {plan.createCount + plan.updateCount} applications
              </PinkHoverButton>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}
