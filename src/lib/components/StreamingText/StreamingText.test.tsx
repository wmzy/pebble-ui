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
    // completion puts the full text in the live region as well, so the
    // visible chunk and the announcement mirror both match
    expect(screen.getAllByText('Hi')).toHaveLength(2);
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
    // the visible text and its live-region mirror both hold the text
    expect(screen.getAllByText('Hello world')).toHaveLength(2);
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
    // visible chunks live inside the content area; the live region is a
    // hidden first child (see the announcements suite below)
    const viewport = wrapperEl.lastElementChild as HTMLElement;
    const chunks = Array.from(viewport.children);
    // one chunk span per line; finalized chunks keep their trailing newline
    expect(chunks).toHaveLength(3);
    expect(chunks[0]!.textContent).toBe('first line\n');
    expect(chunks[1]!.textContent).toBe('second line\n');
    expect(chunks[2]!.textContent).toBe('third line');
    expect(viewport.textContent).toBe(text);
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
    const viewport = root.lastElementChild as HTMLElement;

    // Finalized chunks must never have their text mutated again: every
    // characterData mutation has to land on the element that is the last
    // child at delivery time (the growing tail chunk). MutationObserver
    // records are delivered per microtask checkpoint, so each tick is
    // flushed through an async act before the next one starts. The
    // observer scopes to the content area on purpose — the live region's
    // announcement mutations legitimately happen outside it.
    const mutatedOutsideTail: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type !== 'characterData') return;
        const parent = (record.target as Text).parentElement;
        if (parent && parent !== viewport.lastElementChild) {
          mutatedOutsideTail.push(parent.textContent);
        }
      }
    });
    observer.observe(viewport, { characterData: true, childList: true, subtree: true });

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
    expect(viewport.textContent).toBe(text);
    expect(viewport.children).toHaveLength(lines.length);
  });
});

describe('StreamingText screen-reader announcements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes a status live region marked as the live-region slot', () => {
    render(<StreamingText text="Hi" speed={100} />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('data-slot', 'live-region');
  });

  it('cues the live region with a generating hint at stream start', () => {
    render(<StreamingText text="Hi" speed={100} />);
    const region = screen.getByRole('status');
    act(() => { vi.advanceTimersByTime(0); });
    expect(region).toHaveTextContent('Generating');
  });

  it('marks the streaming content busy and drops aria-busy when done', () => {
    const { container } = render(<StreamingText text="Hi" speed={100} />);
    const root = container.firstChild as HTMLElement;
    const content = root.lastElementChild as HTMLElement;
    // busy marks the mutating content area, never the root — the live
    // region must sit outside the aria-busy subtree
    expect(root).not.toHaveAttribute('aria-busy');
    expect(content).toHaveAttribute('aria-busy', 'true');
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { vi.advanceTimersByTime(100); });
    expect(content).not.toHaveAttribute('aria-busy');
  });

  it('throttles live-region snapshots to announceInterval', () => {
    const text = 'x'.repeat(60);
    render(
      <StreamingText
        text={text}
        speed={10}
        announceInterval={200}
        showCursor={false}
      />,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Generating');

    // Each character's timer is scheduled by the previous act's effect
    // flush, so the stream advances one character per act tick — the
    // same cadence the suite's older tests spell out.
    const tick = () => act(() => { vi.advanceTimersByTime(10); });

    // t=200: the first announce boundary; the cue is replaced by a
    // real snapshot of the characters streamed so far
    for (let i = 0; i < 20; i++) tick();
    const first = region.textContent;
    expect(text.startsWith(first)).toBe(true);
    expect(first.length).toBeGreaterThan(0);

    // mid-interval the region must hold steady — per-character updates
    // are exactly what the throttle exists to suppress
    for (let i = 0; i < 15; i++) tick();
    expect(region.textContent).toBe(first);

    // past the next boundary a further snapshot has landed
    for (let i = 0; i < 6; i++) tick();
    const second = region.textContent;
    expect(second.length).toBeGreaterThan(first.length);
    expect(text.startsWith(second)).toBe(true);
  });

  it('announces the complete text once the stream finishes', () => {
    const text = 'All done now';
    render(
      <StreamingText
        text={text}
        speed={10}
        announceInterval={50}
        showCursor={false}
      />,
    );
    const region = screen.getByRole('status');
    for (const _tick of text) {
      act(() => { vi.advanceTimersByTime(10); });
    }
    expect(region).toHaveTextContent('All done now');
    // settled: no further announcements mutate the region
    act(() => { vi.advanceTimersByTime(400); });
    expect(region).toHaveTextContent('All done now');
  });

  it('re-cues when the stream restarts with new text', () => {
    const { rerender } = render(
      <StreamingText text="first" speed={10} showCursor={false} />,
    );
    for (const _tick of 'first') {
      act(() => { vi.advanceTimersByTime(10); });
    }
    expect(screen.getByRole('status')).toHaveTextContent('first');

    rerender(<StreamingText text="second" speed={10} showCursor={false} />);
    const region = screen.getByRole('status');
    expect(region.textContent).not.toBe('first');
    for (const _tick of 'second') {
      act(() => { vi.advanceTimersByTime(10); });
    }
    expect(region).toHaveTextContent('second');
  });

  it('says nothing for an empty stream', () => {
    render(<StreamingText text="" speed={10} />);
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
