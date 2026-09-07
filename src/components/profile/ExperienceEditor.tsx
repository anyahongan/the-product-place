import { useState } from "react";
import { Sheet } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { SaveStatus, type SaveState } from "@/components/profile/SaveStatus";
import {
  createExperience,
  createExperienceBullet,
  deleteExperience,
  deleteExperienceBullet,
  deleteExperienceMetric,
  listExperiences,
  moveExperienceBullet,
  updateExperience,
  updateExperienceBullet,
  upsertExperienceMetric,
  type ExperienceInput,
} from "@/lib/profile/experienceRepository";
import {
  EXPERIENCE_TYPE_LABELS,
  type ExperienceRecord,
  type ExperienceSource,
  type ExperienceType,
} from "@/types/profile";
import { cn } from "@/lib/utils";

function fieldClass() {
  return "mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-body text-[0.95rem] text-ink outline-none focus:bg-yellow-wash";
}

const emptyInput = (): ExperienceInput => ({
  experienceType: "internship",
  organization: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  summary: "",
  skills: [],
  projectUrl: "",
  githubUrl: "",
  caseStudyUrl: "",
  productType: "",
  projectStatus: "",
});

function fromRecord(exp: ExperienceRecord): ExperienceInput {
  return {
    experienceType: exp.experienceType,
    organization: exp.organization,
    title: exp.title,
    location: exp.location ?? "",
    startDate: exp.startDate ?? "",
    endDate: exp.endDate ?? "",
    isCurrent: exp.isCurrent,
    summary: exp.summary ?? "",
    skills: [...exp.skills],
    projectUrl: exp.projectUrl ?? "",
    githubUrl: exp.githubUrl ?? "",
    caseStudyUrl: exp.caseStudyUrl ?? "",
    productType: exp.productType ?? "",
    projectStatus: exp.projectStatus ?? "",
  };
}

export function ExperienceEditor({
  userId,
  initial,
  createSource = "manual",
  onClose,
  onSaved,
}: {
  userId: string;
  initial: ExperienceRecord | null;
  /** Source tag for newly created rows (manual = not on current resume). */
  createSource?: ExperienceSource;
  onClose: () => void;
  onSaved: (list: ExperienceRecord[]) => void;
}) {
  const [draft, setDraft] = useState<ExperienceInput>(
    initial ? fromRecord(initial) : emptyInput(),
  );
  const [skillsDraft, setSkillsDraft] = useState(
    initial ? initial.skills.join(", ") : "",
  );
  const [experienceId, setExperienceId] = useState<string | null>(initial?.id ?? null);
  const [bullets, setBullets] = useState(initial?.bullets ?? []);
  const [metrics, setMetrics] = useState(initial?.metrics ?? []);
  const [newBullet, setNewBullet] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [metricContext, setMetricContext] = useState("");
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const persistCore = async (): Promise<string> => {
    const input: ExperienceInput = {
      ...draft,
      skills: skillsDraft
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (!input.organization.trim() || !input.title.trim()) {
      throw new Error("Organization and title are required.");
    }
    if (experienceId) {
      await updateExperience(userId, experienceId, input);
      return experienceId;
    }
    const created = await createExperience(userId, { ...input, source: createSource });
    setExperienceId(created.id);
    return created.id;
  };

  const saveAll = async () => {
    setState("saving");
    setError(null);
    try {
      await persistCore();
      const list = await listExperiences(userId);
      setState("saved");
      onSaved(list);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Error saving");
    }
  };

  const addBullet = async () => {
    if (!newBullet.trim()) return;
    setState("saving");
    try {
      const id = await persistCore();
      const bullet = await createExperienceBullet(userId, id, newBullet);
      setBullets((prev) => [...prev, bullet]);
      setNewBullet("");
      setState("saved");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Error saving");
    }
  };

  return (
    <Sheet tone="paper-2" shadow="hard" className="relative mt-4 px-4 py-5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-[1.25rem] font-black uppercase">
          {initial
            ? "Edit experience"
            : createSource === "manual"
              ? "Add experience not on resume"
              : "New experience"}
        </p>
        <PinkHoverButton variant="closeSm" onClick={onClose}>
          Close
        </PinkHoverButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="tag text-ink-faint">Type</span>
          <select
            className={fieldClass()}
            value={draft.experienceType}
            onChange={(e) =>
              setDraft({ ...draft, experienceType: e.target.value as ExperienceType })
            }
          >
            {(Object.keys(EXPERIENCE_TYPE_LABELS) as ExperienceType[]).map((t) => (
              <option key={t} value={t}>
                {EXPERIENCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="tag text-ink-faint">Organization</span>
          <input
            className={fieldClass()}
            value={draft.organization}
            onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="tag text-ink-faint">Title</span>
          <input
            className={fieldClass()}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="tag text-ink-faint">Location</span>
          <input
            className={fieldClass()}
            value={draft.location ?? ""}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="tag text-ink-faint">Start date</span>
          <input
            className={fieldClass()}
            type="date"
            value={draft.startDate ?? ""}
            onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="tag text-ink-faint">End date</span>
          <input
            className={fieldClass()}
            type="date"
            disabled={draft.isCurrent}
            value={draft.endDate ?? ""}
            onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
          />
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(draft.isCurrent)}
          onChange={(e) => setDraft({ ...draft, isCurrent: e.target.checked })}
        />
        <span className="tag uppercase">Current role</span>
      </label>

      <label className="mt-3 block">
        <span className="tag text-ink-faint">Summary (optional)</span>
        <textarea
          className={cn(fieldClass(), "min-h-[72px]")}
          value={draft.summary ?? ""}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        />
      </label>

      <label className="mt-3 block">
        <span className="tag text-ink-faint">Skills / tags (comma-separated)</span>
        <input
          className={fieldClass()}
          value={skillsDraft}
          onChange={(e) => setSkillsDraft(e.target.value)}
          placeholder="user research, Figma, SQL"
        />
      </label>

      {draft.experienceType === "project" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="tag text-ink-faint">Project URL</span>
            <input
              className={fieldClass()}
              value={draft.projectUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, projectUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="tag text-ink-faint">GitHub URL</span>
            <input
              className={fieldClass()}
              value={draft.githubUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="tag text-ink-faint">Case study URL</span>
            <input
              className={fieldClass()}
              value={draft.caseStudyUrl ?? ""}
              onChange={(e) => setDraft({ ...draft, caseStudyUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="tag text-ink-faint">Product type / status</span>
            <input
              className={fieldClass()}
              value={[draft.productType, draft.projectStatus].filter(Boolean).join(" · ")}
              onChange={(e) => {
                const [productType, ...rest] = e.target.value.split("·");
                setDraft({
                  ...draft,
                  productType: productType?.trim() || "",
                  projectStatus: rest.join("·").trim() || "",
                });
              }}
              placeholder="Consumer · shipped"
            />
          </label>
        </div>
      )}

      <div className="mt-5">
        <p className="tag font-black text-ink">What I did</p>
        <ul className="mt-2 space-y-2">
          {bullets.map((b, i) => (
            <li key={b.id} className="border-2 border-ink bg-paper px-3 py-2">
              <textarea
                className="w-full resize-y border-0 bg-transparent outline-none"
                value={b.content}
                onChange={(e) =>
                  setBullets((prev) =>
                    prev.map((x) => (x.id === b.id ? { ...x, content: e.target.value } : x)),
                  )
                }
                onBlur={() => {
                  void updateExperienceBullet(userId, b.id, b.content).catch(() => undefined);
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <PinkHoverButton
                  variant="xs"
                  disabled={i === 0}
                  onClick={() => {
                    if (!experienceId) return;
                    void moveExperienceBullet(userId, experienceId, b.id, "up").then(setBullets);
                  }}
                >
                  Up
                </PinkHoverButton>
                <PinkHoverButton
                  variant="xs"
                  disabled={i === bullets.length - 1}
                  onClick={() => {
                    if (!experienceId) return;
                    void moveExperienceBullet(userId, experienceId, b.id, "down").then(setBullets);
                  }}
                >
                  Down
                </PinkHoverButton>
                <PinkHoverButton
                  variant="xs"
                  onClick={() => {
                    void deleteExperienceBullet(userId, b.id).then(() =>
                      setBullets((prev) => prev.filter((x) => x.id !== b.id)),
                    );
                  }}
                >
                  Delete
                </PinkHoverButton>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className={fieldClass()}
            placeholder="Add a factual bullet"
            value={newBullet}
            onChange={(e) => setNewBullet(e.target.value)}
          />
          <PinkHoverButton variant="paper" onClick={() => void addBullet()}>
            Add bullet
          </PinkHoverButton>
        </div>
      </div>

      <div className="mt-5">
        <p className="tag font-black text-ink">Metrics (optional, user-authored only)</p>
        <ul className="mt-2 space-y-2">
          {metrics.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink px-3 py-2">
              <span>
                <strong>{m.label}</strong>: {m.value}
                {m.context ? ` · ${m.context}` : ""}
              </span>
              <PinkHoverButton
                variant="xs"
                onClick={() => {
                  void deleteExperienceMetric(userId, m.id).then(() =>
                    setMetrics((prev) => prev.filter((x) => x.id !== m.id)),
                  );
                }}
              >
                Delete
              </PinkHoverButton>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            className={fieldClass()}
            placeholder="Label"
            value={metricLabel}
            onChange={(e) => setMetricLabel(e.target.value)}
          />
          <input
            className={fieldClass()}
            placeholder="Value"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
          />
          <input
            className={fieldClass()}
            placeholder="Context"
            value={metricContext}
            onChange={(e) => setMetricContext(e.target.value)}
          />
        </div>
        <div className="mt-2">
          <PinkHoverButton
            variant="paper"
            onClick={() => {
              if (!metricLabel.trim() || !metricValue.trim()) return;
              void (async () => {
                const id = await persistCore();
                const metric = await upsertExperienceMetric(userId, id, {
                  label: metricLabel,
                  value: metricValue,
                  context: metricContext,
                });
                setMetrics((prev) => [...prev, metric]);
                setMetricLabel("");
                setMetricValue("");
                setMetricContext("");
              })().catch((e) => {
                setState("error");
                setError(e instanceof Error ? e.message : "Error saving");
              });
            }}
          >
            Add metric
          </PinkHoverButton>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PinkHoverButton variant="ink" onClick={() => void saveAll()}>
          Save experience
        </PinkHoverButton>
        {initial && (
          <PinkHoverButton
            variant="paper"
            onClick={() => {
              void deleteExperience(userId, initial.id).then(async () => {
                onSaved(await listExperiences(userId));
              });
            }}
          >
            Delete experience
          </PinkHoverButton>
        )}
        <SaveStatus state={state} error={error} />
      </div>
    </Sheet>
  );
}
