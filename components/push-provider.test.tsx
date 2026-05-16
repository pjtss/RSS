import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushProvider, usePushDebug } from './push-provider';

// Mock APIs
const mockServiceWorker = {
  getRegistration: vi.fn().mockResolvedValue(null),
  register: vi.fn(),
};

const mockNotification = {
  permission: 'default',
  requestPermission: vi.fn(),
};

vi.stubGlobal('navigator', { serviceWorker: mockServiceWorker });
vi.stubGlobal('Notification', mockNotification);
vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('window', {
  ...window,
  atob: vi.fn(),
  PushManager: {},
});

const TestComponent = () => {
  const { status } = usePushDebug();
  if (!status) return <div>Loading...</div>;
  return <div>{status.supported ? 'Supported' : 'Not Supported'}</div>;
};

describe('PushProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: true }),
    } as any);
  });

  it('provides push status to consumers', async () => {
    await act(async () => {
      render(
        <PushProvider>
          <TestComponent />
        </PushProvider>
      );
    });

    expect(screen.getByText(/Supported|Not Supported/)).toBeDefined();
  });

  it('throws error when used outside of provider', () => {
    // Suppress console.error for this test
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('PushProvider 안에서만 usePushDebug를 사용할 수 있습니다.');
  });
});
