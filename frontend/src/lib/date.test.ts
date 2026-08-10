import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { formatDateOnly } from './date';

describe('formatDateOnly', () => {
  beforeAll(() => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the calendar date in a timezone west of UTC', () => {
    expect(formatDateOnly('2025-07-01', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
      .toBe('mardi 1 juillet 2025');
  });
});
