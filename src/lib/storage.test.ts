import { describe, expect, it } from 'vitest';
import { DEFAULT_SCHEDULING_POLICY, generateSchedule } from './planner';
import { loadSavedPlan, PLAN_STORAGE_KEY, savePlanLocally } from './storage';
import type { PlanInput } from '../types/study';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const input: PlanInput = {
  dailyStudyHours: 2,
  subjects: [{ id: 's1', name: 'Math', examDate: '2026-11-10', topics: [{ id: 't1', name: 'Matrices', difficulty: 'easy' }] }],
};

describe('local plan storage', () => {
  it('restores the saved plan after a reload boundary', () => {
    const result = generateSchedule(input, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const storage = new MemoryStorage();
    expect(savePlanLocally(result.plan, storage)).toEqual({ ok: true });
    expect(storage.getItem(PLAN_STORAGE_KEY)).not.toBeNull();
    expect(loadSavedPlan(storage)).toEqual({ ok: true, plan: result.plan });
  });

  it('returns a helpful state for malformed or unsupported saved data', () => {
    const storage = new MemoryStorage();
    storage.setItem(PLAN_STORAGE_KEY, '{bad json');
    expect(loadSavedPlan(storage).ok).toBe(false);
    storage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }));
    expect(loadSavedPlan(storage)).toEqual({ ok: false, message: 'The saved plan could not be read. It has been left untouched.' });
  });

  it('reports a failed write without claiming the data was saved', () => {
    const throwingStorage = { setItem: () => { throw new Error('quota'); } } as unknown as Storage;
    const result = generateSchedule(input, '2026-11-01', DEFAULT_SCHEDULING_POLICY, '2026-11-01T08:00:00.000Z');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(savePlanLocally(result.plan, throwingStorage).ok).toBe(false);
  });
});
