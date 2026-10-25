---
doc: prd
status: approved
---

# StudyPilot AI — Product Requirements

A polished, interactive study planner for college and engineering students preparing for semester or competitive exams.
Source: `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey

1. **Arrive:** A first-time student sees a welcoming dashboard with honest empty states, a clear path to create a plan, and an explicitly illustrative timetable preview. Returning students see their saved plan and real progress. Source: `scope.md > What "Working" Looks Like`.
2. **Set up a plan:** The student opens the guided plan form and enters subjects, topics, difficulty levels, exam date(s), and available daily study hours. The form shows setup progress, validates required and usable values, and explains invalid input or insufficient time. Source: `scope.md > The Core Loop`, `scope.md > The POC Boundary`.
3. **Generate:** The student chooses “Generate My Study Plan.” StudyPilot creates a day-by-day timetable from their inputs, prioritizing difficult subjects, including revision, and respecting daily study-hour limits. It is clearly labeled as deterministic planning, not AI-generated advice. Source: `scope.md > The Unique Kernel`, `scope.md > What "Working" Looks Like`.
4. **Study and track:** The student reviews sessions in calendar or list view, opens a session, and marks it complete. The session status, progress ring, completion percentage, and data-driven analytics update immediately. Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.
5. **Recover from a missed session:** The student requests a reschedule. The app suggests the next suitable valid slot and shows its date and time. The student can accept it or choose another valid slot. Completed sessions never move; no day exceeds the student's limit; regular sessions are not scheduled beyond the exam date. If no valid slot remains, explain the conflict and offer choices: reduce optional revision time, increase daily available hours, or prioritize essential topics. Do not apply a change until the student chooses and confirms it. Never silently delete sessions or change settings. On confirmation, update the timetable and analytics immediately. Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.
6. **Return:** The student refreshes or returns later and sees their saved plan, settings, completion state, reschedules, and progress restored. Source: `scope.md > What "Working" Looks Like`.

## Screens and Layout

One responsive dashboard experience with sidebar navigation on larger screens and a suitable responsive navigation on smaller screens. Navigation destinations: Overview, My Study Plan, Subjects, Progress & Insights, and Settings.

- **Overview:** Welcome hero, getting-started cards, overview cards, quick-start action, and labeled illustrative preview before a plan exists. With a plan, show real upcoming exams, today's sessions and study time, preparation progress, and analytics.
- **My Study Plan:** Generated timetable with calendar and list views, session details, complete action, and reschedule flow.
- **Subjects:** Subjects, topics, and difficulty used by the plan. Pages without data explain how to add it.
- **Progress & Insights:** Real-data progress ring, completion percentage, and meaningful analytics; use helpful empty states until data exists.
- **Settings:** Student's saved study availability and exam settings, with no silent changes during rescheduling.

The guided plan form opens from “Create My Study Plan” and shows an understandable setup progress indicator. It collects the required subjects/topics, difficulty, exam date(s), and daily availability. Source: `scope.md > The Core Loop`, `scope.md > Inspiration & Identity`.

## Look and Feel

Premium, colorful education SaaS dashboard with a deep navy base, violet and electric-blue gradients, teal and coral accents, sparing glassmorphism, soft shadows, rounded cards, polished typography, subtle decorative details, and smooth entrance animations. Use clear hierarchy, responsive cards, and meaningful hover/click feedback. Keep interactions visually clear and keyboard accessible, maintain accessible contrast, and respect reduced-motion preferences. Do not use fake analytics or present illustrative preview data as the student's real plan. Source: `scope.md > Inspiration & Identity`.

## Features and Behavior

### First Visit and Dashboard

- Show the welcome hero text: “Your goals. Your plan. Your progress.” and a short subtitle about preparing smarter, not just studying longer.
- Provide a prominent “Create My Study Plan” action.
- Show three getting-started cards: add subjects and topics; set exam dates and daily availability; generate a personalized timetable with revision.
- Show empty states for upcoming exams, today's study time, completion rate, and study streak. Do not fabricate metrics, streaks, sessions, or progress.
- Show an illustrative timetable preview only when clearly labeled illustrative.
- After generation, transition the same dashboard to real student data.

### Plan Setup and Generation

- Collect one or more subjects, topic names, difficulty per topic, exam date(s), and daily study hours. The demo journey should support entering three subjects.
- Show setup progress and validate missing or invalid data with helpful, visible messages. Do not create a partial or misleading plan after invalid input.
- Generate a deterministic timetable that distributes topics across days, prioritizes difficult topics, includes revision, and respects available daily time. Clearly state that this initial plan is deterministic.
- If the available time cannot fit the requested workload, explain the constraint and offer actionable choices without silently dropping topics or changing user settings.
- Display resulting sessions in calendar and list views. Each session shows enough information to identify its subject/topic, date, time or duration, and status.

### Session Completion and Progress

- Allow a student to open a session and mark it complete.
- Update session status, progress ring, completion percentage, and relevant analytics immediately from actual plan data.
- Completed work remains completed when other sessions are rescheduled.

### Missed-Session Rescheduling

- Suggest the next suitable available slot, balancing subject difficulty, topic priority, and remaining workload; show date and time before applying it.
- Let the student accept the suggestion or choose another valid slot.
- Protect completed sessions, daily hour limits, and the exam-date boundary.
- If no valid slot remains, explain why and offer reducing optional revision, increasing daily available hours, or prioritizing essential topics. Require the student's explicit choice and confirmation before applying any adjustment. Never silently delete sessions or change settings.
- After confirmation, update the timetable and analytics immediately and persist the change.

### Navigation, Feedback, and Accessibility

- Keep the five navigation destinations usable, with helpful empty states when a page has no data.
- Use clear success/error feedback, such as toast notifications, for meaningful actions.
- Provide keyboard-operable controls, visible focus, readable contrast, and reduced-motion behavior. Animation and hover feedback must not be required to understand or operate the app.

## States and Boundaries

- **First visit / no plan:** Honest empty-state overview, setup guidance, and labeled illustrative preview; no invented student data.
- **Setup in progress:** Show current step and validation state; preserve form values while navigating the guided flow.
- **Invalid input:** Explain what needs correction and keep the student’s entered values.
- **Insufficient time:** Explain the conflict and ask the student how to proceed; do not silently remove topics or settings.
- **Plan generated:** Show timetable and metrics derived from the saved plan.
- **No sessions on a selected view:** Explain that no sessions are scheduled there and provide a route back to the plan or setup.
- **Reschedule available:** Show a suggested valid slot and allow acceptance or selection of another valid slot before confirmation.
- **No valid reschedule slot:** Explain the constraint and present the stated adjustment choices; apply only after the student chooses and confirms.
- **Completed session:** Keep it immutable during rescheduling.
- **Reload / return:** Restore plan, settings, progress, and confirmed schedule changes.
- **Reduced motion / keyboard use:** Preserve all functionality and feedback without relying on motion or pointer-only controls.

## Product Decisions

- The dashboard uses an honest first-visit experience without fake analytics or fabricated progress.
- A guided form leads into the plan; the demo should show three subjects.
- The initial planner is deterministic and clearly labeled; genuine AI is conditional on being safely implementable and verifiable without risking the core workflow.
- Rescheduling proposes a valid next slot, lets the student review/choose, and requires confirmation for adjustments when no slot remains.
- Local persistence is required for the first version.
- Visual polish, responsive layouts, keyboard access, contrast, and reduced-motion support are product requirements alongside functionality.

### Demo and Quality Acceptance

- The dashboard is aesthetic, colorful, animated, responsive, and interactive; it is a working product surface, not a static mockup.
- Every visible button, navigation item, form, chart, and action works as intended or is clearly marked unavailable/deferred.
- Analytics reflect actual saved study data; no fabricated user statistics are shown.
- Validate inputs, respect daily study-hour limits and exam dates, and preserve completed sessions during rescheduling.
- Persist plan and progress data across refreshes and provide helpful error and empty states.
- Support keyboard navigation, accessible contrast, and reduced-motion preferences.
- The core workflow is testable end to end and can be demonstrated clearly in a 1–3 minute video.
- Keep optional AI integration and the focus timer deferred until the core planner works reliably.

## What We're Building

A responsive dashboard with honest empty and real-data states; guided, validated plan setup; deterministic, difficulty-aware timetable generation with revision; calendar/list timetable views; session completion; protected missed-session rescheduling; real progress and analytics; local persistence; clear action feedback; accessible interactions; and the agreed visual design.

## Deferred From the POC

- **Genuine AI planning integration:** Deferred unless it can be implemented and verified without jeopardizing the deterministic core workflow.
- **Focus timer:** Optional enhancement only after the required planning workflow is working and verified.
- **Beyond-POC enhancements:** Any functionality not needed to demonstrate the plan, complete, reschedule, and restore workflow stays out of the initial build.

## Possible Later Enhancements

A genuine AI layer could offer optional planning suggestions after the deterministic schedule is reliable. A focus timer could support individual study sessions if time remains.

## Non-Goals

- Do not portray deterministic scheduling as AI.
- Do not use fabricated analytics or sample timetable entries as a student's real data.
- Do not move completed sessions, exceed daily limits, schedule regular study beyond the exam date, silently delete sessions, or change settings during rescheduling.
- Do not add unrequested features that delay the end-to-end proof of concept.

## Open Questions

- **Before `4-spec`:** None identified that block specifying the product. The exact scheduling and rescheduling algorithm details belong in the technical spec and must preserve the behaviors above.
- **Can wait until implementation:** Whether genuine AI or the optional focus timer fits after the core workflow is working and verifiable.
