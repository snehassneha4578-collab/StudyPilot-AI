import type { SchedulePlan } from '../types/study';

export interface DayStudyStats {
  date: string;
  plannedMinutes: number;
  completedMinutes: number;
}

export interface PlanStats {
  completedSessions: number;
  totalSessions: number;
  completionPercent: number;
  todayPlannedMinutes: number;
  todayCompletedMinutes: number;
  totalPlannedMinutes: number;
  studyStreakDays: number;
  nextExam: { subjectName: string; date: string } | null;
  week: DayStudyStats[];
}

function addDays(value: string, offset: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

export function getPlanStats(plan: SchedulePlan, today: string): PlanStats {
  const completed = plan.sessions.filter((session) => session.status === 'completed');
  const activeSessions = plan.sessions.filter((session) => session.status !== 'unscheduled');
  const todaySessions = activeSessions.filter((session) => session.date === today);
  const upcoming = plan.subjects
    .filter((subject) => subject.examDate >= today)
    .sort((a, b) => a.examDate.localeCompare(b.examDate));
  const [year, month, day] = today.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayOffset = (weekday + 6) % 7;
  const weekStart = addDays(today, -mondayOffset);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const sessions = activeSessions.filter((session) => session.date === date);
    return {
      date,
      plannedMinutes: sessions.reduce((sum, session) => sum + session.durationMinutes, 0),
      completedMinutes: sessions.filter((session) => session.status === 'completed').reduce((sum, session) => sum + session.durationMinutes, 0),
    };
  });
  const completedDates = new Set(completed.map((session) => session.date));
  let streak = 0;
  let cursor = completedDates.has(today) ? today : addDays(today, -1);
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    completedSessions: completed.length,
    totalSessions: plan.sessions.length,
    completionPercent: plan.sessions.length ? Math.round((completed.length / plan.sessions.length) * 100) : 0,
    todayPlannedMinutes: todaySessions.reduce((sum, session) => sum + session.durationMinutes, 0),
    todayCompletedMinutes: todaySessions.filter((session) => session.status === 'completed').reduce((sum, session) => sum + session.durationMinutes, 0),
    totalPlannedMinutes: activeSessions.reduce((sum, session) => sum + session.durationMinutes, 0),
    studyStreakDays: streak,
    nextExam: upcoming[0] ? { subjectName: upcoming[0].name, date: upcoming[0].examDate } : null,
    week,
  };
}
