# Application-material truthfulness

Future Quick Apply, resume tailoring, cover-letter drafting, and interview-prep
features in The Product Place **must** treat the structured profile as a fact bank.

## Allowed

Application-generation features may:

- select relevant user facts from Profile / Experience Library / Network insights
- reorganize facts
- summarize facts the user already stored
- suggest wording based only on stored facts

## Forbidden

They may **not**:

- invent experiences
- invent employers
- invent job titles
- invent responsibilities
- invent metrics
- invent technologies / skills
- invent referrals
- invent conversations
- invent education credentials

## Source hierarchy

1. **Experience Library** (`experiences` + `experience_bullets` + optional metrics) — primary factual source  
2. **Standard application answers** — user-authored Q/A only  
3. **Master resume PDF** — reference context; never auto-trusted as structured fact until a future user-confirmed import flow  
4. **Network insights** — only notes the user marked for application materials / interview prep  

Uploaded resumes are **not** automatically converted into trusted Experience Library rows.
A future parser may propose candidate records; the user must review and confirm before anything becomes fact.
