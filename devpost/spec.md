---
doc: spec
status: approved
---

# StudyPilot AI — Technical Spec

## How This Works, In Plain Language

StudyPilot AI is one React app that runs in the browser. The setup form turns a student's subjects, topics, difficulty ratings, exam dates, and daily study hours into a proposed schedule. A scheduling function checks the dates and available time before it returns a complete plan; if it cannot fit the work, the app explains the conflict and asks the student what to adjust. React components display the plan and calculate progress from its sessions. When the student changes the plan, the app saves the updated plan in the browser's local storage, so it is restored on refresh on that same browser and device.

There is no account, backend, or AI service in this first version. This keeps setup and the demo self-contained; the tradeoff is that plans do not sync to another device.

## The Core Journey Through the System

1. The app reads saved plan data from local storage. If none exists, it shows the honest welcome dashboard and labeled illustrative preview (`prd.md > First Visit and Dashboard`).
2. The student opens the guided form and enters subjects, topics, difficulty, exam date(s), and daily availability. Form validation shows errors without discarding entered values (`prd.md > Plan Setup and Generation`).
3. The scheduling function estimates workload, orders topics deterministically, places study and revision sessions within the available date/hour limits, and either returns a complete plan or a conflict report. It never silently omits topics (`prd.md > Plan Setup and Generation`).
4. The app saves and renders the generated plan. The student switches between list and calendar, opens a session, and completes it. Dashboard counts, progress ring, and charts derive from the same saved sessions (`prd.md > Session Completion and Progress`).
5. When a student requests rescheduling, the function searches for valid open slots, excluding completed sessions and respecting daily limits and exam dates. The app presents a suggested slot or valid alternatives for review. If none fit, it presents adjustment choices and applies nothing until confirmation (`prd.md > Missed-Session Rescheduling`).
6. The app persists the confirmed change and recalculates the displayed analytics. On refresh, the same plan, completion states, settings, and schedule are loaded again (`prd.md > States and Boundaries`).

## Stack

- **React** — reusable interactive dashboard components. [React documentation](https://react.dev/learn)
- **TypeScript** — explicit types for subjects, topics, study sessions, and plans. [TypeScript documentation](https://www.typescriptlang.org/docs/)
- **Vite** — local development server and production build for this client-only app. [Vite guide](https://vite.dev/guide/)
- **Vitest** — tests for the pure scheduling, validation, rescheduling, and statistics functions; it uses the Vite project configuration. [Vitest guide](https://vitest.dev/guide/)
- **CSS and inline SVG** — styling, progress ring, and charts without a charting or animation library.

The installed Node.js v24.20.0 meets the current Vite requirement (Node 20.19+ or 22.12+); npm.cmd v11.19.0 is available in PowerShell. PowerShell blocks the `npm.ps1` shim in this environment, so commands below use `npm.cmd`. Pin resolved dependency versions in `package-lock.json` for reproducible installs. Check the Vite and Vitest compatibility notes when installing: Vite currently requires Node 20.19+/22.12+, and Vitest requires Vite 6.4+ and Node 22.12+.

## Where It Runs and How Someone Tries It

- **Runtime:** local development server plus the student's browser; no API key or backend.
- **Install dependencies in PowerShell:** `npm.cmd install`
- **Run locally:** `npm.cmd run dev`
- **Open:** the local URL printed by Vite (normally `http://localhost:5173`).
- **Run automated checks:** `npm.cmd run test`
- **Check production build:** `npm.cmd run build`
- **Demo flow:** open the app; enter three subjects, topics, difficulty, exam date, and availability; generate the plan; complete a session; reschedule another; refresh; show that saved progress remains. Show a validation or insufficient-time message if it fits the 1–3 minute recording.

Deployment is not part of this spec. The app is demonstrable locally for the required video; `6-ship` separately handles the video and public repository.

## Look and Feel

Use a deep navy canvas with violet and electric-blue gradient highlights, teal and coral accents, restrained glass-like surfaces, rounded cards, soft shadows, and readable modern typography. Keep the dashboard spacious and visually rich, with subtle animated gradients and entrance transitions, vivid but legible data visualization, responsive cards, and a clear active navigation state. Use CSS and inline SVG for motion and charts to keep dependencies light. Every visual action needs a keyboard-accessible control, visible focus, a reduced-motion alternative, and sufficient contrast. Illustrative preview content must be labeled as illustrative and separated from real student data. Implements `prd.md > Look and Feel` and `prd.md > First Visit and Dashboard`.

## Components

### App Shell and Navigation

Owns the responsive sidebar/navigation and active dashboard destination. On narrow screens it switches to a compact navigation pattern. All five destinations route to functional views or a clearly marked unavailable state; no decorative dead links. Implements `prd.md > Screens and Layout` and `prd.md > Navigation, Feedback, and Accessibility`.

### Overview Dashboard

Shows welcome hero, getting-started cards, empty overview cards and an illustrative preview when no plan exists. Once a plan exists, shows real exam countdowns, today's sessions/hours, progress, and analytics. Implements `prd.md > First Visit and Dashboard`.

### Plan Setup Form

Provides guided steps, subject/topic entry, difficulty selection, exam date(s), and daily availability; validates values and explains schedule capacity before generating. Preserves entries when correcting errors. Implements `prd.md > Plan Setup and Generation`.

### Study Plan Views

Displays generated sessions in calendar and list modes, with subject, topic, date/time or duration, and status. Session detail exposes completion and reschedule actions. Implements `prd.md > Screens and Layout` and `prd.md > Plan Setup and Generation`.

### Session Completion Control

Marks a pending session complete once and prevents completed work from being moved by rescheduling. Implements `prd.md > Session Completion and Progress`.

### Reschedule Dialog

Shows the suggested next valid slot, other valid choices, and explicit confirmation. If there is no valid slot, explains why and offers the PRD's choices without applying any until confirmed. Implements `prd.md > Missed-Session Rescheduling`.

### Progress and Insights

Computes totals from current plan data only. Use an SVG completion ring and actual-data time/session chart; render honest empty states when there is no plan or history. Implements `prd.md > Session Completion and Progress` and `prd.md > Navigation, Feedback, and Accessibility`.

### Subjects View

Shows the subjects and topic difficulty currently in the saved plan; empty state directs the student to plan setup. Implements `prd.md > Screens and Layout`.

### Settings View

Shows saved study availability and exam settings. Any edit is an explicit action with confirmation and a schedule impact message; rescheduling must not silently change settings. Implements `prd.md > Screens and Layout` and `prd.md > Missed-Session Rescheduling`.

### Toast and Empty/Error Feedback

Communicates saved, completed, validation, storage, and scheduling outcomes with visible status text that assistive technology can announce. Implements `prd.md > Navigation, Feedback, and Accessibility` and `prd.md > States and Boundaries`.

### StudyPlanProvider

Loads the saved plan once, exposes typed plan data and actions to the components, persists successful updates, and derives dashboard statistics from that data. Failed storage writes are surfaced and must not be described as saved. Implements `prd.md > Session Completion and Progress` and `prd.md > States and Boundaries`.

## Data Model

All values are typed in `src/types/study.ts` and stored together as a versioned JSON document under a single localStorage key.

- **Subject:** stable ID, name, exam date, topics.
- **Topic:** stable ID, name, difficulty (`easy | medium | hard`), optional essential flag selected only if resolving an insufficient-time conflict.
- **StudyPlan:** schema version, daily available minutes, subjects, sessions, any visibly unscheduled topics created by an explicit prioritization choice, created/updated timestamps.
- **StudySession:** stable ID, subject/topic reference, kind (`study | revision`), local calendar date, start time, duration in minutes, status (`planned | completed`), and optional original date for rescheduled work.
- **Derived statistics:** completion count/percentage, remaining study time, today's sessions, upcoming exam countdown, and chart series are calculated from the plan each render. They are not persisted as separate or fabricated metrics.

The form is the source of new subjects/topics/settings. Planner functions create sessions from the form data; completion and reschedule actions update only the affected session records; provider saves the resulting plan. On return or refresh, the provider parses and validates the versioned localStorage value. Missing, malformed, unsupported, or unavailable storage shows a useful recovery message and never presents unpersisted changes as durable. No server or cross-device sync is included.

### Scheduling and Rescheduling Rules

The approved default duration estimates are easy topic = 30 minutes, medium = 45 minutes, hard = 60 minutes, and one 30-minute revision session per subject. Clearly label them as estimates in setup and the generated plan. Keep them in a typed scheduling policy object so a future iteration can let students customize durations; do not add customization controls in this POC. Store the estimated duration on each generated session so future policy changes do not alter existing plans. The planner checks the full required workload against available pre-exam capacity before saving. It prioritizes higher-difficulty topics earlier, distributes sessions across available days, and keeps each day at or below the stated hours. Feasibility checks sum all topic estimates and the required revision estimates before placing sessions, and verify each day remains within the daily limit. If invalid data is entered, save nothing. If the full workload cannot fit by exam day, show a conflict with all affected work and do not silently save a partial plan. The student may explicitly choose to reduce revision estimates, increase availability, or prioritize selected essential topics. Require confirmation before applying changes. If the student chooses to prioritize a subset, keep every other topic in a clearly labeled unscheduled-work list until resolved; do not discard it or present the plan as complete. Revision occurs before the associated exam. No session is placed beyond its exam date.

For rescheduling, preserve the original completed records. For a pending/missed session, find the next open slot on or before the subject's exam date that fits that day's remaining minutes; suggest the earliest valid slot and allow the user to select another valid slot. If no slot exists, show the reason and the same adjustment choices; do not mutate settings, omit work, or apply an adjustment before confirmation. Difficulty and essential-topic choices determine ordering when capacity is constrained. Stable IDs keep analytics and completion history attached to the same session. Suggested clock times begin at 09:00 and stack in 30-minute blocks, because setup collects daily hours but no time-of-day preferences; display these as suggested times and keep the start time in the scheduling policy so it can be customized later.

## File Structure

```text
StudyPilot-AI/
├── devpost/
│   ├── learner-profile.md       # learner context, excluded from commits
│   ├── scope.md                 # approved product scope
│   ├── prd.md                   # approved product requirements
│   ├── spec.md                  # this technical plan
│   └── checklist.md             # build steps created by 5-build
├── index.html                   # app entry HTML
├── package.json                 # scripts and dependencies
├── package-lock.json            # exact dependency versions
├── tsconfig.json                # TypeScript checks
├── vite.config.ts               # Vite and Vitest config
└── src/
    ├── main.tsx                 # React entry and global styles
    ├── App.tsx                  # dashboard view selection and shell
    ├── index.css                # responsive theme, motion, accessibility
    ├── types/
    │   └── study.ts              # Subject, Topic, StudySession, StudyPlan types
    ├── context/
    │   └── StudyPlanProvider.tsx # load, update, persist plan
    ├── lib/
    │   ├── planner.ts            # validation, generation, rescheduling
    │   ├── storage.ts            # versioned localStorage parsing/writes
    │   └── stats.ts              # real-data derived analytics
    ├── components/
    │   ├── AppShell.tsx
    │   ├── OverviewDashboard.tsx
    │   ├── PlanSetupForm.tsx
    │   ├── StudyPlanView.tsx
    │   ├── SessionDetails.tsx
    │   ├── RescheduleDialog.tsx
    │   ├── ProgressInsights.tsx
    │   ├── SubjectsView.tsx
    │   ├── SettingsView.tsx
    │   ├── ProgressRing.tsx
    │   ├── StudyChart.tsx
    │   ├── ToastRegion.tsx
    │   └── EmptyState.tsx
    └── lib/
        ├── planner.test.ts       # generation, boundaries, and reschedule cases
        ├── stats.test.ts         # derived metric cases
        └── storage.test.ts       # restore and invalid storage cases
```

## External Services and Dependencies

No external runtime services, API keys, hosted database, or analytics services. Dependencies are React, React DOM, Vite, TypeScript, the Vite React plugin, and Vitest for local automated tests. Prefer native browser APIs, CSS, and inline SVG for storage, date handling, icons, and charts; add no charting, routing, animation, or date library unless implementation shows a clear need.

Documentation:
- [React](https://react.dev/learn)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/guide/)
- [Vitest](https://vitest.dev/guide/)
- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Reduced motion media query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## Important Failure Modes

- **Invalid or impossible schedule** → Keep form values, show the workload/capacity conflict and valid choices, and create no partial plan until the student confirms a resolution.
- **Browser storage unavailable or malformed** → Explain that the plan could not be loaded/saved; do not claim persistence. Keep the page usable where possible and offer to start a new plan without silently replacing recoverable data.
- **No sessions or analytics yet** → Show honest empty states; never fill charts with demo numbers.

## What Was Simplified and Why

- **Single browser-based app with localStorage** instead of accounts, backend, or database — fits the one-student demo, avoids service credentials, and supports refresh persistence; the tradeoff is no sync across browsers/devices.
- **Deterministic planner** instead of an AI API — stable, explainable scheduling with no API key or network dependency; genuine AI stays deferred until the core is reliable.
- **Native CSS/SVG charts and animations** instead of visualization/motion packages — keeps dependencies small and ensures charts stay tied to real app data.
- **One dashboard shell with view switching** instead of a multi-route application — all required sections remain navigable without adding routing setup.

## Decisions and Open Issues

- **Learner-approved:** React + Vite + TypeScript, client-side architecture, localStorage, minimal dependencies, deterministic difficulty-aware scheduling, real-data analytics, accessible animated visuals, and PowerShell run/test instructions.
- **Derived implementation detail:** React context/provider keeps the single plan available to the dashboard; pure functions handle scheduling and statistics so these behaviors can be tested separately.
- **Learner uncertainty clarified:** Topic effort is not captured in the form. A fixed difficulty-to-duration estimate makes capacity checks understandable without adding another setup field. The learner approved estimates of easy 30 min, medium 45 min, hard 60 min, plus one 30-minute revision per subject. Label them as estimates and store them in a scheduling policy object for future customization; no customization UI in this POC.
- **Not included:** AI API, focus timer, accounts, cloud sync, and deployment are deferred or outside the approved POC.
- **Resolved by current environment:** Node.js 24.20 and npm.cmd 11.19 are installed; Vite and Vitest current minimum Node requirements are met. Confirm the exact dependency versions at install time and retain the lockfile.
- **Open issues:** None block implementation. The daily 09:00 start is an implementation default because time-of-day availability is not collected; show it as a suggested time and isolate it in the scheduling policy. Work that cannot fit stays visible as unresolved work, never silently discarded.
