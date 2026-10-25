export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TopicInput {
  id: string;
  name: string;
  difficulty: Difficulty;
}

export interface SubjectInput {
  id: string;
  name: string;
  examDate: string;
  topics: TopicInput[];
}

export interface PlanInput {
  dailyStudyHours: number;
  subjects: SubjectInput[];
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName: string;
  kind: 'study' | 'revision';
  difficulty?: Difficulty;
  date: string;
  startTime: string;
  durationMinutes: number;
  durationIsEstimate: true;
  status: 'planned' | 'completed' | 'unscheduled';
  originalDate?: string;
  unscheduledReason?: string;
  priority?: 'standard' | 'essential';
}

export interface SchedulePlan extends PlanInput {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  sessions: StudySession[];
}

export interface RescheduleOption {
  date: string;
  startTime: string;
  availableMinutes: number;
}

export interface SchedulingPolicy {
  topicMinutesByDifficulty: Record<Difficulty, number>;
  revisionMinutesPerSubject: number;
  dayStartMinute: number;
}
