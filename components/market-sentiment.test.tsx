import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarketSentiment } from './market-sentiment';

// Mock CSS modules
vi.mock('./market-sentiment.module.css', () => ({
  default: {
    container: 'container',
    gauge: 'gauge',
    track: 'track',
    fill: 'fill',
    center: 'center',
    score: 'score',
    label: 'label',
    labels: 'labels',
  },
}));

describe('MarketSentiment Component', () => {
  it('renders score and label correctly', () => {
    render(<MarketSentiment score={75} label="BULLISH" />);
    expect(screen.getByText('75')).toBeDefined();
    expect(screen.getByText('BULLISH')).toBeDefined();
  });

  it('renders range labels', () => {
    render(<MarketSentiment score={50} label="NEUTRAL" />);
    expect(screen.getByText('BEARISH')).toBeDefined();
    expect(screen.getByText('NEUTRAL')).toBeDefined();
    expect(screen.getByText('BULLISH')).toBeDefined();
  });
});
