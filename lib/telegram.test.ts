import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockQuery = vi.fn();
const mockRelease = vi.fn();
const mockConnect = vi.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease,
});
const mockPool = {
  connect: mockConnect,
};

vi.mock('./db', () => ({
  getPool: () => mockPool,
}));

describe('Telegram Integration Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    process.env = { ...originalEnv };
    mockQuery.mockReset();
    mockRelease.mockReset();
    mockConnect.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = originalEnv;
  });

  describe('addTelegramSubscriber', () => {
    it('successfully updates subscriber in DB', async () => {
      const { addTelegramSubscriber } = await import('./telegram');
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await addTelegramSubscriber('12345');
      expect(mockConnect).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO telegram_subscribers'),
        ['12345']
      );
      expect(mockRelease).toHaveBeenCalled();
    });

    it('handles query error gracefully', async () => {
      const { addTelegramSubscriber } = await import('./telegram');
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await addTelegramSubscriber('12345');
      expect(mockRelease).toHaveBeenCalled(); // must still release client
    });
  });

  describe('removeTelegramSubscriber', () => {
    it('successfully disables subscriber in DB', async () => {
      const { removeTelegramSubscriber } = await import('./telegram');
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await removeTelegramSubscriber('12345');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE telegram_subscribers'),
        ['12345']
      );
      expect(mockRelease).toHaveBeenCalled();
    });

    it('handles query error gracefully', async () => {
      const { removeTelegramSubscriber } = await import('./telegram');
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await removeTelegramSubscriber('12345');
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('loadTelegramSubscribers', () => {
    it('returns list of enabled chatIds', async () => {
      const { loadTelegramSubscribers } = await import('./telegram');
      mockQuery.mockResolvedValueOnce({
        rows: [{ chat_id: '123' }, { chat_id: '456' }],
      });

      const list = await loadTelegramSubscribers();
      expect(list).toEqual(['123', '456']);
      expect(mockRelease).toHaveBeenCalled();
    });

    it('returns empty array on load error', async () => {
      const { loadTelegramSubscribers } = await import('./telegram');
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      const list = await loadTelegramSubscribers();
      expect(list).toEqual([]);
      expect(mockRelease).toHaveBeenCalled();
    });
  });

  describe('sendTelegramMessage', () => {
    it('returns early if TELEGRAM_BOT_TOKEN is not configured', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const { sendTelegramMessage } = await import('./telegram');

      await sendTelegramMessage('12345', 'Hello');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('calls telegram message API with proper body', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      const { sendTelegramMessage } = await import('./telegram');

      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as any);

      await sendTelegramMessage('12345', 'Hello');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chat_id: '12345',
            text: 'Hello',
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
          }),
        })
      );
    });

    it('handles request failure gracefully', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      const { sendTelegramMessage } = await import('./telegram');

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await sendTelegramMessage('12345', 'Hello');
      // Should not throw
    });
  });

  describe('sendTelegramAlerts', () => {
    it('returns early if no bot token or empty alerts', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const { sendTelegramAlerts } = await import('./telegram');

      await sendTelegramAlerts([{ id: 1 } as any]);
      expect(mockConnect).not.toHaveBeenCalled();

      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      const { sendTelegramAlerts: sendWithToken } = await import('./telegram');
      await sendWithToken([]);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('gathers all subscribers including TELEGRAM_CHAT_ID owner and transmits alerts', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_CHAT_ID = 'owner-chat';
      const { sendTelegramAlerts } = await import('./telegram');

      // Subscribers: DB returns '123'
      mockQuery.mockResolvedValueOnce({
        rows: [{ chat_id: '123' }],
      });
      vi.mocked(fetch).mockResolvedValue({ ok: true } as any);

      await sendTelegramAlerts([
        {
          company: '삼성',
          title: '수주공시',
          publishedAt: '2026-05-16T00:00:00Z',
          link: 'http://link',
          level: '최강호재',
        } as any,
      ]);

      // Subscribed chatIds should receive standard Markdown message
      // 1. owner-chat, 2. 123
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('bottest-token/sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('[최강호재] 삼성'),
        })
      );
    });

    it('handles standard alert with fallback level title prefix', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      delete process.env.TELEGRAM_CHAT_ID;
      const { sendTelegramAlerts } = await import('./telegram');

      // Subscribers: DB returns '123'
      mockQuery.mockResolvedValueOnce({
        rows: [{ chat_id: '123' }],
      });
      vi.mocked(fetch).mockResolvedValue({ ok: true } as any);

      await sendTelegramAlerts([
        {
          company: '삼성',
          title: '수주공시',
          publishedAt: '2026-05-16T00:00:00Z',
          link: 'http://link',
        } as any,
      ]);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('bottest-token/sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('[공시] 삼성'),
        })
      );
    });

    it('returns early if no subscribers exist', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      delete process.env.TELEGRAM_CHAT_ID;
      const { sendTelegramAlerts } = await import('./telegram');

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await sendTelegramAlerts([{ company: '삼성' } as any]);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
