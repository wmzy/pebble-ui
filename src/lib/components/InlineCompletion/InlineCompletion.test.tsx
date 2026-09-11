import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import InlineCompletion from './InlineCompletion';

/** Renders InlineCompletion with a controlled value mirrored out, so
 * control wiring is observable from outside the component. */
function ControlledHost({ suggestion }: { suggestion?: string }) {
  const [value, , control] = useControl(undefined, '');
  return (
    <>
      <InlineCompletion value={control} suggestion={suggestion} aria-label='editor' />
      <output data-testid='mirror'>{value}</output>
    </>
  );
}

describe('InlineCompletion', () => {
  it('renders a text input and updates it while typing', async () => {
    const user = userEvent.setup();
    render(<InlineCompletion aria-label='editor' />);
    const input = screen.getByRole('textbox', { name: 'editor' });
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  describe('ghost', () => {
    it('stays hidden until the host is focused', async () => {
      const user = userEvent.setup();
      render(
        <InlineCompletion suggestion=' world' aria-label='editor' />
      );
      expect(screen.queryByText('world')).not.toBeInTheDocument();

      await user.click(screen.getByRole('textbox', { name: 'editor' }));
      expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('hides again on blur', async () => {
      const user = userEvent.setup();
      render(<InlineCompletion suggestion=' world' aria-label='editor' />);
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.click(input);
      expect(screen.getByText('world')).toBeInTheDocument();

      // fireEvent over user.tab(): Tab is the accept key while the
      // ghost is active, so it cannot double as the blur driver.
      fireEvent.blur(input);
      expect(screen.queryByText('world')).not.toBeInTheDocument();
    });

    it('treats an empty suggestion as absent', async () => {
      const user = userEvent.setup();
      render(<InlineCompletion suggestion='' aria-label='editor' />);
      await user.click(screen.getByRole('textbox', { name: 'editor' }));
      const hint = screen.queryByText(/Press Tab to accept/);
      expect(hint).not.toBeInTheDocument();
    });

    it('works on the multiline textarea host', async () => {
      const user = userEvent.setup();
      render(
        <InlineCompletion multiline suggestion=' the rest' aria-label='editor' />
      );
      const area = screen.getByRole('textbox', { name: 'editor' });
      expect(area.tagName).toBe('TEXTAREA');
      await user.click(area);
      // The matcher is not whitespace-normalized — query the trimmed text.
      expect(screen.getByText('the rest')).toBeInTheDocument();
    });
  });

  describe('accept (Tab)', () => {
    it('appends the suggestion to the value and fires onAccept', async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      render(
        <InlineCompletion
          suggestion=' world'
          onAccept={onAccept}
          aria-label='editor'
        />
      );
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.type(input, 'hello');
      await user.keyboard('{Tab}');

      expect(input).toHaveValue('hello world');
      expect(onAccept).toHaveBeenCalledTimes(1);
      // Focus stays in the host after accepting (default Tab is prevented).
      expect(input).toHaveFocus();
      // The accepted suggestion no longer ghosts behind the caret.
      expect(screen.queryByText('world')).not.toBeInTheDocument();
    });

    it('does not intercept Tab without an active suggestion', async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      render(
        <InlineCompletion
          value='hello'
          onAccept={onAccept}
          aria-label='editor'
        />
      );
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.click(input);
      await user.keyboard('{Tab}');

      expect(onAccept).not.toHaveBeenCalled();
      expect(input).toHaveValue('hello');
      expect(input).not.toHaveFocus();
    });

    it('appends into a controlled value', async () => {
      const user = userEvent.setup();
      render(<ControlledHost suggestion=' there' />);
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.click(input);
      await user.type(input, 'hi');
      expect(screen.getByTestId('mirror')).toHaveTextContent('hi');

      await user.keyboard('{Tab}');
      expect(screen.getByTestId('mirror')).toHaveTextContent('hi there');
    });
  });

  describe('dismiss (Escape)', () => {
    it('fires onDismiss and drops the ghost without touching the value', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <InlineCompletion
          value='hello'
          suggestion=' world'
          onDismiss={onDismiss}
          aria-label='editor'
        />
      );
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.click(input);
      await user.keyboard('{Escape}');

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('hello');
      expect(screen.queryByText('world')).not.toBeInTheDocument();
    });

    it('re-offers a changed suggestion after a dismissal', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <InlineCompletion suggestion=' world' aria-label='editor' />
      );
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.click(input);
      await user.keyboard('{Escape}');
      expect(screen.queryByText('world')).not.toBeInTheDocument();

      rerender(
        <InlineCompletion suggestion=' there' aria-label='editor' />
      );
      expect(screen.getByText('there')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('links the hint through aria-describedby while active', async () => {
      const user = userEvent.setup();
      render(<InlineCompletion suggestion=' world' aria-label='editor' />);
      const input = screen.getByRole('textbox', { name: 'editor' });
      expect(input).not.toHaveAttribute('aria-describedby');

      await user.click(input);
      const hint = screen.getByText(/Press Tab to accept/);
      expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    });

    it('merges a consumer-provided aria-describedby', async () => {
      const user = userEvent.setup();
      render(
        <InlineCompletion
          suggestion=' world'
          aria-label='editor'
          aria-describedby='external-hint'
        />
      );
      const input = screen.getByRole('textbox', { name: 'editor' });
      await user.click(input);

      const describedBy = input.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/)).toContain('external-hint');
      expect(describedBy.split(/\s+/)).toHaveLength(2);
    });

    it('supports a custom hint', async () => {
      const user = userEvent.setup();
      render(
        <InlineCompletion
          suggestion=' world'
          hint='Vorschlag verfügbar'
          aria-label='editor'
        />
      );
      await user.click(screen.getByRole('textbox', { name: 'editor' }));
      expect(screen.getByText('Vorschlag verfügbar')).toBeInTheDocument();
    });
  });

  it('fires the consumer native handlers', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();
    render(
      <InlineCompletion
        aria-label='editor'
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
    );
    const input = screen.getByRole('textbox', { name: 'editor' });
    await user.click(input);
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.type(input, 'a');
    expect(onChange).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('applies className to the wrapper', () => {
    const { container } = render(
      <InlineCompletion aria-label='editor' className='custom' />
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards native props to the host input', () => {
    render(
      <InlineCompletion
        aria-label='editor'
        placeholder='Type here'
        data-testid='host'
        maxLength={10}
      />
    );
    const input = screen.getByTestId('host');
    expect(input).toHaveAttribute('placeholder', 'Type here');
    expect(input).toHaveAttribute('maxlength', '10');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    const { container } = render(
      <>
        <InlineCompletion suggestion=' world' aria-label='editor' />
        <InlineCompletion multiline suggestion=' more' aria-label='notes' />
      </>
    );
    await user.click(screen.getByRole('textbox', { name: 'editor' }));
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
