# Cursor Agent Prompt — Internal Q&A Platform (Phase 1)

## Role & Context
Act as a **Senior Backend + Product Engineer** building an **internal, self-hosted Q&A platform** (StackOverflow-inspired) for an organization. The system is for **internal knowledge sharing**, optimized for **clarity, low friction, and scalability**.

---

## Objective
Implement a **pure Q&A workflow** with:
- Questions
- Multiple ( answers )Comments & clarifications
- Upvote-only voting
- Soft resolution state
- In-app notifications

### Explicitly Out of Scope
- Accepted answers
- Documentation generation
- Reputation, badges, or gamification
- Downvotes
- Email / external notifications

---

## Core Design Principles
1. Open discussion first (no early hard decisions)
2. Signal over authority (votes, not correctness)
3. Searchable by default (tags + text)
4. Low governance overhead (managers moderate only)
5. Clean upgrade path for future phases

---

techstack: next js, prisma, POstgres setup already done for the existing table below. 

## Domain Model (Conceptual)

### User
- `id`
- `name`
- `role` → `USER | MANAGER`

### Question
- `id`
- `title`
- `description`
- `tags[]` (predefined, max 3–5)
- `status` → `OPEN | ACTIVE | RESOLVED`
- `created_by`
- `created_at`
- `updated_at`

### Answer
- `id`
- `question_id`
- `content`
- `created_by`
- `vote_count`
- `created_at`
- `updated_at`

### Comment
- `id`
- `parent_type` → `QUESTION | ANSWER`
- `parent_id`
- `content`
- `created_by`
- `created_at`

### Vote
- `id`
- `entity_type` → `ANSWER | COMMENT`
- `entity_id`
- `user_id`

### Notification
- `id`
- `recipient_id`
- `actor_id`
- `action_type`
- `entity_type`
- `entity_id`
- `is_read`
- `created_at`

---

## Workflow Logic (Authoritative)

### 1. Question Creation
- Any authenticated user can create a question
- User must select 2–4 predefined tags
- Set:



### 2. Answering Phase
- Any user can add answers
- Multiple answers allowed
- No answer is final
- Sort answers by:
1. Vote count
2. Recent activity
3. Creation time

### 3. Comments & Clarifications
- Users can comment on questions and answers
- Comments are for clarification only
- Long explanations must be answers

### 4. Voting Logic (Upvote-Only)
- Users can upvote answers and comments
- One vote per user per entity
- Votes affect ordering only
- No downvotes, no reputation

### 5. Editing & Refinement
- Users edit their own content
- Managers can edit any content (moderation)
- Update `updated_at`
- Optional edit history

### 6. Resolution Logic (Soft Closure)
- A question can be marked `RESOLVED` by:
- Question author, or
- Manager
- Condition: at least one answer exists
- Semantics:
- Discussion is mature
- Content remains editable
- No canonical answer implied



---

## In-App Notification System

### Principles
- Notify only affected users
- Never notify the actor themselves
- One action = one notification
- In-app only

### Trigger → Recipient Mapping
| Action | Recipient |
|------|-----------|
| New answer added | Question author |
| Comment on answer | Answer author |
| Reply to comment | Comment author |
| Upvote | Content owner |
| Edit by another user | Content owner |
| Mark resolved | Question author + all answer authors |

### Notification Payload
- `recipient_id`
- `actor_id`
- `action_type`
- `entity_type`
- `entity_id`
- `created_at`
- `is_read`

---

## Search & Discovery (Baseline)
- Full-text search on:
  - Question titles
  - Question descriptions
  - Answers
- Filter by tags
- Default sort priority:
  1. Resolved questions
  2. Active questions
  3. Open questions

---

## Constraints & Guardrails
- Do not implement accepted answers
- Do not implement documentation workflows
- Do not implement gamification
- Do not implement external notifications
- Keep architecture extensible for future phases

---

## Expected Output
Provide:
- Data models
- API endpoints
- Business rules
- State handling
- Event-driven notification logic
- Clean, maintainable structure

---

## Future Evolution (Not Implemented Now)
Design must allow later extension to:


Tables created

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'MANAGER')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AUTH: ACCOUNTS (CREDENTIALS)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- ============================================================
-- AUTH: SESSIONS (SESSION-BASED LOGIN)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'ACTIVE', 'RESOLVED')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COMMENTS (POLYMORPHIC: QUESTION / ANSWER)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_type VARCHAR(20) NOT NULL CHECK (parent_type IN ('QUESTION', 'ANSWER')),
    parent_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VOTES (UPVOTE-ONLY)
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('ANSWER', 'COMMENT')),
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (entity_type, entity_id, user_id)
);

-- ============================================================
-- NOTIFICATIONS (IN-APP)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES (PERFORMANCE)
-- ============================================================

-- Auth
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token
ON auth_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry
ON auth_sessions(expires_at);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_status
ON questions(status);

CREATE INDEX IF NOT EXISTS idx_questions_tags
ON questions USING GIN (tags);

-- Answers
CREATE INDEX IF NOT EXISTS idx_answers_question
ON answers(question_id);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_parent
ON comments(parent_type, parent_id);

-- Votes
CREATE INDEX IF NOT EXISTS idx_votes_entity
ON votes(entity_type, entity_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
ON notifications(recipient_id, is_read);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_updated ON questions;
CREATE TRIGGER trg_questions_updated
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_answers_updated ON answers;
CREATE TRIGGER trg_answers_updated
BEFORE UPDATE ON answers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEADERBOARD / USER POINTS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points > 0),
    reason VARCHAR(50) NOT NULL,
    entity_type VARCHAR(20),
    entity_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES (IMPORTANT FOR LEADERBOARD QUERIES)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_points_user
ON user_points(user_id);

CREATE INDEX IF NOT EXISTS idx_user_points_created
ON user_points(created_at);

CREATE INDEX IF NOT EXISTS idx_user_points_reason
ON user_points(reason);

-- ============================================================
-- OPTIONAL: PREVENT SELF-REWARD (APP LAYER ENFORCED)
-- =


 List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | answers       | table | postgres
 public | auth_accounts | table | postgres
 public | auth_sessions | table | postgres
 public | comments      | table | postgres
 public | notifications | table | postgres
 public | questions     | table | postgres
 public | users         | table | postgres
 public | votes         | table | postgres
 public | user_points   | table | postgres 



------------------------------------------------------------

# Cursor Agent Prompt — Internal Q&A Platform (Phase 1)

## Role & Context
Act as a Senior Backend + Product Engineer building an internal, self-hosted Q&A platform (StackOverflow-inspired) for internal knowledge sharing. Stack: Next.js, Prisma, Postgres (already provisioned).

## Objective
Implement a pure Q&A workflow with:
- Questions
- Answers + clarification comments
- Upvote-only voting
- Soft resolution state
- In-app notifications

Out of scope: accepted answers, documentation, reputation/badges/gamification, downvotes, external/email notifications.

## Domain Model (Authoritative)
- User: id, name, role (`USER | MANAGER`), created_at
- Question: id, title, description, tags[] (predefined, 2–4), status (`OPEN | ACTIVE | RESOLVED`), created_by, created_at, updated_at
- Answer: id, question_id, content, created_by, vote_count, created_at, updated_at
- Comment: id, parent_type (`QUESTION | ANSWER`), parent_id, content, created_by, created_at  (no threading; comments attach only to Q/A)
- Vote: id, entity_type (`ANSWER | COMMENT`), entity_id, user_id, created_at  (unique per user/entity; upvote-only)
- Notification: id, recipient_id, actor_id, action_type, entity_type, entity_id, is_read, created_at

## Workflow Logic
### Question Creation
- Any authenticated user
- Must provide: title, description, 2–4 tags (from whitelist)
- Default status: `OPEN`

### Status Lifecycle
- `OPEN` → `ACTIVE` when first answer is posted (automatic)
- `ACTIVE` → `RESOLVED` when author or manager marks resolved; requires ≥1 answer
- `RESOLVED` → `ACTIVE` (reopen) by author or manager
- All states keep content editable

### Answering
- Any authenticated user
- Multiple answers allowed
- Ordering: vote_count desc → updated_at desc → created_at asc

### Comments
- Clarifications only; short-form
- No nesting (comment targets a question or an answer)
- Ordering: created_at asc (or updated_at desc if edited)

### Voting (Upvote-only)
- One vote per user per entity (enforced by unique constraint)
- Applies to answers and comments
- `answers.vote_count` maintained transactionally when inserting/deleting votes

### Editing & Permissions
- Users can edit their own content
- Managers can edit any content
- updated_at auto-updates on question/answer edits

### Resolution
- Allowed actors: question author or manager
- Preconditions: question has ≥1 answer
- Reopen allowed by same actors

## Notifications (In-app)
Principles: notify affected users only; never the actor; one action = one notification.
Enum suggestions:
- action_type: `ANSWER_ADDED`, `COMMENT_ADDED`, `UPVOTE`, `EDITED`, `MARK_RESOLVED`, `MARK_REOPENED`
- entity_type: `QUESTION`, `ANSWER`, `COMMENT`, `VOTE`
Triggers → Recipients:
- New answer on question → question author
- Comment on answer → answer author
- Comment on question → question author
- Upvote on answer/comment → content owner
- Edit by another user → content owner
- Mark resolved → question author + all answer authors
- Mark reopened → question author
Mark-read endpoint toggles `is_read`.

## Search & Discovery
- Postgres FTS on question.title, question.description, answer.content (tsvector)
- Filter by tags (GIN on tags array)
- Default sort: `RESOLVED` first, then `ACTIVE`, then `OPEN`; within each, recent activity desc

## API Surface (auth required unless noted)
- POST /auth/login (session issuance)
- POST /questions
- GET /questions?search=&tags[]=…&status=
- GET /questions/:id
- POST /questions/:id/answers
- POST /questions/:id/resolve (author/manager; requires ≥1 answer)
- POST /questions/:id/reopen (author/manager)
- POST /comments (body includes parent_type, parent_id)
- POST /votes (entity_type, entity_id) — idempotent; second call is no-op
- DELETE /votes (entity_type, entity_id) — optional if you want unvote
- GET /notifications
- POST /notifications/:id/mark-read
- POST /notifications/mark-all-read

## Validation & Limits
- title: 5–150 chars; description: max 10k
- answer: max 10k; comment: max 1k
- tags: must be from predefined list; 2–4 required
- Reject empty/whitespace-only content

## Data Model Cleanups
- Keep `user_points/leaderboard` out (gamification is out of scope) — capture it in a “Future Enhancements” note instead.

## Implementation Notes
- Keep `update_updated_at` trigger on questions and answers.
- Maintain `answers.vote_count` via transactional increments/decrements when votes change.
- Use the existing `votes` unique constraint to enforce a single upvote per user/entity.

## Day 2 Implementation Deliverables
- Build CRUD for questions, answers, and comments with the specified validation rules (tags 2–4, length limits, non-empty content).
- Trigger `OPEN` → `ACTIVE` on the first answer and allow author/manager to mark `RESOLVED` or reopen, enforcing the ≥1 answer precondition.
- Implement upvote-only voting via the `votes` table and keep `answers.vote_count` synchronized.
- Assemble the notification pipeline for answers, comments, edits, upvotes, resolutions, and reopen events, plus mark-read endpoints.
- Expose search/filter endpoints using Postgres FTS on question/answer text, tag filtering, and status-prioritized sorting.

## Existing Workflow
 - User logs in via session-based auth and lands on a question list sorted by resolution status and recent activity.
 - Creating a question requires a title, description, and 2–4 predefined tags; it stays `OPEN` until engagement.
 - Adding the first answer automatically flips the status to `ACTIVE`; each answer/comment can be edited by its owner or any manager, with `updated_at` refreshed.
 - Comments are short clarifications tied directly to a question or answer (no threading); voting applies only to answers/comments.
 - Each vote updates `answers.vote_count` so sorting relies on that aggregated value plus recency.
 - Notifications are generated for the question author and answer/comment owners based on actions (answers, comments, edits, upvotes, resolve/reopen) and can be marked read.
 - Managers and question authors can mark a question `RESOLVED` only when at least one answer exists, and reopen it if discussion continues.
 - Search and filtering combine Postgres FTS on the textual fields with tag-based filtration to keep discovery fast.

## Visualized Workflow
```
User → [Login / Session] → [Question feed (Resolved → Active → Open)]
           ↓                            ↓
     (session established)        question creation
                                   ↓
                         Created question (OPEN, requires tags)
                                   ↓
     Answers/Comments → Vote/Comment → Status updates + notifications
                                   ↓
                        First answer → Status=ACTIVE
                                   ↓
                   Author/Manager (resolve/reopen)
                                   ↓
                        Notifications clients + read marks
```