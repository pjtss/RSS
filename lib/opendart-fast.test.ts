import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchOpenDartFastFeed } from './opendart-fast';

describe('opendart-fast.ts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv, OPENDART_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should throw error if API key is missing', async () => {
    delete process.env.OPENDART_API_KEY;
    await expect(fetchOpenDartFastFeed()).rejects.toThrow('OPENDART_API_KEY 환경변수가 설정되지 않았습니다.');
  });

  it('should fetch and parse OpenDart data correctly', async () => {
    const mockResponse = {
      status: '000',
      list: [
        {
          corp_cls: 'Y',
          corp_name: '삼성전자',
          stock_code: '005930',
          report_nm: '단일판매ㆍ공급계약체결',
          rcept_no: '20260516000001',
          flr_nm: '삼성전자',
          rcept_dt: '20260516',
          rm: '',
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as any);

    const result = await fetchOpenDartFastFeed();
    expect(result.source).toBe('OPENDART');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].corpName).toBe('삼성전자');
    expect(result.items[0].judgment).toBe('최강호재');
  });

  it('should handle "013" (no data) status correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: '013', message: '조회된 데이타가 없습니다.' }),
    } as any);

    const result = await fetchOpenDartFastFeed();
    expect(result.items).toHaveLength(0);
  });

  it('should throw error on API error status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: '999', message: 'Unknown Error' }),
    } as any);

    await expect(fetchOpenDartFastFeed()).rejects.toThrow('Unknown Error');
  });
});
