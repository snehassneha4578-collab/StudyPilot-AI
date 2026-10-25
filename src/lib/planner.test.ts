import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCHEDULING_POLICY,
  generateSchedule,
  getRescheduleOptions,
  getPrioritySwapCandidates,
  markSessionCompleted,
  moveSessionToDate,
  prioritizeSessionByDeferring,
  validatePlanInput,
} from './planner';
import type { PlanInput, SchedulePlan } from '../types/study';

const samplePlan: PlanInput = {
  dailyStudyHours: 2,
  subjects: [
    {
      id: 'math',
      name: 'Engineering Math',
      examDate: '2026-11-10',
      topics: [
        { id: 'integrals', name: 'Integrals', difficulty: 'hard' },
        { id: 'matrices', name: 'Matrices', difficulty: 'easy' },
      ],
    },
    {
      id: 'physics',
      name: 'Physics',
      examDate: '2026-11-11',
      topics: [{ id: 'circuits', name: 'Circuits', difficulty: 'medium' }],
    },
  ],
};

describe('validatePlanInput', () => {
  it('accepts complete input with a future exam date and half-hour study time', () => {
    expect(validatePlanInput(samplePlan, '2026-11-01')).toEqual([]);
  });

  it('accepts daily availability normalized to a whole-minute value', () => {
    expect(validatePlanInput({ ...samplePlan, dailyStudyHours: 1.75 }, '2026-11-01')).toEqual([]);
  });

  it('rejects an exam scheduled for today', () => {
    const input: PlanInput = {
      dailyStudyHours: 2,
      subjects: [{ id: 's1', name: 'Social', examDate: '2026-10-25', topics: [{ id: 't1', name: 'History', difficulty: 'easy' }] }],
    };
    expect(validatePlanInput(input, '2026-10-25')).toContainEqual(expect.objectContaining({
      path: 'subjects.0.examDate',
      message: 'Choose an exam date after today so there is time to study and revise.',
    }));
  });

  it('accepts tomorrow as a future exam date at the date-validation boundary', () => {
    const input: PlanInput = {
      dailyStudyHours: 2,
      subjects: [{ id: 's1', name: 'Social', examDate: '2026-10-26', topics: [{ id: 't1', name: 'History', difficulty: 'easy' }] }],
    };
    expect(validatePlanInput(input, '2026-10-25').filter((issue) => issue.path === 'subjects.0.examDate')).toEqual([]);
  });

  it('generates a valid plan for a tomorrow exam without crossing the deadline', () => {
    const input: PlanInput = {
      dailyStudyHours: 2,
      subjects: [{ id: 's1', name: 'Social', examDate: '2026-10-26', topics: [{ id: 't1', name: 'History', difficulty: 'easy' }] }],
    };
    const result = generateSchedule(input, '2026-10-25', DEFAULT_SCHEDULING_POLICY, '2026-10-25T10:00:00.000Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.sessions.every((session) => session.date < '2026-10-26')).toBe(true);
  });

  it('rejects past dates and malformed calendar dates', () => {
    const past: PlanInput = {
      dailyStudyHours: 2,
      subjects: [{ id: 's1', name: 'Social', examDate: '2026-10-24', topics: [{ id: 't1', name: 'History', difficulty: 'easy' }] }],
    };
    const malformed: PlanInput = {
      ...past,
      subjects: [{ ...past.subjects[0], examDate: '2026-02-30' }],
    };
    expect(validatePlanInput(past, '2026-10-25').some((issue) => issue.path === 'subjects.0.examDate')).toBe(true);
    expect(validatePlanInput(malformed, '2026-10-25')).toContainEqual(expect.objectContaining({
      path: 'subjects.0.examDate',
      message: 'Enter a valid exam date.',
    }));
  });

  it('rejects blank subjects and topics, invalid dates, and out-of-range hours', () => {
    const invalid: PlanInput = {
      dailyStudyHours: 13,
      subjects: [{
        id: 's1', name: ' ', examDate: '2026-02-30', topics: [{ id: 't1', name: ' ', difficulty: 'easy' }],
      }],
    };
    const issues = validatePlanInput(invalid, '2026-11-01');
    expect(issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
      'dailyStudyHours', 'subjects.0.name', 'subjects.0.examDate', 'subjects.0.topics.0.name',
    ]));
  });

  it('requires unique subject and topic IDs', () => {
    const duplicate: PlanInput = {
      dailyStudyHours: 1,
      subjects: [
        { ...samplePlan.subjects[0], topics: [{ id: 'same', name: 'One', difficulty: 'easy' }] },
        { id: 'math', name: 'Other', examDate: '2026-11-10', topics: [{ id: 'same', name: 'Two', difficulty: 'easy' }] },
      ],
    };
    const issues = validatePlanInput(duplicate, '2026-11-01');
    expect(issues.some((issue) => issue.path === 'subjects.1.id')).toBe(true);
    expect(issues.some((issue) => issue.path === 'subjects.1.topics.0.id')).toBe(true);
  });
});

describe('generateSchedule', () => {
  it('schedules topic estimates and one revision per subject before each exam', () => {
    const result = generateSchedule(samplePlan, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.sessions.filter((session) => session.kind === 'revision')).toHaveLength(2);
    expect(result.plan.sessions.every((session) => session.date < result.plan.subjects.find((subject) => subject.id === session.subjectId)!.examDate)).toBe(true);
    expect(result.plan.sessions.find((session) => session.topicId === 'integrals')?.durationMinutes).toBe(60);
    expect(result.plan.sessions.find((session) => session.topicId === 'matrices')?.durationMinutes).toBe(30);
    expect(result.plan.sessions.every((session) => session.durationIsEstimate)).toBe(true);
  });

  it('never exceeds the daily study-hour limit', () => {
    const result = generateSchedule(samplePlan, '2026-11-01');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const minutesByDay = new Map<string, number>();
    result.plan.sessions.forEach((session) => {
      minutesByDay.set(session.date, (minutesByDay.get(session.date) ?? 0) + session.durationMinutes);
    });
    expect([...minutesByDay.values()].every((minutes) => minutes <= 120)).toBe(true);
  });

  it('schedules against normalized minute capacity for decimal-hour availability', () => {
    const result = generateSchedule({ ...samplePlan, dailyStudyHours: 1.751 }, '2026-11-01');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.dailyStudyHours).toBe(1.75);
    const minutesByDay = new Map<string, number>();
    result.plan.sessions.forEach((session) => {
      minutesByDay.set(session.date, (minutesByDay.get(session.date) ?? 0) + session.durationMinutes);
    });
    expect([...minutesByDay.values()].every((minutes) => minutes <= 105)).toBe(true);
  });

  it('prioritizes a harder topic before an easier topic with the same deadline', () => {
    const result = generateSchedule({
      dailyStudyHours: 1.5,
      subjects: [{
        id: 's1', name: 'Subject', examDate: '2026-11-05', topics: [
          { id: 'easy', name: 'Easy topic', difficulty: 'easy' },
          { id: 'hard', name: 'Hard topic', difficulty: 'hard' },
        ],
      }],
    }, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const studySessions = result.plan.sessions.filter((session) => session.kind === 'study');
    expect(studySessions[0].topicId).toBe('hard');
  });

  it('rejects impossible workload without returning or saving a partial plan', () => {
    const impossible: PlanInput = {
      dailyStudyHours: 0.5,
      subjects: [{
        id: 's1', name: 'Subject', examDate: '2026-11-03', topics: [
          { id: 'hard', name: 'Hard topic', difficulty: 'hard' },
        ],
      }],
    };
    const result = generateSchedule(impossible, '2026-11-01');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.conflict.code).toBe('INSUFFICIENT_CAPACITY');
    expect(result.conflict.affectedItems).toContain('Hard topic');
  });

  it('keeps all sessions on or before the day before the exam', () => {
    const result = generateSchedule(samplePlan, '2026-11-01');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.sessions.every((session) => session.date < result.plan.subjects.find((subject) => subject.id === session.subjectId)!.examDate)).toBe(true);
  });

  it('places each revision after the topics for that subject', () => {
    const result = generateSchedule(samplePlan, '2026-11-01');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const subject of result.plan.subjects) {
      const topics = result.plan.sessions.filter((session) => session.subjectId === subject.id && session.kind === 'study');
      const revision = result.plan.sessions.find((session) => session.subjectId === subject.id && session.kind === 'revision')!;
      const latestTopic = [...topics].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).at(-1)!;
      expect(revision.date > latestTopic.date || (revision.date === latestTopic.date && revision.startTime > latestTopic.startTime)).toBe(true);
    }
  });
});

describe('session actions', () => {
  const generated = generateSchedule(samplePlan, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');

  it('marks a planned session complete without changing other sessions', () => {
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const target = generated.plan.sessions[0];
    const changed = markSessionCompleted(generated.plan, target.id);
    expect(changed.sessions.find((session) => session.id === target.id)?.status).toBe('completed');
    expect(changed.sessions.filter((session) => session.id !== target.id)).toEqual(
      generated.plan.sessions.filter((session) => session.id !== target.id),
    );
    expect(markSessionCompleted(changed, target.id).sessions.find((session) => session.id === target.id)?.status).toBe('completed');
  });

  it('suggests only dates before the exam with enough remaining daily time', () => {
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const target = generated.plan.sessions.find((session) => session.kind === 'study')!;
    const options = getRescheduleOptions(generated.plan, target.id, '2026-11-01');
    expect(options.ok).toBe(true);
    if (!options.ok) return;
    expect(options.options.length).toBeGreaterThan(0);
    expect(options.options.every((option) => option.date > target.date)).toBe(true);
    expect(options.options.every((option) => option.date < generated.plan.subjects.find((subject) => subject.id === target.subjectId)!.examDate)).toBe(true);
    expect(options.options.every((option) => option.availableMinutes >= target.durationMinutes)).toBe(true);
  });

  it('moves only an uncompleted session into a valid option and preserves its original date', () => {
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const target = generated.plan.sessions.find((session) => session.kind === 'study')!;
    const result = getRescheduleOptions(generated.plan, target.id, '2026-11-01');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const moved = moveSessionToDate(generated.plan, target.id, result.options[0]);
    expect(moved?.sessions.find((session) => session.id === target.id)?.date).toBe(result.options[0].date);
    expect(moved?.sessions.find((session) => session.id === target.id)?.originalDate).toBe(target.date);
    expect(moveSessionToDate(markSessionCompleted(generated.plan, target.id), target.id, result.options[0])).toBeNull();
  });

  it('keeps displaced work visible when the student explicitly prioritizes a topic', () => {
    const plan = {
      schemaVersion: 1 as const,
      id: 'plan',
      createdAt: '2026-11-01T08:00:00.000Z',
      dailyStudyHours: 2,
      subjects: [
        { id: 'math', name: 'Math', examDate: '2026-11-05', topics: [{ id: 'missed-topic', name: 'Algebra', difficulty: 'easy' as const }] },
        { id: 'physics', name: 'Physics', examDate: '2026-11-08', topics: [{ id: 'other-topic', name: 'Waves', difficulty: 'hard' as const }] },
      ],
      sessions: [
        { id: 'missed', subjectId: 'math', subjectName: 'Math', topicId: 'missed-topic', topicName: 'Algebra', kind: 'study' as const, difficulty: 'easy' as const, date: '2026-11-01', startTime: '09:00', durationMinutes: 30, durationIsEstimate: true as const, status: 'planned' as const },
        { id: 'move-aside', subjectId: 'physics', subjectName: 'Physics', topicId: 'other-topic', topicName: 'Waves', kind: 'study' as const, difficulty: 'hard' as const, date: '2026-11-03', startTime: '09:00', durationMinutes: 60, durationIsEstimate: true as const, status: 'planned' as const },
      ],
    };
    const candidate = getPrioritySwapCandidates(plan, 'missed', '2026-11-02')[0];
    expect(candidate?.deferredSessionId).toBe('move-aside');
    const updated = prioritizeSessionByDeferring(plan, 'missed', candidate);
    expect(updated?.sessions.find((session) => session.id === 'missed')?.priority).toBe('essential');
    expect(updated?.sessions.find((session) => session.id === 'move-aside')?.status).toBe('unscheduled');
    expect(updated?.sessions.find((session) => session.id === 'move-aside')?.unscheduledReason).toContain('your choice');
  });

  it('does not offer reschedule dates on or beyond the exam deadline', () => {
    const nearExam = {
      schemaVersion: 1 as const,
      id: 'plan',
      createdAt: '2026-11-01T08:00:00.000Z',
      dailyStudyHours: 1,
      subjects: [{ id: 's1', name: 'Math', examDate: '2026-11-03', topics: [{ id: 't1', name: 'Algebra', difficulty: 'easy' as const }] }],
      sessions: [{ id: 's1-t1', subjectId: 's1', subjectName: 'Math', topicId: 't1', topicName: 'Algebra', kind: 'study' as const, difficulty: 'easy' as const, date: '2026-11-02', startTime: '09:00', durationMinutes: 30, durationIsEstimate: true as const, status: 'planned' as const }],
    };
    const options = getRescheduleOptions(nearExam, 's1-t1', '2026-11-02');
    expect(options.ok).toBe(false);
  });

  it('offers a later slot on the same future day when the exam is the next day', () => {
    const nearDeadline: SchedulePlan = {
      schemaVersion: 1,
      id: 'near-deadline',
      createdAt: '2026-10-25T08:00:00.000Z',
      dailyStudyHours: 1.5,
      subjects: [
        { id: 'social', name: 'Social', examDate: '2026-11-03', topics: [{ id: 'social-topic', name: 'Civics', difficulty: 'easy' }] },
        { id: 'history', name: 'History', examDate: '2026-10-28', topics: [{ id: 'history-topic', name: 'History', difficulty: 'medium' }] },
      ],
      sessions: [
        { id: 'social-revision', subjectId: 'social', subjectName: 'Social', topicName: 'Social revision', kind: 'revision', date: '2026-10-27', startTime: '09:00', durationMinutes: 30, durationIsEstimate: true, status: 'completed' },
        { id: 'history-session', subjectId: 'history', subjectName: 'History', topicId: 'history-topic', topicName: 'History', kind: 'study', difficulty: 'medium', date: '2026-10-27', startTime: '09:30', durationMinutes: 45, durationIsEstimate: true, status: 'planned' },
      ],
    };
    const adjusted = { ...nearDeadline, dailyStudyHours: 3.5 };
    const options = getRescheduleOptions(adjusted, 'history-session', '2026-10-25');

    expect(options).toEqual({
      ok: true,
      options: [{ date: '2026-10-27', startTime: '10:15', availableMinutes: 210 }],
    });
    if (!options.ok) return;
    const moved = moveSessionToDate(adjusted, 'history-session', options.options[0]);
    expect(moved?.dailyStudyHours).toBe(3.5);
    expect(moved?.sessions.find((session) => session.id === 'history-session')).toMatchObject({ date: '2026-10-27', startTime: '10:15', status: 'planned' });
    expect(moved?.sessions.find((session) => session.id === 'social-revision')).toMatchObject({ date: '2026-10-27', startTime: '09:00', status: 'completed' });
    expect(nearDeadline.dailyStudyHours).toBe(1.5);
    expect(nearDeadline.sessions.find((session) => session.id === 'history-session')?.startTime).toBe('09:30');
  });

  it('keeps completed sessions out of the minute budget but never overlaps them', () => {
    const exactCase: SchedulePlan = {
      schemaVersion: 1,
      id: 'completed-slot',
      createdAt: '2026-10-25T08:00:00.000Z',
      dailyStudyHours: 3.5,
      subjects: [{ id: 'history', name: 'History', examDate: '2026-10-28', topics: [{ id: 'history-topic', name: 'History', difficulty: 'medium' }] }],
      sessions: [
        { id: 'completed', subjectId: 'history', subjectName: 'History', topicName: 'History revision', kind: 'revision', date: '2026-10-27', startTime: '09:00', durationMinutes: 30, durationIsEstimate: true, status: 'completed' },
        { id: 'target', subjectId: 'history', subjectName: 'History', topicId: 'history-topic', topicName: 'History', kind: 'study', difficulty: 'medium', date: '2026-10-27', startTime: '09:30', durationMinutes: 45, durationIsEstimate: true, status: 'planned' },
      ],
    };
    const options = getRescheduleOptions(exactCase, 'target', '2026-10-25');
    expect(options.ok).toBe(true);
    if (!options.ok) return;
    expect(options.options[0]).toMatchObject({ date: '2026-10-27', startTime: '10:15', availableMinutes: 210 });
    expect(moveSessionToDate(exactCase, 'target', { ...options.options[0], startTime: '09:00' })).toBeNull();
    expect(moveSessionToDate(exactCase, 'target', { ...options.options[0], startTime: '09:45' })).toBeNull();
  });

  it('does not offer a same-day slot when the session is today and the current time is unknown', () => {
    const todaySession: SchedulePlan = {
      schemaVersion: 1,
      id: 'today-session',
      createdAt: '2026-10-27T08:00:00.000Z',
      dailyStudyHours: 3.5,
      subjects: [{ id: 'history', name: 'History', examDate: '2026-10-28', topics: [{ id: 'history-topic', name: 'History', difficulty: 'medium' }] }],
      sessions: [{ id: 'target', subjectId: 'history', subjectName: 'History', topicId: 'history-topic', topicName: 'History', kind: 'study', difficulty: 'medium', date: '2026-10-27', startTime: '09:30', durationMinutes: 45, durationIsEstimate: true, status: 'planned' }],
    };
    expect(getRescheduleOptions(todaySession, 'target', '2026-10-27').ok).toBe(false);
  });

  it('allows an overdue session to use the next valid slot today', () => {
    const overdue: SchedulePlan = {
      schemaVersion: 1,
      id: 'overdue-session',
      createdAt: '2026-10-25T08:00:00.000Z',
      dailyStudyHours: 2,
      subjects: [{ id: 'history', name: 'History', examDate: '2026-10-29', topics: [{ id: 'history-topic', name: 'History', difficulty: 'medium' }] }],
      sessions: [{ id: 'target', subjectId: 'history', subjectName: 'History', topicId: 'history-topic', topicName: 'History', kind: 'study', difficulty: 'medium', date: '2026-10-26', startTime: '09:00', durationMinutes: 45, durationIsEstimate: true, status: 'planned' }],
    };
    const options = getRescheduleOptions(overdue, 'target', '2026-10-27');
    expect(options.ok).toBe(true);
    if (options.ok) expect(options.options[0]).toMatchObject({ date: '2026-10-27', startTime: '09:00' });
  });

  it('restores an unscheduled session to the timetable only after a valid slot is chosen', () => {
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const target = generated.plan.sessions[0];
    const unscheduledPlan = { ...generated.plan, sessions: generated.plan.sessions.map((session) => session.id === target.id ? { ...session, status: 'unscheduled' as const, unscheduledReason: 'Deferred by the learner.' } : session) };
    const options = getRescheduleOptions(unscheduledPlan, target.id, '2026-11-01');
    expect(options.ok).toBe(true);
    if (!options.ok) return;
    const moved = moveSessionToDate(unscheduledPlan, target.id, options.options[0]);
    expect(moved?.sessions.find((session) => session.id === target.id)?.status).toBe('planned');
    expect(moved?.sessions.find((session) => session.id === target.id)?.unscheduledReason).toBeUndefined();
  });
});
