import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Rating from './Rating';
import RatingCore from './RatingCore';

describe('Rating', () => {
  it('renders 5 stars by default', () => {
    const { container } = render(<Rating />);
    const stars = container.querySelectorAll('[role="radio"]');
    expect(stars.length).toBe(5);
  });

  it('applies className', () => {
    const { container } = render(<Rating className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders custom count', () => {
    const { container } = render(<Rating count={3} />);
    const stars = container.querySelectorAll('[role="radio"]');
    expect(stars.length).toBe(3);
  });

  it('calls onChange on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating onChange={onChange} />);
    const stars = screen.getAllByRole('radio');
    await user.click(stars[2]!);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('steps the selection with arrow keys and follows focus (radiogroup pattern)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating value={2} onChange={onChange} />);
    const stars = screen.getAllByRole('radio');
    stars[1]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(stars[2]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(stars[1]).toHaveFocus();
  });

  it('steps in half increments with allowHalf', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Rating value={2} allowHalf onChange={onChange} />);
    screen.getAllByRole('radio')[1]!.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(2.5);
  });

  it('highlights stars up to value', () => {
    const { container } = render(<Rating value={3} />);
    const stars = container.querySelectorAll('[role="radio"]');
    expect(stars[0]).toHaveAttribute('aria-checked', 'true');
    expect(stars[1]).toHaveAttribute('aria-checked', 'true');
    expect(stars[2]).toHaveAttribute('aria-checked', 'true');
    expect(stars[3]).toHaveAttribute('aria-checked', 'false');
  });

  it('supports half rating', () => {
    const { container } = render(<Rating value={3.5} allowHalf />);
    const stars = container.querySelectorAll('[role="radio"]');
    expect(stars.length).toBe(5);
  });

  it('renders half-filled star with gradient when allowHalf', () => {
    const { container } = render(<Rating value={3.5} allowHalf />);
    const stars = container.querySelectorAll('[role="radio"]');
    const fillOf = (i: number) =>
      stars[i]?.querySelector('svg')?.getAttribute('fill');
    expect(fillOf(2)).toBe('currentColor');
    expect(fillOf(3)).toBe('url(#half)');
    expect(fillOf(4)).toBe('none');
    expect(container.querySelector('linearGradient')).toBeInTheDocument();
  });

  it('previews stars on hover and restores on leave', () => {
    const { container } = render(<Rating value={1} />);
    const stars = container.querySelectorAll('[role="radio"]');
    const third = stars[2]!;
    fireEvent.mouseEnter(third);
    expect(third.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
    fireEvent.mouseLeave(third);
    expect(third.querySelector('svg')).toHaveAttribute('fill', 'none');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Rating value={3} />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('RatingCore', () => {
  it('renders the given value with stars highlighted', () => {
    const { container } = render(<RatingCore value={3} onChange={() => undefined} />);
    const stars = container.querySelectorAll('[role="radio"]');
    expect(stars[0]).toHaveAttribute('aria-checked', 'true');
    expect(stars[2]).toHaveAttribute('aria-checked', 'true');
    expect(stars[3]).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the clicked star value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RatingCore value={0} onChange={onChange} />);
    const stars = screen.getAllByRole('radio');
    await user.click(stars[2]!);
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
