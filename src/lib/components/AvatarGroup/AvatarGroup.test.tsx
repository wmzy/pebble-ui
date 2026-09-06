import { render, screen } from '@testing-library/react';

import Avatar from '../Avatar/Avatar';

import AvatarGroup from './AvatarGroup';

const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];

function Group({
  count = names.length,
  ...rest
}: { count?: number } & Partial<Parameters<typeof AvatarGroup>[0]>) {
  return (
    <AvatarGroup {...rest}>
      {names.slice(0, count).map((name) => (
        <Avatar key={name} alt={name} />
      ))}
    </AvatarGroup>
  );
}

function groupRoot(container: HTMLElement) {
  return container.firstChild as HTMLElement;
}

describe('AvatarGroup', () => {
  it('renders every child when max does not truncate', () => {
    render(<Group max={5} />);
    for (const name of names) {
      expect(screen.getByText(name.charAt(0))).toBeInTheDocument();
    }
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('renders all children when no max is given', () => {
    render(<Group count={2} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('wraps each child in a stacking frame', () => {
    const { container } = render(<Group count={3} />);
    const frames = Array.from(groupRoot(container).children) as HTMLElement[];
    expect(frames).toHaveLength(3);
    for (const frame of frames) {
      expect(frame.firstChild?.nodeName).toBe('SPAN');
    }
    // Every frame after the first overlaps via an extra class.
    expect(frames[1]!.getAttribute('class')).not.toBe(
      frames[0]!.getAttribute('class')
    );
    expect(frames[2]!.getAttribute('class')).toBe(
      frames[1]!.getAttribute('class')
    );
  });

  it('truncates beyond max and shows the overflow count', () => {
    const { container } = render(<Group max={3} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('D')).not.toBeInTheDocument();
    expect(screen.queryByText('E')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    // Overflow chip is the last frame in the stack.
    const frames = Array.from(groupRoot(container).children);
    expect(frames).toHaveLength(4);
    expect(frames[3]).toHaveTextContent('+2');
  });

  it('uses total as the overflow count when provided', () => {
    render(<Group max={2} total={99} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('C')).not.toBeInTheDocument();
    expect(screen.getByText('+99')).toBeInTheDocument();
  });

  it('shows total even when it understates the actual remainder', () => {
    render(<Group max={3} total={1} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('ignores total when nothing is truncated', () => {
    render(<Group count={3} max={10} total={99} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('+99')).not.toBeInTheDocument();
  });

  it('renders only the overflow chip for max=0', () => {
    const { container } = render(<Group max={0} />);
    const frames = Array.from(groupRoot(container).children) as HTMLElement[];
    expect(frames).toHaveLength(1);
    expect(frames[0]).toHaveTextContent('+5');
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('applies className and forwards native props', () => {
    render(<Group className='custom' data-testid='team' aria-label='Team' />);
    const root = screen.getByTestId('team');
    expect(root).toHaveClass('custom');
    expect(root).toHaveAttribute('aria-label', 'Team');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Group max={3} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
