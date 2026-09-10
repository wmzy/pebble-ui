import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import TagInput from './TagInput';
import TagInputCore from './TagInputCore';

describe('TagInput', () => {
  it('renders input with placeholder', () => {
    render(<TagInput placeholder="Add tag" />);
    expect(screen.getByPlaceholderText('Add tag')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<TagInput className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('forwards id and aria attrs to the inner input, not the root div', () => {
    const { container } = render(
      <TagInput
        id="haze-field-1"
        aria-invalid
        aria-describedby="haze-field-1-error"
      />
    );
    // FormItem 桥依赖 id 落在可聚焦元素上（<label htmlFor> 才能接通）
    const input = document.getElementById('haze-field-1');
    expect(input).toBe(screen.getByRole('textbox'));
    expect(container.firstChild).not.toHaveAttribute('id');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'haze-field-1-error');
  });

  it('adds tag on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'react{Enter}');
    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('renders initial tags', () => {
    render(<TagInput value={['react', 'vue']} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('vue')).toBeInTheDocument();
  });

  it('removes tag on button click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['react', 'vue']} onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]!);
    expect(onChange).toHaveBeenCalledWith(['vue']);
  });

  it('does not add duplicate tags', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['react']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'react{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes last tag on Backspace with empty input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['react', 'vue']} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '{Backspace}');
    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('exposes list semantics with per-tag remove labels', () => {
    render(<TagInput value={['react', 'vue']} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Remove react' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove vue' })).toBeInTheDocument();
  });

  it('describes the tag count on the input aria-label', () => {
    // Uncontrolled default: value only seeds on mount, so use fresh
    // renders per case.
    const first = render(<TagInput value={['react']} placeholder="Add tag" />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-label',
      'Add tag, 1 tag'
    );
    first.unmount();
    const second = render(
      <TagInput value={['react', 'vue']} placeholder="Add tag" />
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-label',
      'Add tag, 2 tags'
    );
    second.unmount();
    render(<TagInput value={[]} placeholder="Add tag" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Add tag');
  });

  it('moves focus to the neighboring remove button after Backspace removal', async () => {
    const user = userEvent.setup();
    render(<TagInput value={['react', 'vue', 'ng']} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '{Backspace}');
    // 'ng' removed; focus lands on the new last tag's remove button
    expect(screen.getByRole('button', { name: 'Remove vue' })).toHaveFocus();
  });

  it('supports consecutive Backspace removals with coherent focus', async () => {
    const user = userEvent.setup();
    render(<TagInput value={['react', 'vue', 'ng']} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '{Backspace}');
    expect(screen.getByRole('button', { name: 'Remove vue' })).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(screen.getByRole('button', { name: 'Remove react' })).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('returns focus to the input when the last tag is removed', async () => {
    const user = userEvent.setup();
    render(<TagInput value={['react']} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '{Backspace}');
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('moves focus to the neighbor after clicking a middle remove button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput value={['react', 'vue', 'ng']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Remove vue' }));
    expect(onChange).toHaveBeenCalledWith(['react', 'ng']);
    // the tag after the removed one shifts into its place and takes focus
    expect(screen.getByRole('button', { name: 'Remove ng' })).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<TagInput value={['react', 'vue']} placeholder="Add tag" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('TagInputCore', () => {
  it('renders the given tags', () => {
    render(<TagInputCore value={['react', 'vue']} onChange={() => undefined} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('vue')).toBeInTheDocument();
  });

  it('calls onChange with the updated list on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInputCore value={[]} onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'react{Enter}');
    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('calls onChange with the list minus the removed tag', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInputCore value={['react', 'vue']} onChange={onChange} />);
    await user.click(screen.getByRole('button', {name: 'Remove vue'}));
    expect(onChange).toHaveBeenCalledWith(['react']);
  });
});

describe('TagInput sortable', () => {
  /** jsdom rects are all 0×0 at (0,0) and dnd-kit's sortable keyboard
   * coordinate getter snaps onto neighbors by rect geometry — every li
   * needs a distinct rect before a keyboard drag can walk the list. */
  const giveItemsDistinctRects = () => {
    document.querySelectorAll('li').forEach((li, index) => {
      const left = index * 26;
      li.getBoundingClientRect = () =>
        ({
          x: left,
          y: 0,
          top: 0,
          left,
          right: left + 20,
          bottom: 20,
          width: 20,
          height: 20,
          toJSON: () => ({}),
        });
    });
  };

  it('reorders tags through the full keyboard flow (lift → move → drop)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput sortable value={['a', 'b', 'c']} onChange={onChange} />);
    giveItemsDistinctRects();
    screen.getByRole('button', { name: 'a' }).focus();
    await user.keyboard(' '); // lift 'a'
    await user.keyboard('{ArrowRight}'); // over 'b'
    await user.keyboard('{ArrowRight}'); // over 'c'
    await user.keyboard(' '); // drop
    expect(onChange).toHaveBeenCalledWith(['b', 'c', 'a']);
    // the uncontrolled state adopted the new order in the DOM
    expect(
      screen.getAllByRole('listitem').map((li) => li.firstChild?.textContent)
    ).toEqual(['b', 'c', 'a']);
  });

  it('reorders one slot with a single arrow press', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput sortable value={['a', 'b', 'c']} onChange={onChange} />);
    giveItemsDistinctRects();
    screen.getByRole('button', { name: 'b' }).focus();
    await user.keyboard(' {ArrowLeft} ');
    expect(onChange).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('does not commit a reorder when the drag is cancelled with Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput sortable value={['a', 'b']} onChange={onChange} />);
    giveItemsDistinctRects();
    screen.getByRole('button', { name: 'a' }).focus();
    await user.keyboard(' {ArrowRight}{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getAllByRole('listitem').map((li) => li.firstChild?.textContent)
    ).toEqual(['a', 'b']);
  });

  it('wires drag handles with sortable semantics when sortable', () => {
    render(<TagInput sortable value={['a', 'b']} />);
    const handle = screen.getByRole('button', { name: 'a' });
    expect(handle).toHaveAttribute('aria-roledescription', 'sortable');
    expect(handle).toHaveAttribute('tabindex', '0');
    // dnd-kit renders the keyboard instructions the handle points at
    expect(handle).toHaveAccessibleDescription(/press the space bar/i);
  });

  it('renders zero drag affordances when sortable is off', () => {
    const { container } = render(<TagInput value={['a', 'b']} />);
    expect(
      container.querySelectorAll('[aria-roledescription="sortable"]')
    ).toHaveLength(0);
  });

  it('drops drag affordances when disabled', () => {
    render(<TagInput sortable disabled value={['a', 'b']} />);
    expect(
      document.querySelectorAll('[aria-roledescription="sortable"]')
    ).toHaveLength(0);
  });

  it('has no axe violations (sortable)', async () => {
    const { axe } = await import('jest-axe');
    render(<TagInput sortable value={['react', 'vue']} placeholder="Add tag" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('TagInput ref forwarding', () => {
  it('forwards ref to the inner text input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TagInput ref={ref} placeholder='Add tag' />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
