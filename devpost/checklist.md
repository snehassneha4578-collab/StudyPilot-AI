---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Enter study details and generate a feasible plan**
  Becomes usable: A student can use the first-visit dashboard, enter subjects/topics with difficulty, exam dates, and daily hours, and get a real deterministic timetable with revision or a clear infeasibility explanation.
  Why now: Bootstrapping is part of the first working path; validating the estimated workload early proves the core planner and prevents building the dashboard around invalid schedules.
  PRD ref: `prd.md > The Core Journey` (steps 1–3), `prd.md > Plan Setup and Generation`, `prd.md > States and Boundaries`.
  Spec ref: `spec.md > Components > Plan Setup Form`, `spec.md > Data Model > Scheduling and Rescheduling Rules`, `spec.md > File Structure`.
  Build: First build and test the pure scheduler and validation functions independently of React/UI. Only after those tests pass, scaffold React/Vite/TypeScript and integrate the proven functions into the welcome state and guided form; label duration defaults as estimates; show the timetable or a no-partial-plan conflict state.
  Verify (mechanical): Scheduler/validation tests passed before UI integration (8 tests); after UI integration, `npm.cmd run test` passed (8/8), `npm.cmd run build` passed, and Vite dev server started at `http://127.0.0.1:5173/`. Coverage includes estimates, revision, difficulty ordering, invalid fields, daily limits, exam boundaries, and impossible workload.
  Learner check: Open the dashboard, enter three subjects and topics with difficulty, exam dates, and available hours. Generate the plan and confirm revision is present, estimates are labeled, and no day exceeds the entered hours.
  Commit: Skipped per explicit learner instruction; leave changes uncommitted.

- [x] **2. Complete sessions and reschedule safely**
  Becomes usable: Students can complete sessions, see progress update, reschedule a missed session into a valid suggested or chosen slot, and keep completed work and changes after refresh.
  Why now: This delivers the distinctive recovery behavior early and verifies the most important invariants before investing in richer charts and navigation.
  PRD ref: `prd.md > Session Completion and Progress`, `prd.md > Missed-Session Rescheduling`, `prd.md > States and Boundaries`.
  Spec ref: `spec.md > Components > Session Completion Control`, `spec.md > Components > Reschedule Dialog`, `spec.md > Components > StudyPlanProvider`, `spec.md > Data Model`.
  Build: Add localStorage restore/save with safe parse errors; session completion and derived completion percentage; suggested and alternate valid slots; explicit confirmation for adjustments; ensure completed sessions cannot move and daily limits/exam dates are enforced; keep unresolved work visible.
  Verify (mechanical): `npm.cmd run test` passed (20/20), including completion immutability, reschedule deadline/capacity checks, unscheduled-work recovery, storage restore/error handling, and real-data statistics; `npm.cmd run build` passed; Vite dev server remains available at `http://127.0.0.1:5173/`.
  Learner check: Learner-reported browser evidence: generated timetable; marked a session complete; rescheduled Science revision to 26 Oct 2026. A prior handoff recorded a learner-reported refresh, but persistence has not been independently verified in this final review.
  Commit: Skipped per explicit learner instruction; leave changes uncommitted.

- [x] **3. Show real insights and usable dashboard sections**
  Becomes usable: Overview, My Study Plan, Subjects, Progress & Insights, and Settings navigate to working views; charts, progress, exams, and today's study time come from saved plan data, with honest empty states before data exists.
  Why now: Once the plan state is reliable, every dashboard surface can reuse the same source of truth and avoid fabricated or inconsistent analytics.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > First Visit and Dashboard`, `prd.md > Session Completion and Progress`, `prd.md > Navigation, Feedback, and Accessibility`.
  Spec ref: `spec.md > Components > Overview Dashboard`, `spec.md > Components > Progress and Insights`, `spec.md > Components > Subjects View`, `spec.md > Components > Settings View`, `spec.md > Components > App Shell and Navigation`.
  Build: Add responsive navigation/view switching; implement real-data dashboard summaries and SVG charts; add empty states, labeled illustrative preview, session list/calendar views, settings summary, and action feedback. Ensure every visible control works or is labeled unavailable.
  Verify (mechanical): `npm.cmd run test` passed (20/20); `npm.cmd run build` passed; statistics unit tests confirm metrics derive from plan sessions, including zero progress before completion; chart and subject summaries consume those derived values. Vite serves the updated app at `http://127.0.0.1:5173/`.
  Learner check: Visit each navigation destination before and after creating a plan; confirm the empty state is honest and the chart/progress responds to real sessions.
  Commit: Skipped per explicit learner instruction; leave changes uncommitted.

- [x] **4. Refine responsive visuals and accessibility**
  Becomes usable: The full workflow has the agreed premium navy/violet visual identity, responsive layouts, keyboard operation, sufficient contrast, and reduced-motion behavior.
  Why now: Visual refinement is applied to working surfaces and real data, so it supports the product without hiding incomplete behavior.
  PRD ref: `prd.md > Look and Feel`, `prd.md > Navigation, Feedback, and Accessibility`, `prd.md > Demo and Quality Acceptance`.
  Spec ref: `spec.md > Look and Feel`, `spec.md > Components > App Shell and Navigation`, `spec.md > Components > Toast and Empty/Error Feedback`.
  Build: Refine gradients, accent colors, typography, cards, chart styling, animation, responsive breakpoints, focus states, contrast, and prefers-reduced-motion styles; complete 1–3 minute demo path and clear PowerShell instructions.
  Verify (mechanical): `npm.cmd run test` passed (20/20); `npm.cmd run build` passed; Vite returned HTTP 200 at `http://127.0.0.1:5173/`. Source inspection confirms layout breakpoints at 1100/900/620/420px, visible keyboard focus styles, keyboard-operable chart targets, and `prefers-reduced-motion` overrides. A contrast calculation found the sidebar section label at 4.46:1 against the navy base; it was raised to 5.76:1. Browser-based laptop/narrow-width, keyboard-only, and reduced-motion interaction checks remain pending because no browser automation or visual browser tool is available in this environment.
  Learner check: Learner-reported browser evidence confirms the core plan, completion, and reschedule flow. Refresh persistence was not independently verified in this review. Narrow-viewport behavior, keyboard-only operation, and reduced-motion behavior still need hands-on review.
  Commit: Skipped per explicit learner instruction; leave changes uncommitted.

## Hands-on Checkpoints

- [x] Early feedback checkpoint deferred at learner request to continue through ordinary implementation slices without pausing; no learner feedback is claimed.
- [ ] Final kick-the-tires exploration and feedback completed after Slice 4. In the latest report, the learner observed History moved to 10:15 AM on 27 Oct 2026 while Social revision remained completed at 09:00 AM. Persistence after refresh has not been confirmed in this review; responsive sizing, keyboard-only use, reduced-motion behavior, and awkward-input review remain outstanding.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship.

## Code Tour and App Map

- [x] Learning activity complete — focused, evidence-based recap of the exam-date boundary investigation and verified single-local-date snapshot fix; no hands-on editor tour is claimed.
- [x] Optional edit and transfer reflection addressed — no separate practice edit; the date-consistency fix was already implemented and regression-tested. One optional transfer reflection is offered in the handoff; no response is required.
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse.

Activity and evidence: Focused investigation recap — the date-only input is preserved as `YYYY-MM-DD`; form validation and generation share one local-date snapshot so a midnight rollover cannot make them disagree. Regression tests cover today, tomorrow, feasible tomorrow-plan generation, and past/malformed dates. No hands-on editor tour is claimed.
Route and stops: Reference route in `app-map.html`: `PlanSetupForm.handleGenerate` → `planner.ts` (`validatePlanInput`, `generateSchedule`) → `StudyPlanProvider` / `storage.ts` and derived values in `stats.ts`. The map gives anchors and paths; no interactive editor tour is claimed.
Edit outcome: No separate optional learning edit; the requested date fix was already made and verified.
Reflection: One optional transfer question offered in the handoff; response is optional.
Activity mode: Focused investigation recap.

## Revisions

- Slice 1 completed with 8 automated tests and a successful production build; early hands-on feedback was deferred per learner instruction to proceed without ordinary pauses.
- Date validation regression fix (2026-10-25): the plan form now captures the browser-local calendar date once per submission and reuses that snapshot for both validation and schedule generation, avoiding a midnight rollover between two clock reads. Date-only input values remain ISO calendar strings and are compared without UTC conversion; exams on today or earlier remain invalid. Added regression coverage for today, tomorrow (including feasible generation before the deadline), and past/malformed dates. Verified: `npm.cmd run test` passed (24/24), `npm.cmd exec tsc -- --noEmit` passed, `npm.cmd run build` passed, and `git diff --check` returned no errors. The repository has no commits and project files are untracked, so `git diff --check` cannot inspect their contents; no staging or commit was performed.
- Prior learner-reported browser journey: timetable generated; a session completed; Science revision rescheduled to 26 Oct 2026. A refresh was previously reported, but persistence is not independently verified in this review. Keyboard-only operation, reduced motion, and responsive widths also remain unverified.
- Wrap-up artifacts prepared: factual root `README.md`, MIT `LICENSE`, demo cue sheet, submission checklist, and standalone `app-map.html`. No public repository/video/URL is claimed. Final review remains unchecked until the outstanding manual checks and explicit learner readiness confirmation.
- Final documentation verification: map contains five valid local source links, accessible inline SVG, no scripts or external runtime references; all five new artifacts passed a trailing-whitespace scan. Final command run: `npm.cmd run test` passed (24/24), `npm.cmd exec tsc -- --noEmit` passed, `npm.cmd run build` passed, `git diff --check` returned no errors. Because all project files are untracked and there is no commit, `git diff --check` cannot inspect them; source/docs were not staged.
- Final quality review (2026-10-25): source inspection found that the responsive 621–800px sidebar hides navigation text while its icons are decorative; added explicit accessible names to each navigation button. Also return focus to the opener when the reschedule dialog closes. Responsive breakpoints, visible focus rules, reduced-motion overrides, form validation, and existing planner regression coverage were reviewed. `README.md`, MIT `LICENSE`, demo cue sheet, submission checklist, and app map were reviewed; all five local app-map source links point to existing files. Current checks: `npm.cmd run test` passed (24/24), `npm.cmd exec tsc -- --noEmit` passed, `npm.cmd run build` passed. `git diff --check` returned no errors, but cannot inspect these files because the repository contains no commits and project files remain untracked. Contrast evidence is limited to the recorded 5.76:1 sidebar section label calculation; a complete rendered contrast audit and browser-based narrow-screen, keyboard, reduced-motion, and awkward-input checks remain outstanding. Final review and ready-to-ship confirmation remain unchecked.
- Final regression and readiness review (2026-10-25): the learner reported observing History moved to 10:15 AM on 27 Oct 2026 while Social revision remained completed at 09:00 AM; this is learner-reported live behavior, not an independently captured browser test. Source inspection confirms the provider loads/saves the versioned plan through localStorage, surfaces read/write failures, and does not persist failed planner moves. Storage unit tests cover a MemoryStorage reload boundary, malformed/unsupported values, and failed writes; they do not verify a real browser refresh. Planner regression coverage includes the 27 Oct/28 Oct deadline case, completed-session preservation and overlap protection, date-boundary behavior, and rescheduling capacity. Navigation accessible names and dialog labeling, tab trapping, Escape close, and focus return are present in source; keyboard interaction was not browser-tested. Verified: `npm.cmd run test` passed (28/28), `npm.cmd exec tsc -- --noEmit` passed, `npm.cmd run build` passed, and `git diff --check` returned no errors. Git reports project files as untracked and there are no commits, so `git diff --check` cannot inspect their contents; no staging or commit was performed. No refresh persistence, rendered contrast, responsive behavior, or keyboard interaction is claimed as independently verified. Public repository and public 1–3 minute demo video are not available; the MIT license artifact exists locally, and the learner-authored Devpost submission fields and exit survey remain incomplete. Final review remains open.
- Final browser-readiness pass (2026-10-25): inspected available tools and found no browser automation tool, so no browser session or localStorage refresh was tested. Source inspection confirms the app's versioned localStorage read/write path; existing storage tests use MemoryStorage and are not browser persistence evidence. Re-ran `npm.cmd run test` (28/28 passed), `npm.cmd exec tsc -- --noEmit` (passed), `npm.cmd run build` (passed), and `git diff --check` (no errors reported; repository files remain untracked, so Git cannot inspect them). Manual completion, refresh, Subjects, and Progress & Insights checks remain pending; final review stays unchecked.
