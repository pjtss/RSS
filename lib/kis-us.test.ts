import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('KIS US API Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  it('exports fetchUsTradingIntensity function', async () => {
    const mod = await import('./kis-us');
    expect(typeof mod.fetchUsTradingIntensity).toBe('function');
  });
});
