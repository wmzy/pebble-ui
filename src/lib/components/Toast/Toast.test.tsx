import { expect } from 'vitest';
import { render, screen, renderHook, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LocaleProvider from '../LocaleProvider';

import Toast from './Toast';
import ToastContainer, { toastPlacements } from './ToastContainer';
import { useToastContext } from './ToastContext';
import useToast from './useToast';
import { toast } from './toast';

/** Renders the live toast list length inside the container. */
function ToastCount() {
  const { toasts } = useToastContext();
  return <div data-testid="toast-count">{toasts.length}</div>;
}

describe('Toast', () => {
  it('throws when useToast is used outside ToastContainer', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within <ToastContainer>'
    );
    spy.mockRestore();
  });

  it('renders the default variant with a polite status role', () => {
    render(<Toast onClose={vi.fn()} duration={0}>Message</Toast>);
    expect(screen.getByRole('status')).toHaveTextContent('Message');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('maps every variant to its live-region role', () => {
    const variants = ['info', 'success', 'warning', 'danger', 'loading'] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <Toast variant={variant} onClose={vi.fn()} duration={0}>
          Message
        </Toast>
      );
      // Only danger interrupts (role="alert"); the rest queue politely
      // (role="status").
      const expected = variant === 'danger' ? 'alert' : 'status';
      const unexpected = expected === 'alert' ? 'status' : 'alert';
      expect(screen.getByRole(expected)).toHaveTextContent('Message');
      expect(screen.queryByRole(unexpected)).not.toBeInTheDocument();
      unmount();
    }
  });

  it('renders close button', () => {
    render(<Toast onClose={vi.fn()} duration={0}>Message</Toast>);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('labels the close button from the active locale pack', () => {
    render(
      <LocaleProvider locale='ja-JP'>
        <Toast onClose={vi.fn()} duration={0}>Message</Toast>
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument();
  });

  it('re-resolves the close label when the locale switches', () => {
    const { rerender } = render(
      <LocaleProvider locale='zh-CN'>
        <Toast onClose={vi.fn()} duration={0}>Message</Toast>
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
    rerender(
      <LocaleProvider locale='ja-JP'>
        <Toast onClose={vi.fn()} duration={0}>Message</Toast>
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  });

  it('lets a strings override win for the close label', () => {
    render(
      <LocaleProvider strings={{ toast: { close: 'Dismiss' } }}>
        <Toast onClose={vi.fn()} duration={0}>Message</Toast>
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={0}>Message</Toast>);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the default DOM untouched — exactly content + close, no icon', () => {
    // The e2e toast-open baseline pins this structure: without an action
    // or title, and on a non-loading variant, the root holds exactly the
    // content wrapper and the dismiss button, nothing else.
    render(<Toast onClose={vi.fn()} duration={0}>Message</Toast>);
    const root = screen.getByRole('status');
    expect(root.childElementCount).toBe(2);
    expect(root.querySelector('svg')).not.toBeInTheDocument();
    expect(root.children[0]).toHaveTextContent('Message');
    expect(root.children[1]).toHaveAccessibleName('Close');
  });

  it('renders the action button between the content and the close button', () => {
    render(
      <Toast
        onClose={vi.fn()}
        duration={0}
        action={{ label: 'Undo', onClick: vi.fn() }}
      >
        Message
      </Toast>
    );
    const root = screen.getByRole('status');
    const action = screen.getByRole('button', { name: 'Undo' });
    const close = screen.getByRole('button', { name: 'Close' });
    expect(root.childElementCount).toBe(3);
    // DOM order contract: content → action → close.
    expect(root.children[1]).toBe(action);
    expect(root.children[2]).toBe(close);
    expect(root.children[0]).toHaveTextContent('Message');
  });

  it('renders the loading variant with an aria-hidden spinner glyph', () => {
    render(
      <Toast variant='loading' onClose={vi.fn()} duration={0}>
        Working…
      </Toast>
    );
    // aria-hidden art: the toast root is the live region — the glyph must
    // not announce anything of its own.
    const glyph = screen.getByRole('status').querySelector('svg');
    expect(glyph).toBeInTheDocument();
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Working…')).toBeInTheDocument();
  });

  it('renders a title above the description when provided', () => {
    render(
      <Toast onClose={vi.fn()} duration={0} title='Network unstable'>
        Falling back to the cached copy.
      </Toast>
    );
    const root = screen.getByRole('status');
    // The body wrapper now carries exactly the title and description.
    const body = root.children[0] as HTMLElement;
    expect(body.childElementCount).toBe(2);
    expect(body.children[0]).toHaveTextContent('Network unstable');
    expect(body.children[1]).toHaveTextContent('Falling back to the cached copy.');
    // Without a title the body renders the content directly (plain text:
    // the body wrapper IS the text element, no extra description div).
    render(<Toast onClose={vi.fn()} duration={0}>Bare</Toast>);
    const bareRoot = screen
      .getByText('Bare')
      .closest('[role="status"]')!;
    const bareBody = bareRoot.children[0];
    expect(bareBody).toBe(screen.getByText('Bare'));
    expect(bareBody?.childElementCount).toBe(0);
  });

  it('auto-closes after duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={3000}>Message</Toast>);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('does not auto-close when duration is 0', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={0}>Message</Toast>);
    vi.advanceTimersByTime(10000);
    expect(onClose).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('pauses the countdown while hovered and resumes with the remaining time', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: (delay) => {
        vi.advanceTimersByTime(delay);
      },
    });
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={3000}>Message</Toast>);

    vi.advanceTimersByTime(1000);
    // RTL's asyncWrapper parks userEvent on a fake setTimeout(0) that only a
    // concurrent clock advance can flush (it tries jest.advanceTimersByTime,
    // which is a no-op under vitest).
    const hoverPromise = user.hover(screen.getByText('Message'));
    await vi.advanceTimersByTimeAsync(0);
    await hoverPromise;
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(onClose).not.toHaveBeenCalled();

    // 1000ms elapsed while running, so only 2000ms of budget are left.
    const unhoverPromise = user.unhover(screen.getByText('Message'));
    await vi.advanceTimersByTimeAsync(0);
    await unhoverPromise;
    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('pauses the countdown while focused and resumes with the remaining time', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={3000}>Message</Toast>);
    const closeBtn = screen.getByRole('button', { name: 'Close' });

    vi.advanceTimersByTime(1000);
    fireEvent.focus(closeBtn);
    vi.advanceTimersByTime(10_000);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.blur(closeBtn);
    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('stays paused while either hover or focus is active without resetting the budget', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: (delay) => {
        vi.advanceTimersByTime(delay);
      },
    });
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={3000}>Message</Toast>);
    const closeBtn = screen.getByRole('button', { name: 'Close' });

    vi.advanceTimersByTime(1000);
    const hoverPromise = user.hover(screen.getByText('Message'));
    await vi.advanceTimersByTimeAsync(0);
    await hoverPromise;
    fireEvent.focus(closeBtn); // second pause source, must not re-arm the timer
    vi.advanceTimersByTime(10_000);
    expect(onClose).not.toHaveBeenCalled();

    const unhoverPromise = user.unhover(screen.getByText('Message')); // still focused
    await vi.advanceTimersByTimeAsync(0);
    await unhoverPromise;
    vi.advanceTimersByTime(10_000);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.blur(closeBtn); // resume with the 2000ms left since the hover
    vi.advanceTimersByTime(1999);
    expect(onClose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('keeps the countdown when the onClose callback identity changes', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const { rerender } = render(
      <Toast onClose={onClose} duration={3000}>Message</Toast>
    );

    vi.advanceTimersByTime(2000);
    rerender(
      <Toast onClose={() => { onClose(); }} duration={3000}>Message</Toast>
    );
    // Only 1000ms of budget remain; a re-armed timer would need the full 3000ms.
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});

describe('ToastContainer + useToast', () => {
  it('shows toast when useToast is called', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Hello toast');
    });

    expect(screen.getByText('Hello toast')).toBeInTheDocument();
  });

  it('shows toast with custom variant', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Success!', { variant: 'success' });
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('removes toast when close is clicked', async () => {
    const user = userEvent.setup();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Temp', { duration: 0 });
    });

    expect(screen.getByText('Temp')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    // Removal is two-phase: the toast unmounts once the exit settles
    // (immediately under jsdom, which reports no animation duration).
    await waitFor(() =>
      expect(screen.queryByText('Temp')).not.toBeInTheDocument()
    );
  });

  it('keeps a closing toast mounted until the exit settles, then drops it from the list', async () => {
    const user = userEvent.setup();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>
        <ToastCount />
        {children}
      </ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Temp', { duration: 0 });
    });

    // Entering: mounted with data-state="open" on the toast root.
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    // Exit in flight: still mounted and listed, but flipped to closed.
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Exit settled: unmounted from the DOM and removed from the list.
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    );
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('unmounts only after the declared exit animation ends (real-browser path)', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Animated', { duration: 0 });
    });

    // Simulate a browser that computed the toastOut animation (jsdom
    // itself reports no durations, making every exit settle instantly).
    const toastEl = screen.getByRole('status');
    const real = window.getComputedStyle.bind(window);
    const styleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((element, pseudoElement) =>
        element === toastEl
          ? ({
              animationName: 'toastOut',
              animationDuration: '0.2s',
              animationDelay: '0s',
              transitionProperty: 'none',
              transitionDuration: '0s',
              transitionDelay: '0s',
            } as unknown as CSSStyleDeclaration)
          : real(element, pseudoElement)
      );

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      // Past the double frame: the settle is listening, the exit is pending.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
      });
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        toastEl.dispatchEvent(new Event('animationend'));
      });
      await waitFor(() =>
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      );
    } finally {
      styleSpy.mockRestore();
    }
  });

  it('drops the oldest toast when maxCount is exceeded', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer maxCount={2}>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('One', { duration: 0 });
      result.current('Two', { duration: 0 });
      result.current('Three', { duration: 0 });
    });

    expect(screen.queryByText('One')).not.toBeInTheDocument();
    const two = screen.getByText('Two');
    const three = screen.getByText('Three');
    expect(two).toBeInTheDocument();
    expect(three).toBeInTheDocument();
    expect(
      two.compareDocumentPosition(three) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('pins the container to the top-right edge with placement="top-right"', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer placement='top-right'>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Placed', { duration: 0 });
    });

    const containerEl = screen.getByRole('status').parentElement;
    expect(containerEl).toHaveClass(toastPlacements['top-right']);
    expect(containerEl).not.toHaveClass(toastPlacements['bottom-right']);
  });

  it('keeps the bottom-right placement by default', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Placed', { duration: 0 });
    });

    const containerEl = screen.getByRole('status').parentElement;
    expect(containerEl).toHaveClass(toastPlacements['bottom-right']);
    expect(containerEl).not.toHaveClass(toastPlacements['top-right']);
  });

  it('updates content and variant in place without replaying animations', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    const ids: number[] = [];
    act(() => {
      ids.push(result.current('Before update', { duration: 0 }));
    });
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('data-state', 'open');

    act(() => {
      result.current.update(ids[0]!, {
        content: 'After update',
        variant: 'danger',
      });
    });

    // Same DOM node survives the patch (same id → same React key): no
    // unmount/remount, so no exit→enter sequence and the toast never
    // re-enters — it only flipped variant (status → alert).
    const after = screen.getByRole('alert');
    expect(after).toBe(el);
    expect(after).toHaveAttribute('data-state', 'open');
    expect(after).toHaveTextContent('After update');
    expect(screen.queryByText('Before update')).not.toBeInTheDocument();
  });

  it('leaves the countdown running when the patch omits duration', () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    const ids: number[] = [];
    act(() => {
      ids.push(result.current('Uninterrupted', { duration: 3000 }));
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current.update(ids[0]!, { content: 'Still counting' });
    });

    // 1000ms of the ORIGINAL budget remain: closing here proves the patch
    // did not re-arm (a re-armed 3000ms countdown would still be open).
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    vi.useRealTimers();
  });

  it('re-arms the countdown from the full budget when duration changes', () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    const ids: number[] = [];
    act(() => {
      ids.push(result.current('Re-armed', { duration: 3000 }));
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current.update(ids[0]!, { duration: 5000 });
    });

    // The new budget runs in full from the update: still open at +4999
    // (the old countdown would have closed at +1000).
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    vi.useRealTimers();
  });

  it('promise: swaps loading for success copy through the context path', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    let resolveFetch!: (data: string) => void;
    const fetchNames = new Promise<string>((resolve) => {
      resolveFetch = resolve;
    });
    let returned: Promise<string> | undefined;
    act(() => {
      returned = result.current.promise(fetchNames, {
        loading: 'Fetching…',
        success: (data) => `Loaded ${data}`,
        duration: 0,
      });
    });
    expect(screen.getByText('Fetching…')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      resolveFetch('records');
    });
    expect(screen.getByText('Loaded records')).toBeInTheDocument();
    expect(screen.queryByText('Fetching…')).not.toBeInTheDocument();
    await expect(returned).resolves.toBe('records');
  });

  it('shows the spinner during the loading phase and drops it on settle', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    let resolveJob!: () => void;
    const job = new Promise<void>((resolve) => {
      resolveJob = resolve;
    });
    act(() => {
      void toast.promise(job, { loading: 'Working…', duration: 0 });
    });
    // The pending phase rides the loading variant: spinner glyph present.
    const loadingRoot = screen.getByRole('status');
    expect(loadingRoot.querySelector('svg')).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      resolveJob();
    });
    // Settled: same element patched to success — the glyph is gone.
    expect(screen.getByRole('status')).toBe(loadingRoot);
    expect(screen.getByRole('status').querySelector('svg')).not.toBeInTheDocument();
    expect(loadingRoot).toHaveTextContent('Success');
  });

  it('runs the action onClick and dismisses the toast by default', async () => {
    const user = userEvent.setup();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });
    const onClick = vi.fn();

    act(() => {
      result.current('Archived', {
        duration: 0,
        action: { label: 'Undo', onClick },
      });
    });

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledOnce();
    // close defaults to true: the toast leaves without touching the ×.
    await waitFor(() =>
      expect(screen.queryByText('Archived')).not.toBeInTheDocument()
    );
  });

  it('keeps the toast open when the action opts out with close: false', async () => {
    const user = userEvent.setup();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });
    const onClick = vi.fn();

    act(() => {
      result.current('Draft saved', {
        duration: 0,
        action: { label: 'View', onClick, close: false },
      });
    });

    await user.click(screen.getByRole('button', { name: 'View' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('Draft saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
  });

  it('update() attaches an action to a live toast in place', async () => {
    const user = userEvent.setup();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    const ids: number[] = [];
    act(() => {
      ids.push(result.current('Uploaded', { duration: 0 }));
    });
    expect(
      screen.queryByRole('button', { name: 'Undo' })
    ).not.toBeInTheDocument();
    const el = screen.getByRole('status');

    act(() => {
      result.current.update(ids[0]!, {
        action: { label: 'Undo', onClick: vi.fn() },
      });
    });

    // Same element patched, not remounted.
    expect(screen.getByRole('status')).toBe(el);
    const action = screen.getByRole('button', { name: 'Undo' });
    await user.click(action);
    await waitFor(() =>
      expect(screen.queryByText('Uploaded')).not.toBeInTheDocument()
    );
  });

  it('reaches the action button by keyboard and activates it with Enter', async () => {
    const user = userEvent.setup();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });
    const onClick = vi.fn();

    act(() => {
      result.current('Saved', {
        duration: 0,
        action: { label: 'Undo', onClick },
      });
    });

    // The action is a real button first in the tab order (the toast body
    // holds no focusable content).
    await user.tab();
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    );
  });

  it('loading() shows the spinner and never auto-dismisses', () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.loading('Crunching numbers…');
    });

    const root = screen.getByRole('status');
    expect(root).toHaveTextContent('Crunching numbers…');
    expect(root.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    // duration defaults to 0 — no countdown is ever armed.
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    vi.useRealTimers();
  });

  it('loading() honors an explicit duration override', () => {
    vi.useFakeTimers();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.loading('Brief spin', { duration: 2000 });
    });
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'closed');
    vi.useRealTimers();
  });

  it('has no axe violations for an action toast with a title', async () => {
    const { axe } = await import('jest-axe');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Falling back to the cached copy.', {
        variant: 'warning',
        title: 'Network unstable',
        duration: 0,
        action: { label: 'Retry now', onClick: vi.fn() },
      });
    });

    expect(await screen.findByText('Network unstable')).toBeInTheDocument();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations while a toast is shown', async () => {
    const { axe } = await import('jest-axe');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastContainer>{children}</ToastContainer>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current('Saved successfully', { variant: 'success', duration: 0 });
    });

    expect(await screen.findByText('Saved successfully')).toBeInTheDocument();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('imperative toast()', () => {
  // toast() holds module-level state (pending queue + subscribers) that
  // would otherwise leak across tests.
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('does not throw without a container and shows nothing', () => {
    expect(() => {
      act(() => {
        toast('Queued', { duration: 0 });
      });
    }).not.toThrow();
    expect(screen.queryByText('Queued')).not.toBeInTheDocument();
  });

  it('replays queued toasts in order when a container mounts', () => {
    act(() => {
      toast('First queued', { duration: 0 });
      toast('Second queued', { duration: 0 });
    });
    render(<ToastContainer>{null}</ToastContainer>);
    const first = screen.getByText('First queued');
    const second = screen.getByText('Second queued');
    expect(first).toBeInTheDocument();
    expect(second).toBeInTheDocument();
    expect(
      first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('caps the pending queue at 100, dropping the oldest', () => {
    Array.from({ length: 101 }, (_, i) =>
      toast(`Queued ${i}`, { duration: 0 })
    );
    render(<ToastContainer>{null}</ToastContainer>);
    expect(screen.queryByText('Queued 0')).not.toBeInTheDocument();
    expect(screen.getByText('Queued 1')).toBeInTheDocument();
    expect(screen.getByText('Queued 100')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(100);
  });

  it('shows toast() immediately once a container is mounted', () => {
    render(<ToastContainer>{null}</ToastContainer>);
    act(() => {
      toast('Immediate', { duration: 0 });
    });
    expect(screen.getByText('Immediate')).toBeInTheDocument();
  });

  it('enqueues again after the container unmounts', () => {
    const { unmount } = render(<ToastContainer>{null}</ToastContainer>);
    unmount();
    act(() => {
      toast('After unmount', { duration: 0 });
    });
    expect(screen.queryByText('After unmount')).not.toBeInTheDocument();
    render(<ToastContainer>{null}</ToastContainer>);
    expect(screen.getByText('After unmount')).toBeInTheDocument();
  });

  it('renders in only the first container when two are mounted', () => {
    render(<ToastContainer>{null}</ToastContainer>);
    render(<ToastContainer>{null}</ToastContainer>);
    act(() => {
      toast('Once', { duration: 0 });
    });
    expect(screen.getAllByText('Once')).toHaveLength(1);
  });

  it('exposes variant sugar matching the variant union', () => {
    render(<ToastContainer>{null}</ToastContainer>);
    act(() => {
      toast.success('Saved', { duration: 0 });
      toast.danger('Failed', { duration: 0 });
    });
    const saved = screen.getByText('Saved').closest('[role="status"]');
    const failed = screen.getByText('Failed').closest('[role="alert"]');
    expect(saved).toBeInTheDocument();
    expect(failed).toBeInTheDocument();
    // Distinct variants land on distinct classes of the toast root.
    expect(saved?.className).not.toBe(failed?.className);
  });

  it('toast.loading stays until dismissed and carries the spinner', () => {
    vi.useFakeTimers();
    render(<ToastContainer>{null}</ToastContainer>);
    act(() => {
      toast.loading('Fetching schema…');
    });
    const root = screen.getByRole('status');
    expect(root).toHaveTextContent('Fetching schema…');
    expect(root.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'open');
    act(() => {
      toast.dismiss();
    });
    vi.useRealTimers();
  });

  it('variant sugar methods carry an action like plain toast()', async () => {
    const user = userEvent.setup();
    render(<ToastContainer>{null}</ToastContainer>);
    const onClick = vi.fn();
    act(() => {
      toast.danger('Delete failed', {
        duration: 0,
        action: { label: 'Retry', onClick },
      });
    });
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByText('Delete failed')).not.toBeInTheDocument()
    );
  });

  it('dismisses a specific toast by id', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    const ids: number[] = [];
    act(() => {
      ids.push(
        toast('Keep me', { duration: 0 }),
        toast('Drop me', { duration: 0 })
      );
    });
    act(() => {
      toast.dismiss(ids[1]);
    });
    await waitFor(() =>
      expect(screen.queryByText('Drop me')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Keep me')).toBeInTheDocument();
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('dismisses all displayed toasts when called without an id', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    act(() => {
      toast('All one', { duration: 0 });
      toast('All two', { duration: 0 });
    });
    act(() => {
      toast.dismiss();
    });
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    );
  });

  it('cancels a still-queued toast by id before a container mounts', () => {
    toast('Kept in queue', { duration: 0 });
    const cancelledId = toast('Cancelled while queued');
    toast.dismiss(cancelledId);
    render(<ToastContainer>{null}</ToastContainer>);
    expect(screen.getByText('Kept in queue')).toBeInTheDocument();
    expect(screen.queryByText('Cancelled while queued')).not.toBeInTheDocument();
  });

  it('clears the pending queue on dismiss-all with no container mounted', () => {
    toast('Queued one');
    toast('Queued two');
    toast.dismiss();
    render(<ToastContainer>{null}</ToastContainer>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has no axe violations for imperative toasts', async () => {
    const { axe } = await import('jest-axe');
    render(<ToastContainer>{null}</ToastContainer>);
    act(() => {
      toast.success('Imperatively saved', { duration: 0 });
    });
    expect(await screen.findByText('Imperatively saved')).toBeInTheDocument();
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('toast.update()', () => {
  // toast() holds module-level state (pending queue + subscribers) that
  // would otherwise leak across tests.
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('patches a toast that is still queued before any container mounts', () => {
    const id = toast('Queued original', { duration: 0 });
    act(() => {
      toast.update(id, { content: 'Queued updated', variant: 'success' });
    });
    render(<ToastContainer>{null}</ToastContainer>);
    // The replay shows the patched item — the update landed pre-mount.
    expect(screen.queryByText('Queued original')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Queued updated');
    // One patched toast, not a second one appended.
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('patches a displayed imperative toast in place', () => {
    render(<ToastContainer>{null}</ToastContainer>);
    const ids: number[] = [];
    act(() => {
      ids.push(toast('Module before', { duration: 0 }));
    });
    const el = screen.getByRole('status');
    act(() => {
      toast.update(ids[0]!, { content: 'Module after', variant: 'warning' });
    });
    expect(screen.getByRole('status')).toBe(el);
    expect(el).toHaveTextContent('Module after');
  });

  it('never resurrects an already-dismissed toast', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    const ids: number[] = [];
    act(() => {
      ids.push(toast('Short-lived', { duration: 0 }));
    });
    act(() => {
      toast.dismiss(ids[0]);
    });
    await waitFor(() =>
      expect(screen.queryByText('Short-lived')).not.toBeInTheDocument()
    );
    act(() => {
      toast.update(ids[0]!, { content: 'Back from the dead' });
    });
    expect(screen.queryByText('Back from the dead')).not.toBeInTheDocument();
  });
});

describe('toast.promise', () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it('settles a successful promise: loading copy swaps in place, the promise passes through', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    let resolveSave!: (value: string) => void;
    const save = new Promise<string>((resolve) => {
      resolveSave = resolve;
    });
    let returned: Promise<string> | undefined;
    act(() => {
      returned = toast.promise(save, {
        loading: 'Saving…',
        success: (data) => `Saved ${data}`,
        duration: 0,
      });
    });
    // 原样透传: the caller's promise identity is preserved.
    expect(returned).toBe(save);
    const loadingEl = screen.getByRole('status');
    expect(loadingEl).toHaveTextContent('Saving…');

    await act(async () => {
      await Promise.resolve();
      resolveSave('invoice.pdf');
    });
    // Same toast element — the settle patched it, never remounted it.
    expect(screen.getByRole('status')).toBe(loadingEl);
    expect(loadingEl).toHaveTextContent('Saved invoice.pdf');
    expect(screen.queryByText('Saving…')).not.toBeInTheDocument();
    await expect(save).resolves.toBe('invoice.pdf');
  });

  it('falls back to the locale pack copy for omitted phases', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    let resolveJob!: () => void;
    const job = new Promise<void>((resolve) => {
      resolveJob = resolve;
    });
    act(() => {
      void toast.promise(job, { duration: 0 });
    });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
      resolveJob();
    });
    expect(screen.getByText('Success')).toBeInTheDocument();

    let rejectImport!: (reason?: unknown) => void;
    const importJob = new Promise<void>((_resolve, reject) => {
      rejectImport = reject;
    });
    act(() => {
      void toast.promise(importJob, { duration: 0 });
    });
    await act(async () => {
      await Promise.resolve();
      rejectImport(new Error('nope'));
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await expect(importJob).rejects.toThrow('nope');
  });

  it('resolves deferred copy against the active LocaleProvider pack', async () => {
    render(
      <LocaleProvider locale='zh-CN'>
        <ToastContainer>{null}</ToastContainer>
      </LocaleProvider>
    );
    let resolveJob!: () => void;
    const job = new Promise<void>((resolve) => {
      resolveJob = resolve;
    });
    act(() => {
      void toast.promise(job, { duration: 0 });
    });
    expect(screen.getByText('加载中…')).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
      resolveJob();
    });
    expect(screen.getByText('成功')).toBeInTheDocument();
  });

  it('settles a rejected promise: danger copy and the original rejection still catchable', async () => {
    render(<ToastContainer>{null}</ToastContainer>);
    const failure = new Error('network down');
    let rejectSync!: (reason?: unknown) => void;
    const sync = new Promise<string>((_resolve, reject) => {
      rejectSync = reject;
    });
    let returned: Promise<string> | undefined;
    act(() => {
      returned = toast.promise(sync, {
        loading: 'Syncing…',
        error: (err) =>
          `Sync failed: ${err instanceof Error ? err.message : String(err)}`,
        duration: 0,
      });
    });
    await act(async () => {
      await Promise.resolve();
      rejectSync(failure);
    });
    // danger variant → assertive role, error copy applied.
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sync failed: network down'
    );
    expect(screen.queryByText('Syncing…')).not.toBeInTheDocument();
    // The caller's catch still sees the original rejection value.
    await expect(returned).rejects.toBe(failure);
  });

  it('does not resurrect a loading toast dismissed before the promise settles', async () => {
    const user = userEvent.setup();
    render(<ToastContainer>{null}</ToastContainer>);
    let resolveUpload!: () => void;
    const upload = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });
    act(() => {
      void toast.promise(upload, { loading: 'Uploading…', duration: 0 });
    });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByText('Uploading…')).not.toBeInTheDocument()
    );
    await act(async () => {
      await Promise.resolve();
      resolveUpload();
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });
});

describe('Toast classNames slots', () => {
  it('applies item, content and close to a directly rendered toast', () => {
    render(
      <Toast
        onClose={vi.fn()}
        duration={0}
        classNames={{ item: 't-item', content: 't-content', close: 't-close' }}
      >
        Message
      </Toast>
    );
    const item = screen.getByRole('status');
    expect(item).toHaveClass('t-item');
    expect(item.firstElementChild).toHaveClass('t-content');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('t-close');
  });

  it('applies action and title slots when those parts render', () => {
    render(
      <Toast
        onClose={vi.fn()}
        duration={0}
        title='Slotted title'
        classNames={{ action: 't-action', title: 't-title' }}
        action={{ label: 'Undo', onClick: vi.fn() }}
      >
        Message
      </Toast>
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveClass('t-action');
    expect(screen.getByText('Slotted title')).toHaveClass('t-title');
  });

  it('distributes viewport and item slots from ToastContainer to fired toasts', async () => {
    const user = userEvent.setup();
    function FireToast() {
      const showToast = useToast();
      return (
        <button onClick={() => showToast('Slotted', { duration: 0 })}>fire</button>
      );
    }
    const { container } = render(
      <ToastContainer
        classNames={{ viewport: 't-viewport', item: 't-item', close: 't-close' }}
      >
        <FireToast />
      </ToastContainer>
    );
    // The fixed stack this container renders (after the children).
    const viewport = container.lastElementChild;
    expect(viewport).toHaveClass('t-viewport');
    await user.click(screen.getByRole('button', { name: 'fire' }));
    expect(screen.getByRole('status')).toHaveClass('t-item');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('t-close');
  });

  it('keeps the class lists untouched when classNames is omitted', () => {
    const { container } = render(<Toast onClose={vi.fn()} duration={0}>Message</Toast>);
    const item = screen.getByRole('status');
    for (const el of [
      item,
      item.firstElementChild as HTMLElement,
      screen.getByRole('button', { name: 'Close' }),
      container.firstElementChild as HTMLElement,
    ]) {
      expect(el.className).toBe(el.className.trim());
      expect(el.className).not.toContain('  ');
    }
  });
});
