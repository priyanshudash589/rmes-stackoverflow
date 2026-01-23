# RMES Internal Q&A – Daily Log

This README tracks day-by-day progress for the internal Stack Overflow MVP.

## Day 1
- Documented MVP scope, principles, tagging model, search, and SDLC touchpoints in `day1.md`.
- Chose custom build: Next.js fullstack + Postgres + Prisma; local accounts for auth.
- Produced implementation plan (architecture, data model, flows, search approach, integrations, execution checklist) appended to `day1.md` section 8.
### Prompt Review (Day 1)
- Score: 3/10
- Risks: Placeholder lacks actual prompt; unclear audience, tone, length, and edit permissions.
- Missing: Real prompt text, audience/purpose, length/tone, scope, success criteria, tooling/autonomy rules.
- Add: Provide the exact prompt; specify audience, tone, length, scope limits, success criteria, and edit/tool permissions.
- Remove/simplify: The placeholder; redundant “append” wording without clear location.
- Rewritten template: See “A rewritten, improved version of the prompt” in the analysis.


## Day 2
- Implemented a full Next.js (App Router) app with Tailwind and Prisma, wired to the existing Postgres instance using the OTP-based email auth defined in `.env.local`.
- Built the core Q&A flows from `day2.md`: question creation with 2–4 predefined tags, answers, clarification comments (non-threaded), upvote-only voting, soft resolution (`OPEN → ACTIVE → RESOLVED`), and in-app notifications.
- Added search, tag filtering, and status-based sorting on the home page, plus ask-question, question-detail (with answers/comments/votes), notifications, and login screens.
- Seeded the database with a manager, a regular user, and sample questions/answers to make the environment usable immediately on `npm run dev`.

### Issues Encountered (Day 2)
- **Multiple dev ports (3000 & 3001)**: Two `npm run dev` processes (Windows + WSL) were running; Next.js automatically bound the second server to 3001. Resolved by keeping only a single dev server.
- **Prisma env config**: The initial `.env.local` used `DB_*` variables only. Prisma required `DATABASE_URL`, so we added a Postgres connection string and a dedicated `.env` (mirroring `.env.local`) for CLI use.
- **Existing DB schema drift**: The database already had tables/indexes from raw SQL (e.g., `idx_comments_parent`). `prisma db push` failed until we synced Prisma’s schema to the actual DB and accepted data-loss to let Prisma own the schema.
- **Font import error**: Using `Geist` (Vercel font) without the proper package caused a `next/font` error. Fixed by switching to built-in Google fonts (`Inter`, `JetBrains_Mono`) and aligning Tailwind font variables.

### Prompt Review (Day 2)
- **Score**: 7/10
- **Strengths**: Domain model and workflows in `day2.md` are precise (roles, states, notification triggers); constraints are clear (no gamification / accepted answers); expectations for data models + APIs + notifications are well specified.
- **Gaps**:
  - Implementation details for auth were under-specified; we had to choose OTP + sessions and map it onto the existing `auth_*` tables.
  - Search section describes FTS conceptually but not the exact indexing strategy or fallback when FTS isn’t fully wired (we used Prisma `contains` for now on the UI side).
  - `user_points` / leaderboard tables exist in SQL even though gamification is “out of scope”, which can confuse ownership and future migrations.
- **Improvements for future prompts**:
  - Call out the chosen auth mechanism explicitly (e.g., “OTP via email using these env vars; session cookie name X; protected routes list Y”).
  - Clarify whether FTS must be implemented via Postgres `tsvector` indexes in this phase vs. allowing a simpler `ILIKE`/`contains` search as an interim.
  - Either fully remove out-of-scope tables from the “current phase” schema or move them into a clearly labeled “future_sql.sql” to avoid Prisma/DB drift.


