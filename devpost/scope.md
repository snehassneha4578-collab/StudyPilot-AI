---
doc: scope
status: approved
---

# StudyPilot AI

A responsive study planner that turns exam dates, topics, difficulty, and available study hours into a workable daily plan students can track and adjust.

## The Unique Kernel
Students can recover from missed study sessions without erasing completed progress: the plan adapts while preserving what they have already done.

## Who It's For
College students, especially engineering students preparing for semester or competitive exams while balancing multiple subjects and limited study time.

## The Core Loop
A student opens a dashboard overview, enters subjects and topics with difficulty, exam dates, and daily study hours, then generates a day-by-day timetable with revision. They complete sessions and see progress update immediately, reschedule missed work without losing completed sessions, and return after a refresh to find their plan and progress saved.

## Inspiration & Identity
A premium, colorful education SaaS dashboard: deep navy with violet and electric-blue gradients, teal and coral accents, restrained glass effects, soft shadows, rounded cards, clear typography, and subtle motion. Responsive and keyboard accessible, with sufficient contrast and reduced-motion support.

## Why This Matters to the Learner
The learner wants to improve plan-first development and understand the reasoning behind technical decisions while building a genuinely working application.

## What "Working" Looks Like
A student enters three subjects and their topics, difficulty levels, an exam date, and available daily study hours. The app generates a realistic timetable that prioritizes difficult subjects, includes revision, and respects available time. Completing a session updates its status, the progress ring, completion percentage, and analytics. Rescheduling a missed session preserves completed work, and refreshing restores the plan and progress. Invalid input and insufficient time produce helpful messages. The key demo moment is adapting the schedule after a miss while completed sessions remain intact.

## The POC Boundary
Build a reliable, responsive end-to-end planner with a useful dashboard, subject/topic and exam input, daily availability, deterministic schedule generation with revision and difficulty prioritization, completion tracking, missed-session rescheduling, data-driven progress indicators and analytics, validation, clear feedback, and local persistence. The core workflow must use real user data. Clearly label deterministic planning and distinguish it from any genuine AI functionality. Support keyboard access and reduced motion. Prioritize the working core before optional polish and features.

## Later
A genuine AI-powered planning layer and optional focus timer, only if the deterministic core is stable and the work can be verified within the hackathon time.

## Explicitly Cut
No additional cuts have been established yet; avoid adding features beyond the POC boundary during planning.
