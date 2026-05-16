import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWatchlist, saveWatchlist, toggleWatchlist, WATCHLIST_KEY } from './watchlist';

describe('watchlist.ts', () => {
  beforeEach(() => {
    // Clear localStorage mock before each test
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  describe('getWatchlist', () => {
    it('should return empty array if nothing in localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      expect(getWatchlist()).toEqual([]);
    });

    it('should return parsed array if exists in localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['AAPL', 'TSLA']));
      expect(getWatchlist()).toEqual(['AAPL', 'TSLA']);
    });

    it('should return empty array on parse error', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');
      expect(getWatchlist()).toEqual([]);
    });
  });

  describe('saveWatchlist', () => {
    it('should call setItem with correct key and value', () => {
      saveWatchlist(['MSFT']);
      expect(localStorage.setItem).toHaveBeenCalledWith(WATCHLIST_KEY, JSON.stringify(['MSFT']));
    });
  });

  describe('toggleWatchlist', () => {
    it('should add item if not present', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['AAPL']));
      const result = toggleWatchlist('TSLA');
      expect(result).toEqual(['AAPL', 'TSLA']);
      expect(localStorage.setItem).toHaveBeenCalledWith(WATCHLIST_KEY, JSON.stringify(['AAPL', 'TSLA']));
    });

    it('should remove item if already present', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['AAPL', 'TSLA']));
      const result = toggleWatchlist('AAPL');
      expect(result).toEqual(['TSLA']);
      expect(localStorage.setItem).toHaveBeenCalledWith(WATCHLIST_KEY, JSON.stringify(['TSLA']));
    });
  });
});
