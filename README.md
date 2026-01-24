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

### Wireframes (Day 2 MVP)
- **Home / Question List**
  - Top bar: product name, notifications bell, “Sign in” / user menu.
  - Main content: search bar + tag filter row; below that, a vertical list of `QuestionCard`s showing status pill, title, short description, tags, author, time, and answer count; primary CTA “Ask Question”.
- **Ask Question**
  - Simple form with three blocks: title input, long description textarea, tag picker (2–4 predefined tags) plus inline character counters; footer buttons “Post question” (primary) and “Cancel”.
- **Question Detail**
  - Header: status pill (Open/Active/Resolved), tags, title, optional “Mark resolved / Reopen” button for author/manager.
  - Body: description, ask/updated meta, then “Answers” list (each answer with vote widget, content, author, created-at, comments), and at bottom a “Your Answer” card with editor and submit button.
- **Auth (OTP)**
  - Step 1: small centered card, email input + “Continue”.
  - Step 2: six-digit code input (and optional name for new users), “Sign in” button, link to “Use different email”.
- **Notifications**
  - List of cards, each line like “Alice answered your question”, timestamp, “View” + “Mark read”; unread items highlighted with a left border.


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


