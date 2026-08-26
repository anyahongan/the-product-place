# The Product Place

I'm really big on alliteration, so in short, the Prodct Place is a preppy, personalized product path (PPPP) for discovering roles, preparing for PM recruiting, building product skills, and creating portfolio-ready work.

**Live demo:**  [https://the-product-place.vercel.app/https://the-product-place.vercel.app/https://the-product-place.vercel.app/https://the-product-place.vercel.app/*A](https://the-product-place.vercel.app/)*

---

## What it does

The Product Place connects recruiting workflows and skill-building around one shared profile.

### Apply

- Live product job catalog (Greenhouse, Lever, Ashby, and curated boards)
- Search, filters, and saved roles
- **Ranks Best Match** scoring from your Profile 
- Quick Apply materials and interview prep grounded in Profile facts



### Network

- Company-centric contacts, follow-ups, and conversations
- Outreach drafts (template or optional AI) from your stored facts
- LinkedIn Connections CSV import
- Notes that can inform applications and interview prep



### Learn

- Original PM curriculum: foundations, product sense, metrics, strategy, recruiting prep
- Technical literacy framing for non-engineers
- Glossary, resources, and custom imported lessons



### Practice

- PM drills: open response, multiple choice, and checkbox formats
- Optional AI grading with coach fallback when `OPENAI_API_KEY` is unset
- Mock interview loops with live speaking/audio conversations



### Create

- Portfolio templates: teardown, feature proposal, PRD, experiment plan, 0→1 concept, study worksheets
- Deterministic “Build it” guidance from your notes



### Profile

- Structured recruiting profile and preferences
- Master resume (private Storage bucket)
- Set a library and standard application answers

---



## Why I built it

I very recently realized that product was the space for me, but looking around, felt very behind on informing myself of the space, preparing for interviews, reaching out for coffee chats, and applying for roles. I was getting advice from GitHub, Tik Tok, and Reddit, and wanted to consolidate all this info and tasks into one place- preferably, somewhere cute and colorful.

---



## Tech stack


| Layer         | Technology                                                   |
| ------------- | ------------------------------------------------------------ |
| UI            | React 19, TypeScript, Tailwind CSS 4                         |
| App framework | TanStack Start, TanStack Router, TanStack Query              |
| Build / SSR   | Vite, Nitro                                                  |
| Backend data  | Supabase (Auth, Postgres, Storage, Edge Functions)           |
| Deployment    | Vercel (TanStack Start + Nitro preset)                       |
| Optional AI   | OpenAI API (server-only, for grading and drafting fallbacks) |


Core libraries include Radix UI, Motion, Zod, and `@supabase/supabase-js`.

---



## Architecture

```
JOB INGESTION
  source adapters (Greenhouse, Lever, Ashby, …)
    → normalize / classify product roles
    → dedupe (dedupe_key)
    → server ingest (SUPABASE_SECRET_KEY)
    → canonical jobs catalog in Postgres
    → Apply feed

PERSONALIZATION
  Profile + preferences
    → deterministic Best Match scorer
    → explainable match signals + coverage gates

SKILL LOOP
  Learn (curriculum)
    → Practice (drills + optional AI grade)
    → Create (portfolio templates)

USER DATA
  Supabase Auth
    → private applications, contacts, notes, progress, profile
    → RLS on all personal tables
    → resumes in private Storage bucket (signed URLs)
```

See `[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)` for database setup and `[docs/APPLICATION_TRUTHFULNESS.md](docs/APPLICATION_TRUTHFULNESS.md)` for generation rules.

---

## Screenshots

| Home | Apply |
|------|-------|
| ![Home page](./docs/screenshots/Home%20Page.png) | ![Apply page](./docs/screenshots/Apply%20Page.png) |

| Network | Learn |
|---------|-------|
| ![Network page](./docs/screenshots/Network%20Page.png) | ![Learn page](./docs/screenshots/Learn%20Page.png) |

| Practice | Create |
|----------|--------|
| ![Practice page](./docs/screenshots/Practice%20Page.png) | ![Create page](./docs/screenshots/Create%20Page.png) |

---

## Status (Beta)

The Product Place is an **active beta** with an end-to-end recruiting + skill-building workflow:

- Signed-in users get persistent Apply, Network, Profile, Learn, Practice, and Create data via Supabase
- Job catalog ingestion runs server-side; catalog refresh is manual (no scheduled cron yet)
- Quick Apply prepares materials; **you submit** on employer sites (no auto-submit)
- Optional AI for practice grading, outreach drafts, apply materials, and interview prep

Current areas of exploration:

- Broader early-career job coverage and ingestion scheduling
- Richer portfolio shareability for Create
- Deeper practice and mock-interview tooling

---

## Local setup

**Requirements:** Node.js 20+, npm

```bash
git clone https://github.com/anyahongan/the-product-place.git
cd the-product-place
npm install
cp .env.example .env.local
```

Edit `.env.local`:


| Variable                        | Required for                        | Notes                                       |
| ------------------------------- | ----------------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`             | Auth, catalog reads, personal data  | Browser-safe                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same                                | Browser-safe (anon/publishable key)         |
| `SUPABASE_SECRET_KEY`           | Catalog ingest, server admin writes | **Server only** — never `VITE_`             |
| `SUPABASE_URL`                  | Server scripts                      | Optional; falls back to `VITE_SUPABASE_URL` |
| `OPENAI_API_KEY`                | AI grading / drafting               | Optional                                    |
| `OPENAI_PRACTICE_MODEL`         | AI model override                   | Optional (default `gpt-4o-mini`)            |


Apply Supabase migrations (see `[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)`), then:

```bash
npm run dev          # http://localhost:8080
npm run build        # production build
npx tsc --noEmit     # typecheck
```

**Catalog ingest (optional):** with `SUPABASE_SECRET_KEY` set:

```bash
npm run ingest:catalog
```

---

## Verification

Lightweight verification scripts (not a full unit-test suite):

```bash
npm run verify:matching    # Best Match scoring invariants
npm run verify:ingestion   # job adapter / pipeline checks
npm run verify:learning    # curriculum / template integrity
npx tsc --noEmit
npm run build
```

---

## Data & privacy

- Authentication via Supabase Auth (email/password)
- Personal rows protected by Postgres **Row Level Security**
- Master resume files live in a **private** `resumes` Storage bucket; access via signed URLs when authenticated
- `SUPABASE_SECRET_KEY` and `OPENAI_API_KEY` are **server-only**

---

## AI features (optional)


| Feature                           | Server env       | Fallback                |
| --------------------------------- | ---------------- | ----------------------- |
| Practice grading                  | `OPENAI_API_KEY` | Local coach rubric      |
| Apply materials / interview prep  | `OPENAI_API_KEY` | Profile-aware templates |
| Network outreach (AI format mode) | `OPENAI_API_KEY` | Template drafts         |


AI must not invent employers, metrics, referrals, or experience — see `[docs/APPLICATION_TRUTHFULNESS.md` 

---

## Learning content

Learn lessons and practice prompts in this repo are **original**. Some lessons include `sourceRefs` acknowledging conceptual influence from books such as *Product Management in Practice* (Matt LeMay) and *Cracking the PM Interview* (Gayle McDowell / Lewis C. Lin). No copyrighted text from those books is reproduced.

---

## License

No license file is included yet. Making this repository public on GitHub does **not** grant others permission to copy or reuse the code- default copyright applies until you add a license.

If you intend open reuse, **MIT** is a common choice for portfolio projects; add a `LICENSE` file only when you decide.

---



## Related docs

- `[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)` — migrations, auth, ingestion, storage
- `[docs/APPLICATION_TRUTHFULNESS.md](docs/APPLICATION_TRUTHFULNESS.md)` — rules for generated materials
- `[docs/screenshots/README.md](docs/screenshots/README.md)` — screenshot checklist for the public repo

