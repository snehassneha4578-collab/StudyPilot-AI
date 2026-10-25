import type { SchedulePlan } from '../types/study';

export const PLAN_STORAGE_KEY = 'studyPilot.plan.v1';

export type LoadPlanResult =
  | { ok: true; plan: SchedulePlan | null }
  | { ok: false; message: string };

export function loadSavedPlan(storage?: Storage): LoadPlanResult {
  try {
    const target = storage ?? window.localStorage;
    const serialized = target.getItem(PLAN_STORAGE_KEY);
    if (serialized === null) return { ok: true, plan: null };
    const value: unknown = JSON.parse(serialized);
    if (!isSchedulePlan(value)) {
      return { ok: false, message: 'The saved plan could not be read. It has been left untouched.' };
    }
    return { ok: true, plan: value };
  } catch {
    return { ok: false, message: 'StudyPilot could not access saved browser storage. Your current session can continue, but changes may not persist after refresh.' };
  }
}

export function savePlanLocally(plan: SchedulePlan, storage?: Storage): { ok: true } | { ok: false; message: string } {
  try {
    const target = storage ?? window.localStorage;
    target.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    return { ok: true };
  } catch {
    return { ok: false, message: 'This change is visible now, but browser storage could not save it. It may not remain after refresh.' };
  }
}

function isSchedulePlan(value: unknown): value is SchedulePlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<SchedulePlan>;
  return plan.schemaVersion === 1
    && typeof plan.id === 'string'
    && typeof plan.dailyStudyHours === 'number'
    && Array.isArray(plan.subjects)
    && Array.isArray(plan.sessions)
    && plan.sessions.every((session) => session && typeof session.id === 'string'
      && typeof session.date === 'string'
      && typeof session.durationMinutes === 'number'
      && (session.status === 'planned' || session.status === 'completed' || session.status === 'unscheduled'));
}
