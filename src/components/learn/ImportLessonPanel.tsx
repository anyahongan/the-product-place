import { Sheet, Tab, Tape } from "@/components/paper/Paper";
import { COMPETENCY_GROUPS, type CompetencyGroupId } from "@/lib/learning/competencies";
import { fetchLessonSourceUrlFn } from "@/lib/learning/fetchLessonSource.server";
import {
  finalizeCustomLesson,
  generateLessonFromSource,
} from "@/lib/learning/generateLessonFromSource";
import { localSaveCustomLesson } from "@/lib/learning/localStore";
import { useState } from "react";

export function ImportLessonPanel({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (lessonId: string) => void;
}) {
  const [mode, setMode] = useState<"paste" | "file" | "url">("paste");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<CompetencyGroupId>("foundations");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > 400_000) {
      setError("File is too large — try a shorter .txt or .md excerpt.");
      return;
    }
    const lower = file.name.toLowerCase();
    if (!/\.(txt|md|markdown|text)$/.test(lower) && file.type && !file.type.startsWith("text/")) {
      setError("Upload a .txt or .md file (plain text notes). PDFs aren’t parsed yet — paste an excerpt instead.");
      return;
    }
    const raw = await file.text();
    setFileName(file.name);
    setText(raw);
    if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    setError(null);
  }

  async function fetchUrl() {
    setBusy(true);
    setError(null);
    try {
      const result = await fetchLessonSourceUrlFn({ data: { url } });
      setText(result.text);
      if (!title.trim()) setTitle(result.title);
      setMode("url");
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} — you can still paste the page text below.`
          : "Fetch failed — paste the page text instead.",
      );
    } finally {
      setBusy(false);
    }
  }

  function create() {
    setBusy(true);
    setError(null);
    try {
      const partial = generateLessonFromSource({
        rawText: text,
        titleHint: title,
        sourceKind: mode,
        sourceLabel: mode === "file" ? fileName || "Uploaded file" : mode === "url" ? url || "Web page" : "Pasted notes",
        sourceUrl: mode === "url" && url ? url : null,
        groupId,
      });
      const lesson = finalizeCustomLesson(partial);
      localSaveCustomLesson(lesson);
      onCreated(lesson.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build lesson");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-10 sm:px-8">
      <div aria-hidden className="ruled pointer-events-none absolute inset-0 -z-10 opacity-40" />
      <div className="mx-auto max-w-[820px]">
        <button type="button" className="tag focus-ink" onClick={onBack}>
          ← Learn home
        </button>

        <Sheet tone="green" soft pattern="ruled" shadow="hard" className="relative mt-8 px-6 py-7 sm:px-8">
          <Tape className="-top-3 left-8" color="green" angle={-5} width={120} />
          <Tab color="green">Add a lesson</Tab>
          <h1 className="mt-4 font-display text-3xl font-black uppercase leading-tight">
            Import your notes
          </h1>
          <p className="mt-3 max-w-[52ch] text-ink-soft">
            Upload a text file, paste study notes, or pull a public webpage. We’ll structure it into a
            Product Place lesson scaffold on this device. Use materials you have rights to — this is
            for your notes and public pages, not wholesale book dumps.
          </p>
        </Sheet>

        <div className="mt-8 flex flex-wrap gap-2">
          {(
            [
              ["paste", "Paste notes"],
              ["file", "Upload file"],
              ["url", "Website URL"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`border-2 border-ink px-3 py-2 font-display text-xs font-bold uppercase focus-ink ${
                mode === id ? "bg-green text-ink" : "bg-paper hover:bg-green-wash"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="font-display text-xs font-bold uppercase text-green">Lesson title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional — we’ll infer from the source"
              className="mt-2 w-full border-2 border-ink bg-paper px-3 py-2 focus-ink"
            />
          </label>

          <label className="block">
            <span className="font-display text-xs font-bold uppercase text-green">Place in</span>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value as CompetencyGroupId)}
              className="mt-2 w-full border-2 border-ink bg-paper px-3 py-2 focus-ink"
            >
              {COMPETENCY_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>

          {mode === "url" && (
            <div>
              <label className="block">
                <span className="font-display text-xs font-bold uppercase text-green">Website URL</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  className="mt-2 w-full border-2 border-ink bg-paper px-3 py-2 focus-ink"
                />
              </label>
              <button
                type="button"
                disabled={busy || !url.trim()}
                onClick={() => void fetchUrl()}
                className="mt-3 border-2 border-ink bg-ink px-3 py-2 font-display text-xs font-bold uppercase text-paper focus-ink disabled:opacity-40 hover:bg-green hover:text-ink"
              >
                Fetch page text
              </button>
            </div>
          )}

          {mode === "file" && (
            <label className="block">
              <span className="font-display text-xs font-bold uppercase text-green">
                Text (.txt / .md)
              </span>
              <input
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                className="mt-2 block w-full text-sm"
                onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
              />
              {fileName && <p className="mt-2 tag text-ink-soft">{fileName}</p>}
            </label>
          )}

          <label className="block">
            <span className="font-display text-xs font-bold uppercase text-green">
              {mode === "paste" ? "Notes" : "Source text (editable)"}
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Paste chapter notes, blog excerpts you have rights to, or interview prep dumps…"
              className="mt-2 w-full border-2 border-ink bg-paper p-3 font-mono text-sm leading-relaxed focus-ink"
            />
          </label>

          {error && <p className="tag text-pink">{error}</p>}

          <button
            type="button"
            disabled={busy || text.trim().length < 40}
            onClick={create}
            className="border-2 border-ink bg-green px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink focus-ink disabled:opacity-40 hover:bg-ink hover:text-green"
          >
            Build lesson →
          </button>
        </div>
      </div>
    </main>
  );
}
