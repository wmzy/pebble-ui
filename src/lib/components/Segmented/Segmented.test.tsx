import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import Segmented from './Segmented';
import SegmentedCore from './SegmentedCore';

describe('Segmented', () => {
  it('renders options', () => {
    render(<Segmented options={['A', 'B', 'C']} />);
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<Segmented options={['A']} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('calls onChange on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented options={['A', 'B']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('renders object options with label', () => {
    render(<Segmented options={[{ value: 'a', label: 'Alpha' }]} />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('disables option', () => {
    render(<Segmented options={[{ value: 'a', label: 'A', disabled: true }, 'B']} />);
    expect(screen.getByRole('button', { name: 'A' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Segmented options={['A', 'B']} value="A" />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('SegmentedCore', () => {
  it('renders the given value as the active option', () => {
    const { container } = render(
      <SegmentedCore options={['A', 'B']} value="B" onChange={() => undefined} />
    );
    const buttons = container.querySelectorAll('button');
    const a = buttons[0]!;
    const b = buttons[1]!;
    // the active option (B) carries an extra class the inactive one lacks
    expect(b.className.split(' ').length).toBeGreaterThan(
      a.className.split(' ').length
    );
  });

  it('calls onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SegmentedCore options={['A', 'B']} value="A" onChange={onChange} />);
    await user.click(screen.getByRole('button', {name: 'B'}));
    expect(onChange).toHaveBeenCalledWith('B');
  });
});

describe('Segmented ref forwarding', () => {
  it('forwards ref to the selected option button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Segmented ref={ref} options={['day', 'week']} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
    expect(ref.current).toHaveTextContent('day');
  });
});
