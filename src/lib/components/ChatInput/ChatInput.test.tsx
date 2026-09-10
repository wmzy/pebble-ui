import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatInput from './ChatInput';

describe('ChatInput', () => {
  it('renders textarea', () => {
    render(<ChatInput />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<ChatInput className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders custom placeholder', () => {
    render(<ChatInput placeholder="Ask me anything" />);
    expect(screen.getByPlaceholderText('Ask me anything')).toBeInTheDocument();
  });

  it('calls onSend on Enter', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.type(textarea, 'Hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not call onSend on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.type(textarea, 'Hello{Shift>}{Enter}{/Shift}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('clears input after send', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.type(textarea, 'Hello{Enter}');
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('does not send empty message', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const sendBtn = screen.getByRole('button', { name: 'Send' });
    await user.click(sendBtn);
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input when disabled', () => {
    render(<ChatInput disabled />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
  });

  describe('stop generation', () => {
    it('swaps the send button for an enabled stop control', () => {
      render(<ChatInput generating onSend={vi.fn()} onStop={vi.fn()} />);
      const stopBtn = screen.getByRole('button', { name: 'Stop generating' });
      expect(stopBtn).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    });

    it('calls onStop instead of onSend when the stop control is clicked', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      const onStop = vi.fn();
      render(<ChatInput generating onSend={onSend} onStop={onStop} />);
      await user.click(screen.getByRole('button', { name: 'Stop generating' }));
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onSend).not.toHaveBeenCalled();
    });

    it('Enter stops generation instead of sending and keeps the draft', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      const onStop = vi.fn();
      render(<ChatInput generating value="draft" onSend={onSend} onStop={onStop} />);
      await user.type(screen.getByPlaceholderText('Type a message...'), '{Enter}');
      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onSend).not.toHaveBeenCalled();
      const textarea = screen.getByPlaceholderText(
        'Type a message...',
      );
      expect(textarea).toHaveValue('draft');
    });

    it('returns to the send control once generation ends', () => {
      const { rerender } = render(
        <ChatInput generating onSend={vi.fn()} onStop={vi.fn()} />,
      );
      rerender(<ChatInput generating={false} onSend={vi.fn()} onStop={vi.fn()} />);
      // Empty draft: the send button is back and disabled again.
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('keeps the stop control disabled when the input itself is disabled', () => {
      render(<ChatInput generating disabled onStop={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Stop generating' })).toBeDisabled();
    });
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <>
        <ChatInput placeholder="Type a message..." onSend={() => undefined} />
        <ChatInput generating onSend={() => undefined} onStop={() => undefined} />
      </>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
