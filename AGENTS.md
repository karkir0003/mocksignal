# AGENTS.md — Agent Operating Guide & Best Practices

This document provides instructions, architectural boundaries, security policies, and development standards for AI coding agents working in the **MockSignal (`interview-feedback`)** repository.

---

## 1. System Architecture & Tech Stack

```text
┌───────────────────────────────────────────────────────────────┐
│                    Client-Side SPA (Vite)                     │
│  React 19 + TypeScript + Tailwind CSS + Lucide + React Router  │
│                     Compiled to ./dist                        │
└──────────────────────────────┬────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│   Cloudflare Worker Edge     ││       Supabase Backend       │
│ - server/index.ts (Worker)   ││ - PostgreSQL (RLS enabled)   │
│ - functions/api/ (Endpoints) ││ - GoTrue Auth (Magic/Google) │
│ - Resend Email Dispatch      ││ - PostgREST API              │
│ - Static SPA Asset Serving   ││ - Security Definer RPCs      │
└──────────────────────────────┘└──────────────────────────────┘
```

### Directory Ownership
- **`src/`**: All frontend React application source code.
  - `components/`: UI components broken down by domain (`admin/`, `common/`).
  - `pages/`: Route-level pages (`HomePage`, `AdminDashboardPage`, `PublicScorecardPage`, `CandidateHistoryPage`, `LoginPage`).
  - `contexts/`: React context providers (`AuthContext`).
  - `lib/`: Core singletons and helpers (`supabase.ts`, `analytics.ts`).
  - `types/`: Shared TypeScript data models and database interface definitions.
  - `test/`: Vitest + React Testing Library test suites.
- **`server/`**: Cloudflare Worker entry point (`server/index.ts`) handling request routing, asset bindings, and SPA fallbacks.
- **`functions/api/`**: Cloudflare Worker API endpoints (e.g. `send-report.ts` for email dispatch via Resend).
- **`supabase/`**:
  - `migrations/`: Authoritative chronological PostgreSQL migrations. **Single source of truth for the database.**
  - `scripts/`: Dynamic tooling (`snapshot.mjs`, `clone.mjs`) for local development and staging without hardcoded credentials.
- **`public/`**: Static public assets (favicons, icons, manifest, robots.txt).

---

## 2. Core Development Standards

### Component & TypeScript Standards
- **Named Functional Components**: Always export named components (`export function ComponentName()`). Avoid default exports.
- **Strict Typing**: Zero tolerance for build-breaking TypeScript errors. Never introduce loose `any` types where models exist in `src/types/`. Always run `yarn typecheck` (`tsc -b`) to verify.
- **URL Search Params for State**: When implementing multi-tab dashboards (e.g. `/admin?tab=questions`), sync active tabs with URL search params so views are shareable and refresh-safe.
- **Icons**: Use `lucide-react` icons. Maintain consistent sizing (`h-4 w-4` for standard buttons, `h-3.5 w-3.5` for compact badges).
- **Styling**: Use utility Tailwind CSS classes matching the clean, modern engineering theme (slate neutral borders, emerald accents for success, blue accents for LLD, purple for AI Coding, amber for warnings).

### UX & Error Handling Patterns
- **Immediate Feedback**: Destructive or async operations must display loading state (e.g., `Loader2` spinner), disable repeated clicks (debounce), and trigger toast notifications (`useToast().success` or `showError`).
- **Confirmation Prompts**: Resetting forms or deleting reusable entities must prompt for confirmation before purging state.

---

## 3. Database & Supabase Migration Standards

### The Migration Lifecycle
1. **Single Source of Truth**: All schema changes MUST be committed as new migration files in `supabase/migrations/` prefixed with a 14-digit timestamp (`YYYYMMDDHHMMSS_description.sql`).
2. **Never Edit Past Applied Migrations**: Once a migration is merged or applied to production, never mutate it. Always create a new forward migration.
3. **Idempotency & Atomicity**:
   - Wrap complex procedural operations inside `DO $$ BEGIN ... END $$;` blocks.
   - Use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, or conditional lookups so migrations can be safely re-run without violating unique constraints.
   - Ensure foreign key updates happen *before* deleting duplicate entities to avoid foreign key restriction errors.
4. **Self-Verifying Assertions**:
   - Embed sanity assertions at the end of the migration block (e.g., `IF count > 0 THEN RAISE EXCEPTION ...`). If any assertion fails, PostgreSQL automatically rolls back the entire transaction.

### Local Development & Testing Workflow
- **One-Command Dev Environment**: `yarn dev:local` boots local Supabase with the latest production snapshot (`supabase/seed.sql`) and synthetic dev users (`supabase/dev-users.sql`), auto-configures `.env.local` dynamically, and launches Vite on `http://localhost:5173`.
- **Pre-Seeded Synthetic Test Accounts (Password: `password123`)**:
  - `admin@mocksignal.local`: Full permissions across `/admin`, rubrics, question bank, and grading.
  - `interviewer@mocksignal.local`: Grader permissions for evaluating sessions.
  - `candidate@mocksignal.local`: Pre-seeded with 2 graded mock interview scorecards (Splitwise & LRU Cache) viewable at `/history`.
- **1-Click Dev Quick-Login**: In development mode, `/login` displays the `<DevQuickLogin />` panel with 1-click authentication buttons for all three roles.
- **Replay from Scratch**: `yarn db:reset` wipes the local database and replays all migrations in `supabase/migrations/` followed by snapshot and dev seeds in chronological order.
- **Snapshot Production**: `yarn db:snapshot` extracts a data-only snapshot of public tables into `supabase/seed.sql` using `.env` credentials dynamically.
- **Local Tooling Endpoints**:
  - **Web App**: `http://localhost:5173`
  - **Supabase Studio UI**: `http://127.0.0.1:54323` (Browse tables and run SQL)
  - **Mailpit Local Mailbox**: `http://127.0.0.1:54324` (Inspect magic links and outgoing emails)
  - **API Gateway**: `http://127.0.0.1:54321` (PostgREST & GoTrue)

---

## 4. Cloudflare Worker & Deployment Rules

### CI & Deployment Triggers (`.github/workflows/ci.yml` & `.github/workflows/deploy.yml`)
CI checks and Cloudflare Worker deployments are decoupled into two workflows:
- **`.github/workflows/ci.yml` (`CI`)**: Runs path-filtered checks in parallel (`validate` for app/build paths and `test-migrations` for `supabase/**`) and uploads the `dist` artifact on `main` pushes when app paths changed.
- **`.github/workflows/deploy.yml` (`Deploy to Cloudflare Workers`)**: Triggers via `workflow_run` only after `CI` succeeds on `main` (reusing the `dist` artifact and skipping deploy if no app paths changed) or manually via `workflow_dispatch`.
- **Triggers Deploy**: Changes to `src/**`, `server/**`, `functions/**`, `public/**`, `index.html`, `wrangler.json`, build dependencies (`package.json`, `vite.config.ts`, etc.), and workflow files (`.github/workflows/ci.yml`, `.github/workflows/deploy.yml`).
- **Does NOT Trigger Deploy**: Changes only to `supabase/**`, `docs/**`, `README.md`, or `.gitignore`.

### Edge Functions (`functions/api/`)
- API endpoints run inside Cloudflare Workers runtime.
- Use the Request/Response Web Standards API.
- Authenticate incoming requests by verifying the Supabase JWT Bearer token against `auth.users` before executing privileged actions.

---

## 5. Security, Privacy & Secret Hygiene

1. **Zero Secret Leaks**:
   - Never hardcode API keys, service role tokens, or private credentials in `.ts`, `.tsx`, `.json`, or `.md` files.
   - Secrets in Cloudflare Workers (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) must be injected via Cloudflare Secrets (`wrangler secret put`) and read via `context.env`.
   - `wrangler.json` must ONLY contain public, non-sensitive variables (`SUPABASE_URL`, publishable anon keys).
2. **Zero Personal Email Exposure**:
   - Never hardcode personal email addresses or personal domains into application code or fallback defaults.
   - Read from `env.RESEND_FROM_EMAIL` with a generic fallback (`MockSignal <onboarding@resend.dev>`).
3. **Sensitive Data in Git**:
   - `supabase/seed.sql` contains real candidate feedback and is explicitly ignored in `.gitignore`. **Never commit seed files containing production PII.**
   - Never commit `.env` or `.env.*.local` files.
   - Never hardcode Supabase project IDs or references in `package.json`. Read dynamically from `VITE_SUPABASE_URL`.

---

## 6. Analytics & Attribution Standards

- **Centralized Tracking**: All user and client interactions must be logged through `trackEvent(eventName, properties)` in `src/lib/analytics.ts`.
- **Event Naming**: Use snake_case names (`evaluation_published`, `tip_button_clicked`, `evaluation_email_resent`, `admin_scorecard_link_copied`).
- **UTM Campaign Tagging**: All external links dispatched in automated emails must include standardized UTM parameters:
  ```text
  ?utm_source=mocksignal&utm_medium=email&utm_campaign=interview_evaluation&utm_content={cta_name}
  ```
- **Resend Tagging**: When dispatching transactional emails via the Resend API, include categorical metadata tags:
  ```json
  "tags": [
    { "name": "category", "value": "feedback_report" },
    { "name": "track", "value": "lld" }
  ]
  ```

---

## 7. Mandatory Pre-Flight Verification Checklist

Before completing any task or committing changes, an agent **MUST ALWAYS** run the following verification pipeline:

```bash
# 1. Typecheck the entire project (client + server + functions)
yarn typecheck

# 2. Run all unit and integration tests
yarn test

# 3. Verify production Vite build & asset bundling
yarn build
```

If ANY step fails, fix the underlying issue immediately before asking the user for review.

---

## 8. Git & Operational Notes

- **Lockfile Errors in Sandbox**: If `git` operations fail with `fatal: Unable to create .git/index.lock: Operation not permitted`, run git commands outside the sandbox with `BypassSandbox: true`.
- **Conventional Commits**: Format commit messages following the Conventional Commits specification:
  - `feat(...)`: New user-facing or backend features.
  - `fix(...)`: Bug fixes or rubric corrections.
  - `ci(...)`: GitHub Actions or workflow adjustments.
  - `chore(...)`: Dependency updates, script cleanups, or refactoring.
  - `docs(...)`: Documentation or specification updates.

