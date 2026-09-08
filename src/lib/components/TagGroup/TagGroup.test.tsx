import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TagGroup from './TagGroup';
import TagGroupItem from './TagGroupItem';

describe('TagGroup', () => {
  it('renders children', () => {
    render(
      <TagGroup>
        <TagGroupItem>React</TagGroupItem>
        <TagGroupItem>Vue</TagGroupItem>
      </TagGroup>,
    );
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('has group role', () => {
    render(<TagGroup>Tags</TagGroup>);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<TagGroup className="custom">Tags</TagGroup>);
    expect(screen.getByRole('group')).toHaveClass('custom');
  });

  it('renders TagGroupItem with close button', () => {
    render(<TagGroupItem onClose={vi.fn()}>Tag</TagGroupItem>);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TagGroupItem onClose={onClose}>Tag</TagGroupItem>);
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render close button without onClose', () => {
    render(<TagGroupItem>Tag</TagGroupItem>);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('applies className to TagGroupItem', () => {
    render(<TagGroupItem className="custom">Tag</TagGroupItem>);
    expect(screen.getByText('Tag')).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <TagGroup>
        <TagGroupItem onClose={() => undefined}>React</TagGroupItem>
        <TagGroupItem>Vue</TagGroupItem>
      </TagGroup>,
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

/** TagGroup's reorder contract is parent-driven: onReorder reports the new
 * index order and the owner re-renders the children accordingly. */
function applyOrder<T>(list: T[], order: number[]): T[] {
  return order.flatMap((index) => {
    const item = list[index];
    return item === undefined ? [] : [item];
  });
}

function ReorderableTagGroup() {
  const [tags, setTags] = useState(['React', 'Vue', 'Angular']);
  return (
    <TagGroup sortable onReorder={(order) => setTags(applyOrder(tags, order))}>
      {tags.map((tag) => (
        <TagGroupItem key={tag}>{tag}</TagGroupItem>
      ))}
    </TagGroup>
  );
}

describe('TagGroup sortable', () => {
  /** jsdom rects are all 0×0 at (0,0) and dnd-kit's sortable keyboard
   * coordinate getter snaps onto neighbors by rect geometry — every chip
   * wrapper needs a distinct rect before a keyboard drag can walk the row. */
  const giveChipsDistinctRects = () => {
    screen.getByRole('group').querySelectorAll(':scope > span').forEach((chip, index) => {
      const left = index * 26;
      chip.getBoundingClientRect = () =>
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

  it('reorders chips through the full keyboard flow (lift → move → drop)', async () => {
    const user = userEvent.setup();
    render(<ReorderableTagGroup />);
    giveChipsDistinctRects();
    screen.getByRole('button', { name: 'React' }).focus();
    await user.keyboard(' '); // lift 'React'
    await user.keyboard('{ArrowRight}'); // over 'Vue'
    await user.keyboard('{ArrowRight}'); // over 'Angular'
    await user.keyboard(' '); // drop
    // chips are the only buttons here — their names follow the DOM order
    expect(screen.getAllByRole('button').map((chip) => chip.textContent)).toEqual([
      'Vue',
      'Angular',
      'React',
    ]);
  });

  it('reports the index permutation via onReorder', async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(
      <TagGroup sortable onReorder={onReorder}>
        <TagGroupItem>React</TagGroupItem>
        <TagGroupItem>Vue</TagGroupItem>
        <TagGroupItem>Angular</TagGroupItem>
      </TagGroup>,
    );
    giveChipsDistinctRects();
    screen.getByRole('button', { name: 'Vue' }).focus();
    await user.keyboard(' {ArrowLeft} ');
    expect(onReorder).toHaveBeenCalledWith([1, 0, 2]);
  });

  it('does not call onReorder when the drag is cancelled with Escape', async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    render(
      <TagGroup sortable onReorder={onReorder}>
        <TagGroupItem>React</TagGroupItem>
        <TagGroupItem>Vue</TagGroupItem>
      </TagGroup>,
    );
    giveChipsDistinctRects();
    screen.getByRole('button', { name: 'React' }).focus();
    await user.keyboard(' {ArrowRight}{Escape}');
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('wires chips with sortable semantics when sortable', () => {
    render(
      <TagGroup sortable>
        <TagGroupItem>React</TagGroupItem>
      </TagGroup>,
    );
    const chip = screen.getByRole('button', { name: 'React' });
    expect(chip).toHaveAttribute('aria-roledescription', 'sortable');
    expect(chip).toHaveAttribute('tabindex', '0');
    expect(chip).toHaveAccessibleDescription(/press the space bar/i);
  });

  it('renders zero drag affordances when sortable is off', () => {
    render(
      <TagGroup>
        <TagGroupItem>React</TagGroupItem>
        <TagGroupItem>Vue</TagGroupItem>
      </TagGroup>,
    );
    expect(
      document.querySelectorAll('[aria-roledescription="sortable"]')
    ).toHaveLength(0);
  });

  it('has no axe violations (sortable)', async () => {
    const { axe } = await import('jest-axe');
    render(
      <TagGroup sortable onReorder={() => undefined}>
        <TagGroupItem onClose={() => undefined}>React</TagGroupItem>
        <TagGroupItem>Vue</TagGroupItem>
        <TagGroupItem>Angular</TagGroupItem>
      </TagGroup>,
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
