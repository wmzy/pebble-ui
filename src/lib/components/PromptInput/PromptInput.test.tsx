import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import LocaleProvider from '../LocaleProvider';

import PromptInput from './PromptInput';

const PEOPLE = ['alice', 'bob', 'carol'];

/** Sync suggestion source filtering by query prefix. */
const filterPeople = (_trigger: string, query: string) =>
  PEOPLE.filter((name) => name.startsWith(query));

describe('PromptInput', () => {
  it('degenerates to a plain auto-growing textarea without getSuggestions', () => {
    render(<PromptInput placeholder="Ask anything" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask anything')).toBeInTheDocument();
    // No completion: no combobox wrapper, no listbox in the DOM.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('exposes combobox semantics when completion is enabled', () => {
    render(<PromptInput getSuggestions={filterPeople} />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    expect(combobox).toHaveAttribute('aria-controls');
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-autocomplete',
      'list'
    );
  });

  it('applies className', () => {
    const { container } = render(<PromptInput className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards native textarea props', () => {
    render(<PromptInput maxLength={10} aria-label="Notes" />);
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    expect(textarea).toHaveAttribute('maxlength', '10');
  });

  it('types text uncontrolled and reports onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PromptInput onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello');
    expect(textarea).toHaveValue('hello');
    expect(onChange).toHaveBeenLastCalledWith('hello');
  });

  it('shares text and tags with a parent through controls', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [text, setText, textCtrl] = useControl('');
      const [tags, setTags, tagsCtrl] = useControl(['draft']);
      return (
        <div>
          <PromptInput value={textCtrl} tags={tagsCtrl} />
          <button onClick={() => setText('rewritten')}>rewrite</button>
          <button onClick={() => setTags([...tags, 'extra'])}>addtag</button>
          <output data-testid="mirror">
            [{text}|{tags.join(',')}]
          </output>
        </div>
      );
    }
    render(<Controlled />);
    const textarea = screen.getByRole('textbox');

    // Typing flows into parent-owned text state…
    await user.type(textarea, 'hello');
    expect(screen.getByTestId('mirror')).toHaveTextContent('[hello|draft]');

    // …tag removal flows out too…
    await user.click(screen.getByRole('button', { name: 'Remove draft' }));
    expect(screen.getByTestId('mirror')).toHaveTextContent('[hello|]');

    // …and external writes drive the widget back.
    await user.click(screen.getByText('addtag'));
    expect(screen.getByTestId('mirror')).toHaveTextContent('[hello|extra]');
    await user.click(screen.getByText('rewrite'));
    expect(textarea).toHaveValue('rewritten');
    expect(screen.getByRole('button', { name: 'Remove extra' })).toBeInTheDocument();
  });

  it('renders initial tags with list semantics and per-tag remove labels', () => {
    render(<PromptInput tags={['react', 'vue']} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Remove react' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove vue' })
    ).toBeInTheDocument();
  });

  it('removes a tag on button click', async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    render(<PromptInput tags={['react', 'vue']} onTagsChange={onTagsChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove vue' }));
    expect(onTagsChange).toHaveBeenCalledWith(['react']);
    expect(screen.queryByRole('button', { name: 'Remove vue' })).not.toBeInTheDocument();
  });

  it('removes the last tag on Backspace with empty text', async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    render(
      <PromptInput tags={['react', 'vue']} onTagsChange={onTagsChange} />
    );
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '{Backspace}');
    expect(onTagsChange).toHaveBeenCalledWith(['react']);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    // Focus stays in the textarea — it is a composer, not a tag walker.
    expect(textarea).toHaveFocus();
  });

  it('edits text with Backspace instead of removing tags while text is non-empty', async () => {
    const user = userEvent.setup();
    render(<PromptInput tags={['react']} value="x" />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '{Backspace}');
    expect(textarea).toHaveValue('');
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('opens the panel when the trigger is typed and passes the query through', async () => {
    const user = userEvent.setup();
    const getSuggestions = vi.fn(filterPeople);
    render(<PromptInput getSuggestions={getSuggestions} />);
    const combobox = screen.getByRole('combobox');
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Hi ');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.type(textarea, '@');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(getSuggestions).toHaveBeenCalledWith('@', '');
    expect(screen.getAllByRole('option')).toHaveLength(3);

    await user.type(textarea, 'bo');
    expect(getSuggestions).toHaveBeenCalledWith('@', 'bo');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'bob' })).toBeInTheDocument();
  });

  it('does not open for an email-like word', async () => {
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} />);
    await user.type(screen.getByRole('textbox'), 'alice@example.com');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('supports custom triggers', async () => {
    const user = userEvent.setup();
    render(
      <PromptInput
        triggers={['/', '@']}
        getSuggestions={(trigger, query) =>
          (trigger === '/' ? ['summarize', 'translate'] : PEOPLE).filter(
            (word) => word.startsWith(query)
          )
        }
      />
    );
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '/su');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await user.keyboard('{Enter}');
    expect(textarea).toHaveValue('/summarize ');
  });

  it('navigates with arrows and inserts the suggestion on Enter', async () => {
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Ping @');

    expect(textarea).not.toHaveAttribute('aria-activedescendant');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const bob = screen.getByRole('option', { name: 'bob' });
    expect(textarea).toHaveAttribute('aria-activedescendant', bob.id);
    expect(bob).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(
      screen.getByRole('option', { name: 'alice' })
    ).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');
    // The token (trigger + query) is replaced by trigger + word + space.
    expect(textarea).toHaveValue('Ping @alice ');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('inserts the top suggestion on Enter without prior navigation', async () => {
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Ping @ca');
    await user.keyboard('{Enter}');
    expect(textarea).toHaveValue('Ping @carol ');
  });

  it('inserts an option on click', async () => {
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@');
    await user.click(screen.getByRole('option', { name: 'bob' }));
    expect(textarea).toHaveValue('@bob ');
  });

  it('closes the panel on Escape without clearing the text, and reopens on typing', async () => {
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '@al');
    await user.keyboard('{ArrowDown}');
    expect(textarea).toHaveAttribute('aria-activedescendant');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(textarea).toHaveValue('@al');
    expect(textarea).not.toHaveAttribute('aria-activedescendant');

    // Continuing to type re-arms the panel for the new token.
    await user.type(textarea, 'i');
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('closes the panel on outside pointerdown', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <PromptInput getSuggestions={filterPeople} />
        <button>outside</button>
      </div>
    );
    await user.type(screen.getByRole('textbox'), '@');
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

  it('shows the no-match row', async () => {
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} />);
    await user.type(screen.getByRole('textbox'), '@zz');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('shows async loading state, then the resolved options', async () => {
    const user = userEvent.setup();
    let resolve!: (list: string[]) => void;
    render(
      <PromptInput
        getSuggestions={() => new Promise<string[]>((r) => (resolve = r))}
      />
    );
    await user.type(screen.getByRole('textbox'), '@');
    expect(screen.getByRole('option', { name: 'Loading…' })).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
      resolve(['alice']);
    });
    expect(await screen.findByRole('option', { name: 'alice' })).toBeInTheDocument();
  });

  it('discards stale async responses when a faster request wins', async () => {
    const user = userEvent.setup();
    let resolveSlow!: (list: string[]) => void;
    const getSuggestions = vi.fn(
      (_trigger: string, query: string): string[] | Promise<string[]> => {
        if (query === '') {
          return new Promise<string[]>((r) => {
            resolveSlow = r;
          });
        }
        return Promise.resolve([`fast:${query}`]);
      }
    );
    render(<PromptInput getSuggestions={getSuggestions} />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, '@');
    expect(getSuggestions).toHaveBeenCalledWith('@', '');
    expect(screen.getByRole('option', { name: 'Loading…' })).toBeInTheDocument();

    await user.type(textarea, 'a');
    expect(getSuggestions).toHaveBeenCalledWith('@', 'a');
    // The fast request resolves first and wins.
    expect(
      await screen.findByRole('option', { name: 'fast:a' })
    ).toBeInTheDocument();

    // The slow response lands last — it must be dropped.
    await act(async () => {
      await Promise.resolve();
      resolveSlow(['slow:']);
    });
    expect(
      screen.queryByRole('option', { name: 'slow:' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'fast:a' })).toBeInTheDocument();
  });

  it('recovers to empty suggestions when an async request rejects', async () => {
    const user = userEvent.setup();
    let reject!: (reason?: unknown) => void;
    render(
      <PromptInput
        getSuggestions={() => new Promise<string[]>((_r, rej) => (reject = rej))}
      />
    );
    await user.type(screen.getByRole('textbox'), '@');
    expect(screen.getByRole('option', { name: 'Loading…' })).toBeInTheDocument();
    await act(async () => {
      await Promise.resolve();
      reject(new Error('network down'));
    });
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });

  it('submits on Enter, clears the draft, and keeps tags', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput tags={['ctx']} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('');
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('keeps Shift+Enter as a newline', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'line{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('line\n');
  });

  it('does not submit whitespace-only drafts', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '  {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    // preventDefault still applies — no newline either.
    expect(textarea).toHaveValue('  ');
  });

  it('submits with mod-enter only: plain Enter newlines, Ctrl+Enter submits', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput submitKey="mod-enter" onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('hello\n');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('');
  });

  it('Enter commits the suggestion instead of submitting while the panel is open', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput getSuggestions={filterPeople} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hi @');
    await user.keyboard('{Enter}');
    expect(textarea).toHaveValue('Hi @alice ');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Enter stays a newline mid-token when the panel has no match', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PromptInput getSuggestions={filterPeople} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hi @zz');
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Hi @zz\n');
  });

  it('disables the textarea and tag removal', () => {
    render(<PromptInput disabled tags={['ctx']} placeholder="Ask" />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove ctx' })).toBeDisabled();
  });

  it('supports multi-line drafts under maxRows', async () => {
    const user = userEvent.setup();
    render(<PromptInput maxRows={3} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'one{Shift>}{Enter}{/Shift}two');
    expect(textarea).toHaveValue('one\ntwo');
  });

  it('localizes the tag removal label and no-match copy under zh-CN', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="zh-CN">
        <PromptInput tags={['ctx']} getSuggestions={filterPeople} />
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '移除 ctx' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), '@zz');
    expect(screen.getByText('无匹配项')).toBeInTheDocument();
  });

  it('has no axe violations (tags present, panel closed)', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <PromptInput tags={['ctx']} getSuggestions={filterPeople} placeholder="Ask" />
    );
    await user.type(screen.getByRole('textbox'), 'hello');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations with the panel open', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <PromptInput tags={['ctx']} getSuggestions={filterPeople} placeholder="Ask" />
    );
    await user.type(screen.getByRole('textbox'), '@');
    await user.keyboard('{ArrowDown}');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations when nothing matches', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    render(<PromptInput getSuggestions={filterPeople} placeholder="Ask" />);
    await user.type(screen.getByRole('textbox'), '@zz');
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
