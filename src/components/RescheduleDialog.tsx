import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  dailyStudyHoursToMinutes,
  getPrioritySwapCandidates,
  getRescheduleOptions,
  moveSessionToDate,
  prioritizeSessionByDeferring,
} from '../lib/planner';
import { parseDailyStudyTime } from '../lib/dailyStudyTime';
import type { RescheduleOption, SchedulePlan, StudySession } from '../types/study';
import { formatDate, formatMinutes } from './OverviewDashboard';

interface RescheduleDialogProps {
  plan: SchedulePlan;
  session: StudySession;
  onClose: () => void;
  onPlanChange: (plan: SchedulePlan, successMessage: string) => void;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return new Date(2024, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function RescheduleDialog({ plan, session, onClose, onPlanChange }: RescheduleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [newDailyHours, setNewDailyHours] = useState(String(Math.min(12, plan.dailyStudyHours + 0.5)));
  const [adjustmentMessage, setAdjustmentMessage] = useState('');
  const today = todayISO();
  const baseOptions = useMemo(() => getRescheduleOptions(plan, session.id, today), [plan, session.id, today]);
  const parsedNewDailyHours = parseDailyStudyTime(newDailyHours);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  const keepTabInside = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { onClose(); return; }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
      event.preventDefault(); first.focus();
    }
  };

  const applyMove = (nextPlan: SchedulePlan, option: RescheduleOption, message: string) => {
    const moved = moveSessionToDate(nextPlan, session.id, option);
    if (!moved) return;
    onPlanChange(moved, message);
  };

  const withMoreHours = () => {
    const parsed = parseDailyStudyTime(newDailyHours);
    if (!parsed.ok) {
      setAdjustmentMessage(parsed.message);
      return;
    }
    if (parsed.minutes <= dailyStudyHoursToMinutes(plan.dailyStudyHours)) {
      setAdjustmentMessage('Enter a daily limit greater than your current setting.');
      return;
    }
    const updatedPlan = { ...plan, dailyStudyHours: parsed.hours };
    const options = getRescheduleOptions(updatedPlan, session.id, today);
    if (options.ok) applyMove(updatedPlan, options.options[0], `Daily availability updated to ${formatMinutes(parsed.minutes)} per day and session rescheduled.`);
    else setAdjustmentMessage('That daily limit still leaves no valid slot before the exam. Your saved settings are unchanged.');
  };

  const revisionAdjustments = useMemo(() => {
    const revisions = plan.sessions.filter((item) => item.kind === 'revision' && item.status === 'planned' && item.durationMinutes > 15);
    return revisions.flatMap((revision) => {
      const adjusted = {
        ...plan,
        sessions: plan.sessions.map((item) => item.id === revision.id ? { ...item, durationMinutes: Math.max(15, item.durationMinutes - 15) } : item),
      };
      const options = getRescheduleOptions(adjusted, session.id, today);
      return options.ok ? [{ plan: adjusted, revision, option: options.options[0] }] : [];
    });
  }, [plan, session.id, today]);

  const prioritySwaps = useMemo(() => getPrioritySwapCandidates(plan, session.id, today), [plan, session.id, today]);
  const noSlot = !baseOptions.ok;
  const sessionOptions = baseOptions.ok ? baseOptions.options : [];

  return (
    <div className="dialog-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="reschedule-dialog surface-card" role="dialog" aria-modal="true" aria-labelledby="reschedule-title" aria-describedby="reschedule-description" tabIndex={-1} ref={dialogRef} onKeyDown={keepTabInside}>
        <div className="dialog-heading"><div><p className="eyebrow">ADJUST YOUR PLAN</p><h2 id="reschedule-title">Find a better study slot</h2></div><button type="button" className="icon-button dialog-close" aria-label="Close reschedule dialog" onClick={onClose}>×</button></div>
        <div className="reschedule-target"><span className={`session-dot ${session.kind}`} /><div><strong>{session.topicName}</strong><small>{session.subjectName} · {formatMinutes(session.durationMinutes)} estimate</small></div></div>
        <p className="muted" id="reschedule-description">Completed sessions stay where they are. Choose a valid suggested slot before {formatDate(plan.subjects.find((item) => item.id === session.subjectId)?.examDate ?? session.date)}.</p>

        {!noSlot ? <div className="slot-options"><p className="eyebrow">SUGGESTED OPEN SLOTS</p>{sessionOptions.map((option, index) => <button className={`slot-option ${index === 0 ? 'slot-suggested' : ''}`} type="button" key={`${option.date}-${option.startTime}`} onClick={() => applyMove(plan, option, `${session.topicName} moved to ${formatDate(option.date)}.`)}><span className="slot-date"><strong>{formatDate(option.date)}</strong><small>{timeLabel(option.startTime)} · {formatMinutes(session.durationMinutes)}</small></span>{index === 0 && <span className="suggested-chip">SUGGESTED</span>}<span className="slot-arrow" aria-hidden="true">→</span></button>)}</div>
          : <div className="no-slot-panel"><div className="conflict-icon">!</div><div><strong>No valid slot fits the current daily limit.</strong><p>{baseOptions.message} Your existing timetable is unchanged until you choose an adjustment.</p></div></div>}

        {noSlot && <div className="adjustment-options">
          {plan.dailyStudyHours < 12 && <section className="adjustment-card"><div className="adjustment-card-heading"><span className="adjustment-symbol">◷</span><div><strong>Increase daily availability</strong><small>This changes the saved daily study-hour setting.</small></div></div><label className="field-label adjustment-hours">New daily limit<input type="text" inputMode="text" autoComplete="off" spellCheck={false} value={newDailyHours} onChange={(event) => { setNewDailyHours(event.target.value); setAdjustmentMessage(''); }} /><small>Examples: 3.5, 3:30, 7/2, or 3 1/2 hours (up to 12 hours).</small></label><button type="button" className="button button-outline adjustment-action" onClick={withMoreHours}>Use this daily limit and reschedule</button></section>}

          {revisionAdjustments.map(({ plan: adjusted, revision, option }) => <section className="adjustment-card" key={revision.id}><div className="adjustment-card-heading"><span className="adjustment-symbol">↻</span><div><strong>Reduce one revision estimate</strong><small>{revision.subjectName} revision: {formatMinutes(revision.durationMinutes)} → {formatMinutes(Math.max(15, revision.durationMinutes - 15))}</small></div></div><button type="button" className="button button-outline adjustment-action" onClick={() => applyMove(adjusted, option, `Revision estimate reduced and ${session.topicName} rescheduled.`)}>Reduce revision and use {formatDate(option.date)}</button></section>)}

          {prioritySwaps.map((candidate) => <section className="adjustment-card" key={candidate.deferredSessionId}><div className="adjustment-card-heading"><span className="adjustment-symbol">✦</span><div><strong>Prioritize this topic as essential</strong><small>{candidate.deferredSessionLabel} will remain visible as unscheduled work.</small></div></div><button type="button" className="button button-outline adjustment-action" onClick={() => { const updated = prioritizeSessionByDeferring(plan, session.id, candidate); if (updated) onPlanChange(updated, `${session.topicName} prioritized. ${candidate.deferredSessionLabel} remains in unscheduled work.`); }}>Prioritize and use {formatDate(candidate.date)}</button></section>)}

          {adjustmentMessage && <p className="adjustment-error" role="alert">{adjustmentMessage}</p>}
          {revisionAdjustments.length === 0 && prioritySwaps.length === 0 && (!parsedNewDailyHours.ok || parsedNewDailyHours.minutes <= dailyStudyHoursToMinutes(plan.dailyStudyHours)) && <p className="muted no-adjustments">No adjustment currently creates a valid slot. Your plan remains unchanged.</p>}
        </div>}
        <div className="dialog-footer"><span className="deterministic-note">Suggested times start at 9:00 AM. Daily hours are estimates, not calendar availability.</span><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button></div>
      </div>
    </div>
  );
}
