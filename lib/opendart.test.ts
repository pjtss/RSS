import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('OpenDART API Module', () => {
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

  it('returns null if API key is not set', async () => {
    delete process.env.OPENDART_API_KEY;
    const { getContractDetails } = await import('./opendart');

    const result = await getContractDetails('20260516000001');
    expect(result).toBeNull();
  });

  it('returns null if rceptNo size is invalid', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    const result = await getContractDetails('123'); // short
    expect(result).toBeNull();
  });

  it('handles list.json fetch failure', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
    } as any);

    const result = await getContractDetails('20260516000001');
    expect(result).toBeNull();
  });

  it('handles list.json bad status code', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: '999', message: 'Error' }),
    } as any);

    const result = await getContractDetails('20260516000001');
    expect(result).toBeNull();
  });

  it('handles network throw in list.json', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await getContractDetails('20260516000001');
    expect(result).toBeNull();
  });

  it('handles matching corpCode but snglpnrsctrt fetch fails', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    vi.mocked(fetch).mockImplementation((url: any) => {
      if (url.includes('list.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{ rcept_no: '20260516000001', corp_code: '00123456' }],
          }),
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    const result = await getContractDetails('20260516000001');
    expect(result).toBeNull();
  });

  it('handles matching corpCode but contract is not found in the list', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    vi.mocked(fetch).mockImplementation((url: any) => {
      if (url.includes('list.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{ rcept_no: '20260516000001', corp_code: '00123456' }],
          }),
        } as any);
      }
      if (url.includes('snglpnrsctrt.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{ rcept_no: 'different-receipt', corp_code: '00123456' }],
          }),
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    const result = await getContractDetails('20260516000001');
    expect(result).toBeNull();
  });

  it('retrieves contract details successfully and tests currency formatting branches', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    let fetchCount = 0;
    vi.mocked(fetch).mockImplementation((url: any) => {
      fetchCount++;
      if (url.includes('list.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{ rcept_no: '20260516000001', corp_code: '00123456' }],
          }),
        } as any);
      }
      if (url.includes('snglpnrsctrt.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{
              rcept_no: '20260516000001',
              cntrct_amt: '5000000000', // 50억원
              sales_amount_stle: '15.5',
              cntrct_prtnr: 'A Corp',
              cntrct_bgn_de: '2026-05-16',
              cntrct_end_de: '2027-05-16',
            }],
          }),
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    // 1st call: triggers list.json and snglpnrsctrt.json
    const res1 = await getContractDetails('20260516000001');
    expect(res1).toEqual({
      contractAmount: '50억원',
      salesRatio: '15.5',
      partner: 'A Corp',
      period: '2026-05-16 ~ 2027-05-16',
    });
    expect(fetchCount).toBe(2);

    // 2nd call: corpCodeCache lookup hits! (no list.json fetch, only snglpnrsctrt.json)
    const res2 = await getContractDetails('20260516000001');
    expect(res2?.contractAmount).toBe('50억원');
    expect(fetchCount).toBe(3); // +1 fetch instead of +2
  });

  it('tests remaining currency formatting branches in getContractDetails', async () => {
    process.env.OPENDART_API_KEY = 'test-key';
    const { getContractDetails } = await import('./opendart');

    vi.mocked(fetch).mockImplementation((url: any) => {
      if (url.includes('list.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{ rcept_no: '20260516000001', corp_code: '00123456' }],
          }),
        } as any);
      }
      if (url.includes('snglpnrsctrt.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{
              rcept_no: '20260516000001',
              cntrct_amt: '500000', // 500,000원 (less than 100M)
              sales_amount_stle: '0.1',
              cntrct_prtnr: '',
              cntrct_bgn_de: '',
              cntrct_end_de: '',
            }],
          }),
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    const res1 = await getContractDetails('20260516000001');
    expect(res1?.contractAmount).toBe('500,000원');
    expect(res1?.partner).toBe('비공개');
    expect(res1?.period).toBe('? ~ ?');

    // Test non-numeric amount string
    vi.mocked(fetch).mockImplementation((url: any) => {
      if (url.includes('list.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{ rcept_no: '20260516000001', corp_code: '00123456' }],
          }),
        } as any);
      }
      if (url.includes('snglpnrsctrt.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: '000',
            list: [{
              rcept_no: '20260516000001',
              cntrct_amt: 'N/A', // non-numeric
            }],
          }),
        } as any);
      }
      return Promise.resolve({ ok: false } as any);
    });

    const res2 = await getContractDetails('20260516000001');
    expect(res2?.contractAmount).toBe('N/A');
  });
});
