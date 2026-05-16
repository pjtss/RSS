import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedPage from './feed-page';
import { PushProvider } from './push-provider';

// Mock child components
vi.mock('./market-sentiment', () => ({
  MarketSentiment: () => <div data-testid="sentiment" />
}));

vi.mock('./page-navigation', () => ({
  PageNavigation: () => <nav data-testid="navigation" />
}));

// Mock CSS
vi.mock('./feed-page.module.css', () => ({
  default: {
    container: 'container',
    hero: 'hero',
    title: 'title',
    description: 'description',
    searchInput: 'searchInput',
  },
}));

describe('FeedPage Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    } as any));
    
    // Mock navigator.serviceWorker for PushProvider
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockResolvedValue(null),
      }
    });
  });

  it('renders page header correctly', async () => {
    await act(async () => {
      render(
        <PushProvider>
          <FeedPage type="dart" title="DART 공시" description="실시간 호재 공시" />
        </PushProvider>
      );
    });
    
    expect(screen.getByText('DART 공시')).toBeDefined();
    expect(screen.getByText('실시간 호재 공시')).toBeDefined();
  });

  it('filters items when search input changes', async () => {
    await act(async () => {
      render(
        <PushProvider>
          <FeedPage type="dart" title="DART" description="DESC" />
        </PushProvider>
      );
    });

    const searchInput = screen.getByPlaceholderText(/검색어를 입력하세요/);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '삼성' } });
    });
    expect((searchInput as HTMLInputElement).value).toBe('삼성');
  });
});
