import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatContainer from './ChatContainer';

/** jsdom has no layout: fabricate the scroll metrics the container reads. */
function mockMetrics(el: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
}

/** Flush the MutationObserver microtask checkpoint. */
async function flushMutations() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('ChatContainer', () => {
  it('renders children', () => {
    render(<ChatContainer><div>Message</div></ChatContainer>);
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<ChatContainer className="custom">Content</ChatContainer>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders multiple children', () => {
    render(
      <ChatContainer>
        <div>Msg 1</div>
        <div>Msg 2</div>
        <div>Msg 3</div>
      </ChatContainer>,
    );
    expect(screen.getByText('Msg 1')).toBeInTheDocument();
    expect(screen.getByText('Msg 2')).toBeInTheDocument();
    expect(screen.getByText('Msg 3')).toBeInTheDocument();
  });

  describe('auto-scroll follow', () => {
    it('sticks to the bottom while the reader is parked there', async () => {
      const { container, rerender } = render(
        <ChatContainer>
          <div>Msg 1</div>
        </ChatContainer>,
      );
      const el = container.firstChild as HTMLElement;
      mockMetrics(el, 1000, 200);
      act(() => {
        el.scrollTop = 1000;
        el.dispatchEvent(new Event('scroll'));
      });

      rerender(
        <ChatContainer>
          <div>Msg 1</div>
          <div>Msg 2</div>
        </ChatContainer>,
      );
      await flushMutations();
      expect(el.scrollTop).toBe(1000);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('still follows within the 40px bottom threshold', async () => {
      const { container, rerender } = render(
        <ChatContainer>
          <div>Msg 1</div>
        </ChatContainer>,
      );
      const el = container.firstChild as HTMLElement;
      mockMetrics(el, 1000, 200);
      // 30px shy of the end still counts as parked at the bottom.
      act(() => {
        el.scrollTop = 770;
        el.dispatchEvent(new Event('scroll'));
      });

      rerender(
        <ChatContainer>
          <div>Msg 1</div>
          <div>Msg 2</div>
        </ChatContainer>,
      );
      await flushMutations();
      expect(el.scrollTop).toBe(1000);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('pauses when the reader scrolls up and surfaces a jump pill', async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(
        <ChatContainer>
          <div>Msg 1</div>
        </ChatContainer>,
      );
      const el = container.firstChild as HTMLElement;
      mockMetrics(el, 1000, 200);
      act(() => {
        el.scrollTop = 400;
        el.dispatchEvent(new Event('scroll'));
      });

      rerender(
        <ChatContainer>
          <div>Msg 1</div>
          <div>Msg 2</div>
        </ChatContainer>,
      );
      await flushMutations();
      // Reading position kept; new content announced via the pill.
      expect(el.scrollTop).toBe(400);
      expect(screen.getByRole('button', { name: 'New messages' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'New messages' }));
      expect(el.scrollTop).toBe(1000);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not resurface the pill when the reader scrolls back on their own', async () => {
      const { container, rerender } = render(
        <ChatContainer>
          <div>Msg 1</div>
        </ChatContainer>,
      );
      const el = container.firstChild as HTMLElement;
      mockMetrics(el, 1000, 200);
      act(() => {
        el.scrollTop = 400;
        el.dispatchEvent(new Event('scroll'));
      });

      rerender(
        <ChatContainer>
          <div>Msg 1</div>
          <div>Msg 2</div>
        </ChatContainer>,
      );
      await flushMutations();
      expect(screen.getByRole('button', { name: 'New messages' })).toBeInTheDocument();

      // Scrolling back to the bottom dismisses the pill without a click.
      act(() => {
        el.scrollTop = 1000;
        el.dispatchEvent(new Event('scroll'));
      });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders a custom unreadLabel', async () => {
      const { container, rerender } = render(
        <ChatContainer unreadLabel="Neue Nachrichten">
          <div>Msg 1</div>
        </ChatContainer>,
      );
      const el = container.firstChild as HTMLElement;
      mockMetrics(el, 1000, 200);
      act(() => {
        el.scrollTop = 400;
        el.dispatchEvent(new Event('scroll'));
      });

      rerender(
        <ChatContainer unreadLabel="Neue Nachrichten">
          <div>Msg 1</div>
          <div>Msg 2</div>
        </ChatContainer>,
      );
      await flushMutations();
      expect(screen.getByRole('button', { name: 'Neue Nachrichten' })).toBeInTheDocument();
    });

    it('manages no scroll and no pill when autoScroll is false', async () => {
      const { container, rerender } = render(
        <ChatContainer autoScroll={false}>
          <div>Msg 1</div>
        </ChatContainer>,
      );
      const el = container.firstChild as HTMLElement;
      mockMetrics(el, 1000, 200);

      rerender(
        <ChatContainer autoScroll={false}>
          <div>Msg 1</div>
          <div>Msg 2</div>
        </ChatContainer>,
      );
      await flushMutations();
      expect(el.scrollTop).toBe(0);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('forwards native props to the scroll element', () => {
      render(
        <ChatContainer aria-label='Conversation' data-testid='chat-scroll'>
          <div>Msg</div>
        </ChatContainer>,
      );
      expect(screen.getByRole('generic', { name: 'Conversation' })).toHaveAttribute(
        'data-testid',
        'chat-scroll',
      );
    });
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <ChatContainer>
        <div>Msg 1</div>
        <div>Msg 2</div>
      </ChatContainer>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
