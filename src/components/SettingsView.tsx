import { useEffect, useState, type FormEvent } from 'react';
import { parseDailyStudyTime } from '../lib/dailyStudyTime';
import type { SchedulePlan } from '../types/study';
import { formatDate } from './OverviewDashboard';
import { EmptyState } from './EmptyState';

interface SettingsViewProps {
  plan: SchedulePlan | null;
  onCreatePlan: () => void;
  onSavePlan: (plan: SchedulePlan) => void;
}

export function SettingsView({ plan, onCreatePlan, onSavePlan }: SettingsViewProps) {
  const [dailyStudyTime, setDailyStudyTime] = useState(String(plan?.dailyStudyHours ?? 2));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (plan) setDailyStudyTime(String(plan.dailyStudyHours)); }, [plan]);
  if (!plan) return <div className="dashboard-content"><EmptyState eyebrow="SETTINGS" title="Study preferences appear here" description="Create a plan to save and manage your daily study availability and exam dates." actionLabel="Create My Study Plan" onAction={onCreatePlan} /></div>;

  const submit = (event: FormEvent) => {
    event.preventDefault(); setMessage(''); setError('');
    const parsed = parseDailyStudyTime(dailyStudyTime);
    if (!parsed.ok) { setError(parsed.message); return; }
    const dailyMinutes = parsed.minutes;
    const usedByDay = new Map<string, number>();
    plan.sessions.filter((session) => session.status !== 'unscheduled').forEach((session) => usedByDay.set(session.date, (usedByDay.get(session.date) ?? 0) + session.durationMinutes));
    const overLimit = [...usedByDay.entries()].find(([, minutes]) => minutes > dailyMinutes);
    if (overLimit) { setError(`Your plan has ${overLimit[1] / 60} scheduled hours on ${formatDate(overLimit[0])}. Reschedule sessions before lowering the limit.`); return; }
    onSavePlan({ ...plan, dailyStudyHours: parsed.hours });
    setMessage('Daily availability updated. Your existing sessions remain within the new limit.');
  };

  return <div className="dashboard-content"><section className="page-heading"><div><p className="eyebrow">YOUR PREFERENCES</p><h1>Make the plan <span>fit your day.</span></h1><p className="muted">Settings update only when you save them. Exam dates remain attached to each subject.</p></div></section>
    {message && <p className="action-notice" role="status">✓ {message}</p>}{error && <p className="form-errors" role="alert">{error}</p>}
    <div className="settings-grid"><form className="surface-card settings-card" onSubmit={submit}><p className="eyebrow">DAILY AVAILABILITY</p><h2>Study hours per day</h2><p className="muted">Your schedule will never exceed this limit. Lower limits are blocked if current sessions would overflow.</p><label className="field-label settings-hours-label">Daily study time<input type="text" inputMode="text" autoComplete="off" spellCheck={false} value={dailyStudyTime} onChange={(event) => setDailyStudyTime(event.target.value)} /><small>Examples: 2.5, 1:45, 1/2, or 1 3/4 hours (0.5–12 hours).</small></label><button className="button button-primary" type="submit">Save availability</button></form>
      <section className="surface-card settings-card"><p className="eyebrow">EXAM DATES</p><h2>Upcoming exams</h2><div className="settings-exams">{plan.subjects.map((subject) => <div className="settings-exam-row" key={subject.id}><span className="session-dot" /><strong>{subject.name}</strong><time>{formatDate(subject.examDate)}</time></div>)}</div><p className="deterministic-note">Exam dates are managed with each subject in the plan setup flow.</p></section></div>
  </div>;
}
