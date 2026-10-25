import { describe, expect, it } from 'vitest';
import { DEFAULT_SCHEDULING_POLICY, generateSchedule, markSessionCompleted } from './planner';
import { getPlanStats } from './stats';

describe('getPlanStats', () => {
  it('derives progress, upcoming exam, daily totals, and chart bars from plan sessions', () => {
    const generated = generateSchedule({
      dailyStudyHours: 2,
      subjects: [{ id: 's1', name: 'Math', examDate: '2026-11-10', topics: [{ id: 't1', name: 'Algebra', difficulty: 'easy' }] }],
    }, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const firstSession = generated.plan.sessions[0];
    const plan = markSessionCompleted(generated.plan, firstSession.id);
    const stats = getPlanStats(plan, firstSession.date);
    expect(stats.completedSessions).toBe(1);
    expect(stats.totalSessions).toBe(2);
    expect(stats.completionPercent).toBe(50);
    expect(stats.todayCompletedMinutes).toBe(firstSession.durationMinutes);
    expect(stats.nextExam?.subjectName).toBe('Math');
    expect(stats.week.some((day) => day.completedMinutes > 0)).toBe(true);
  });

  it('returns zero real progress and no streak before any session is completed', () => {
    const generated = generateSchedule({
      dailyStudyHours: 2,
      subjects: [{ id: 's1', name: 'Math', examDate: '2026-11-10', topics: [{ id: 't1', name: 'Algebra', difficulty: 'easy' }] }],
    }, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const stats = getPlanStats(generated.plan, '2026-11-01');
    expect(stats.completedSessions).toBe(0);
    expect(stats.completionPercent).toBe(0);
    expect(stats.studyStreakDays).toBe(0);
  });
});
