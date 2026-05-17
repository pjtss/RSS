import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContractBadge } from './contract-badge';

describe('ContractBadge Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders null immediately if rceptNo is missing', () => {
    const { container } = render(<ContractBadge rceptNo="" />);
    expect(container.firstChild).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('renders loading state and then contract details on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        contractAmount: '120억원',
        salesRatio: '24.5',
        partner: '글로벌 유통사',
        period: '2026-05-16 ~ 2027-05-16',
      }),
    } as any);

    render(<ContractBadge rceptNo="20260516000001" />);

    // Check loading indicator
    expect(screen.getByText('계약 상세 데이터 불러오는 중...')).toBeInTheDocument();

    // Check loaded details
    await waitFor(() => {
      expect(screen.getByText('120억원')).toBeInTheDocument();
    });
    expect(screen.getByText('(매출대비 24.5%)')).toBeInTheDocument();
    expect(screen.getByText('글로벌 유통사')).toBeInTheDocument();
    expect(screen.getByText('2026-05-16 ~ 2027-05-16')).toBeInTheDocument();
  });

  it('renders null if API response fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<ContractBadge rceptNo="20260516000001" />);

    await waitFor(() => {
      // Container should become null after loading completes and error is caught
      expect(container.firstChild).toBeNull();
    });
  });
});
