import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Sheet, Tape } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { SaveStatus, type SaveState } from "@/components/profile/SaveStatus";
import { ExperienceEditor } from "@/components/profile/ExperienceEditor";
import {
  createApplicationAnswer,
  deleteApplicationAnswer,
  updateApplicationAnswer,
} from "@/lib/profile/applicationAnswersRepository";
import {
  loadProfileBundle,
  replaceLocations,
  updateApplicationDetails,
  updateEmploymentTypes,
  updateProfileBasics,
  updateTargetRoles,
  updateWorkModes,
} from "@/lib/profile/profileRepository";
import {
  getMasterResumeSignedUrl,
  replaceMasterResume,
  uploadMasterResume,
} from "@/lib/profile/resumeRepository";
import { moveExperience } from "@/lib/profile/experienceRepository";
import {
  DEFAULT_ANSWER_PROMPTS,
  EXPERIENCE_TYPE_LABELS,
  TARGET_PRODUCT_ROLES,
  WORK_AUTH_OPTIONS,
  type ExperienceRecord,
  type ProfileApplicationDetails,
  type ProfileBasics,
  type ProfileTargets,
  type ResumeDocument,
  type StandardApplicationAnswer,
  type UserProfileBundle,
  type WorkAuthorizationStatus,
} from "@/types/profile";
import type { EmploymentType, ProductRole, WorkMode } from "@/types/apply";
import { cn } from "@/lib/utils";

function fieldClass() {
  return "mt-1 w-full border-2 border-ink bg-paper px-3 py-2 font-body text-[0.95rem] text-ink outline-none focus:bg-yellow-wash";
}

function Section({
  eyebrow,
  title,
  hint,
  tone = "paper",
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  tone?: "paper" | "blue" | "pink" | "yellow" | "green";
  children: ReactNode;
}) {
  return (
    <Sheet tone={tone} soft={tone !== "paper"} shadow="hard-sm" className="relative px-5 py-5 sm:px-6">
      <Tape className="-top-3 left-6" color="pink" angle={-5} width={92} height={20} />
      <p className="tag text-ink-faint">{eyebrow}</p>
      <h2 className="mt-1 font-display text-[1.55rem] font-black uppercase leading-none">{title}</h2>
      {hint ? <p className="mt-2 max-w-2xl text-[0.92rem] text-ink-soft">{hint}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </Sheet>
  );
}

function ToggleChip({
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
      onClick={onClick}
      className={cn(
        "focus-ink border-2 border-ink px-3 py-2 font-display text-xs font-black uppercase outline-none",
        active ? "bg-ink text-paper" : "bg-paper hover:bg-pink-wash",
      )}
    >
      {children}
    </button>
  );
}

function completeness(bundle: UserProfileBundle) {
  const checks = [
    Boolean(bundle.profile.preferredName.trim()),
    Boolean(bundle.profile.school.trim()),
    Boolean(bundle.profile.graduationYear),
    bundle.targets.roles.length > 0,
    bundle.targets.locations.length > 0 || bundle.targets.workModes.length > 0,
    Boolean(bundle.profile.preferredEmail.trim() || bundle.profile.linkedinUrl.trim()),
    Boolean(bundle.masterResume),
    bundle.experiences.length > 0,
  ];
  const done = checks.filter(Boolean).length;
  return { done, total: checks.length };
}

export function ProfileWorkspace() {
  const { configured, ready, user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [bundle, setBundle] = useState<UserProfileBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [basics, setBasics] = useState<ProfileBasics | null>(null);
  const [details, setDetails] = useState<ProfileApplicationDetails | null>(null);
  const [targets, setTargets] = useState<ProfileTargets | null>(null);
  const [locationsDraft, setLocationsDraft] = useState("");
  const [answers, setAnswers] = useState<StandardApplicationAnswer[]>([]);
  const [masterResume, setMasterResume] = useState<ResumeDocument | null>(null);
  const [experiences, setExperiences] = useState<ExperienceRecord[]>([]);

  const [basicsState, setBasicsState] = useState<SaveState>("idle");
  const [detailsState, setDetailsState] = useState<SaveState>("idle");
  const [targetsState, setTargetsState] = useState<SaveState>("idle");
  const [resumeState, setResumeState] = useState<SaveState>("idle");
  const [answerState, setAnswerState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editingExperienceId, setEditingExperienceId] = useState<string | null | "new">(null);
  const [newAnswerLabel, setNewAnswerLabel] = useState("");
  const [newAnswerBody, setNewAnswerBody] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!configured || !user) {
      setLoading(false);
      setBundle(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void loadProfileBundle(user.id)
      .then((data) => {
        if (cancelled) return;
        setBundle(data);
        setBasics({
          preferredName: data.profile.preferredName,
          school: data.profile.school,
          major: data.profile.major,
          minor: data.profile.minor,
          graduationYear: data.profile.graduationYear,
          currentLocation: data.profile.currentLocation,
        });
        setDetails({
          preferredEmail: data.profile.preferredEmail,
          phone: data.profile.phone,
          linkedinUrl: data.profile.linkedinUrl,
          githubUrl: data.profile.githubUrl,
          portfolioUrl: data.profile.portfolioUrl,
          websiteUrl: data.profile.websiteUrl,
          workAuthorizationStatus: data.profile.workAuthorizationStatus,
          requiresSponsorship: data.profile.requiresSponsorship,
        });
        setTargets(data.targets);
        setLocationsDraft(data.targets.locations.map((l) => l.label).join(", "));
        setAnswers(data.answers);
        setMasterResume(data.masterResume);
        setExperiences(data.experiences);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "Could not load profile.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [configured, ready, user]);

  const summary = useMemo(() => {
    if (!bundle || !basics || !targets) return null;
    const live: UserProfileBundle = {
      ...bundle,
      profile: { ...bundle.profile, ...basics, ...(details ?? {}) },
      targets,
      answers,
      masterResume,
      experiences,
    };
    return { live, completeness: completeness(live) };
  }, [bundle, basics, details, targets, answers, masterResume, experiences]);

  if (!ready || loading) {
    return (
      <main className="px-5 pb-28 pt-12 sm:px-8">
        <p className="tag text-ink-faint">Loading profile…</p>
      </main>
    );
  }

  if (!configured) {
    return (
      <main className="px-5 pb-28 pt-12 sm:px-8">
        <Sheet tone="yellow" soft shadow="hard-sm" className="mx-auto max-w-xl px-5 py-6">
          <p className="font-display text-[1.4rem] font-black uppercase">Supabase not configured</p>
          <p className="mt-2 text-ink-soft">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to use Profile.
          </p>
        </Sheet>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative overflow-hidden px-5 pb-28 pt-12 sm:px-8">
        <div aria-hidden className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-55" />
        <div className="mx-auto max-w-xl">
          <p className="tag text-pink">The Product Place · Profile</p>
          <h1 className="mt-2 font-display text-[clamp(2.4rem,8vw,4.5rem)] font-black uppercase leading-[0.85]">
            Your dossier
          </h1>
          <p className="mt-4 text-ink-soft">
            Sign in to build the structured profile that later powers matching, Quick Apply, and
            truthful application materials.
          </p>
          <div className="mt-6">
            <PinkHoverButton variant="ink" onClick={() => setAuthOpen(true)}>
              Sign in
            </PinkHoverButton>
          </div>
        </div>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </main>
    );
  }

  if (loadError || !basics || !details || !targets || !summary) {
    return (
      <main className="px-5 pb-28 pt-12 sm:px-8">
        <Sheet tone="pink" soft shadow="hard-sm" className="mx-auto max-w-xl px-5 py-6">
          <p className="font-display text-[1.3rem] font-black uppercase">Could not load profile</p>
          <p className="mt-2 text-paper">{loadError}</p>
          <p className="mt-3 text-sm text-paper/90">
            If this is a new environment, apply migration{" "}
            <code className="bg-ink/20 px-1">20260812000004_profile_master_resume.sql</code> first.
          </p>
        </Sheet>
      </main>
    );
  }

  const saveBasics = async () => {
    setBasicsState("saving");
    setErrorMsg(null);
    try {
      const next = await updateProfileBasics(user.id, basics);
      setBasics({
        preferredName: next.preferredName,
        school: next.school,
        major: next.major,
        minor: next.minor,
        graduationYear: next.graduationYear,
        currentLocation: next.currentLocation,
      });
      setBasicsState("saved");
    } catch (e) {
      setBasicsState("error");
      setErrorMsg(e instanceof Error ? e.message : "Error saving");
    }
  };

  const saveDetails = async () => {
    setDetailsState("saving");
    setErrorMsg(null);
    try {
      const next = await updateApplicationDetails(user.id, details);
      setDetails({
        preferredEmail: next.preferredEmail,
        phone: next.phone,
        linkedinUrl: next.linkedinUrl,
        githubUrl: next.githubUrl,
        portfolioUrl: next.portfolioUrl,
        websiteUrl: next.websiteUrl,
        workAuthorizationStatus: next.workAuthorizationStatus,
        requiresSponsorship: next.requiresSponsorship,
      });
      setDetailsState("saved");
    } catch (e) {
      setDetailsState("error");
      setErrorMsg(e instanceof Error ? e.message : "Error saving");
    }
  };

  const saveTargets = async () => {
    setTargetsState("saving");
    setErrorMsg(null);
    try {
      const labels = locationsDraft
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await updateTargetRoles(user.id, targets.roles);
      await updateWorkModes(user.id, targets.workModes);
      await updateEmploymentTypes(user.id, targets.employmentTypes);
      const locations = await replaceLocations(user.id, labels);
      setTargets({ ...targets, locations });
      setLocationsDraft(locations.map((l) => l.label).join(", "));
      setTargetsState("saved");
    } catch (e) {
      setTargetsState("error");
      setErrorMsg(e instanceof Error ? e.message : "Error saving");
    }
  };

  const onResumeFile = async (file: File | null) => {
    if (!file) return;
    setResumeState("saving");
    setErrorMsg(null);
    try {
      const doc = masterResume
        ? await replaceMasterResume(user.id, file)
        : await uploadMasterResume(user.id, file);
      setMasterResume(doc);
      setResumeState("saved");
    } catch (e) {
      setResumeState("error");
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const openResume = async () => {
    if (!masterResume) return;
    try {
      const url = await getMasterResumeSignedUrl(user.id, masterResume.storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setResumeState("error");
      setErrorMsg(e instanceof Error ? e.message : "Could not open resume");
    }
  };

  const toggleRole = (role: ProductRole) => {
    setTargets((prev) => {
      if (!prev) return prev;
      const has = prev.roles.includes(role);
      return {
        ...prev,
        roles: has ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
      };
    });
  };

  const toggleMode = (mode: WorkMode) => {
    setTargets((prev) => {
      if (!prev) return prev;
      const has = prev.workModes.includes(mode);
      return {
        ...prev,
        workModes: has ? prev.workModes.filter((m) => m !== mode) : [...prev.workModes, mode],
      };
    });
  };

  const toggleEmp = (t: EmploymentType) => {
    setTargets((prev) => {
      if (!prev) return prev;
      const has = prev.employmentTypes.includes(t);
      return {
        ...prev,
        employmentTypes: has
          ? prev.employmentTypes.filter((x) => x !== t)
          : [...prev.employmentTypes, t],
      };
    });
  };

  return (
    <main className="relative overflow-hidden px-5 pb-28 pt-12 sm:px-8 sm:pt-14">
      <div aria-hidden className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-55" />

      <div className="mx-auto max-w-[1100px] space-y-8">
        <header>
          <p className="tag text-pink">The Product Place · Profile</p>
          <h1 className="mt-2 font-display text-[clamp(2.6rem,9vw,5rem)] font-black uppercase leading-[0.8]">
            Profile
          </h1>
          <p className="mt-4 max-w-2xl text-[1.02rem] text-ink-soft">
            Your career dossier — who you are, what you want, and the factual experience library
            future applications will draw from. No invented details.
          </p>
        </header>

        <Sheet tone="yellow" soft shadow="hard-sm" className="relative px-5 py-5">
          <Tape className="-top-3 right-8" color="blue" angle={6} width={88} height={20} />
          <p className="tag text-ink-faint">Master profile summary</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="tag text-ink-faint">Name</p>
              <p className="font-display text-[1.15rem] font-black uppercase">
                {basics.preferredName || "—"}
              </p>
            </div>
            <div>
              <p className="tag text-ink-faint">School / grad</p>
              <p className="font-display text-[1.15rem] font-black uppercase">
                {[basics.school || null, basics.graduationYear].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <div>
              <p className="tag text-ink-faint">Target roles</p>
              <p className="text-[0.95rem] text-ink-soft">
                {targets.roles.length ? targets.roles.join(", ") : "—"}
              </p>
            </div>
            <div>
              <p className="tag text-ink-faint">Locations</p>
              <p className="text-[0.95rem] text-ink-soft">
                {targets.locations.length
                  ? targets.locations.map((l) => l.label).join(", ")
                  : locationsDraft || "—"}
              </p>
            </div>
            <div>
              <p className="tag text-ink-faint">Master resume</p>
              <p className="font-display text-[1.05rem] font-black uppercase">
                {masterResume ? "Uploaded" : "Missing"}
              </p>
            </div>
            <div>
              <p className="tag text-ink-faint">Experiences</p>
              <p className="font-display text-[1.05rem] font-black uppercase">
                {experiences.length}
              </p>
            </div>
          </div>
          <p className="mt-4 tag text-ink">
            Profile setup · {summary.completeness.done} of {summary.completeness.total} core details
            added
          </p>
          <p className="mt-1 text-[0.88rem] text-ink-soft">
            {masterResume && experiences.length > 0
              ? details.preferredEmail || details.linkedinUrl
                ? "Ready for future Quick Apply data assembly."
                : "Application details incomplete — optional for now."
              : "Add a master resume and at least one experience when you can."}
          </p>
        </Sheet>

        <Section
          eyebrow="Basics"
          title="Who you are"
          hint="Only store what you enter. Nothing is prefilled from mock data."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="tag text-ink-faint">Preferred / full name</span>
              <input
                className={fieldClass()}
                value={basics.preferredName}
                onChange={(e) => setBasics({ ...basics, preferredName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">School</span>
              <input
                className={fieldClass()}
                value={basics.school}
                onChange={(e) => setBasics({ ...basics, school: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Degree / major</span>
              <input
                className={fieldClass()}
                value={basics.major}
                onChange={(e) => setBasics({ ...basics, major: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Minor (optional)</span>
              <input
                className={fieldClass()}
                value={basics.minor}
                onChange={(e) => setBasics({ ...basics, minor: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Graduation year</span>
              <input
                className={fieldClass()}
                type="number"
                inputMode="numeric"
                placeholder="2027"
                value={basics.graduationYear ?? ""}
                onChange={(e) =>
                  setBasics({
                    ...basics,
                    graduationYear: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Current city / location</span>
              <input
                className={fieldClass()}
                value={basics.currentLocation}
                onChange={(e) => setBasics({ ...basics, currentLocation: e.target.value })}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PinkHoverButton variant="ink" onClick={() => void saveBasics()}>
              Save basics
            </PinkHoverButton>
            <SaveStatus state={basicsState} error={errorMsg} />
          </div>
        </Section>

        <Section
          eyebrow="Targets"
          title="What you want"
          hint="Preferences only — matching comes later."
          tone="blue"
        >
          <div>
            <p className="tag text-ink-faint">Target product roles</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TARGET_PRODUCT_ROLES.map((role) => (
                <ToggleChip
                  key={role}
                  active={targets.roles.includes(role)}
                  onClick={() => toggleRole(role)}
                >
                  {role === "Other / Unspecified Product" ? "Other Product" : role}
                </ToggleChip>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="tag text-ink-faint">Preferred locations (comma-separated)</span>
            <input
              className={fieldClass()}
              value={locationsDraft}
              onChange={(e) => setLocationsDraft(e.target.value)}
              placeholder="Bay Area, NYC, Seattle"
            />
          </label>
          <div>
            <p className="tag text-ink-faint">Work mode</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["remote", "Remote okay"],
                  ["hybrid", "Hybrid okay"],
                  ["in-person", "In-person okay"],
                ] as const
              ).map(([mode, label]) => (
                <ToggleChip
                  key={mode}
                  active={targets.workModes.includes(mode)}
                  onClick={() => toggleMode(mode)}
                >
                  {label}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div>
            <p className="tag text-ink-faint">Employment type</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["internship", "Internship"],
                  ["part-time", "Part-time"],
                  ["full-time", "Full-time"],
                ] as const
              ).map(([t, label]) => (
                <ToggleChip
                  key={t}
                  active={targets.employmentTypes.includes(t)}
                  onClick={() => toggleEmp(t)}
                >
                  {label}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PinkHoverButton variant="ink" onClick={() => void saveTargets()}>
              Save targets
            </PinkHoverButton>
            <SaveStatus state={targetsState} error={errorMsg} />
          </div>
        </Section>

        <Section
          eyebrow="Application details"
          title="Forms & contact"
          hint="Stored for your own application workflow. Leave blank if you prefer not to answer."
          tone="green"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="tag text-ink-faint">Preferred application email</span>
              <input
                className={fieldClass()}
                type="email"
                value={details.preferredEmail}
                onChange={(e) => setDetails({ ...details, preferredEmail: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Phone (optional)</span>
              <input
                className={fieldClass()}
                value={details.phone}
                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">LinkedIn URL</span>
              <input
                className={fieldClass()}
                value={details.linkedinUrl}
                onChange={(e) => setDetails({ ...details, linkedinUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">GitHub URL</span>
              <input
                className={fieldClass()}
                value={details.githubUrl}
                onChange={(e) => setDetails({ ...details, githubUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Portfolio URL</span>
              <input
                className={fieldClass()}
                value={details.portfolioUrl}
                onChange={(e) => setDetails({ ...details, portfolioUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Personal website</span>
              <input
                className={fieldClass()}
                value={details.websiteUrl}
                onChange={(e) => setDetails({ ...details, websiteUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="tag text-ink-faint">Work authorization</span>
              <select
                className={fieldClass()}
                value={details.workAuthorizationStatus}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    workAuthorizationStatus: e.target.value as WorkAuthorizationStatus,
                  })
                }
              >
                {WORK_AUTH_OPTIONS.map((o) => (
                  <option key={o.value || "blank"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="block">
              <legend className="tag text-ink-faint">Requires future sponsorship?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    [null, "Not answered"],
                    [true, "Yes"],
                    [false, "No"],
                  ] as const
                ).map(([val, label]) => (
                  <ToggleChip
                    key={label}
                    active={details.requiresSponsorship === val}
                    onClick={() => setDetails({ ...details, requiresSponsorship: val })}
                  >
                    {label}
                  </ToggleChip>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PinkHoverButton variant="ink" onClick={() => void saveDetails()}>
              Save application details
            </PinkHoverButton>
            <SaveStatus state={detailsState} error={errorMsg} />
          </div>
        </Section>

        <Section
          eyebrow="Standard answers"
          title="Reusable responses"
          hint="Write your own answers. Nothing is generated."
          tone="pink"
        >
          <div className="space-y-3">
            {answers.length === 0 ? (
              <p className="border-2 border-dashed border-ink/40 bg-paper px-4 py-6 text-ink-soft">
                No reusable answers yet. Add prompts you often see on applications.
              </p>
            ) : (
              answers.map((a) => (
                <Sheet key={a.id} tone="paper" shadow="hard-sm" className="px-4 py-4">
                  <input
                    className={fieldClass()}
                    value={a.label}
                    onChange={(e) =>
                      setAnswers((prev) =>
                        prev.map((x) => (x.id === a.id ? { ...x, label: e.target.value } : x)),
                      )
                    }
                  />
                  <textarea
                    className={cn(fieldClass(), "mt-2 min-h-[96px]")}
                    value={a.answer}
                    onChange={(e) =>
                      setAnswers((prev) =>
                        prev.map((x) => (x.id === a.id ? { ...x, answer: e.target.value } : x)),
                      )
                    }
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PinkHoverButton
                      variant="paper"
                      onClick={() => {
                        setAnswerState("saving");
                        void updateApplicationAnswer(user.id, a.id, {
                          label: a.label,
                          answer: a.answer,
                          category: a.category,
                        })
                          .then((saved) => {
                            setAnswers((prev) => prev.map((x) => (x.id === a.id ? saved : x)));
                            setAnswerState("saved");
                          })
                          .catch((e) => {
                            setAnswerState("error");
                            setErrorMsg(e instanceof Error ? e.message : "Error saving");
                          });
                      }}
                    >
                      Save
                    </PinkHoverButton>
                    <PinkHoverButton
                      variant="paper"
                      onClick={() => {
                        void deleteApplicationAnswer(user.id, a.id).then(() =>
                          setAnswers((prev) => prev.filter((x) => x.id !== a.id)),
                        );
                      }}
                    >
                      Delete
                    </PinkHoverButton>
                  </div>
                </Sheet>
              ))
            )}
          </div>
          <div className="border-2 border-ink bg-paper px-4 py-4">
            <p className="tag text-ink-faint">Add answer</p>
            <input
              className={fieldClass()}
              placeholder="Question / label"
              value={newAnswerLabel}
              onChange={(e) => setNewAnswerLabel(e.target.value)}
              list="tpp-answer-prompts"
            />
            <datalist id="tpp-answer-prompts">
              {DEFAULT_ANSWER_PROMPTS.map((p) => (
                <option key={p.label} value={p.label} />
              ))}
            </datalist>
            <textarea
              className={cn(fieldClass(), "mt-2 min-h-[80px]")}
              placeholder="Your answer"
              value={newAnswerBody}
              onChange={(e) => setNewAnswerBody(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PinkHoverButton
                variant="ink"
                onClick={() => {
                  if (!newAnswerLabel.trim()) return;
                  setAnswerState("saving");
                  const prompt = DEFAULT_ANSWER_PROMPTS.find((p) => p.label === newAnswerLabel.trim());
                  void createApplicationAnswer(user.id, {
                    label: newAnswerLabel,
                    answer: newAnswerBody,
                    category: prompt?.category ?? null,
                  })
                    .then((created) => {
                      setAnswers((prev) => [...prev, created]);
                      setNewAnswerLabel("");
                      setNewAnswerBody("");
                      setAnswerState("saved");
                    })
                    .catch((e) => {
                      setAnswerState("error");
                      setErrorMsg(e instanceof Error ? e.message : "Error saving");
                    });
                }}
              >
                Add answer
              </PinkHoverButton>
              <SaveStatus state={answerState} error={errorMsg} />
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Master resume"
          title="Baseline document"
          hint="Private PDF upload. The Experience Library below stays separate — editing facts does not change this file."
        >
          {!masterResume ? (
            <div className="border-2 border-dashed border-ink/50 bg-paper px-4 py-8">
              <p className="font-display text-[1.2rem] font-black uppercase">No master resume yet</p>
              <p className="mt-2 max-w-xl text-ink-soft">
                Upload the resume you want The Product Place to use as your baseline.
              </p>
              <label className="mt-4 inline-block">
                <span className="sr-only">Upload resume</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="block w-full text-sm"
                  onChange={(e) => void onResumeFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-display text-[1.2rem] font-black uppercase">
                {masterResume.originalFilename}
              </p>
              <p className="tag text-ink-faint">
                Uploaded {new Date(masterResume.uploadedAt).toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-2">
                <PinkHoverButton variant="ink" onClick={() => void openResume()}>
                  View / download
                </PinkHoverButton>
                <label className="inline-block">
                  <span className="sr-only">Replace resume</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="block text-sm"
                    onChange={(e) => void onResumeFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          )}
          <SaveStatus state={resumeState} error={errorMsg} />
        </Section>

        <Section
          eyebrow="Experience library"
          title="Fact bank"
          hint="Structured experiences and bullets future tailoring must use. Do not invent metrics."
          tone="yellow"
        >
          {experiences.length === 0 && editingExperienceId === null ? (
            <div className="border-2 border-dashed border-ink/50 bg-paper px-4 py-8">
              <p className="font-display text-[1.2rem] font-black uppercase">
                No experiences added yet
              </p>
              <p className="mt-2 max-w-xl text-ink-soft">
                Build a factual library of internships, projects, leadership, and work you can reuse
                across applications.
              </p>
              <div className="mt-4">
                <PinkHoverButton variant="ink" onClick={() => setEditingExperienceId("new")}>
                  Add experience
                </PinkHoverButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <Sheet key={exp.id} tone="paper" shadow="hard-sm" className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="tag text-ink-faint">
                        {EXPERIENCE_TYPE_LABELS[exp.experienceType]}
                      </p>
                      <p className="mt-1 font-display text-[1.35rem] font-black uppercase leading-none">
                        {exp.organization}
                      </p>
                      <p className="mt-1 text-[1rem] text-ink-soft">{exp.title}</p>
                      <p className="tag mt-2 text-ink-faint">
                        {[exp.startDate, exp.isCurrent ? "Present" : exp.endDate]
                          .filter(Boolean)
                          .join(" – ") || "Dates not set"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PinkHoverButton
                        variant="xs"
                        disabled={index === 0}
                        onClick={() => {
                          void moveExperience(user.id, exp.id, "up").then(setExperiences);
                        }}
                      >
                        Up
                      </PinkHoverButton>
                      <PinkHoverButton
                        variant="xs"
                        disabled={index === experiences.length - 1}
                        onClick={() => {
                          void moveExperience(user.id, exp.id, "down").then(setExperiences);
                        }}
                      >
                        Down
                      </PinkHoverButton>
                      <PinkHoverButton
                        variant="paper"
                        onClick={() => setEditingExperienceId(exp.id)}
                      >
                        Edit experience
                      </PinkHoverButton>
                    </div>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-4 list-disc space-y-1 pl-5 text-[0.95rem]">
                      {exp.bullets.map((b) => (
                        <li key={b.id}>{b.content}</li>
                      ))}
                    </ul>
                  )}
                  {exp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exp.skills.map((s) => (
                        <span
                          key={s}
                          className="border-2 border-ink bg-blue-wash px-2 py-1 tag uppercase"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </Sheet>
              ))}
              {editingExperienceId === null && (
                <PinkHoverButton variant="ink" onClick={() => setEditingExperienceId("new")}>
                  Add experience
                </PinkHoverButton>
              )}
            </div>
          )}

          {editingExperienceId !== null && (
            <ExperienceEditor
              userId={user.id}
              initial={
                editingExperienceId === "new"
                  ? null
                  : experiences.find((e) => e.id === editingExperienceId) ?? null
              }
              onClose={() => setEditingExperienceId(null)}
              onSaved={(list) => {
                setExperiences(list);
                setEditingExperienceId(null);
              }}
            />
          )}
        </Section>

        <Section eyebrow="Links" title="Quick links">
          <ul className="space-y-2 text-[0.95rem]">
            {[
              ["LinkedIn", details.linkedinUrl],
              ["GitHub", details.githubUrl],
              ["Portfolio", details.portfolioUrl],
              ["Website", details.websiteUrl],
            ].map(([label, url]) => (
              <li key={label}>
                <span className="tag text-ink-faint">{label}</span>{" "}
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-2 underline-offset-2"
                  >
                    {url}
                  </a>
                ) : (
                  <span className="text-ink-soft">—</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}
