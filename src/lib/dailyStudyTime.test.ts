import { describe, expect, it } from 'vitest';
import { parseDailyStudyTime } from './dailyStudyTime';

describe('parseDailyStudyTime', () => {
  it.each([
    ['2.5', 150],
    ['1:45', 105],
    ['1/2', 30],
    ['1 3/4', 105],
    ['2 1/2', 150],
    ['1.75', 105],
    ['2/3', 40],
    ['1:5', 65],
  ])('parses %s as %i minutes', (value, minutes) => {
    expect(parseDailyStudyTime(value)).toEqual({ ok: true, minutes, hours: minutes / 60 });
  });

  it.each(['', '   ', 'two hours', '1::45', '1:75', '1:100', '1//2', '1/0', '1 3/2', '1.2.3', '2,5'])('rejects malformed input %j', (value) => {
    expect(parseDailyStudyTime(value).ok).toBe(false);
  });

  it.each(['-1', '-1/2', '-1 1/2', '-1:45'])('rejects negative input %s', (value) => {
    expect(parseDailyStudyTime(value)).toMatchObject({ ok: false, message: expect.stringContaining('negative') });
  });

  it.each(['0', '0:00', '0/1', '0.49', '12.01', '12:01', '999999999999999999999999999999999'])('rejects values outside the supported range: %s', (value) => {
    expect(parseDailyStudyTime(value).ok).toBe(false);
  });

  it('accepts the minimum and maximum daily limits', () => {
    expect(parseDailyStudyTime('0.5')).toMatchObject({ ok: true, minutes: 30 });
    expect(parseDailyStudyTime('12:00')).toMatchObject({ ok: true, minutes: 720 });
  });

  it('rounds fractional-hour input to the nearest minute', () => {
    expect(parseDailyStudyTime('5/7')).toMatchObject({ ok: true, minutes: 43 });
  });
});
