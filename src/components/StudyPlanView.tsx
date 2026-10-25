import { useState } from 'react';
import { useStudyPlan } from '../context/StudyPlanProvider';
import type { SchedulePlan, StudySession } from '../types/study';
import { formatDate, formatMinutes } from './OverviewDashboard';
import { RescheduleDialog } from './RescheduleDialog';

interface StudyPlanViewProps {
  plan: SchedulePlan;
  onBack: () => void;
}

type PlanLayout = 'list' | 'calendar';

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function localToday() {
  const date = new Date();
  return dateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function StudyPlanView({ plan, onBack }: StudyPlanViewProps) {
  const { completeSession, savePlan } = useStudyPlan();
  const [reschedule, setReschedule] = useState<StudySession | null>(null);
  const [notice, setNotice] = useState('');
  const [layout, setLayout] = useState<PlanLayout>('list');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(localToday());
  const visibleSessions = plan.sessions.filter((session) => session.status !== 'unscheduled');
  const unscheduled = plan.sessions.filter((session) => session.status === 'unscheduled');
  const days = [...new Set(visibleSessions.map((session) => session.date))].sort();

  const handleComplete = (session: StudySession) => {
    completeSession(session.id);
    setNotice(`${session.topicName} marked complete. Your progress is updated.`);
  };

  const handleReschedule = (nextPlan: SchedulePlan, message: string) => {
    savePlan(nextPlan);
    setReschedule(null);
    setNotice(message);
  };

  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelectedDate(dateKey(next.getFullYear(), next.getMonth(), 1));
  };

  const renderSessions = (sessions: StudySession[]) => <div className="session-list">{sessions.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((session) => <article className={`session-row plan-session ${session.kind} ${session.status === 'completed' ? 'completed-row' : ''}`} key={session.id}><span className={`session-dot ${session.kind}`} /><time>{session.startTime}</time><div className="session-main"><strong>{session.topicName}</strong><small>{session.subjectName} · {session.kind === 'revision' ? 'Revision estimate' : `${session.difficulty} topic · estimated duration`}</small></div><span className="session-duration">{formatMinutes(session.durationMinutes)}</span>{session.status === 'completed' ? <span className="completed-badge">✓ Complete</span> : <div className="session-actions"><button type="button" className="small-action complete-action" onClick={() => handleComplete(session)}>Complete</button><button type="button" className="small-action reschedule-action" onClick={() => setReschedule(session)}>Reschedule</button></div>}</article>)}</div>;

  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlankDays = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const calendarCells = [...Array.from({ length: leadingBlankDays }, () => null), ...Array.from({ length: monthDays }, (_, index) => index + 1)];
  const selectedSessions = visibleSessions.filter((session) => session.date === selectedDate);

  return (
    <div className="dashboard-content">
      <section className="page-heading"><div><p className="eyebrow">YOUR STUDY PLAN · DETERMINISTIC ESTIMATES</p><h1>Your next steps, <span>in focus.</span></h1><p className="muted">A practical rhythm, shaped around your subjects, deadlines, and daily time.</p></div><button className="button button-secondary" onClick={onBack}>← Overview</button></section>
      <div className="plan-summary-strip"><span>{plan.subjects.length} subjects</span><i /><span>{visibleSessions.length} scheduled sessions</span><i /><span>{formatMinutes(visibleSessions.reduce((sum, session) => sum + session.durationMinutes, 0))} estimated study time</span></div>
      {notice && <div className="action-notice" role="status"><span aria-hidden="true">✓</span>{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}

      <section className="surface-card plan-calendar-card">
        <div className="plan-view-toolbar"><div><p className="eyebrow">YOUR TIMETABLE</p><h2>{layout === 'list' ? 'Day by day' : month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2></div><div className="view-toggle" role="group" aria-label="Timetable layout"><button type="button" className={layout === 'list' ? 'selected' : ''} aria-pressed={layout === 'list'} onClick={() => setLayout('list')}>List</button><button type="button" className={layout === 'calendar' ? 'selected' : ''} aria-pressed={layout === 'calendar'} onClick={() => setLayout('calendar')}>Calendar</button></div></div>
        {layout === 'list' ? <div className="timeline-days">{days.map((date, dayIndex) => { const sessions = visibleSessions.filter((session) => session.date === date); return <section className="timeline-day" key={date}><div className="timeline-date"><span className="timeline-day-number">{String(dayIndex + 1).padStart(2, '0')}</span><div><strong>{formatDate(date)}</strong><small>{sessions.length} study blocks</small></div></div>{renderSessions(sessions)}</section>; })}</div> : <div className="calendar-layout"><div className="calendar-main"><div className="calendar-month-controls"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button><strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button type="button" className="icon-button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button></div><div className="calendar-grid" role="grid" aria-label="Study plan calendar"><div className="calendar-weekdays" role="row">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span role="columnheader" key={day}>{day}</span>)}</div><div className="calendar-date-grid">{calendarCells.map((day, index) => { if (day === null) return <span className="calendar-blank" key={`blank-${index}`} aria-hidden="true" />; const key = dateKey(month.getFullYear(), month.getMonth(), day); const daySessions = visibleSessions.filter((session) => session.date === key); return <button type="button" role="gridcell" aria-label={`${formatDate(key)}: ${daySessions.length} study sessions`} aria-pressed={selectedDate === key} className={`calendar-day ${selectedDate === key ? 'selected' : ''} ${daySessions.length ? 'has-sessions' : ''}`} key={key} onClick={() => setSelectedDate(key)}><span>{day}</span>{daySessions.length > 0 && <small>{daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}</small>}</button>; })}</div></div></div><aside className="calendar-day-detail"><p className="eyebrow">SELECTED DAY</p><h3>{formatDate(selectedDate)}</h3>{selectedSessions.length ? renderSessions(selectedSessions) : <p className="empty-inline">No sessions scheduled for this day.</p>}</aside></div>}
      </section>

      {unscheduled.length > 0 && <section className="unscheduled-panel surface-card"><div className="card-heading"><div><p className="eyebrow">NEEDS A NEW SLOT</p><h2>Unscheduled work stays on your plan</h2></div><span className="unscheduled-count">{unscheduled.length}</span></div><p className="muted">You chose to prioritize another topic. Nothing was deleted; these sessions remain here until you resolve them.</p><div className="session-list">{unscheduled.map((session) => <div className="session-row" key={session.id}><span className={`session-dot ${session.kind}`} /><div className="session-main"><strong>{session.topicName}</strong><small>{session.subjectName} · {session.unscheduledReason}</small></div><span className="session-duration">{formatMinutes(session.durationMinutes)} estimate</span><button type="button" className="small-action reschedule-action" onClick={() => setReschedule(session)}>Find a slot</button></div>)}</div></section>}
      <p className="deterministic-note">Duration values are estimates. Study sessions are scheduled before their exam date; daily time limits are respected.</p>
      {reschedule && <RescheduleDialog plan={plan} session={reschedule} onClose={() => setReschedule(null)} onPlanChange={handleReschedule} />}
    </div>
  );
}
