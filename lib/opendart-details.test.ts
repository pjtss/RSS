import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDisclosureDetails } from './opendart-details';

describe('OpenDART Details Module', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null if corpCode or category is missing', async () => {
    const result1 = await fetchDisclosureDetails('', 'contract');
    expect(result1).toBeNull();

    // @ts-ignore
    const result2 = await fetchDisclosureDetails('123', null);
    expect(result2).toBeNull();
  });

  it('returns null for an invalid category', async () => {
    // @ts-ignore
    const result = await fetchDisclosureDetails('123', 'invalid-category');
    expect(result).toBeNull();
  });

  it('handles contract category with high and low ratios', async () => {
    // Branch: ratio > 50
    vi.mocked(Math.random).mockReturnValue(0.9); // ratio will be ~150
    const res1 = await fetchDisclosureDetails('123', 'contract');
    expect(res1?.category).toBe('contract');
    expect(res1?.badgeType).toBe('positive');

    // Branch: ratio <= 50
    vi.mocked(Math.random).mockReturnValue(0.1); // ratio will be ~30
    const res2 = await fetchDisclosureDetails('123', 'contract');
    expect(res2?.badgeType).toBe('neutral');
  });

  it('handles treasury stock category with cancel and acquire', async () => {
    // Branch: isCancel = true (random > 0.5)
    vi.mocked(Math.random).mockReturnValue(0.9);
    const res1 = await fetchDisclosureDetails('123', 'treasury');
    expect(res1?.summary).toContain('소각 결정');

    // Branch: isCancel = false (random <= 0.5)
    vi.mocked(Math.random).mockReturnValue(0.1);
    const res2 = await fetchDisclosureDetails('123', 'treasury');
    expect(res2?.summary).toContain('취득');
  });

  it('handles insider holdings category with buy and sell', async () => {
    // Branch: isBuy = true (random > 0.3)
    vi.mocked(Math.random).mockReturnValue(0.9);
    const res1 = await fetchDisclosureDetails('123', 'insider');
    expect(res1?.summary).toContain('장내매수');
    expect(res1?.badgeType).toBe('positive');

    // Branch: isBuy = false (random <= 0.3)
    vi.mocked(Math.random).mockReturnValue(0.1);
    const res2 = await fetchDisclosureDetails('123', 'insider');
    expect(res2?.summary).toContain('장내매도');
    expect(res2?.badgeType).toBe('warning');
  });

  it('handles capital increase category with bonus and private issues', async () => {
    // Branch: 무상증자 (random > 0.5) and 1:1 (random > 0.5)
    vi.mocked(Math.random).mockReturnValue(0.9);
    const res1 = await fetchDisclosureDetails('123', 'capital');
    expect(res1?.summary).toContain('무상증자');
    expect(res1?.summary).toContain('1:1');

    // Branch: 무상증자 (random > 0.5) and 1:2 (random <= 0.5)
    let callCount = 0;
    vi.mocked(Math.random).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.9 : 0.1; // 1st > 0.5, 2nd <= 0.5
    });
    const res2 = await fetchDisclosureDetails('123', 'capital');
    expect(res2?.summary).toContain('1:2');

    // Branch: 유상증자 (random <= 0.5)
    vi.mocked(Math.random).mockReturnValue(0.1);
    const res3 = await fetchDisclosureDetails('123', 'capital');
    expect(res3?.summary).toContain('유상증자');
  });

  it('handles dividends category with high and low yields', async () => {
    // Branch: yieldRate > 4.0
    vi.mocked(Math.random).mockReturnValue(0.9); // yield will be ~5.5%
    const res1 = await fetchDisclosureDetails('123', 'dividend');
    expect(res1?.badgeType).toBe('positive');

    // Branch: yieldRate <= 4.0
    vi.mocked(Math.random).mockReturnValue(0.1); // yield will be ~1.5%
    const res2 = await fetchDisclosureDetails('123', 'dividend');
    expect(res2?.badgeType).toBe('neutral');
  });

  it('handles activism and mna categories', async () => {
    const res1 = await fetchDisclosureDetails('123', 'activism');
    expect(res1?.summary).toContain('행동주의 개입 감지');

    const res2 = await fetchDisclosureDetails('123', 'mna');
    expect(res2?.summary).toContain('M&A 투자');
  });

  it('handles earnings category with surprise and regular earnings', async () => {
    // Branch: isSurprise = true (opIncome > 50)
    vi.mocked(Math.random).mockReturnValue(0.9); // opIncome = 130
    const res1 = await fetchDisclosureDetails('123', 'earnings');
    expect(res1?.summary).toContain('어닝 서프라이즈');
    expect(res1?.badgeType).toBe('positive');

    // Branch: isSurprise = false (opIncome <= 50)
    vi.mocked(Math.random).mockReturnValue(0.1); // opIncome = -30
    const res2 = await fetchDisclosureDetails('123', 'earnings');
    expect(res2?.summary).toContain('실적 공시');
    expect(res2?.badgeType).toBe('neutral');
  });

  it('handles cb_bw category with high and low dilution ratios', async () => {
    // Branch: ratio > 10
    vi.mocked(Math.random).mockReturnValue(0.9); // ratio = 13.8%
    const res1 = await fetchDisclosureDetails('123', 'cb_bw');
    expect(res1?.badgeType).toBe('warning');

    // Branch: ratio <= 10
    vi.mocked(Math.random).mockReturnValue(0.1); // ratio = 4.2%
    const res2 = await fetchDisclosureDetails('123', 'cb_bw');
    expect(res2?.badgeType).toBe('neutral');
  });

  it('handles lawsuit category with embezzlement and normal lawsuits', async () => {
    // Branch: isEmbezzle = true (random > 0.7)
    vi.mocked(Math.random).mockReturnValue(0.9);
    const res1 = await fetchDisclosureDetails('123', 'lawsuit');
    expect(res1?.summary).toContain('배임ㆍ횡령');

    // Branch: isEmbezzle = false (random <= 0.7)
    vi.mocked(Math.random).mockReturnValue(0.1);
    const res2 = await fetchDisclosureDetails('123', 'lawsuit');
    expect(res2?.summary).toContain('소송 피소');
  });
});
