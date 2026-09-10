import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatMessage from './ChatMessage';

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

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <ChatMessage role="user" name="Alice" timestamp="10:30">Hello there</ChatMessage>
        <ChatMessage role="assistant" avatar={<span aria-hidden="true">AI</span>} name="Bot">
          Hi, how can I help?
        </ChatMessage>
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
