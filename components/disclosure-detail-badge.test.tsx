import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DisclosureDetailBadge } from './disclosure-detail-badge';

describe('DisclosureDetailBadge Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders null immediately if corpCode or category is missing', () => {
    const { container: c1 } = render(<DisclosureDetailBadge corpCode="" category="contract" />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<DisclosureDetailBadge corpCode="123" category="" />);
    expect(c2.firstChild).toBeNull();

    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders loading state and then details badge on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        summary: '50억원 공급 계약',
        badgeType: 'positive',
      }),
    } as any);

    render(<DisclosureDetailBadge corpCode="00123456" category="contract" />);

    // Check loading indicator
    expect(screen.getByText('분석 중...')).toBeInTheDocument();

    // Check loaded detail badge
    await waitFor(() => {
      expect(screen.getByText('50억원 공급 계약')).toBeInTheDocument();
    });

    const badge = screen.getByText('50억원 공급 계약').closest('span[class*="badge"]');
    expect(badge).not.toBeNull();
  });

  it('renders null/empty if API response fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<DisclosureDetailBadge corpCode="00123456" category="contract" />);

    await waitFor(() => {
      // The wrapper div exists but it contains no children (empty)
      expect(container.firstChild?.childNodes.length).toBe(0);
    });
  });

  it('cancels state update if component unmounts mid-flight', async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(fetch).mockReturnValueOnce(fetchPromise as any);

    const { unmount, container } = render(
      <DisclosureDetailBadge corpCode="00123456" category="contract" />
    );

    // Currently loading
    expect(screen.getByText('분석 중...')).toBeInTheDocument();

    // Unmount before resolve
    unmount();

    // Resolve now
    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ summary: 'Late', badgeType: 'positive' }),
    });

    // Should not render anything since unmounted
    expect(container.firstChild).toBeNull();
  });
});
