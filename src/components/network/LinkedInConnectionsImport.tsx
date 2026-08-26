import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import {
  planLinkedInConnectionsImport,
  type LinkedInImportPlan,
} from "@/lib/network/mergeLinkedInConnections";
import { parseLinkedInConnectionsCsv } from "@/lib/network/parseLinkedInConnectionsCsv";
import type { Company } from "@/types/recruiting";
import type { NetworkContact } from "@/types/network";

export function LinkedInConnectionsImport({
  contacts,
  companies,
  onImport,
  busy = false,
}: {
  contacts: NetworkContact[];
  companies: Company[];
  onImport: (plan: LinkedInImportPlan) => Promise<void>;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<LinkedInImportPlan["preview"][number]["row"][]>(
    [],
  );
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [requireUrl, setRequireUrl] = useState(false);
  const [plan, setPlan] = useState<LinkedInImportPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRows = useMemo(() => plan?.preview.slice(0, 12) ?? [], [plan]);

  const handleFile = async (file: File) => {
    setError(null);
    setPlan(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseLinkedInConnectionsCsv(text);
      setParseWarnings(parsed.warnings);
      setParsedRows(parsed.rows);
      if (parsed.rows.length === 0) return;
      setPlan(
        planLinkedInConnectionsImport(parsed.rows, contacts, companies, {
          requireLinkedInUrl: requireUrl,
        }),
      );
    } catch {
      setError("Could not read that file.");
    }
  };

  const recomputePlan = (requireLinkedIn: boolean) => {
    if (parsedRows.length === 0) return;
    setPlan(
      planLinkedInConnectionsImport(parsedRows, contacts, companies, {
        requireLinkedInUrl: requireLinkedIn,
      }),
    );
  };

  return (
    <Sheet tone="paper" shadow="hard-sm" className="px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="tag text-ink-faint">Import · LinkedIn export</p>
          <h3 className="mt-1 font-display text-[1.35rem] font-black uppercase leading-none">
            Connections.csv
          </h3>
          <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-soft">
            Download your data from LinkedIn →{" "}
            <span className="font-black text-ink">Settings → Data privacy → Get a copy of your data</span>
            , choose <span className="font-black text-ink">Connections</span>, then upload{" "}
            <span className="font-black text-ink">Connections.csv</span> from the ZIP. We merge by
            profile URL and name — nothing is scraped or auto-synced.
          </p>
        </div>
        <PinkHoverButton variant="paper" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Import"}
        </PinkHoverButton>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t-2 border-ink/15 pt-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
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
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="focus-ink border-2 border-ink bg-blue px-3 py-2 font-display text-xs font-black uppercase text-paper outline-none transition-colors hover:bg-ink disabled:opacity-50"
            >
              Choose Connections.csv
            </button>
            {fileName && <span className="tag text-ink-faint">{fileName}</span>}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[0.92rem] text-ink-soft">
            <input
              type="checkbox"
              checked={requireUrl}
              onChange={(e) => {
                const next = e.target.checked;
                setRequireUrl(next);
                recomputePlan(next);
              }}
              className="h-4 w-4 border-2 border-ink accent-blue"
            />
            Skip rows without a LinkedIn profile URL
          </label>

          {parseWarnings.length > 0 && (
            <ul className="space-y-1">
              {parseWarnings.map((warning) => (
                <li key={warning} className="text-[0.9rem] text-ink-soft">
                  {warning}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-[0.9rem] text-pink">{error}</p>}

          {plan && (
            <>
              <p className="font-display text-sm font-black uppercase text-ink">
                {plan.stats.create} new · {plan.stats.update} updated · {plan.stats.skip} skipped ·{" "}
                {plan.stats.parsed} parsed
              </p>

              {previewRows.length > 0 && (
                <div className="overflow-x-auto border-2 border-ink bg-paper-2">
                  <table className="w-full min-w-[32rem] text-left text-[0.85rem]">
                    <thead>
                      <tr className="border-b-2 border-ink bg-blue text-paper">
                        <th className="px-2 py-2 font-display text-[0.65rem] font-black uppercase">
                          Action
                        </th>
                        <th className="px-2 py-2 font-display text-[0.65rem] font-black uppercase">
                          Name
                        </th>
                        <th className="px-2 py-2 font-display text-[0.65rem] font-black uppercase">
                          Company
                        </th>
                        <th className="px-2 py-2 font-display text-[0.65rem] font-black uppercase">
                          LinkedIn
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((entry) => (
                        <tr key={`${entry.row.name}-${entry.row.linkedinUrl}`} className="border-b border-ink/15">
                          <td className="px-2 py-2 tag uppercase">{entry.action}</td>
                          <td className="px-2 py-2">{entry.row.name}</td>
                          <td className="px-2 py-2 text-ink-soft">
                            {entry.row.company || "Independent"}
                          </td>
                          <td className="max-w-[10rem] truncate px-2 py-2 text-ink-faint">
                            {entry.row.linkedinUrl ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {plan.preview.length > previewRows.length && (
                    <p className="tag px-2 py-2 text-ink-faint">
                      + {plan.preview.length - previewRows.length} more rows
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || (plan.stats.create === 0 && plan.stats.update === 0)}
                  onClick={() => void onImport(plan).then(() => setOpen(false))}
                  className="focus-ink border-2 border-ink bg-yellow px-4 py-2 font-display text-sm font-black uppercase outline-none hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Importing…" : "Import into Network"}
                </button>
                <PinkHoverButton
                  variant="paper"
                  onClick={() => {
                    setPlan(null);
                    setParsedRows([]);
                    setFileName(null);
                  }}
                >
                  Clear preview
                </PinkHoverButton>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
