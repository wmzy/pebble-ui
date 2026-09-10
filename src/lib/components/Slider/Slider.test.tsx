import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import Slider from './Slider';
import SliderCore from './SliderCore';

describe('Slider', () => {
  it('renders a range input', () => {
    render(<Slider aria-label="volume" />);
    expect(screen.getByRole('slider', { name: 'volume' })).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<Slider className="custom" aria-label="volume" />);
    expect(screen.getByRole('slider')).toHaveClass('custom');
  });

  it('defaults to value 50', () => {
    render(<Slider aria-label="volume" />);
    expect(screen.getByRole('slider')).toHaveValue('50');
  });

  it('accepts initial numeric value', () => {
    render(<Slider value={75} aria-label="volume" />);
    expect(screen.getByRole('slider')).toHaveValue('75');
  });

  it('keeps the bare input as its root in single mode', () => {
    // Zero-regression guard: without `range` the component renders the
    // native input itself — no wrapper element, one input total.
    const { container } = render(<Slider value={75} aria-label="volume" />);
    const root = container.firstElementChild;
    expect(root?.tagName).toBe('INPUT');
    expect(root).toHaveAttribute('type', 'range');
    expect(container.querySelectorAll('input')).toHaveLength(1);
  });

  it('updates value on change', () => {
    const onChange = vi.fn();
    render(<Slider aria-label="volume" onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '30' } });
    expect(screen.getByRole('slider')).toHaveValue('30');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards native props like min, max, step', () => {
    render(<Slider min={0} max={100} step={5} aria-label="volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('forwards disabled prop', () => {
    render(<Slider disabled aria-label="volume" />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Slider value={75} aria-label="volume" />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Slider range mode', () => {
  it('renders two thumbs defaulting to [min, max]', () => {
    render(<Slider range aria-label={['minimum', 'maximum']} />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveValue('0');
    expect(thumbs[1]).toHaveValue('100');
  });

  it('derives the uncontrolled default from min/max props', () => {
    render(<Slider range min={10} max={20} aria-label={['minimum', 'maximum']} />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs[0]).toHaveValue('10');
    expect(thumbs[1]).toHaveValue('20');
  });

  it('accepts an initial tuple and renders an inverted tuple normalized', () => {
    const { unmount } = render(
      <Slider range value={[20, 80]} aria-label={['minimum', 'maximum']} />
    );
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs[0]).toHaveValue('20');
    expect(thumbs[1]).toHaveValue('80');
    unmount();

    render(<Slider range value={[80, 20]} aria-label={['minimum', 'maximum']} />);
    const normalized = screen.getAllByRole('slider');
    expect(normalized[0]).toHaveValue('20');
    expect(normalized[1]).toHaveValue('80');
  });

  it('labels each thumb from an aria-label tuple', () => {
    render(<Slider range value={[20, 80]} aria-label={['minimum', 'maximum']} />);
    expect(screen.getByRole('slider', { name: 'minimum' })).toHaveValue('20');
    expect(screen.getByRole('slider', { name: 'maximum' })).toHaveValue('80');
  });

  it('labels both thumbs from a bare aria-label string', () => {
    render(<Slider range value={[20, 80]} aria-label="volume" />);
    expect(screen.getAllByRole('slider', { name: 'volume' })).toHaveLength(2);
  });

  it('applies className to the wrapper', () => {
    const { container } = render(
      <Slider range className="custom" aria-label={['minimum', 'maximum']} />
    );
    expect(container.firstElementChild).toHaveClass('custom');
    // The thumbs live inside the wrapper, which owns the className.
    expect(container.querySelectorAll('input')).toHaveLength(2);
  });

  it('forwards native props to both thumbs', () => {
    render(
      <Slider range min={0} max={100} step={5} disabled aria-label={['minimum', 'maximum']} />
    );
    screen.getAllByRole('slider').forEach((thumb) => {
      expect(thumb).toHaveAttribute('min', '0');
      expect(thumb).toHaveAttribute('max', '100');
      expect(thumb).toHaveAttribute('step', '5');
      expect(thumb).toBeDisabled();
    });
  });

  it('paints the fill between the thumbs', () => {
    const { container } = render(
      <Slider range value={[25, 75]} aria-label={['minimum', 'maximum']} />
    );
    const fill = container.firstElementChild?.children[1];
    expect(fill).toHaveStyle({
      insetInlineStart: '25%',
      width: '50%',
    });
  });

  it('emits the next tuple and updates uncontrolled state', () => {
    const onChange = vi.fn();
    render(
      <Slider range value={[20, 80]} onValuesChange={onChange} aria-label={['minimum', 'maximum']} />
    );
    const [low, high] = screen.getAllByRole('slider');
    fireEvent.change(low!, { target: { value: '40' } });
    expect(onChange).toHaveBeenCalledWith([40, 80]);
    expect(low).toHaveValue('40');
    expect(high).toHaveValue('80');
  });

  it('works controlled: updates flow through the control and back', () => {
    function Harness() {
      const [value, , ctrl] = useControl<number | [number, number]>([20, 80]);
      return (
        <>
          <Slider range value={ctrl} aria-label={['minimum', 'maximum']} />
          <output data-testid="value">
            {Array.isArray(value) ? value.join('–') : String(value)}
          </output>
        </>
      );
    }
    render(<Harness />);
    fireEvent.change(screen.getAllByRole('slider')[0]!, {
      target: { value: '40' },
    });
    expect(screen.getByTestId('value')).toHaveTextContent('40–80');
    expect(screen.getAllByRole('slider')[0]).toHaveValue('40');
  });

  it('snaps the low thumb against the high thumb on cross', () => {
    const onChange = vi.fn();
    render(
      <Slider range value={[20, 80]} onValuesChange={onChange} aria-label={['minimum', 'maximum']} />
    );
    const [low, high] = screen.getAllByRole('slider');
    fireEvent.change(low!, { target: { value: '90' } });
    expect(onChange).toHaveBeenCalledWith([80, 80]);
    expect(low).toHaveValue('80');
    expect(high).toHaveValue('80');
  });

  it('snaps the high thumb against the low thumb on cross', () => {
    const onChange = vi.fn();
    render(
      <Slider range value={[20, 80]} onValuesChange={onChange} aria-label={['minimum', 'maximum']} />
    );
    const [low, high] = screen.getAllByRole('slider');
    fireEvent.change(high!, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith([20, 20]);
    expect(low).toHaveValue('20');
    expect(high).toHaveValue('20');
  });

  it('mirrors arrows for both thumbs under dir=rtl', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Slider range value={[20, 80]} step={5} aria-label={['minimum', 'maximum']} />
      </div>
    );
    const [low, high] = screen.getAllByRole('slider');

    low!.focus();
    // Mirrored: ArrowLeft increases by the input's own step.
    await user.keyboard('{ArrowLeft}');
    expect(low).toHaveValue('25');
    await user.keyboard('{ArrowLeft}');
    expect(low).toHaveValue('30');
    await user.keyboard('{ArrowRight}');
    expect(low).toHaveValue('25');

    high!.focus();
    await user.keyboard('{ArrowLeft}');
    expect(high).toHaveValue('85');
    await user.keyboard('{ArrowRight}');
    expect(high).toHaveValue('80');
  });

  it('snaps a thumb keyboard-stepped past the other (dir=rtl)', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Slider range value={[75, 80]} step={5} aria-label={['minimum', 'maximum']} />
      </div>
    );
    const [low, high] = screen.getAllByRole('slider');
    low!.focus();
    await user.keyboard('{ArrowLeft}');
    expect(low).toHaveValue('80');
    await user.keyboard('{ArrowLeft}');
    // The low thumb sticks at the high thumb instead of crossing it.
    expect(low).toHaveValue('80');
    expect(high).toHaveValue('80');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Slider range value={[20, 80]} aria-label={['minimum', 'maximum']} />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('SliderCore', () => {
  it('renders the given value', () => {
    render(<SliderCore value={75} onChange={() => undefined} aria-label="core" />);
    expect(screen.getByRole('slider')).toHaveValue('75');
  });

  it('calls onChange with the numeric value on change', () => {
    const onChange = vi.fn();
    render(<SliderCore value={50} onChange={onChange} aria-label="core" />);
    fireEvent.change(screen.getByRole('slider'), {target: {value: '30'}});
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('renders two thumbs from a tuple and emits ordered tuples in range mode', () => {
    const onChange = vi.fn();
    render(
      <SliderCore range value={[20, 80]} onChange={onChange} aria-label={['low', 'high']} />
    );
    const [low, high] = screen.getAllByRole('slider');
    expect(low).toHaveValue('20');
    expect(high).toHaveValue('80');
    fireEvent.change(low!, { target: { value: '90' } });
    expect(onChange).toHaveBeenCalledWith([80, 80]);
  });
});

describe('Slider ref forwarding', () => {
  it('forwards ref to the range input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Slider ref={ref} aria-label='Volume' />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
