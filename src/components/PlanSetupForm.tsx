import { useMemo, useState } from 'react';
import { DEFAULT_SCHEDULING_POLICY, generateSchedule, validatePlanInput } from '../lib/planner';
import { parseDailyStudyTime } from '../lib/dailyStudyTime';
import type { Difficulty, PlanInput, SchedulePlan, SubjectInput, TopicInput } from '../types/study';
import { formatMinutes } from './OverviewDashboard';

interface PlanSetupFormProps {
  onCancel: () => void;
  onGenerated: (plan: SchedulePlan) => void;
}

const makeId = () => crypto.randomUUID();
const newTopic = (): TopicInput => ({ id: makeId(), name: '', difficulty: 'medium' });
const newSubject = (): SubjectInput => ({ id: makeId(), name: '', examDate: '', topics: [newTopic()] });
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const tomorrowISO = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};

export function PlanSetupForm({ onCancel, onGenerated }: PlanSetupFormProps) {
  const [step, setStep] = useState(1);
  const [dailyStudyTime, setDailyStudyTime] = useState('2');
  const [subjects, setSubjects] = useState<SubjectInput[]>([newSubject()]);
  const [errors, setErrors] = useState<string[]>([]);

  const workload = useMemo(() => subjects.reduce((sum, subject) => sum + subject.topics.reduce((topicSum, topic) => topicSum + DEFAULT_SCHEDULING_POLICY.topicMinutesByDifficulty[topic.difficulty], 0) + DEFAULT_SCHEDULING_POLICY.revisionMinutesPerSubject, 0), [subjects]);
  const parsedDailyStudyTime = useMemo(() => parseDailyStudyTime(dailyStudyTime), [dailyStudyTime]);

  const updateSubject = (id: string, update: (subject: SubjectInput) => SubjectInput) => setSubjects((current) => current.map((subject) => subject.id === id ? update(subject) : subject));
  const updateTopic = (subjectId: string, topicId: string, update: (topic: TopicInput) => TopicInput) => updateSubject(subjectId, (subject) => ({ ...subject, topics: subject.topics.map((topic) => topic.id === topicId ? update(topic) : topic) }));

  const goNext = () => {
    const nextErrors: string[] = [];
    if (step === 1) {
      subjects.forEach((subject, index) => {
        if (!subject.name.trim()) nextErrors.push(`Add a name for subject ${index + 1}.`);
        if (subject.topics.length === 0 || subject.topics.some((topic) => !topic.name.trim())) nextErrors.push(`Add a name for every topic in ${subject.name.trim() || `subject ${index + 1}`}.`);
      });
    }
    if (step === 2) {
      const parsed = parseDailyStudyTime(dailyStudyTime);
      if (!parsed.ok) nextErrors.push(parsed.message);
    }
    if (nextErrors.length) { setErrors(nextErrors); return; }
    setErrors([]);
    setStep((current) => Math.min(3, current + 1));
  };

  const handleGenerate = () => {
    const parsed = parseDailyStudyTime(dailyStudyTime);
    if (!parsed.ok) { setErrors([parsed.message]); setStep(2); return; }
    const input: PlanInput = { dailyStudyHours: parsed.hours, subjects };
    // Keep validation and scheduling on the same local calendar date. If the
    // student submits across midnight, a second clock read could otherwise
    // turn a date accepted as tomorrow into today during generation.
    const today = todayISO();
    const validation = validatePlanInput(input, today);
    if (validation.length) { setErrors(validation.map((issue) => issue.message)); setStep(2); return; }
    const result = generateSchedule(input, today);
    if (!result.ok) {
      setErrors([result.conflict.message, ...result.conflict.affectedItems.map((item) => `Needs a valid slot: ${item}`)]);
      return;
    }
    onGenerated(result.plan);
  };

  return (
    <section className="setup-screen surface-card" aria-labelledby="setup-title">
      <div className="setup-topline"><button className="back-button" onClick={onCancel}><span aria-hidden="true">←</span> Back to overview</button><span className="setup-label">YOUR STUDY PLAN</span></div>
      <div className="setup-heading"><p className="eyebrow">LET'S MAKE A PLAN</p><h1 id="setup-title">A study rhythm that fits <span>your real life.</span></h1><p className="muted">A few details help us shape a practical plan you can follow.</p></div>
      <div className="setup-progress" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((item) => <div className={`setup-progress-step ${step >= item ? 'is-active' : ''}`} key={item}><span>{step > item ? '✓' : item}</span><small>{item === 1 ? 'Subjects' : item === 2 ? 'Your time' : 'Review'}</small></div>)}
      </div>

      {step === 1 && <div className="setup-step"><div className="form-section-heading"><div><h2>What are you studying?</h2><p className="muted">Start with your subjects, then add the topics you want to cover.</p></div><span className="step-count">01 / 03</span></div>
        <div className="subject-editor-list">{subjects.map((subject, index) => <article className="subject-editor" key={subject.id}>
          <div className="subject-editor-heading"><span className="subject-index">{String(index + 1).padStart(2, '0')}</span><label className="field-label subject-name-field">Subject name<input value={subject.name} onChange={(event) => updateSubject(subject.id, (item) => ({ ...item, name: event.target.value }))} placeholder="e.g. Engineering Mathematics" maxLength={60} /></label>{subjects.length > 1 && <button className="icon-button remove-button" type="button" aria-label={`Remove ${subject.name || `subject ${index + 1}`}`} onClick={() => setSubjects((current) => current.filter((item) => item.id !== subject.id))}>×</button>}</div>
          <div className="topic-fields-heading"><span>TOPICS</span><span>DIFFICULTY</span></div>
          <div className="topic-editor-list">{subject.topics.map((topic, topicIndex) => <div className="topic-editor-row" key={topic.id}><span className="topic-bullet">{String(topicIndex + 1).padStart(2, '0')}</span><input aria-label={`Topic ${topicIndex + 1} name`} value={topic.name} onChange={(event) => updateTopic(subject.id, topic.id, (item) => ({ ...item, name: event.target.value }))} placeholder="e.g. Differential equations" maxLength={80} /><select aria-label={`Difficulty for ${topic.name || `topic ${topicIndex + 1}`}`} value={topic.difficulty} onChange={(event) => updateTopic(subject.id, topic.id, (item) => ({ ...item, difficulty: event.target.value as Difficulty }))}><option value="easy">Easy · 30 min est.</option><option value="medium">Medium · 45 min est.</option><option value="hard">Hard · 60 min est.</option></select><button className="icon-button topic-remove" type="button" aria-label={`Remove topic ${topicIndex + 1}`} onClick={() => updateSubject(subject.id, (item) => ({ ...item, topics: item.topics.filter((row) => row.id !== topic.id) }))}>×</button></div>)}</div>
          <button className="text-button add-topic-button" type="button" onClick={() => updateSubject(subject.id, (item) => ({ ...item, topics: [...item.topics, newTopic()] }))}>＋ Add a topic</button>
        </article>)}</div>
        <button className="button button-outline add-subject-button" type="button" onClick={() => setSubjects((current) => [...current, newSubject()])}><span aria-hidden="true">＋</span> Add another subject</button>
        <div className="estimate-note"><span aria-hidden="true">✦</span><p>Topic times are <strong>estimates</strong> based on difficulty. We’ll add one 30-minute revision session per subject. Custom durations can come in a future version.</p></div>
        <div className="form-actions"><span className="muted">You can adjust this plan later.</span><button className="button button-primary" type="button" onClick={goNext}>Continue <span aria-hidden="true">→</span></button></div>
      </div>}

      {step === 2 && <div className="setup-step"><div className="form-section-heading"><div><h2>When are your exams?</h2><p className="muted">We’ll schedule study and revision before each exam date.</p></div><span className="step-count">02 / 03</span></div>
        <div className="exam-date-list">{subjects.map((subject, index) => <label className="field-label exam-date-field" key={subject.id}><span className="exam-subject-dot" />{subject.name || `Subject ${index + 1}`}<input type="date" min={tomorrowISO()} value={subject.examDate} onChange={(event) => updateSubject(subject.id, (item) => ({ ...item, examDate: event.target.value }))} /></label>)}</div>
        <label className="field-label daily-hours-field">Available study time each day <span className="input-suffix">hours</span><input type="text" inputMode="text" autoComplete="off" spellCheck={false} value={dailyStudyTime} onChange={(event) => { setDailyStudyTime(event.target.value); setErrors([]); }} /><small>Enter 0.5–12 hours. Examples: 1:45, 2.5, 1/2, or 2 1/2 (hours:minutes or fractions of an hour).</small></label>
        <div className="estimate-summary"><div><span className="summary-label">ESTIMATED WORKLOAD</span><strong>{formatMinutes(workload)}</strong><small>Includes topic study + one revision session per subject</small></div><div className="summary-divider" /><div><span className="summary-label">DAILY CAPACITY</span><strong>{parsedDailyStudyTime.ok ? formatMinutes(parsedDailyStudyTime.minutes) : '—'}<small> / day</small></strong><small>We'll check all deadlines before creating your plan</small></div></div>
        <div className="form-actions form-actions-between"><button className="button button-secondary" type="button" onClick={() => { setErrors([]); setStep(1); }}>← Back</button><button className="button button-primary" type="button" onClick={goNext}>Review plan <span aria-hidden="true">→</span></button></div>
      </div>}

      {step === 3 && <div className="setup-step"><div className="form-section-heading"><div><h2>Ready for a steadier week?</h2><p className="muted">Review the details, then generate your deterministic study plan.</p></div><span className="step-count">03 / 03</span></div>
        <div className="review-summary">{subjects.map((subject) => <article className="review-subject" key={subject.id}><div className="review-subject-top"><strong>{subject.name}</strong><span>Exam · {subject.examDate ? new Date(`${subject.examDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not set'}</span></div><div className="review-topic-chips">{subject.topics.map((topic) => <span className={`topic-chip difficulty-${topic.difficulty}`} key={topic.id}>{topic.name} · {topic.difficulty}</span>)}</div></article>)}</div>
        <div className="estimate-summary compact-summary"><div><span className="summary-label">DAILY STUDY TIME</span><strong>{parsedDailyStudyTime.ok ? formatMinutes(parsedDailyStudyTime.minutes) : '—'}</strong></div><div><span className="summary-label">ESTIMATED TOTAL</span><strong>{formatMinutes(workload)}</strong><small>Difficulty-based estimates + revision</small></div></div>
        <div className="form-actions form-actions-between"><button className="button button-secondary" type="button" onClick={() => { setErrors([]); setStep(2); }}>← Back</button><button className="button button-primary" type="button" onClick={handleGenerate}>Generate My Study Plan <span aria-hidden="true">✦</span></button></div>
      </div>}

      {errors.length > 0 && <div className="form-errors" role="alert"><strong>Let's make a quick adjustment</strong><ul>{errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}</ul></div>}
      <p className="deterministic-note setup-deterministic">Deterministic planner · Your plan is calculated from your input. No AI API is used.</p>
    </section>
  );
}
