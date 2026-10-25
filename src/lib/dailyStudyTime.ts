export const MIN_DAILY_STUDY_MINUTES = 30;
export const MAX_DAILY_STUDY_MINUTES = 12 * 60;

export type DailyStudyTimeResult =
  | { ok: true; minutes: number; hours: number }
  | { ok: false; message: string };

const FORMAT_MESSAGE = 'Use hours as a decimal (2.5), hours:minutes (1:45), a fraction (1/2), or a mixed fraction (1 3/4).';

function toResult(hours: number): DailyStudyTimeResult {
  if (!Number.isFinite(hours)) {
    return { ok: false, message: 'Enter daily study time from 0.5 hours (30 minutes) to 12 hours (720 minutes).' };
  }
  if (hours < 0) {
    return { ok: false, message: 'Study time cannot be negative. Enter a value from 0.5 to 12 hours.' };
  }
  const exactMinutes = hours * 60;
  if (exactMinutes < MIN_DAILY_STUDY_MINUTES || exactMinutes > MAX_DAILY_STUDY_MINUTES) {
    return { ok: false, message: 'Enter daily study time from 0.5 hours (30 minutes) to 12 hours (720 minutes).' };
  }
  const minutes = Math.round(exactMinutes);
  return { ok: true, minutes, hours: minutes / 60 };
}

export function parseDailyStudyTime(input: string): DailyStudyTimeResult {
  const value = input.trim();
  if (!value) return { ok: false, message: `Enter daily study time. ${FORMAT_MESSAGE}` };
  if (value.startsWith('-')) return { ok: false, message: 'Study time cannot be negative.' };

  const colon = /^(\d+):(\d{1,2})$/.exec(value);
  if (colon) {
    const hours = Number(colon[1]);
    const minutes = Number(colon[2]);
    if (minutes > 59) return { ok: false, message: 'Minutes after the colon must be between 0 and 59, for example 1:45.' };
    return toResult(hours + minutes / 60);
  }
  if (/^\d+:\d+$/.test(value)) {
    return { ok: false, message: 'Minutes after the colon must be between 0 and 59, for example 1:45.' };
  }

  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(value);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (denominator === 0 || numerator >= denominator) {
      return { ok: false, message: `Use a proper mixed fraction. ${FORMAT_MESSAGE}` };
    }
    return toResult(whole + numerator / denominator);
  }

  const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(value);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator === 0) return { ok: false, message: `The fraction denominator must be greater than zero. ${FORMAT_MESSAGE}` };
    return toResult(numerator / denominator);
  }

  if (/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) return toResult(Number(value));
  return { ok: false, message: FORMAT_MESSAGE };
}
