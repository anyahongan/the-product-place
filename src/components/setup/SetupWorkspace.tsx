import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Sheet, Tape, Tab, Clip } from "@/components/paper/Paper";
import { PinkHoverButton } from "@/components/network/PinkHoverButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";
import {
  loadProfileBundle,
  markOnboardingComplete,
  replaceLocations,
  updateEmploymentTypes,
  updateProfileBasics,
  updateTargetRoles,
  updateWorkModes,
} from "@/lib/profile/profileRepository";
import { uploadMasterResume } from "@/lib/profile/resumeRepository";
import {
  TARGET_PRODUCT_ROLES,
  type ProfileBasics,
  type ProfileTargets,
  type ResumeDocument,
} from "@/types/profile";
import type { EmploymentType, WorkMode } from "@/types/apply";

type StepId = "welcome" | "about" | "roles" | "prefs" | "resume" | "ready";

const CONTENT_STEPS: StepId[] = ["about", "roles", "prefs", "resume", "ready"];

const WORK_MODES: { id: WorkMode; label: string }[] = [
  { id: "remote", label: "Remote" },
  { id: "hybrid", label: "Hybrid" },
  { id: "in-person", label: "In-Person" },
];

const EMPLOYMENT_TYPES: { id: EmploymentType; label: string }[] = [
  { id: "internship", label: "Internship" },
  { id: "part-time", label: "Part-Time" },
  { id: "full-time", label: "Full-Time" },
];

function emptyBasics(): ProfileBasics {
  return {
    preferredName: "",
    school: "",
    major: "",
    minor: "",
    graduationYear: null,
    currentLocation: "",
  };
}

function emptyTargets(): ProfileTargets {
  return { roles: [], locations: [], workModes: [], employmentTypes: [] };
}

function inferStep(
  basics: ProfileBasics,
  targets: ProfileTargets,
  resume: ResumeDocument | null,
): StepId {
  const hasBasics = Boolean(basics.preferredName.trim() && basics.graduationYear);
  const hasRoles = targets.roles.length > 0;
  const hasPrefs =
    targets.workModes.length > 0 ||
    targets.employmentTypes.length > 0 ||
    targets.locations.length > 0;
  const hasAnything =
    hasBasics ||
    hasRoles ||
    hasPrefs ||
    Boolean(basics.school.trim()) ||
    Boolean(basics.major.trim()) ||
    Boolean(resume);

  if (!hasAnything) return "welcome";
  if (!hasBasics) return "about";
  if (!hasRoles) return "roles";
  if (!hasPrefs) return "prefs";
  if (!resume) return "resume";
  return "ready";
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "focus-ink border-2 border-ink px-3 py-2 text-left font-display text-[0.78rem] font-black uppercase outline-none sm:text-xs",
        active ? "bg-blue text-paper" : "bg-paper text-ink hover:bg-yellow-wash",
      )}
    >
      {children}
    </button>
  );
}

function fieldClass() {
  return "mt-1.5 w-full border-2 border-ink bg-paper px-3 py-2.5 text-[0.98rem] outline-none focus:bg-yellow-wash";
}

export function SetupWorkspace() {
  const { configured, ready, user } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<StepId>("welcome");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [basics, setBasics] = useState<ProfileBasics>(emptyBasics);
  const [targets, setTargets] = useState<ProfileTargets>(emptyTargets);
  const [locationsDraft, setLocationsDraft] = useState("");
  const [masterResume, setMasterResume] = useState<ResumeDocument | null>(null);

  const progressIndex = CONTENT_STEPS.indexOf(step);
  const showProgress = progressIndex >= 0;

  const hydrate = useCallback(async (userId: string) => {
    const bundle = await loadProfileBundle(userId);
    const nextBasics: ProfileBasics = {
      preferredName: bundle.profile.preferredName,
      school: bundle.profile.school,
      major: bundle.profile.major,
      minor: bundle.profile.minor,
      graduationYear: bundle.profile.graduationYear,
      currentLocation: bundle.profile.currentLocation,
    };
    setBasics(nextBasics);
    setTargets(bundle.targets);
    setLocationsDraft(bundle.targets.locations.map((l) => l.label).join(", "));
    setMasterResume(bundle.masterResume);
    setStep(inferStep(nextBasics, bundle.targets, bundle.masterResume));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!configured || !user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void hydrate(user.id)
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, configured, user?.id, hydrate]);

  const summaryBits = useMemo(() => {
    const bits: string[] = [];
    if (targets.roles.length) bits.push(targets.roles.join(" · "));
    const places = [
      ...targets.locations.map((l) => l.label),
      ...targets.workModes.map((m) =>
        m === "in-person" ? "In-Person" : m === "hybrid" ? "Hybrid" : "Remote",
      ),
    ];
    if (places.length) bits.push(places.join(" · "));
    if (basics.graduationYear) bits.push(`Graduating ${basics.graduationYear}`);
    if (masterResume) bits.push("Master Resume ✓");
    return bits;
  }, [basics.graduationYear, masterResume, targets]);

  if (!ready || loading) {
    return (
      <main className="relative px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Sheet tone="paper" shadow="hard-sm" className="px-6 py-8">
            <p className="font-display text-[1.3rem] font-black uppercase">Loading setup…</p>
          </Sheet>
        </div>
      </main>
    );
  }

  if (!configured || !user) {
    return (
      <main className="relative px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-lg">
          <Sheet tone="blue" soft shadow="hard" className="px-6 py-8">
            <Tab color="blue">Account setup</Tab>
            <h1 className="mt-4 font-display text-[clamp(2rem,8vw,3.2rem)] font-black uppercase leading-[0.85]">
              Sign in to continue
            </h1>
            <p className="mt-4 text-ink-soft">
              Account Setup is for signed-in users. Create an account or sign in to build your
              workspace.
            </p>
            <div className="mt-6">
              <PinkHoverButton variant="ink" hoverAccent="yellow" onClick={() => setAuthOpen(true)}>
                Sign in
              </PinkHoverButton>
            </div>
          </Sheet>
        </div>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </main>
    );
  }

  const saveAbout = async () => {
    setError(null);
    if (!basics.preferredName.trim()) {
      setError("Preferred name is required.");
      return false;
    }
    if (!basics.graduationYear || basics.graduationYear < 2020 || basics.graduationYear > 2035) {
      setError("Enter a graduation year between 2020 and 2035.");
      return false;
    }
    setBusy(true);
    try {
      await updateProfileBasics(user.id, basics);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save basics.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveRoles = async () => {
    setError(null);
    if (targets.roles.length === 0) {
      setError("Pick at least one target role.");
      return false;
    }
    setBusy(true);
    try {
      await updateTargetRoles(user.id, targets.roles);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save roles.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const savePrefs = async () => {
    setError(null);
    setBusy(true);
    try {
      const labels = locationsDraft
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      await updateWorkModes(user.id, targets.workModes);
      await updateEmploymentTypes(user.id, targets.employmentTypes);
      const locations = await replaceLocations(user.id, labels);
      setTargets((prev) => ({ ...prev, locations }));
      setLocationsDraft(locations.map((l) => l.label).join(", "));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save preferences.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const doc = await uploadMasterResume(user.id, file);
      setMasterResume(doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setError(null);
    setBusy(true);
    try {
      // Persist prefs/locations once more in case user jumped to Ready.
      const labels = locationsDraft
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      await updateProfileBasics(user.id, basics);
      await updateTargetRoles(user.id, targets.roles);
      await updateWorkModes(user.id, targets.workModes);
      await updateEmploymentTypes(user.id, targets.employmentTypes);
      await replaceLocations(user.id, labels);
      await markOnboardingComplete(user.id);
      void navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish setup.");
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (step === "about") {
      if (!(await saveAbout())) return;
      setStep("roles");
      return;
    }
    if (step === "roles") {
      if (!(await saveRoles())) return;
      setStep("prefs");
      return;
    }
    if (step === "prefs") {
      if (!(await savePrefs())) return;
      setStep("resume");
      return;
    }
    if (step === "resume") {
      setStep("ready");
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "about") setStep("welcome");
    else if (step === "roles") setStep("about");
    else if (step === "prefs") setStep("roles");
    else if (step === "resume") setStep("prefs");
    else if (step === "ready") setStep("resume");
  };

  return (
    <main className="relative overflow-hidden px-5 pb-24 pt-10 sm:px-8 sm:pt-12">
      <div
        aria-hidden
        className="grid-bold pointer-events-none absolute inset-0 -z-10 opacity-50"
      />

      <div className="mx-auto max-w-3xl">
        {showProgress && (
          <p className="tag mb-4 text-ink-soft" aria-live="polite">
            {String(progressIndex + 1).padStart(2, "0")} / 05
          </p>
        )}

        <motion.div
          key={step}
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
        >
          {step === "welcome" && (
            <Sheet tone="paper" shadow="hard" className="relative px-6 py-10 sm:px-10">
              <Tape className="-top-3 left-8" color="pink" angle={-5} width={130} height={28} />
              <Clip className="absolute -top-4 right-10" color="blue" size={48} angle={8} />
              <Tab color="blue">Account setup</Tab>
              <h1 className="mt-5 font-display text-[clamp(2.4rem,9vw,4.5rem)] font-black uppercase leading-[0.8]">
                Welcome to
                <br />
                <span className="text-blue">The Product Place</span>
              </h1>
              <p className="mt-5 max-w-[36ch] text-[1.05rem] text-ink-soft">
                Build your workspace around what you&apos;re actually looking for.
              </p>
              <div className="mt-8">
                <PinkHoverButton
                  variant="ink"
                  hoverAccent="yellow"
                  disabled={busy}
                  onClick={() => setStep("about")}
                >
                  Get started
                </PinkHoverButton>
              </div>
            </Sheet>
          )}

          {step === "about" && (
            <Sheet
              tone="blue"
              soft
              pattern="grid"
              shadow="hard"
              className="relative px-6 py-8 sm:px-9"
            >
              <Tape className="-top-3 left-10" color="blue" angle={-4} width={120} height={26} />
              <h2 className="font-display text-[clamp(1.8rem,6vw,2.8rem)] font-black uppercase leading-[0.88]">
                About you
              </h2>
              <p className="tag mt-2 text-ink-soft">Same fields as Profile — edit anytime later.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="tag text-ink-faint">Preferred name *</span>
                  <input
                    className={fieldClass()}
                    value={basics.preferredName}
                    onChange={(e) => setBasics({ ...basics, preferredName: e.target.value })}
                    autoComplete="nickname"
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
                  <span className="tag text-ink-faint">Graduation year *</span>
                  <input
                    className={fieldClass()}
                    type="number"
                    inputMode="numeric"
                    placeholder="2028"
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
                  <span className="tag text-ink-faint">Major</span>
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
              </div>
              <NavRow
                busy={busy}
                onBack={goBack}
                onContinue={() => void goNext()}
                continueLabel="Continue"
              />
            </Sheet>
          )}

          {step === "roles" && (
            <Sheet tone="paper" shadow="hard" className="relative px-6 py-8 sm:px-9">
              <Tape className="-top-3 right-12" color="yellow" angle={6} width={110} height={26} />
              <h2 className="font-display text-[clamp(1.8rem,6vw,2.8rem)] font-black uppercase leading-[0.88]">
                What are you looking for?
              </h2>
              <p className="tag mt-2 text-ink-soft">Select at least one. Multi-select OK.</p>
              <div
                className="mt-6 flex flex-wrap gap-2"
                role="group"
                aria-label="Target product roles"
              >
                {TARGET_PRODUCT_ROLES.map((role) => (
                  <ToggleChip
                    key={role}
                    active={targets.roles.includes(role)}
                    onClick={() =>
                      setTargets((prev) => {
                        const has = prev.roles.includes(role);
                        return {
                          ...prev,
                          roles: has ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
                        };
                      })
                    }
                  >
                    {role === "Other / Unspecified Product" ? "Other Product" : role}
                  </ToggleChip>
                ))}
              </div>
              <NavRow
                busy={busy}
                onBack={goBack}
                onContinue={() => void goNext()}
                continueLabel="Continue"
              />
            </Sheet>
          )}

          {step === "prefs" && (
            <Sheet tone="yellow" soft shadow="hard" className="relative px-6 py-8 sm:px-9">
              <Tape className="-top-3 left-8" color="pink" angle={-6} width={100} height={24} />
              <h2 className="font-display text-[clamp(1.8rem,6vw,2.6rem)] font-black uppercase leading-[0.88]">
                Where / how do you want to work?
              </h2>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="tag text-ink-faint">Employment type</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EMPLOYMENT_TYPES.map((t) => (
                      <ToggleChip
                        key={t.id}
                        active={targets.employmentTypes.includes(t.id)}
                        onClick={() =>
                          setTargets((prev) => {
                            const has = prev.employmentTypes.includes(t.id);
                            return {
                              ...prev,
                              employmentTypes: has
                                ? prev.employmentTypes.filter((x) => x !== t.id)
                                : [...prev.employmentTypes, t.id],
                            };
                          })
                        }
                      >
                        {t.label}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="tag text-ink-faint">Work mode</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {WORK_MODES.map((m) => (
                      <ToggleChip
                        key={m.id}
                        active={targets.workModes.includes(m.id)}
                        onClick={() =>
                          setTargets((prev) => {
                            const has = prev.workModes.includes(m.id);
                            return {
                              ...prev,
                              workModes: has
                                ? prev.workModes.filter((x) => x !== m.id)
                                : [...prev.workModes, m.id],
                            };
                          })
                        }
                      >
                        {m.label}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
                <label className="block">
                  <span className="tag text-ink-faint">
                    Preferred locations (comma-separated, optional)
                  </span>
                  <input
                    className={fieldClass()}
                    value={locationsDraft}
                    onChange={(e) => setLocationsDraft(e.target.value)}
                    placeholder="San Francisco, New York, Remote"
                  />
                </label>
              </div>
              <NavRow
                busy={busy}
                onBack={goBack}
                onContinue={() => void goNext()}
                continueLabel="Continue"
              />
            </Sheet>
          )}

          {step === "resume" && (
            <Sheet
              tone="green"
              soft
              pattern="ruled"
              shadow="hard"
              className="relative px-6 py-8 sm:px-9"
            >
              <Tape className="-top-3 right-10" color="green" angle={5} width={110} height={26} />
              <h2 className="font-display text-[clamp(1.8rem,6vw,2.6rem)] font-black uppercase leading-[0.88]">
                Add your master resume
              </h2>
              <p className="mt-3 max-w-[40ch] text-[0.98rem] text-ink-soft">
                Upload the resume you currently use most often. You can replace or update it anytime
                in Profile.
              </p>
              <p className="tag mt-2 text-ink-faint">Optional · PDF only · private storage</p>

              {masterResume ? (
                <div className="mt-5 border-2 border-ink bg-paper px-4 py-3">
                  <p className="font-display text-sm font-black uppercase">Uploaded</p>
                  <p className="mt-1 text-[0.95rem] text-ink-soft">
                    {masterResume.originalFilename}
                  </p>
                </div>
              ) : null}

              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void onUpload(file);
                }}
              />

              <div className="mt-6 flex flex-wrap gap-2">
                <PinkHoverButton
                  variant="ink"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  Upload PDF
                </PinkHoverButton>
                <PinkHoverButton
                  variant="paper"
                  hoverAccent="yellow"
                  disabled={busy}
                  onClick={() => {
                    setError(null);
                    setStep("ready");
                  }}
                >
                  Skip for now
                </PinkHoverButton>
              </div>
              <NavRow
                busy={busy}
                onBack={goBack}
                onContinue={() => void goNext()}
                continueLabel="Continue"
              />
            </Sheet>
          )}

          {step === "ready" && (
            <Sheet tone="paper" shadow="hard" className="relative px-6 py-10 sm:px-10">
              <Tape className="-top-3 left-10" color="blue" angle={-4} width={120} height={26} />
              <Clip className="absolute -top-5 right-12" color="pink" size={52} angle={-8} />
              <h2 className="font-display text-[clamp(2rem,7vw,3.4rem)] font-black uppercase leading-[0.85]">
                You&apos;re set.
              </h2>
              {basics.preferredName.trim() ? (
                <p className="mt-3 text-[1.05rem] text-ink-soft">
                  Nice to meet you, {basics.preferredName.trim()}.
                </p>
              ) : null}
              <ul className="mt-6 space-y-2">
                {summaryBits.length === 0 ? (
                  <li className="tag text-ink-faint">Basics saved — refine anytime in Profile.</li>
                ) : (
                  summaryBits.map((bit) => (
                    <li
                      key={bit}
                      className="border-2 border-ink bg-blue-wash px-3 py-2 font-display text-[0.95rem] font-extrabold uppercase leading-snug"
                    >
                      {bit}
                    </li>
                  ))
                )}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2">
                <PinkHoverButton variant="paper" disabled={busy} onClick={goBack}>
                  Back
                </PinkHoverButton>
                <PinkHoverButton
                  variant="ink"
                  hoverAccent="yellow"
                  disabled={busy}
                  onClick={() => void finish()}
                >
                  Enter The Product Place
                </PinkHoverButton>
              </div>
            </Sheet>
          )}
        </motion.div>

        {error && (
          <p role="alert" className="mt-4 border-2 border-ink bg-pink px-3 py-2 text-sm text-paper">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function NavRow({
  busy,
  onBack,
  onContinue,
  continueLabel,
}: {
  busy: boolean;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap gap-2">
      <PinkHoverButton variant="paper" disabled={busy} onClick={onBack}>
        Back
      </PinkHoverButton>
      <PinkHoverButton variant="ink" hoverAccent="yellow" disabled={busy} onClick={onContinue}>
        {continueLabel}
      </PinkHoverButton>
    </div>
  );
}
