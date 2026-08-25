/**
 * Lightweight matching verification (no unit-test framework).
 * Run: npx --yes tsx --tsconfig tsconfig.json scripts/verify-matching.ts
 */

import type { JobListingView } from "../src/lib/apply/types";
import {
  calculateJobMatch,
  matchPercentForSort,
  profileHasMatchInputs,
  TOTAL_POSSIBLE_WEIGHT,
  type JobMatchResult,
} from "../src/lib/matching";
import type { UserProfileBundle } from "../src/types/profile";
import type { EmploymentType, ProductRole, WorkMode } from "../src/types/apply";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function baseJob(overrides: Partial<JobListingView> = {}): JobListingView {
  return {
    id: "job-1",
    company: "Acme",
    title: "Product Management Intern",
    productRole: "Product Management",
    location: "San Francisco, CA",
    workMode: null,
    graduationYears: [],
    employmentType: "internship",
    postedDate: "2026-03-01",
    deadline: null,
    status: "open",
    matchPercent: null,
    source: "test",
    sourceUrl: "https://example.com",
    applicationUrl: "https://example.com/apply",
    description: "Product Management Intern at Acme.",
    responsibilities: [],
    requirements: [],
    tone: "blue",
    closed: false,
    ...overrides,
  };
}

function baseBundle(overrides?: {
  roles?: ProductRole[];
  graduationYear?: number | null;
  employmentTypes?: EmploymentType[];
  workModes?: WorkMode[];
  locations?: string[];
  skills?: string[];
}): UserProfileBundle {
  const roles = overrides?.roles ?? (["Product Management"] as ProductRole[]);
  const employmentTypes = overrides?.employmentTypes ?? (["internship"] as EmploymentType[]);
  const workModes = overrides?.workModes ?? ([] as WorkMode[]);
  const locationLabels = overrides?.locations ?? [];
  const graduationYear =
    overrides && "graduationYear" in overrides ? overrides.graduationYear! : 2027;
  const skills = overrides?.skills ?? [];

  return {
    profile: {
      id: "p1",
      preferredName: "Test",
      school: "State U",
      major: "CS",
      minor: "",
      graduationYear,
      currentLocation: "SF",
      preferredEmail: "",
      phone: "",
      linkedinUrl: "",
      githubUrl: "",
      portfolioUrl: "",
      websiteUrl: "",
      workAuthorizationStatus: "",
      requiresSponsorship: null,
      updatedAt: new Date().toISOString(),
      onboardingCompleted: true,
      onboardingCompletedAt: null,
    },
    targets: {
      roles,
      locations: locationLabels.map((label, i) => ({
        id: `loc-${i}`,
        label,
        sortOrder: i,
      })),
      workModes,
      employmentTypes,
    },
    answers: [],
    masterResume: null,
    experiences: skills.length
      ? [
          {
            id: "e1",
            experienceType: "internship",
            organization: "Past Co",
            title: "PM Intern",
            location: null,
            startDate: null,
            endDate: null,
            isCurrent: false,
            summary: null,
            skills,
            projectUrl: null,
            githubUrl: null,
            caseStudyUrl: null,
            productType: null,
            projectStatus: null,
            sortOrder: 0,
            bullets: [],
            metrics: [],
          },
        ]
      : [],
  };
}

function coverageWeight(result: JobMatchResult): number {
  return Math.round(result.coverage * TOTAL_POSSIBLE_WEIGHT);
}

console.log("\nMatching engine verification\n");

// 1. Perfect role + employment match
{
  console.log("1. Perfect role + employment match");
  const r = calculateJobMatch(baseJob(), baseBundle());
  assert("personalized", r.personalized);
  assert("high score", r.score >= 99, `score=${r.score}`);
  assert("tier strong", r.tier === "STRONG MATCH");
  assert(
    "low coverage → no numeric (sparse)",
    !r.showNumeric,
    `coverage=${r.coverage.toFixed(2)} weight≈${coverageWeight(r)}`,
  );
  const role = r.signals.find((s) => s.type === "role");
  const emp = r.signals.find((s) => s.type === "employment");
  assert("role positive", role?.status === "positive");
  assert("employment positive", emp?.status === "positive");
}

// 2. Multiple target roles
{
  console.log("2. Multiple target roles");
  const r = calculateJobMatch(
    baseJob({ productRole: "Product Design" }),
    baseBundle({ roles: ["Product Management", "Product Design"] }),
  );
  assert("design role matches", r.signals.some((s) => s.type === "role" && s.status === "positive"));
  assert("score high", r.score >= 99);
}

// 3. Explicit graduation mismatch
{
  console.log("3. Explicit graduation mismatch");
  const r = calculateJobMatch(
    baseJob({ graduationYears: [2026] }),
    baseBundle({ graduationYear: 2028 }),
  );
  assert("hard mismatch", r.hardMismatch);
  assert("tier LOW", r.tier === "LOW MATCH");
  assert("no numeric", !r.showNumeric);
  assert(
    "grad negative",
    r.signals.some((s) => s.type === "graduation" && s.status === "negative" && s.hardMismatch),
  );
  assert("score capped low", r.score < 50, `score=${r.score}`);
}

// 4. Unknown graduation year
{
  console.log("4. Unknown graduation year");
  const r = calculateJobMatch(baseJob({ graduationYears: [] }), baseBundle({ graduationYear: 2027 }));
  const g = r.signals.find((s) => s.type === "graduation");
  assert("grad unknown", g?.status === "unknown");
  assert("grad not in denominator", g?.available === false);
  assert("score not reduced by unknown", r.score >= 99);
}

// 5. Unknown work mode
{
  console.log("5. Unknown work mode");
  const r = calculateJobMatch(
    baseJob({ workMode: null }),
    baseBundle({ workModes: ["remote", "hybrid"] }),
  );
  const wm = r.signals.find((s) => s.type === "workMode");
  assert("work mode unknown visible", wm?.status === "unknown");
  assert("work mode excluded from denom", wm?.available === false);
  assert("score still high", r.score >= 99);
}

// 6. Remote-only vs explicit in-person
{
  console.log("6. Remote-only vs explicit in-person");
  const r = calculateJobMatch(
    baseJob({ workMode: "in-person", location: "New York, NY" }),
    baseBundle({ workModes: ["remote"] }),
  );
  assert("hard mismatch on work mode", r.hardMismatch);
  assert(
    "work mode negative",
    r.signals.some((s) => s.type === "workMode" && s.status === "negative"),
  );
  assert("tier LOW", r.tier === "LOW MATCH");
}

// 7. Preferred-location match
{
  console.log("7. Preferred-location match");
  const r = calculateJobMatch(
    baseJob({ location: "San Francisco, CA" }),
    baseBundle({ locations: ["San Francisco"] }),
  );
  assert(
    "location positive",
    r.signals.some((s) => s.type === "location" && s.status === "positive"),
  );
}

// 8. Missing Profile preferences
{
  console.log("8. Missing Profile preferences");
  const empty = baseBundle({
    roles: [],
    graduationYear: null,
    employmentTypes: [],
    workModes: [],
    locations: [],
    skills: [],
  });
  assert("profileHasMatchInputs false", !profileHasMatchInputs({
    roles: empty.targets.roles,
    graduationYear: empty.profile.graduationYear,
    employmentTypes: empty.targets.employmentTypes,
    workModes: empty.targets.workModes,
    locations: empty.targets.locations,
    skills: [],
  }));
  const r = calculateJobMatch(baseJob(), empty);
  assert("not personalized", !r.personalized);
  assert("matchPercent null", matchPercentForSort(r) === null);
}

// 9. Skill overlap
{
  console.log("9. Skill overlap");
  const r = calculateJobMatch(
    baseJob({
      title: "PM Intern — Analytics & Figma",
      description: "Use product analytics and Figma daily.",
    }),
    baseBundle({ skills: ["Analytics", "Figma", "SQL"] }),
  );
  assert(
    "skill positive",
    r.signals.some((s) => s.type === "skill" && s.status === "positive" && s.available),
  );
}

// 10. Sparse job with only role/employment data
{
  console.log("10. Sparse job with only role/employment data");
  const r = calculateJobMatch(
    baseJob({
      workMode: null,
      graduationYears: [],
      location: "Location not specified",
      description: "",
    }),
    baseBundle({
      workModes: ["remote"],
      locations: ["Remote"],
      graduationYear: 2027,
      skills: ["SQL"],
    }),
  );
  assert("available signals ≤ 2", r.availableSignalCount <= 2, `count=${r.availableSignalCount}`);
  assert("showNumeric false", !r.showNumeric);
  assert("tier still STRONG when aligned", r.tier === "STRONG MATCH");
  assert("unknown signals present", r.signals.some((s) => s.status === "unknown"));
}

// 11. High match but low coverage
{
  console.log("11. High match but low coverage");
  const r = calculateJobMatch(baseJob(), baseBundle());
  assert("score ≥ 85", r.score >= 85);
  assert("coverage < 0.55", r.coverage < 0.55, `coverage=${r.coverage}`);
  assert("false precision blocked", !r.showNumeric);
}

// 12. Missing fields do not become negative signals
{
  console.log("12. Missing fields do not become negative");
  const r = calculateJobMatch(
    baseJob({ workMode: null, graduationYears: [] }),
    baseBundle({ workModes: ["hybrid"], graduationYear: 2027 }),
  );
  assert(
    "no negative for unknown grad/work",
    !r.signals.some(
      (s) =>
        (s.type === "graduation" || s.type === "workMode") && s.status === "negative",
    ),
  );
  assert(
    "unknowns exist",
    r.signals.filter((s) => s.status === "unknown").length >= 2,
  );
}

// 13. Deterministic Best Match sorting
{
  console.log("13. Deterministic Best Match sorting");
  const bundle = baseBundle({
    roles: ["Product Management", "Product Design"],
    locations: ["San Francisco"],
    workModes: ["hybrid"],
    skills: ["Figma"],
  });
  const jobs = [
    baseJob({
      id: "a",
      productRole: "Product Design",
      postedDate: "2026-01-01",
      workMode: "hybrid",
      location: "San Francisco, CA",
      title: "Design Intern Figma",
      description: "Figma heavy role",
    }),
    baseJob({
      id: "b",
      productRole: "Product Management",
      postedDate: "2026-02-01",
      workMode: "hybrid",
      location: "San Francisco, CA",
      title: "PM Intern",
      description: "General PM",
    }),
    baseJob({
      id: "c",
      productRole: "Growth Product",
      postedDate: "2026-03-01",
      workMode: "remote",
      location: "Remote",
    }),
  ].map((j) => {
    const result = calculateJobMatch(j, bundle);
    return { ...j, matchPercent: matchPercentForSort(result), matchResult: result };
  });

  const sorted = [...jobs].sort((a, b) => {
    const am = a.matchPercent ?? -1;
    const bm = b.matchPercent ?? -1;
    if (bm !== am) return bm - am;
    const dateCmp = (b.postedDate ?? "").localeCompare(a.postedDate ?? "");
    if (dateCmp !== 0) return dateCmp;
    return a.id.localeCompare(b.id);
  });

  const again = [...jobs].sort((a, b) => {
    const am = a.matchPercent ?? -1;
    const bm = b.matchPercent ?? -1;
    if (bm !== am) return bm - am;
    const dateCmp = (b.postedDate ?? "").localeCompare(a.postedDate ?? "");
    if (dateCmp !== 0) return dateCmp;
    return a.id.localeCompare(b.id);
  });

  assert(
    "sort stable / deterministic",
    sorted.map((j) => j.id).join(",") === again.map((j) => j.id).join(","),
  );
  assert(
    "higher match sorts first (or equal then date)",
    (sorted[0]!.matchPercent ?? -1) >= (sorted[1]!.matchPercent ?? -1),
  );
  assert(
    "role mismatch ranks lower",
    (jobs.find((j) => j.id === "c")!.matchPercent ?? 0) <
      (jobs.find((j) => j.id === "b")!.matchPercent ?? 100),
  );
}

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
