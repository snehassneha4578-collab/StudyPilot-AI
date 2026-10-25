import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { markSessionCompleted, moveSessionToDate } from '../lib/planner';
import { loadSavedPlan, savePlanLocally } from '../lib/storage';
import type { RescheduleOption, SchedulePlan } from '../types/study';

interface StudyPlanContextValue {
  plan: SchedulePlan | null;
  storageMessage: string | null;
  savePlan: (plan: SchedulePlan) => void;
  completeSession: (sessionId: string) => void;
  moveSession: (sessionId: string, option: RescheduleOption) => boolean;
  clearStorageMessage: () => void;
}

const StudyPlanContext = createContext<StudyPlanContextValue | null>(null);

function readInitial() {
  const result = loadSavedPlan();
  return { plan: result.ok ? result.plan : null, message: result.ok ? null : result.message };
}

export function StudyPlanProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(readInitial, []);
  const [plan, setPlan] = useState<SchedulePlan | null>(initial.plan);
  const [storageMessage, setStorageMessage] = useState<string | null>(initial.message);
  const [storageReadable] = useState(initial.message === null);

  const persist = (next: SchedulePlan) => {
    setPlan(next);
    if (!storageReadable) {
      setStorageMessage('The previous saved data was left untouched. This new plan is temporary because StudyPilot could not safely read browser storage.');
      return;
    }
    const result = savePlanLocally(next);
    setStorageMessage(result.ok ? null : result.message);
  };

  const value: StudyPlanContextValue = {
    plan,
    storageMessage,
    savePlan: persist,
    completeSession: (sessionId) => {
      if (!plan) return;
      persist(markSessionCompleted(plan, sessionId));
    },
    moveSession: (sessionId, option) => {
      if (!plan) return false;
      const next = moveSessionToDate(plan, sessionId, option);
      if (!next) return false;
      persist(next);
      return true;
    },
    clearStorageMessage: () => setStorageMessage(null),
  };

  return <StudyPlanContext.Provider value={value}>{children}</StudyPlanContext.Provider>;
}

export function useStudyPlan(): StudyPlanContextValue {
  const context = useContext(StudyPlanContext);
  if (!context) throw new Error('useStudyPlan must be used inside StudyPlanProvider.');
  return context;
}
