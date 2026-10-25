import type { SchedulePlan } from '../types/study';
import { formatDate, formatMinutes } from './OverviewDashboard';
import { EmptyState } from './EmptyState';

interface SubjectsViewProps {
  plan: SchedulePlan | null;
  onCreatePlan: () => void;
}

const durationByDifficulty = { easy: 30, medium: 45, hard: 60 } as const;

export function SubjectsView({ plan, onCreatePlan }: SubjectsViewProps) {
  if (!plan) return <div className="dashboard-content"><EmptyState eyebrow="YOUR SUBJECTS" title="Your subjects will live here" description="Create a study plan to organize subjects, topics, and difficulty in one place." actionLabel="Create My Study Plan" onAction={onCreatePlan} /></div>;
  return <div className="dashboard-content"><section className="page-heading"><div><p className="eyebrow">YOUR STUDY MATERIAL</p><h1>Subjects & <span>topics.</span></h1><p className="muted">Your plan, organized into smaller pieces you can work through.</p></div><span className="subject-total-chip">{plan.subjects.length} subjects · {plan.subjects.reduce((sum, subject) => sum + subject.topics.length, 0)} topics</span></section>
    <div className="subject-view-grid">{plan.subjects.map((subject, subjectIndex) => <article className="subject-view-card surface-card" key={subject.id}><div className="subject-view-top"><span className={`subject-view-number sv-color-${subjectIndex % 3}`}>{String(subjectIndex + 1).padStart(2, '0')}</span><div><p className="eyebrow">EXAM · {formatDate(subject.examDate)}</p><h2>{subject.name}</h2></div></div><div className="subject-topic-list">{subject.topics.map((topic, index) => <div className="subject-topic-row" key={topic.id}><span className="topic-bullet">{String(index + 1).padStart(2, '0')}</span><div><strong>{topic.name}</strong><small className={`difficulty-text difficulty-${topic.difficulty}`}>{topic.difficulty} · {formatMinutes(durationByDifficulty[topic.difficulty])} estimate</small></div><span className={`difficulty-pill difficulty-${topic.difficulty}`}>{topic.difficulty}</span></div>)}</div><div className="subject-view-foot"><span>Revision session included</span><span>{formatMinutes(plan.sessions.filter((session) => session.subjectId === subject.id && session.kind === 'revision').reduce((sum, session) => sum + session.durationMinutes, 0))}</span></div></article>)}</div>
    <p className="deterministic-note">Difficulty durations are estimates. Edit or reorganize subjects from the plan setup flow when creating a new plan.</p>
  </div>;
}
