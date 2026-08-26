import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clip, Sheet, Tab, Tape } from "@/components/paper/Paper";
import { Reveal } from "@/components/paper/Reveal";
import { ApplicationProgress } from "@/components/apply/ApplicationProgress";
import { NetworkInsightsPanel } from "@/components/apply/NetworkInsightsPanel";
import { useApplyContext } from "@/components/apply/useApplyContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRecruiting } from "@/components/recruiting/useRecruiting";
import { notesForInterviewPrep } from "@/lib/recruiting/selectors";
import { applicationToInterviewItem } from "@/lib/apply/interviewFromApplication";
import { generateInterviewPrepFn } from "@/lib/apply/generateInterviewPrep.server";
import { generateInterviewPrepLocally } from "@/lib/apply/generateInterviewPrep";
import { formatInterviewWhen } from "@/data/apply";
import { cn } from "@/lib/utils";
import type { InterviewItem, PrepModule, PrepModuleId } from "@/types/apply";

type PrepCacheEntry = {
  modules: PrepModule[];
  source: "ai" | "coach";
};

export function InterviewWorkspace({
  focusApplicationId,
}: {
  focusApplicationId?: string;
}) {
  const { interviewingApps, hydrated, jobs } = useApplyContext();
  const { user } = useAuth();
  const { notes, contacts } = useRecruiting();
  const interviews = useMemo(
    () => interviewingApps.map(applicationToInterviewItem),
    [interviewingApps],
  );

  const [openId, setOpenId] = useState<string | null>(focusApplicationId ?? null);
  const [moduleId, setModuleId] = useState<PrepModuleId>("product-sense");
  const [prepCache, setPrepCache] = useState<Record<string, PrepCacheEntry>>({});
  const [prepBusy, setPrepBusy] = useState<string | null>(null);
  const loadedPrepRef = useRef(new Set<string>());

  useEffect(() => {
    if (focusApplicationId) setOpenId(focusApplicationId);
  }, [focusApplicationId]);

  useEffect(() => {
    if (!openId || loadedPrepRef.current.has(openId)) return;
    const app = interviewingApps.find((a) => a.applicationId === openId);
    if (!app) return;
    loadedPrepRef.current.add(openId);
    const job = jobs.find((j) => j.id === app.jobId);

    setPrepBusy(openId);
    const load = user
      ? generateInterviewPrepFn({
          data: {
            userId: user.id,
            jobId: app.jobId,
            company: app.company,
            title: app.title,
            description: job?.description ?? "",
            responsibilities: job?.responsibilities ?? [],
          },
        })
      : Promise.resolve(
          generateInterviewPrepLocally({
            company: app.company,
            title: app.title,
            description: job?.description ?? "",
            responsibilities: job?.responsibilities ?? [],
            profile: null,
            experiences: [],
            networkInsights: notesForInterviewPrep(notes, app.applicationId).map((note) => ({
              text: note.text,
              contactName: contacts.find((c) => c.id === note.contactId)?.name ?? null,
            })),
          }),
        );

    void load
      .then((result) => {
        setPrepCache((prev) => ({ ...prev, [openId]: result }));
      })
      .finally(() => setPrepBusy(null));
  }, [openId, interviewingApps, jobs, user, notes, contacts]);

  return (
    <div className="space-y-8">
      <Reveal from="up" distance={40}>
        <div>
          <Tab color="blue">Interview prep</Tab>
          <h2 className="mt-3 font-display text-[clamp(2rem,6.5vw,3.8rem)] font-black uppercase leading-[0.84]">
            You have an interview.
            <br />
            <span className="text-blue">Let&apos;s prepare for this role.</span>
          </h2>
          <p className="mt-4 text-[1.02rem] text-ink-soft md:whitespace-nowrap">
            Role-specific prep modules from your Profile, the job posting, and Network insights.
          </p>
        </div>
      </Reveal>

      <div className="mx-auto max-w-[42rem] space-y-4">
        {!hydrated ? (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.3rem] font-black uppercase">Loading interviews</p>
          </Sheet>
        ) : interviews.length === 0 ? (
          <Sheet tone="paper-2" shadow="hard-sm" className="px-6 py-10">
            <p className="font-display text-[1.3rem] font-black uppercase">No interviews yet</p>
            <p className="mt-2 text-ink-soft">
              Move an application to Recruiter Screen, Interviewing, or Final Round to see it here.
            </p>
          </Sheet>
        ) : (
          interviews.map((item, i) => {
            const modules = prepCache[item.applicationId]?.modules ?? item.modules;
            const prepSource = prepCache[item.applicationId]?.source;
            return (
              <InterviewCard
                key={item.id}
                item={{ ...item, modules }}
                index={i}
                active={openId === item.applicationId}
                moduleId={moduleId}
                prepBusy={prepBusy === item.applicationId}
                {...(prepSource ? { prepSource } : {})}
                insights={notesForInterviewPrep(notes, item.applicationId).map((note) => ({
                  note,
                  contact: contacts.find((c) => c.id === note.contactId),
                }))}
                onModule={setModuleId}
                onToggle={() => {
                  if (openId === item.applicationId) {
                    setOpenId(null);
                    return;
                  }
                  setOpenId(item.applicationId);
                  setModuleId("product-sense");
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function InterviewCard({
  item,
  index,
  active,
  moduleId,
  prepBusy,
  prepSource,
  insights,
  onModule,
  onToggle,
}: {
  item: InterviewItem;
  index: number;
  active: boolean;
  moduleId: PrepModuleId;
  prepBusy: boolean;
  prepSource?: "ai" | "coach";
  insights: { note: import("@/types/network").NetworkNote; contact: import("@/types/network").NetworkContact | undefined }[];
  onModule: (id: PrepModuleId) => void;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const mod = item.modules.find((m) => m.id === moduleId) ?? item.modules[0];
  const tone = item.tone === "purple" ? "blue" : item.tone;

  return (
    <Reveal from="left" distance={70} rotate={-1.5} delay={index * 0.06}>
      <div
        className={cn(
          "focus-within:ring-2 focus-within:ring-ink focus-within:ring-offset-2 focus-within:ring-offset-paper",
          active && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
        )}
      >
        <Sheet
          tone={tone}
          soft
          shadow="hard-sm"
          edge="corner-cut"
          tilt={index % 2 ? 0.5 : -0.5}
          className="relative px-5 py-5"
        >
          <Tape className="-right-3 top-4" color={tone} angle={90} width={50} height={22} />

          <motion.button
            type="button"
            onClick={onToggle}
            aria-expanded={active}
            whileHover={reduced ? {} : { x: 5 }}
            className="focus-ink w-full text-left outline-none"
          >
            <p className="tag text-ink-faint">{item.stage}</p>
            <h3 className="mt-1 font-display text-[1.45rem] font-black">{item.company}</h3>
            <p className="mt-1 text-[0.95rem] text-ink-soft">{item.role}</p>
            <p className="tag mt-3 text-ink">{formatInterviewWhen(item.datetime)}</p>
            <div className="mt-4">
              <ApplicationProgress
                current={item.progressStage}
                reached={
                  item.progressStage === "Final"
                    ? ["Submitted", "Recruiter Screen", "Interview", "Final"]
                    : item.progressStage === "Offer"
                      ? ["Submitted", "Recruiter Screen", "Interview", "Final", "Offer"]
                      : ["Submitted", "Recruiter Screen", "Interview"]
                }
              />
            </div>
          </motion.button>

          <AnimatePresence initial={false}>
            {active && mod && (
              <motion.div
                initial={reduced ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="relative mt-6 border-t-2 border-ink pt-5">
                  <Clip className="absolute -top-7 right-2" color="purple" size={44} />

                  <p className="tag text-ink-soft">Preparing for</p>
                  <h4 className="mt-1 font-display text-[1.35rem] font-black uppercase leading-[0.9]">
                    {item.company}
                  </h4>
                  <p className="mt-1 text-[0.95rem] text-ink-soft">{item.role}</p>

                  <div
                    role="tablist"
                    aria-label="Prep modules"
                    className="mt-5 flex flex-wrap gap-2"
                  >
                    {item.modules.map((m) => {
                      const selected = m.id === mod.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => onModule(m.id)}
                          className={cn(
                            "focus-ink border-2 border-ink px-2.5 py-1.5 font-display text-[0.72rem] font-black uppercase outline-none sm:text-xs",
                            selected ? "bg-purple text-paper" : "bg-paper hover:bg-purple-wash",
                          )}
                        >
                          {m.title}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mod.id}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
                      className="mt-5 border-2 border-ink bg-purple-wash px-4 py-5"
                    >
                      <h5 className="font-display text-[1.15rem] font-black uppercase">
                        {mod.title}
                      </h5>
                      <p className="mt-3 text-[1.02rem] leading-snug text-ink">{mod.prompt}</p>
                      <ul className="mt-4 space-y-2">
                        {mod.bullets.map((b) => (
                          <li key={b} className="flex gap-3 text-[0.95rem] text-ink-soft">
                            <span
                              aria-hidden
                              className="mt-[0.4rem] h-2.5 w-2.5 shrink-0 bg-purple"
                            />
                            {b}
                          </li>
                        ))}
                      </ul>
                      <p className="tag mt-5 text-ink-faint">
                        {prepBusy
                          ? "Building role-specific prep…"
                          : prepSource
                            ? `Prep source: ${prepSource === "ai" ? "AI" : "Coach"} · facts from Profile + posting`
                            : "Open to load tailored prep"}
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <NetworkInsightsPanel
                    insights={insights}
                    title="Insights from your network"
                    emptyLabel="No interview insights yet. Mark notes USE FOR INTERVIEW PREP on related contacts."
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Sheet>
      </div>
    </Reveal>
  );
}
