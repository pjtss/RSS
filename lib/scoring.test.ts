import { describe, it, expect } from 'vitest';
import { calculateDartScore, calculateMarketSentiment } from './scoring';

describe('Scoring Logic', () => {
  it('should correctly score a strong bullish title', () => {
    const title = '제3자 배정 유상증자 결정';
    const result = calculateDartScore(title);
    expect(result.judgment).toBe('최강호재');
    expect(result.score).toBeGreaterThanOrEqual(12);
  });

  it('should correctly score an exclusion keyword', () => {
    const title = '단일판매 공급계약 해지';
    const result = calculateDartScore(title);
    expect(result.judgment).toBe('악재');
    expect(result.score).toBe(-20);
  });
});

describe('Market Sentiment Calculation', () => {
  it('should calculate EXTREME BULLISH for many strong items', () => {
    const items = [
      { source: 'DART' as const, judgment: '최강호재' },
      { source: 'DART' as const, judgment: '최강호재' },
      { source: 'DART' as const, judgment: '호재가능' },
    ];
    const result = calculateMarketSentiment(items);
    expect(result.label).toBe('EXTREME BULLISH');
    expect(result.score).toBeGreaterThan(80);
  });

  it('should return NEUTRAL for empty items', () => {
    const result = calculateMarketSentiment([]);
    expect(result.label).toBe('NEUTRAL');
    expect(result.score).toBe(50);
  });
});
