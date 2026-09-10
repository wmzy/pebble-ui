import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import LocaleProvider from '../LocaleProvider';

import Mentions from './Mentions';

const OPTIONS = [
  { value: 'alice', label: 'Alice Zhang' },
  { value: 'bob', label: 'Bob Li' },
  { value: 'carol', label: 'Carol Wang' },
];

describe('Mentions', () => {
  it('renders a combobox wrapper around the textarea', () => {
    render(<Mentions options={OPTIONS} placeholder="Message someone" />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combobox).toHaveAttribute('aria-controls');
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Message someone')).toBeInTheDocument();
  });

  it('opens the panel when the trigger is typed and filters by prefix', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const combobox = screen.getByRole('combobox');
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Hi ');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.type(textarea, '@');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(3);

    // Prefix match covers values and labels, case-insensitively.
    await user.type(textarea, 'BO');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Bob Li' })).toBeInTheDocument();
  });

  it('does not open for an email-like word', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'alice@example.com');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes the panel when the token is deleted', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@bo');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await user.type(textarea, '{Backspace}{Backspace}{Backspace}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('navigates with arrows and inserts the mention on Enter', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Ping @ca');

    expect(textarea).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}');
    const carol = screen.getByRole('option', { name: 'Carol Wang' });
    expect(textarea).toHaveAttribute('aria-activedescendant', carol.id);
    expect(carol).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');
    // The token (trigger + query) is replaced by trigger + value + space.
    expect(textarea).toHaveValue('Ping @carol ');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('inserts the top suggestion on Enter without prior navigation', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Ping @ca');

    // No ArrowDown pressed — Enter still commits the first match
    // instead of inserting a newline (AntD Mentions / GitHub behavior).
    await user.keyboard('{Enter}');
    expect(textarea).toHaveValue('Ping @carol ');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('moves the highlight with ArrowUp and ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(
      screen.getByRole('option', { name: 'Bob Li' })
    ).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(
      screen.getByRole('option', { name: 'Alice Zhang' })
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('inserts the mention on Tab', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@al');
    await user.keyboard('{ArrowDown}{Tab}');
    expect(textarea).toHaveValue('@alice ');
  });

  it('inserts an option on click', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@');
    await user.click(screen.getByRole('option', { name: 'Bob Li' }));
    expect(textarea).toHaveValue('@bob ');
  });

  it('closes the panel on Escape', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@');
    await user.keyboard('{ArrowDown}');
    expect(textarea).toHaveAttribute('aria-activedescendant');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(textarea).not.toHaveAttribute('aria-activedescendant');
  });

  it('closes the panel on outside pointerdown', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Mentions options={OPTIONS} />
        <button>outside</button>
      </div>
    );
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await user.click(screen.getByText('outside'));
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('shares state with a parent through a control', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue, control] = useControl('');
      return (
        <div>
          <Mentions options={OPTIONS} value={control} />
          <button onClick={() => setValue('rewritten')}>rewrite</button>
          {/* Bracketed so the trailing-space insertion contract survives
              jest-dom's whitespace normalization. */}
          <output data-testid="mirror">[{value}]</output>
        </div>
      );
    }
    render(<Controlled />);
    const textarea = screen.getByRole('textbox');

    // Typing flows into the parent-owned state…
    await user.type(textarea, 'Ping @ca');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByTestId('mirror')).toHaveTextContent('[Ping @carol ]');
    expect(textarea).toHaveValue('Ping @carol ');

    // …and an external write drives the textarea back.
    await user.click(screen.getByText('rewrite'));
    expect(textarea).toHaveValue('rewritten');
    expect(screen.getByTestId('mirror')).toHaveTextContent('[rewritten]');
  });

  it('supports a custom trigger', async () => {
    const user = userEvent.setup();
    render(
      <Mentions
        options={[
          { value: 'general', label: 'General' },
          { value: 'random', label: 'Random' },
        ]}
        trigger="#"
      />
    );
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Join #ra');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(textarea).toHaveValue('Join #random ');
  });

  it('shows the English no-match copy by default', async () => {
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} />);
    await user.type(screen.getByRole('textbox'), '@zz');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('shows the localized no-match copy under the zh-CN pack', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="zh-CN">
        <Mentions options={OPTIONS} />
      </LocaleProvider>
    );
    await user.type(screen.getByRole('textbox'), '@zz');
    expect(screen.getByText('无匹配项')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(
      <Mentions options={OPTIONS} className="custom" />
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards native textarea props', () => {
    render(<Mentions options={OPTIONS} rows={5} aria-label="Collaborators" />);
    const textarea = screen.getByRole('textbox', { name: 'Collaborators' });
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} placeholder="Message someone" />);
    await user.type(screen.getByRole('textbox'), '@');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when nothing matches', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<Mentions options={OPTIONS} placeholder="Message someone" />);
    await user.type(screen.getByRole('textbox'), '@zz');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Mentions ref forwarding', () => {
  it('forwards ref to the textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Mentions ref={ref} options={[]} aria-label='Comment' />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
