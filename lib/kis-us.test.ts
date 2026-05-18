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

  describe('Under Test Environment', () => {
    it('returns US simulated trading intensity data', async () => {
      const { fetchUsTradingIntensity } = await import('./kis-us');
      const data = await fetchUsTradingIntensity();
      expect(data).toHaveLength(10);
      expect(data[0].code).toBe('NVDA');
      expect(data[0].company).toBe('NVIDIA Corp');
      expect(data[0].price).toContain('$');
    });

    it('returns US simulated volume spike data', async () => {
      const { fetchUsVolumeSpike } = await import('./kis-us');
      const data = await fetchUsVolumeSpike();
      expect(data).toHaveLength(10);
      expect(data[0].code).toBe('TSLA');
      expect(data[0].volumeRatio).toContain('%');
    });

    it('returns US simulated net buying data', async () => {
      const { fetchUsNetBuying } = await import('./kis-us');
      const data = await fetchUsNetBuying();
      expect(data).toHaveLength(10);
      expect(data[0].code).toBe('META');
      expect(data[0].foreignNetBuy).toContain('$');
    });

    it('returns US simulated program trading data', async () => {
      const { fetchUsProgramTrading } = await import('./kis-us');
      const data = await fetchUsProgramTrading();
      expect(data).toHaveLength(10);
      expect(data[0].code).toBe('NVDA');
      expect(data[0].programNetBuy).toContain('contracts');
    });

    it('returns US simulated new high data', async () => {
      const { fetchUsNewHigh } = await import('./kis-us');
      const data = await fetchUsNewHigh();
      expect(data).toHaveLength(10);
      expect(data[0].code).toBe('NVDA');
      expect(data[0].highType).toContain('52-Week');
    });

    it('returns US simulated bid ask ratio data', async () => {
      const { fetchUsBidAskRatio } = await import('./kis-us');
      const data = await fetchUsBidAskRatio();
      expect(data).toHaveLength(10);
      expect(data[0].code).toBe('PLTR');
      expect(data[0].bidAskRatio).toBeGreaterThan(0);
    });
  });
});
