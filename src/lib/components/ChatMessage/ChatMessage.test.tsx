import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StreamingText from '../StreamingText/StreamingText';

import ChatMessage from './ChatMessage';

/** jsdom has neither navigator.clipboard nor execCommand — stub the
 * async API so the success path runs (same pattern as
 * useClipboard.test.tsx). */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  const fn = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: fn },
    configurable: true,
  });
  return {
    fn,
    restore: () => {
      Reflect.deleteProperty(navigator, 'clipboard');
    },
  };
}

describe('ChatMessage', () => {
  it('renders children', () => {
    render(<ChatMessage role="user">Hello</ChatMessage>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders assistant message', () => {
    render(<ChatMessage role="assistant">Hi there</ChatMessage>);
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('renders system message', () => {
    render(<ChatMessage role="system">System notice</ChatMessage>);
    expect(screen.getByText('System notice')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<ChatMessage role="user" className="custom">Msg</ChatMessage>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders avatar fallback', () => {
    render(<ChatMessage role="user">Msg</ChatMessage>);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders custom avatar', () => {
    render(<ChatMessage role="assistant" avatar={<span>AI</span>}>Msg</ChatMessage>);
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('renders name and timestamp', () => {
    render(<ChatMessage role="user" name="Alice" timestamp="10:30">Msg</ChatMessage>);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<ChatMessage role="user" status="error">Msg</ChatMessage>);
    expect(screen.getByText('Failed to send')).toBeInTheDocument();
  });

  it('renders sending status', () => {
    render(<ChatMessage role="user" status="sending">Msg</ChatMessage>);
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  describe('copy and actions', () => {
    it('renders no action bar by default', () => {
      render(<ChatMessage role="assistant">Plain</ChatMessage>);
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
    });

    it('copies the bubble text from the built-in copy action', async () => {
      // user-event's setup() attaches its own navigator.clipboard stub —
      // install ours after, or writeText goes to the wrong object.
      const user = userEvent.setup();
      const clipboard = stubClipboard(() => Promise.resolve());
      try {
        render(<ChatMessage role="assistant" copyable>Copy me please</ChatMessage>);
        await user.click(screen.getByRole('button', { name: 'Copy' }));
        expect(clipboard.fn).toHaveBeenCalledWith('Copy me please');
      } finally {
        clipboard.restore();
      }
    });

    it('copies the rendered text of element children', async () => {
      const user = userEvent.setup();
      const clipboard = stubClipboard(() => Promise.resolve());
      try {
        render(
          <ChatMessage role="assistant" copyable>
            <div>
              <p>First paragraph</p>
              <p>Second paragraph</p>
            </div>
          </ChatMessage>,
        );
        await user.click(screen.getByRole('button', { name: 'Copy' }));
        expect(clipboard.fn).toHaveBeenCalledWith('First paragraphSecond paragraph');
      } finally {
        clipboard.restore();
      }
    });

    it('flips the feedback glyph for 1.5s after a successful copy', async () => {
      vi.useFakeTimers();
      const clipboard = stubClipboard(() => Promise.resolve());
      try {
        render(<ChatMessage role="assistant" copyable>Feedback</ChatMessage>);
        const btn = screen.getByRole('button', { name: 'Copy' });
        const idleClass = btn.className;
        // fireEvent rather than user-event: under fake timers RTL's
        // asyncWrapper parks user-event on a setTimeout(0) nothing
        // flushes (the Toast suite documents the same pitfall).
        fireEvent.click(btn);
        await act(async () => {
          await vi.advanceTimersByTimeAsync(0);
        });
        expect(btn.className).not.toBe(idleClass);
        act(() => {
          vi.advanceTimersByTime(1500);
        });
        expect(btn.className).toBe(idleClass);
      } finally {
        clipboard.restore();
        vi.useRealTimers();
      }
    });

    it('renders custom actions beside the built-in copy button', () => {
      render(
        <ChatMessage
          role="assistant"
          copyable
          actions={
            <button type="button" aria-label="Retry">
              Retry
            </button>
          }
        >
          With actions
        </ChatMessage>,
      );
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('opts into the action bar with actions alone (no copy button)', () => {
      render(
        <ChatMessage
          role="assistant"
          actions={
            <button type="button" aria-label="Retry">
              Retry
            </button>
          }
        >
          Slot only
        </ChatMessage>,
      );
      expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('works unchanged inside RTL subtrees', async () => {
      const user = userEvent.setup();
      const clipboard = stubClipboard(() => Promise.resolve());
      try {
        render(
          <div dir="rtl">
            <ChatMessage role="assistant" copyable name="بوت">
              مرحبا
            </ChatMessage>
          </div>,
        );
        await user.click(screen.getByRole('button', { name: 'Copy' }));
        expect(clipboard.fn).toHaveBeenCalledWith('مرحبا');
      } finally {
        clipboard.restore();
      }
    });
  });

  describe('streaming announcements', () => {
    it('marks the bubble busy while streaming and clears aria-busy when it ends', () => {
      const { container, rerender } = render(
        <ChatMessage role="assistant" streaming>Partial answer</ChatMessage>,
      );
      const bubble = container.querySelector("[data-slot='bubble']");
      expect(bubble).toHaveAttribute('aria-busy', 'true');
      rerender(<ChatMessage role="assistant">Partial answer</ChatMessage>);
      expect(bubble).not.toHaveAttribute('aria-busy');
    });

    it('cues, snapshots and finishes the live region', () => {
      vi.useFakeTimers();
      try {
        const { rerender } = render(
          <ChatMessage role="assistant" streaming>The answer</ChatMessage>,
        );
        const region = screen.getByRole('status');
        expect(region).toHaveAttribute('data-slot', 'live-region');
        expect(region).toHaveTextContent('Generating');

        // snapshots arrive on the announce cadence, not per token
        act(() => { vi.advanceTimersByTime(1200); });
        expect(region).toHaveTextContent('The answer');

        // growing content is picked up by the next snapshot
        rerender(
          <ChatMessage role="assistant" streaming>
            The answer is 42
          </ChatMessage>,
        );
        act(() => { vi.advanceTimersByTime(1200); });
        expect(region).toHaveTextContent('The answer is 42');

        // ending the stream announces the complete message once
        rerender(
          <ChatMessage role="assistant">The answer is 42, see below</ChatMessage>,
        );
        expect(region).toHaveTextContent('The answer is 42, see below');
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders no live region for user or system messages', () => {
      const { unmount } = render(
        <ChatMessage role="user" streaming>Hey</ChatMessage>,
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      unmount();
      render(<ChatMessage role="system">Notice</ChatMessage>);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('keeps a never-streamed assistant message silent', () => {
      render(<ChatMessage role="assistant">Plain reply</ChatMessage>);
      expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('excludes live regions from the copied text', async () => {
      vi.useFakeTimers();
      const clipboard = stubClipboard(() => Promise.resolve());
      try {
        render(
          <ChatMessage role="assistant" copyable>
            <StreamingText text="Done" speed={10} showCursor={false} />
          </ChatMessage>,
        );
        for (const _tick of 'Done') {
          act(() => { vi.advanceTimersByTime(10); });
        }
        // both the visible chunks and StreamingText's live region hold
        // the text — copy must take the visible half only
        expect(screen.getAllByText('Done').length).toBeGreaterThan(1);
        const btn = screen.getByRole('button', { name: 'Copy' });
        // fireEvent rather than user-event: under fake timers RTL's
        // asyncWrapper parks user-event on a setTimeout(0) nothing
        // flushes (the glyph test above documents the same pitfall).
        fireEvent.click(btn);
        await act(async () => { await vi.advanceTimersByTimeAsync(0); });
        expect(clipboard.fn).toHaveBeenCalledWith('Done');
      } finally {
        clipboard.restore();
        vi.useRealTimers();
      }
    });
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <ChatMessage role="user" name="Alice" timestamp="10:30">Hello there</ChatMessage>
        <ChatMessage role="assistant" avatar={<span aria-hidden="true">AI</span>} name="Bot">
          Hi, how can I help?
        </ChatMessage>
        <ChatMessage role="assistant" streaming>Generating a long answer right now</ChatMessage>
        <ChatMessage
          role="assistant"
          copyable
          actions={
            <button type="button" aria-label="Retry">
              Retry
            </button>
          }
        >
          Hover me for actions
        </ChatMessage>
      </>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
