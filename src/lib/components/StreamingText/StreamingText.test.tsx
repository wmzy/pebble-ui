import { render, screen, act } from '@testing-library/react';

import StreamingText from './StreamingText';

describe('StreamingText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initially empty', () => {
    render(<StreamingText text="Hello" speed={100} />);
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('streams text over time', () => {
    render(<StreamingText text="Hi" speed={100} showCursor={false} />);
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('H')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('calls onComplete when done', () => {
    const onComplete = vi.fn();
    render(<StreamingText text="OK" speed={50} onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(50); });
    act(() => { vi.advanceTimersByTime(50); });
    expect(onComplete).toHaveBeenCalled();
  });

  it('applies className', () => {
    const { container } = render(<StreamingText text="Hi" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('has no axe violations once streaming settles', async () => {
    const { axe } = await import('jest-axe');
    render(<StreamingText text="Hello world" speed={100} />);
    // each character's timer is scheduled from the previous render, so
    // advance one interval per act tick
    for (let i = 0; i < 12; i++) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    // jest-axe is async — run it under real timers.
    vi.useRealTimers();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('finalizes completed lines into memoized chunk spans', () => {
    const text = 'first line\nsecond line\nthird line';
    const { container } = render(
      <StreamingText text={text} speed={1} showCursor={false} />,
    );
    for (const _tick of text) {
      act(() => { vi.advanceTimersByTime(1); });
    }
    const wrapperEl = container.firstChild as HTMLElement;
    const chunks = Array.from(wrapperEl.children);
    // one chunk span per line; finalized chunks keep their trailing newline
    expect(chunks).toHaveLength(3);
    expect(chunks[0]!.textContent).toBe('first line\n');
    expect(chunks[1]!.textContent).toBe('second line\n');
    expect(chunks[2]!.textContent).toBe('third line');
    expect(wrapperEl.textContent).toBe(text);
  });

  it('confines per-tick DOM text mutations to the active tail chunk', async () => {
    const lines = Array.from(
      { length: 12 },
      (_, i) => `line-${String(i).padStart(2, '0')} ${'x'.repeat(10)}`,
    );
    const text = lines.join('\n');
    const { container } = render(
      <StreamingText text={text} speed={1} showCursor={false} />,
    );
    const root = container.firstChild as HTMLElement;

    // Finalized chunks must never have their text mutated again: every
    // characterData mutation has to land on the element that is the last
    // child at delivery time (the growing tail chunk). MutationObserver
    // records are delivered per microtask checkpoint, so each tick is
    // flushed through an async act before the next one starts.
    const mutatedOutsideTail: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== 'characterData') return;
        const parent = (record.target as Text).parentElement;
        if (parent && parent !== root.lastElementChild) {
          mutatedOutsideTail.push(parent.textContent);
        }
      }
    });
    observer.observe(root, { characterData: true, childList: true, subtree: true });

    for (const _tick of text) {
      await act(async () => {
        vi.advanceTimersByTime(1);
        // Yield a microtask so MutationObserver records (delivered per
        // microtask checkpoint) are flushed inside this act boundary.
        await Promise.resolve();
      });
    }
    observer.disconnect();

    expect(mutatedOutsideTail).toEqual([]);
    expect(root.textContent).toBe(text);
    expect(root.children).toHaveLength(lines.length);
  });
});
