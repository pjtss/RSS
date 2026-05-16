import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RapidDartPage } from './rapid-dart-page';

// Mock child components
vi.mock('./page-navigation', () => ({
  PageNavigation: () => <nav data-testid="navigation" />
}));

// Mock CSS
vi.mock('./rapid-dart-page.module.css', () => ({
  default: {
    page: 'page',
    hero: 'hero',
    stats: 'stats',
    statCard: 'statCard',
    panel: 'panel',
    feed: 'feed',
    empty: 'empty',
  },
}));

describe('RapidDartPage Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders hero section and stats', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    } as any);

    await act(async () => {
      render(<RapidDartPage />);
    });
    
    expect(screen.getByText('국내 주식 급속 호재')).toBeDefined();
    expect(screen.getByText('금일 호재 수')).toBeDefined();
  });

  it('renders empty message when no items', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    } as any);

    await act(async () => {
      render(<RapidDartPage />);
    });

    expect(screen.getByText(/표시할 국내 주식 호재 공시가 없습니다/)).toBeDefined();
  });
});
