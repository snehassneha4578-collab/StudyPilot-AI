import type {
  Difficulty,
  PlanInput,
  RescheduleOption,
  SchedulePlan,
  SchedulingPolicy,
  StudySession,
} from '../types/study';

export const DEFAULT_SCHEDULING_POLICY: Readonly<SchedulingPolicy> = {
  topicMinutesByDifficulty: { easy: 30, medium: 45, hard: 60 },
  revisionMinutesPerSubject: 30,
  dayStartMinute: 9 * 60,
};

export function dailyStudyHoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ScheduleConflict {
  code: 'INSUFFICIENT_CAPACITY' | 'NO_VALID_SLOT';
  message: string;
  affectedItems: string[];
  requiredMinutes: number;
  availableMinutes: number;
}

export type ScheduleResult =
  | { ok: true; plan: SchedulePlan }
  | { ok: false; conflict: ScheduleConflict };

export type RescheduleResult =
  | { ok: true; options: RescheduleOption[] }
  | { ok: false; message: string };

interface WorkItem {
  key: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName: string;
  kind: 'study' | 'revision';
  difficulty?: Difficulty;
  examDate: string;
  durationMinutes: number;
}

const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  hard: 0,
  medium: 1,
  easy: 2,
};

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function utcDay(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(value: string, days: number): string {
  const date = new Date(utcDay(value));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetweenInclusive(start: string, end: string): number {
  if (end < start) return 0;
  return Math.floor((utcDay(end) - utcDay(start)) / 86_400_000) + 1;
}

function formatTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minute = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

function timeInMinutes(value: string): number {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return Number.NaN;
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function validatePlanInput(input: PlanInput, today: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dailyMinutes = dailyStudyHoursToMinutes(input.dailyStudyHours);
  const exactDailyMinutes = input.dailyStudyHours * 60;
  if (!Number.isFinite(input.dailyStudyHours) || exactDailyMinutes < 30 || exactDailyMinutes > 12 * 60 || dailyMinutes < 30 || dailyMinutes > 12 * 60) {
    issues.push({ path: 'dailyStudyHours', message: 'Enter daily study time from 0.5 to 12 hours.' });
  }

  if (input.subjects.length === 0) {
    issues.push({ path: 'subjects', message: 'Add at least one subject.' });
  }

  const subjectIds = new Set<string>();
  const topicIds = new Set<string>();
  input.subjects.forEach((subject, subjectIndex) => {
    const subjectPath = `subjects.${subjectIndex}`;
    if (!subject.name.trim()) issues.push({ path: `${subjectPath}.name`, message: 'Enter a subject name.' });
    if (!subject.id.trim() || subjectIds.has(subject.id)) {
      issues.push({ path: `${subjectPath}.id`, message: 'Each subject needs a unique identifier.' });
    }
    subjectIds.add(subject.id);

    if (!isRealDate(subject.examDate)) {
      issues.push({ path: `${subjectPath}.examDate`, message: 'Enter a valid exam date.' });
    } else if (isRealDate(today) && subject.examDate <= today) {
      issues.push({ path: `${subjectPath}.examDate`, message: 'Choose an exam date after today so there is time to study and revise.' });
    }

    if (subject.topics.length === 0) {
      issues.push({ path: `${subjectPath}.topics`, message: 'Add at least one topic for this subject.' });
    }

    subject.topics.forEach((topic, topicIndex) => {
      const topicPath = `${subjectPath}.topics.${topicIndex}`;
      if (!topic.name.trim()) issues.push({ path: `${topicPath}.name`, message: 'Enter a topic name.' });
      if (!topic.id.trim() || topicIds.has(topic.id)) {
        issues.push({ path: `${topicPath}.id`, message: 'Each topic needs a unique identifier.' });
      }
      topicIds.add(topic.id);
      if (!['easy', 'medium', 'hard'].includes(topic.difficulty)) {
        issues.push({ path: `${topicPath}.difficulty`, message: 'Choose easy, medium, or hard.' });
      }
    });
  });
  return issues;
}

function buildWorkItems(input: PlanInput, policy: SchedulingPolicy): WorkItem[] {
  return input.subjects.flatMap((subject) => [
    ...subject.topics.map((topic) => ({
      key: `study:${topic.id}`,
      subjectId: subject.id,
      subjectName: subject.name.trim(),
      topicId: topic.id,
      topicName: topic.name.trim(),
      kind: 'study' as const,
      difficulty: topic.difficulty,
      examDate: subject.examDate,
      durationMinutes: policy.topicMinutesByDifficulty[topic.difficulty],
    })),
    {
      key: `revision:${subject.id}`,
      subjectId: subject.id,
      subjectName: subject.name.trim(),
      topicName: `${subject.name.trim()} revision`,
      kind: 'revision' as const,
      examDate: subject.examDate,
      durationMinutes: policy.revisionMinutesPerSubject,
    },
  ]);
}

function workloadCapacityConflict(
  items: WorkItem[],
  dailyMinutes: number,
  startDate: string,
): ScheduleConflict | undefined {
  const deadlines = [...new Set(items.map((item) => item.examDate))].sort();
  for (const deadline of deadlines) {
    // Sessions are placed strictly before their exam date.
    const daysAvailable = daysBetweenInclusive(startDate, addDays(deadline, -1));
    const dueItems = items.filter((item) => item.examDate <= deadline);
    const requiredMinutes = dueItems.reduce((sum, item) => sum + item.durationMinutes, 0);
    const availableMinutes = daysAvailable * dailyMinutes;
    if (requiredMinutes > availableMinutes) {
      return {
        code: 'INSUFFICIENT_CAPACITY',
        message: `The work due before ${deadline} needs ${requiredMinutes / 60} study hours, but only ${availableMinutes / 60} hours are available before that exam.`,
        affectedItems: dueItems.map((item) => item.topicName),
        requiredMinutes,
        availableMinutes,
      };
    }
  }
  return undefined;
}

function compareWorkItems(a: WorkItem, b: WorkItem): number {
  if (a.examDate !== b.examDate) return a.examDate.localeCompare(b.examDate);
  const aDifficulty = a.difficulty ? DIFFICULTY_ORDER[a.difficulty] : 3;
  const bDifficulty = b.difficulty ? DIFFICULTY_ORDER[b.difficulty] : 3;
  if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;
  if (a.kind !== b.kind) return a.kind === 'study' ? -1 : 1;
  return a.key.localeCompare(b.key);
}

export function generateSchedule(
  input: PlanInput,
  today: string,
  policy: SchedulingPolicy = DEFAULT_SCHEDULING_POLICY,
  now = new Date().toISOString(),
): ScheduleResult {
  const issues = validatePlanInput(input, today);
  if (issues.length > 0) {
    return {
      ok: false,
      conflict: {
        code: 'NO_VALID_SLOT',
        message: issues.map((issue) => issue.message).join(' '),
        affectedItems: [],
        requiredMinutes: 0,
        availableMinutes: 0,
      },
    };
  }

  const items = buildWorkItems(input, policy);
  const dailyMinutes = dailyStudyHoursToMinutes(input.dailyStudyHours);
  const capacityConflict = workloadCapacityConflict(items, dailyMinutes, today);
  if (capacityConflict) return { ok: false, conflict: capacityConflict };

  const scheduled = new Set<string>();
  const sessions: StudySession[] = [];
  const maxExamDate = input.subjects.map((subject) => subject.examDate).sort().at(-1)!;
  const lastStudyDate = addDays(maxExamDate, -1);

  for (let date = today; date <= lastStudyDate; date = addDays(date, 1)) {
    let usedMinutes = 0;
    while (usedMinutes < dailyMinutes) {
      const fullyStudiedSubjectIds = new Set(
        input.subjects
          .filter((subject) => subject.topics.every((topic) => scheduled.has(`study:${topic.id}`)))
          .map((subject) => subject.id),
      );
      const candidates = items
        .filter((item) => !scheduled.has(item.key) && item.examDate > date)
        .filter((item) => item.kind === 'study' || fullyStudiedSubjectIds.has(item.subjectId))
        .sort(compareWorkItems);
      const nextItem = candidates.find((item) => item.durationMinutes <= dailyMinutes - usedMinutes);
      if (!nextItem) break;

      const startMinute = policy.dayStartMinute + usedMinutes;
      sessions.push({
        id: nextItem.key,
        subjectId: nextItem.subjectId,
        subjectName: nextItem.subjectName,
        topicId: nextItem.topicId,
        topicName: nextItem.topicName,
        kind: nextItem.kind,
        difficulty: nextItem.difficulty,
        date,
        startTime: formatTime(startMinute),
        durationMinutes: nextItem.durationMinutes,
        durationIsEstimate: true,
        status: 'planned',
      });
      scheduled.add(nextItem.key);
      usedMinutes += nextItem.durationMinutes;
    }
  }

  if (scheduled.size !== items.length) {
    const unscheduledItems = items.filter((item) => !scheduled.has(item.key));
    return {
      ok: false,
      conflict: {
        code: 'NO_VALID_SLOT',
        message: 'The remaining work cannot fit into valid study slots before the exam dates. No partial plan was created.',
        affectedItems: unscheduledItems.map((item) => item.topicName),
        requiredMinutes: unscheduledItems.reduce((sum, item) => sum + item.durationMinutes, 0),
        availableMinutes: 0,
      },
    };
  }

  return {
    ok: true,
    plan: {
      schemaVersion: 1,
      id: `plan-${now}`,
      createdAt: now,
      dailyStudyHours: dailyMinutes / 60,
      subjects: input.subjects,
      sessions,
    },
  };
}

export function markSessionCompleted(plan: SchedulePlan, sessionId: string): SchedulePlan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => session.id === sessionId && session.status === 'planned'
      ? { ...session, status: 'completed' }
      : session),
  };
}

export function getRescheduleOptions(
  plan: SchedulePlan,
  sessionId: string,
  today: string,
  policy: SchedulingPolicy = DEFAULT_SCHEDULING_POLICY,
): RescheduleResult {
  const session = plan.sessions.find((item) => item.id === sessionId);
  if (!session) return { ok: false, message: 'This session is no longer in the plan.' };
  if (session.status === 'completed') return { ok: false, message: 'Completed sessions cannot be rescheduled.' };
  const subject = plan.subjects.find((item) => item.id === session.subjectId);
  if (!subject) return { ok: false, message: 'The subject for this session could not be found.' };

  // A future session can move later on the same day. For a session already
  // scheduled today, skip today because this API has no current-time input.
  // An overdue session may still use today's remaining schedule.
  const searchStart = session.date > today
    ? session.date
    : session.date < today
      ? today
      : addDays(today, 1);
  const lastAvailableDate = addDays(subject.examDate, -1);
  const dailyLimit = dailyStudyHoursToMinutes(plan.dailyStudyHours);
  const options: RescheduleOption[] = [];

  for (let date = searchStart; date <= lastAvailableDate && options.length < 7; date = addDays(date, 1)) {
    const sessionsForDay = plan.sessions.filter((item) => item.id !== session.id && item.date === date && item.status !== 'unscheduled');
    // Completed records remain immutable and block overlapping times, but
    // they no longer consume the available study-minute budget.
    const usedMinutes = sessionsForDay
      .filter((item) => item.status === 'planned')
      .reduce((sum, item) => sum + item.durationMinutes, 0);
    const availableMinutes = dailyLimit - usedMinutes;
    if (availableMinutes < session.durationMinutes) continue;

    const earliestStart = date === session.date
      ? timeInMinutes(session.startTime) + session.durationMinutes
      : policy.dayStartMinute;
    let startMinute = earliestStart;
    const occupied = sessionsForDay
      .map((item) => ({ start: timeInMinutes(item.startTime), end: timeInMinutes(item.startTime) + item.durationMinutes }))
      .sort((a, b) => a.start - b.start);
    for (const interval of occupied) {
      if (interval.end <= startMinute) continue;
      if (interval.start >= startMinute + session.durationMinutes) break;
      startMinute = interval.end;
    }
    options.push({ date, startTime: formatTime(startMinute), availableMinutes });
  }

  if (options.length === 0) {
    return {
      ok: false,
      message: `There is no open ${session.durationMinutes}-minute slot before ${formatISODate(subject.examDate)} without changing your daily limit.`,
    };
  }
  return { ok: true, options };
}

function formatISODate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function moveSessionToDate(
  plan: SchedulePlan,
  sessionId: string,
  option: RescheduleOption,
): SchedulePlan | null {
  const session = plan.sessions.find((item) => item.id === sessionId);
  if (!session || session.status === 'completed') return null;
  const subject = plan.subjects.find((item) => item.id === session.subjectId);
  if (!subject || option.date >= subject.examDate || option.date < session.date) return null;
  const startMinute = timeInMinutes(option.startTime);
  if (!Number.isFinite(startMinute)) return null;
  if (option.date === session.date && startMinute < timeInMinutes(session.startTime) + session.durationMinutes) return null;
  const dailyLimit = dailyStudyHoursToMinutes(plan.dailyStudyHours);
  const existing = plan.sessions.filter((item) => item.id !== session.id && item.date === option.date && item.status !== 'unscheduled');
  const usedMinutes = existing
    .filter((item) => item.status === 'planned')
    .reduce((sum, item) => sum + item.durationMinutes, 0);
  const endMinute = startMinute + session.durationMinutes;
  if (endMinute > 24 * 60) return null;
  if (usedMinutes + session.durationMinutes > dailyLimit) return null;
  if (existing.some((item) => {
    const itemStart = timeInMinutes(item.startTime);
    const itemEnd = itemStart + item.durationMinutes;
    return startMinute < itemEnd && itemStart < endMinute;
  })) return null;
  return {
    ...plan,
    sessions: plan.sessions.map((item) => item.id === session.id
      ? { ...item, originalDate: item.originalDate ?? (option.date === item.date ? undefined : item.date), date: option.date, startTime: option.startTime, status: 'planned', unscheduledReason: undefined }
      : item),
  };
}

export interface PrioritySwapCandidate {
  date: string;
  startTime: string;
  deferredSessionId: string;
  deferredSessionLabel: string;
}

export function getPrioritySwapCandidates(plan: SchedulePlan, sessionId: string, today: string): PrioritySwapCandidate[] {
  const target = plan.sessions.find((item) => item.id === sessionId);
  const subject = target && plan.subjects.find((item) => item.id === target.subjectId);
  if (!target || !subject || target.status !== 'planned') return [];
  const targetDeadline = subject.examDate;
  const dailyLimit = dailyStudyHoursToMinutes(plan.dailyStudyHours);

  return plan.sessions
    .filter((item) => item.id !== target.id && item.status === 'planned' && item.date > target.date && item.date >= today)
    .filter((item) => item.durationMinutes >= target.durationMinutes)
    .filter((item) => item.date < targetDeadline)
    .map((item) => ({
      date: item.date,
      startTime: item.startTime,
      deferredSessionId: item.id,
      deferredSessionLabel: `${item.subjectName} · ${item.topicName}`,
    }))
    .filter((candidate) => {
      const victim = plan.sessions.find((item) => item.id === candidate.deferredSessionId)!;
      const targetDay = plan.sessions.filter((item) => item.id !== target.id && item.id !== victim.id && item.date === candidate.date && item.status !== 'unscheduled');
      const used = targetDay.filter((item) => item.status === 'planned').reduce((sum, item) => sum + item.durationMinutes, 0);
      const start = timeInMinutes(candidate.startTime);
      const end = start + target.durationMinutes;
      const overlaps = targetDay.some((item) => {
        const itemStart = timeInMinutes(item.startTime);
        const itemEnd = itemStart + item.durationMinutes;
        return start < itemEnd && itemStart < end;
      });
      return Number.isFinite(start) && used + target.durationMinutes <= dailyLimit && !overlaps;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.deferredSessionLabel.localeCompare(b.deferredSessionLabel));
}

export function prioritizeSessionByDeferring(
  plan: SchedulePlan,
  sessionId: string,
  candidate: PrioritySwapCandidate,
): SchedulePlan | null {
  const target = plan.sessions.find((item) => item.id === sessionId);
  const deferred = plan.sessions.find((item) => item.id === candidate.deferredSessionId);
  if (!target || !deferred || target.status !== 'planned' || deferred.status !== 'planned') return null;
  const subject = plan.subjects.find((item) => item.id === target.subjectId);
  if (!subject || candidate.date >= subject.examDate || candidate.date <= target.date) return null;
  const sameDay = plan.sessions.filter((item) => item.date === candidate.date && item.id !== target.id && item.id !== deferred.id && item.status !== 'unscheduled');
  const used = sameDay.filter((item) => item.status === 'planned').reduce((sum, item) => sum + item.durationMinutes, 0);
  const candidateStart = timeInMinutes(candidate.startTime);
  const candidateEnd = candidateStart + target.durationMinutes;
  const overlaps = sameDay.some((item) => {
    const itemStart = timeInMinutes(item.startTime);
    const itemEnd = itemStart + item.durationMinutes;
    return candidateStart < itemEnd && itemStart < candidateEnd;
  });
  if (!Number.isFinite(candidateStart) || overlaps || used + target.durationMinutes > dailyStudyHoursToMinutes(plan.dailyStudyHours)) return null;

  return {
    ...plan,
    sessions: plan.sessions.map((item) => {
      if (item.id === deferred.id) return { ...item, status: 'unscheduled', unscheduledReason: 'Deferred by your choice to prioritize an essential topic.' };
      if (item.id === target.id) return { ...item, originalDate: item.originalDate ?? item.date, date: candidate.date, startTime: candidate.startTime, priority: 'essential' };
      return item;
    }),
  };
}
