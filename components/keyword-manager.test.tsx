import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeywordManager } from './keyword-manager';
import { KEYWORDS_STORAGE_KEY } from '@/lib/keywords';

describe('KeywordManager Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty message when no keywords are registered', () => {
    render(<KeywordManager onKeywordsChange={vi.fn()} />);
    expect(screen.getByText('등록된 키워드가 없습니다.')).toBeInTheDocument();
  });

  it('adds a valid keyword and prevents empty/whitespace/duplicate keywords', () => {
    const handleKeywordsChange = vi.fn();
    render(<KeywordManager onKeywordsChange={handleKeywordsChange} />);

    const input = screen.getByPlaceholderText('예: HBM, 무상증자, 인수합병');
    const addButton = screen.getByText('추가');

    // Attempt empty add
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);
    expect(screen.getByText('등록된 키워드가 없습니다.')).toBeInTheDocument();

    // Add valid keyword
    fireEvent.change(input, { target: { value: '특허' } });
    fireEvent.click(addButton);

    expect(screen.queryByText('등록된 키워드가 없습니다.')).not.toBeInTheDocument();
    expect(screen.getByText('특허')).toBeInTheDocument();
    expect(input).toHaveValue(''); // input must be reset
    expect(handleKeywordsChange).toHaveBeenCalledWith(['특허']);

    // Attempt duplicate add
    fireEvent.change(input, { target: { value: '특허' } });
    fireEvent.click(addButton);
    // Should not trigger handleKeywordsChange again with duplicates
    expect(input).toHaveValue('');
  });

  it('removes a keyword when clicking delete button', () => {
    // Seed localStorage using the correct key
    localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(['특허', '공급계약']));
    const handleKeywordsChange = vi.fn();

    render(<KeywordManager onKeywordsChange={handleKeywordsChange} />);

    expect(screen.getByText('특허')).toBeInTheDocument();
    expect(screen.getByText('공급계약')).toBeInTheDocument();

    // Find delete button inside the span containing '특허'
    const patentBadge = screen.getByText('특허').closest('span');
    expect(patentBadge).not.toBeNull();
    const patentDeleteBtn = patentBadge!.querySelector('button');
    expect(patentDeleteBtn).not.toBeNull();

    fireEvent.click(patentDeleteBtn!);

    // Should only have '공급계약' left
    expect(screen.queryByText('특허')).not.toBeInTheDocument();
    expect(screen.getByText('공급계약')).toBeInTheDocument();
    expect(handleKeywordsChange).toHaveBeenCalledWith(['공급계약']);
  });
});
