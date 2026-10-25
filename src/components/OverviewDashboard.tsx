import type { SchedulePlan } from '../types/study';

interface OverviewDashboardProps {
  plan: SchedulePlan | null;
  onCreatePlan: () => void;
  onOpenPlan: () => void;
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function OverviewDashboard({ plan, onCreatePlan, onOpenPlan }: OverviewDashboardProps) {
  const subjects = plan?.subjects.length ?? 0;
  const scheduled = plan?.sessions.filter((session) => session.status !== 'unscheduled').length ?? 0;
  const completed = plan?.sessions.filter((session) => session.status === 'completed').length ?? 0;
  const today = localDateKey();
  const nextSessions = plan?.sessions
    .filter((session) => session.status === 'planned')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)) ?? [];
  const nextSession = nextSessions[0];
  const upcomingExams = plan?.subjects
    .filter((subject) => subject.examDate >= today)
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .slice(0, 3) ?? [];

  return <div className="dashboard-content overview-content">
    <section className="welcome-hero planning-hero" aria-labelledby="overview-title">
      <div className="hero-copy">
        <p className="eyebrow">A CALMER WAY TO PREPARE</p>
        <h1 id="overview-title">Plan your studies <span>with confidence.</span></h1>
        <p>Bring your subjects, exam dates, and available daily study time together in a practical timetable that fits your life.</p>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={onCreatePlan}>{plan ? 'Adjust My Study Plan' : 'Create My Study Plan'} <span aria-hidden="true">→</span></button>
          {plan && <button className="button button-secondary" type="button" onClick={onOpenPlan}>View My Timetable</button>}
        </div>
        <small className="deterministic-note">Your plan is calculated from your input. No AI API is used.</small>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-card"><span>YOUR NEXT STEP</span><strong>One topic at a time</strong><i>✦</i></div></div>
    </section>

    {plan ? <section className="overview-planning" aria-labelledby="saved-plan-title">
      <div className="overview-section-heading"><div><p className="eyebrow">YOUR STUDY PLAN</p><h2 id="saved-plan-title">Know what to focus on next.</h2><p className="muted">A practical view of your upcoming study time and deadlines.</p></div><button className="button button-secondary" type="button" onClick={onOpenPlan}>Open full timetable <span aria-hidden="true">→</span></button></div>
      <div className="overview-planning-grid">
        <article className="overview-next-session surface-card">
          <div className="overview-card-heading"><span className="overview-plan-icon" aria-hidden="true">↗</span><div><p className="eyebrow">NEXT STUDY SESSION</p><h3>{nextSession ? nextSession.topicName : 'You are all caught up'}</h3></div></div>
          {nextSession ? <><p className="overview-session-subject">{nextSession.subjectName} <span>·</span> {nextSession.kind === 'revision' ? 'Revision' : 'Study session'}</p><div className="overview-session-meta"><span>{nextSession.date < today ? 'Overdue · ' : ''}{nextSession.date === today ? 'Today' : formatDate(nextSession.date)}</span><span>{nextSession.startTime}</span><span>{formatMinutes(nextSession.durationMinutes)}</span></div><button className="button button-primary overview-session-action" type="button" onClick={onOpenPlan}>{nextSession.date < today ? 'Review overdue session' : 'View session'} <span aria-hidden="true">→</span></button></> : <><p className="overview-session-subject">No planned sessions are left in your timetable.</p><button className="button button-secondary overview-session-action" type="button" onClick={onCreatePlan}>Plan your next study block</button></>}
        </article>
        <article className="overview-exams surface-card">
          <div className="overview-card-heading"><span className="overview-plan-icon exam-icon" aria-hidden="true">◷</span><div><p className="eyebrow">UPCOMING EXAMS</p><h3>Keep deadlines in view</h3></div></div>
          {upcomingExams.length ? <ul className="overview-exam-list">{upcomingExams.map((subject) => <li key={subject.id}><span className="exam-dot" aria-hidden="true"/><span className="overview-exam-name">{subject.name}</span><time dateTime={subject.examDate}>{formatDate(subject.examDate)}</time></li>)}</ul> : <p className="overview-session-subject">No upcoming exams in this plan.</p>}
          <div className="overview-plan-footnote">{subjects} subjects <span>·</span> {scheduled} scheduled sessions <span>·</span> {completed} completed</div>
        </article>
      </div>
      <p className="overview-local-note">Your plan is saved on this device. Creating a new plan will ask before replacing it.</p>
    </section> : <section className="getting-started-section planning-quick-start" aria-labelledby="quick-start-title">
      <div className="section-intro"><div><p className="eyebrow">QUICK START</p><h2 id="quick-start-title">Start with what you know.</h2></div><p className="muted">Your answers shape the timetable. You can adjust it later.</p></div>
      <div className="getting-grid">
        <article className="getting-card"><span className="step-icon" aria-hidden="true">01</span><span className="step-number">01</span><h3>Subjects & topics</h3><p>Add what you need to study and choose a difficulty for each topic.</p></article>
        <article className="getting-card"><span className="step-icon" aria-hidden="true">02</span><span className="step-number">02</span><h3>Exam dates</h3><p>Set a date for each subject so study and revision fit before it.</p></article>
        <article className="getting-card"><span className="step-icon" aria-hidden="true">03</span><span className="step-number">03</span><h3>Your daily time</h3><p>Choose the amount of time you can realistically set aside each day.</p></article>
      </div>
      <aside className="time-format-callout" aria-label="Daily study time input examples"><span className="time-format-icon" aria-hidden="true">◷</span><div><strong>Enter time in a format that feels natural</strong><p><code>1:45</code>, <code>2.5</code>, <code>1/2</code>, or <code>2 1/2</code>. Use hours:minutes or a decimal/fraction of an hour.</p></div></aside>
      <button className="button button-primary quick-start-cta" type="button" onClick={onCreatePlan}>Create My Study Plan <span aria-hidden="true">→</span></button>
    </section>}
  </div>;
}
