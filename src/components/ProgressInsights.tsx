import { useState, type KeyboardEvent } from 'react';
import type { SchedulePlan } from '../types/study';
import { getPlanStats } from '../lib/stats';
import { EmptyState } from './EmptyState';
import { ProgressRing } from './ProgressRing';
import { formatMinutes } from './OverviewDashboard';

interface ProgressInsightsProps {
  plan: SchedulePlan | null;
  onCreatePlan: () => void;
}

function localDateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function WeeklyChart({ plan, today }: { plan: SchedulePlan; today: string }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const stats = getPlanStats(plan, today);
  const ceiling = Math.max(60, ...stats.week.map((day) => day.plannedMinutes));
  const chartWidth = 490;
  const chartHeight = 144;
  const barWidth = 31;
  const gap = 34;
  const left = 23;
  const base = 112;
  const selected = stats.week.find((day) => day.date === selectedDate);
  const selectByKey = (event: KeyboardEvent<SVGGElement>, date: string) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedDate(date); } };
  return <figure className="chart-figure"><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} aria-labelledby="study-chart-title study-chart-description"><title id="study-chart-title">Study sessions this week</title><desc id="study-chart-description">Select a day bar to see scheduled and completed minutes.</desc><line x1="10" y1={base} x2="480" y2={base} stroke="rgba(173,181,232,.18)" />{stats.week.map((day, index) => { const x = left + index * (barWidth + gap); const plannedHeight = Math.max(day.plannedMinutes ? 5 : 0, (day.plannedMinutes / ceiling) * 86); const completedHeight = day.plannedMinutes ? (day.completedMinutes / ceiling) * 86 : 0; const label = new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }); return <g key={day.date} className={`chart-day ${selectedDate === day.date ? 'chart-day-selected' : ''}`} role="button" tabIndex={0} aria-label={`${label}, ${formatMinutes(day.completedMinutes)} completed of ${formatMinutes(day.plannedMinutes)} scheduled. Select for details.`} onClick={() => setSelectedDate(day.date)} onKeyDown={(event) => selectByKey(event, day.date)}><rect className="chart-hit-area" x={x - 5} y="10" width={barWidth + 10} height="130" rx="8" /><title>{label}: {formatMinutes(day.completedMinutes)} completed of {formatMinutes(day.plannedMinutes)} scheduled</title><rect x={x} y={base - plannedHeight} width={barWidth} height={plannedHeight} rx="7" fill="rgba(145,122,235,.48)" /><rect x={x} y={base - completedHeight} width={barWidth} height={completedHeight} rx="7" fill="url(#chart-complete-gradient)" /><text x={x + barWidth / 2} y="134" textAnchor="middle" className="chart-day-label">{label}</text></g>; })}<defs><linearGradient id="chart-complete-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#73e2d1"/><stop offset="100%" stopColor="#6588f0"/></linearGradient></defs></svg>{selected && <p className="chart-selection" role="status"><strong>{new Date(`${selected.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</strong><span>{formatMinutes(selected.completedMinutes)} completed · {formatMinutes(selected.plannedMinutes)} scheduled</span></p>}<figcaption className="chart-legend"><span><i className="legend-swatch planned-swatch" />Scheduled</span><span><i className="legend-swatch completed-swatch" />Completed</span></figcaption></figure>;
}

export function ProgressInsights({ plan, onCreatePlan }: ProgressInsightsProps) {
  if (!plan) return <div className="dashboard-content"><EmptyState eyebrow="PROGRESS & INSIGHTS" title="Your progress starts here" description="Once you create a study plan and complete sessions, your progress ring and weekly chart will reflect your saved study data." actionLabel="Create My Study Plan" onAction={onCreatePlan} /></div>;
  const stats = getPlanStats(plan, localDateKey());
  const unscheduled = plan.sessions.filter((session) => session.status === 'unscheduled').length;
  return <div className="dashboard-content"><section className="page-heading"><div><p className="eyebrow">REAL PROGRESS · YOUR SAVED PLAN</p><h1>See your work <span>add up.</span></h1><p className="muted">Every number and chart below comes from your saved study sessions.</p></div><span className="live-dot">Live data</span></section>
    <section className="insights-top-grid"><article className="surface-card completion-insight"><div><p className="eyebrow">PLAN COMPLETION</p><h2>{stats.completionPercent}% <span>complete</span></h2><p className="muted">{stats.completedSessions} of {stats.totalSessions} total sessions marked complete.</p></div><ProgressRing value={stats.completionPercent} /></article><article className="surface-card insight-stat"><span className="metric-label">Study streak</span><strong>{stats.studyStreakDays} <small>days</small></strong><p>{stats.studyStreakDays ? 'Based on saved completed sessions.' : 'Complete a session to start a streak.'}</p></article><article className="surface-card insight-stat"><span className="metric-label">Estimated workload</span><strong>{formatMinutes(stats.totalPlannedMinutes)}</strong><p>Scheduled study and revision time.</p></article>{unscheduled > 0 && <article className="surface-card insight-stat insight-warning"><span className="metric-label">Needs a new slot</span><strong>{unscheduled}</strong><p>Unscheduled sessions remain visible in your plan.</p></article>}</section>
    <section className="surface-card weekly-insight"><div className="card-heading"><div><p className="eyebrow">THIS WEEK</p><h2>Study rhythm</h2></div><span className="chart-period">Mon — Sun</span></div><WeeklyChart plan={plan} today={localDateKey()} /></section>
    <section className="surface-card subject-insight"><div className="card-heading"><div><p className="eyebrow">BY SUBJECT</p><h2>Where your time is planned</h2></div></div><div className="subject-hours-list">{plan.subjects.map((subject) => { const sessions = plan.sessions.filter((session) => session.subjectId === subject.id && session.status !== 'unscheduled'); const minutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0); const completed = sessions.filter((session) => session.status === 'completed').reduce((sum, session) => sum + session.durationMinutes, 0); const percent = minutes ? Math.round((completed / minutes) * 100) : 0; return <div className="subject-hours-row" key={subject.id}><div><strong>{subject.name}</strong><small>{formatMinutes(completed)} completed · {formatMinutes(minutes)} scheduled</small></div><div className="subject-hours-track"><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></div>; })}</div></section>
  </div>;
}
