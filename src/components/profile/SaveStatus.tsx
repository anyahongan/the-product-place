export type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveStatus({ state, error }: { state: SaveState; error?: string | null }) {
  if (state === "idle") return null;
  if (state === "saving") {
    return <p className="tag text-ink-faint">Saving…</p>;
  }
  if (state === "saved") {
    return <p className="tag text-green">Saved</p>;
  }
  return <p className="tag text-pink">{error || "Error saving"}</p>;
}
