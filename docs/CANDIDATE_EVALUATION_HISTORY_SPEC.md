# Searchable Session History & Candidate Filter Spec

**Issue**: [karkir0003/mocksignal#9](https://github.com/karkir0003/mocksignal/issues/9)  
**Route**: `/history` ([`CandidateHistoryPage.tsx`](../src/pages/CandidateHistoryPage.tsx))

---

## 1. Problem

1. **No search on `/history`**: Both candidates and staff see an unsearchable card list of sessions, making it hard to find past evaluations by question, track, verdict, or candidate.
2. **Misleading stats for staff**: On `/history`, staff RLS (`is_staff()`) returns evaluations across *all* candidates, so aggregating them into summary cards mixes unrelated candidates together. Staff need candidate-level filtering and candidate-scoped stats on `/history`.

---

## 2. Design

Keep everything on `/history` with one shared layout:

### A. Searchable Sessions Table (All Roles)
Replace the static session card list with a **searchable sessions table**:
- **Search input**: Real-time filter across question title, track name, verdict, and (for staff) candidate name/email, with a clear button.
- **Columns**: `Date`, `Candidate` *(staff only — clickable to filter to that candidate)*, `Track`, `Question`, `Score` (`ScoreBadge`), `Verdict` (`HireabilityBadge`), and `View Full Rubric` (`/r/:public_token`).

### B. Stats Scope by Role & Filter State
- **Candidate (`canGrade === false`)**:
  - Always sees their personal summary cards (`Total Sessions`, `Overall Average Score`, `Top Evaluated Skill`), `Longitudinal Performance by Rubric Axis`, and their searchable sessions table.
- **Staff (`canGrade === true`)**:
  - **Unfiltered (`/history`)**: Shows a candidate filter `<select>` + search input + the full conducted-interviews table. **Hides** summary cards and axis breakdown so mixed cross-candidate stats are never shown.
  - **Filtered to a candidate (`/history?candidate=<candidateId>`, via dropdown or clicking a candidate in the table)**: Reveals that candidate's summary cards (`Total Sessions`, `Overall Average Score`, `Top Evaluated Skill`) and `Longitudinal Performance by Rubric Axis` directly above their filtered table rows, with a `Clear candidate filter` action.

---

## 3. Data & Implementation

- **Query**: Project only required columns in `/history` (`id`, `public_token`, `candidate_id`, `interview_type_name`, `question_title`, `hireability`, `interviewed_at`, `created_at`, `evaluation_scores (criterion_key, criterion_label, score)`, and `candidates (id, full_name, email)` only when `canGrade` is true).
- **URL State**: Sync selected candidate filter with `?candidate=<candidateId>` via `useSearchParams()` so filtered views are shareable and refresh-safe.
- **Analytics**: Track `candidate_history_selected`, `candidate_history_cleared`, and `candidate_rubric_opened` via [`trackEvent`](../src/lib/analytics.ts) (no PII in properties).

---

## 4. Out of Scope (Follow-Up)

- Per-interviewer `interviewer_id` ownership & RLS ([karkir0003/mocksignal#11](https://github.com/karkir0003/mocksignal/issues/11)).
- Candidate name/email validation audit ([karkir0003/mocksignal#10](https://github.com/karkir0003/mocksignal/issues/10)).
- `/admin` "Latest 30 submissions" quick-action table in [`GradingFormTab.tsx`](../src/components/admin/GradingFormTab.tsx).

---

## 5. Verification

- Unit tests for evaluation metric calculations, session search filtering, and candidate filtering.
- Component tests for [`CandidateHistoryPage`](../src/pages/CandidateHistoryPage.tsx):
  - Candidate role: personal stats + searchable table (no candidate column).
  - Staff unfiltered: searchable table + candidate dropdown, with cross-candidate summary stats hidden.
  - Staff candidate-filtered (`?candidate=<id>`): candidate-scoped summary cards + axis breakdown + filtered rows + `View Full Rubric` links.
- Pre-flight: `yarn typecheck && yarn test && yarn build`.
