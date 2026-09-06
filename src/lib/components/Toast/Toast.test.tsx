import { expect } from 'vitest';
import { render, screen, renderHook, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('renders children with alert role', () => {
    render(<Toast onClose={vi.fn()} duration={0}>Message</Toast>);
    expect(screen.getByRole('alert')).toHaveTextContent('Message');
  });

  it('renders close button', () => {
    render(<Toast onClose={vi.fn()} duration={0}>Message</Toast>);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast onClose={onClose} duration={0}>Message</Toast>);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
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
    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Close' }));

    // Exit in flight: still mounted and listed, but flipped to closed.
    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'closed');
    expect(screen.getByText('Temp')).toBeInTheDocument();
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Exit settled: unmounted from the DOM and removed from the list.
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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
    const alertEl = screen.getByRole('alert');
    const real = window.getComputedStyle.bind(window);
    const styleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((element, pseudoElement) =>
        element === alertEl
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
      expect(screen.getByRole('alert')).toBeInTheDocument();

      act(() => {
        alertEl.dispatchEvent(new Event('animationend'));
      });
      await waitFor(() =>
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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

    const containerEl = screen.getByRole('alert').parentElement;
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

    const containerEl = screen.getByRole('alert').parentElement;
    expect(containerEl).toHaveClass(toastPlacements['bottom-right']);
    expect(containerEl).not.toHaveClass(toastPlacements['top-right']);
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
    expect(screen.getAllByRole('alert')).toHaveLength(100);
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
    const saved = screen.getByText('Saved').closest('[role="alert"]');
    const failed = screen.getByText('Failed').closest('[role="alert"]');
    expect(saved).toBeInTheDocument();
    expect(failed).toBeInTheDocument();
    // Distinct variants land on distinct classes of the toast root.
    expect(saved?.className).not.toBe(failed?.className);
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
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
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
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
