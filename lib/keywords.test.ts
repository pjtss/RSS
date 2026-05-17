import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getKeywords, saveKeywords, toggleKeyword, KEYWORDS_STORAGE_KEY } from './keywords';

describe('Keywords Module', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('When window is undefined (SSR environment)', () => {
    const originalWindow = globalThis.window;

    beforeEach(() => {
      // @ts-ignore
      delete globalThis.window;
    });

    afterEach(() => {
      // @ts-ignore
      globalThis.window = originalWindow;
    });

    it('returns empty array on getKeywords', () => {
      expect(getKeywords()).toEqual([]);
    });

    it('does nothing on saveKeywords', () => {
      saveKeywords(['test']);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('does nothing and returns updated list on toggleKeyword', () => {
      const result = toggleKeyword('test');
      expect(result).toEqual(['test']);
    });
  });

  describe('When window is defined (Client-side environment)', () => {
    it('returns empty array if no keywords are stored', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      expect(getKeywords()).toEqual([]);
    });

    it('returns stored keywords list', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['삼성', '공급']));
      expect(getKeywords()).toEqual(['삼성', '공급']);
    });

    it('handles JSON parse errors gracefully and returns empty array', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');
      expect(getKeywords()).toEqual([]);
    });

    it('saves keywords list to localStorage', () => {
      saveKeywords(['호재', '수주']);
      expect(localStorage.setItem).toHaveBeenCalledWith(KEYWORDS_STORAGE_KEY, JSON.stringify(['호재', '수주']));
    });

    it('returns current keywords if target keyword is empty or whitespace', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['삼성']));
      expect(toggleKeyword('')).toEqual(['삼성']);
      expect(toggleKeyword('   ')).toEqual(['삼성']);
    });

    it('adds keyword to list if not present and saves to localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['삼성']));
      const result = toggleKeyword('공급');
      expect(result).toEqual(['삼성', '공급']);
      expect(localStorage.setItem).toHaveBeenCalledWith(KEYWORDS_STORAGE_KEY, JSON.stringify(['삼성', '공급']));
    });

    it('removes keyword from list if already present and saves to localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(['삼성', '공급']));
      const result = toggleKeyword('삼성');
      expect(result).toEqual(['공급']);
      expect(localStorage.setItem).toHaveBeenCalledWith(KEYWORDS_STORAGE_KEY, JSON.stringify(['공급']));
    });
  });
});
