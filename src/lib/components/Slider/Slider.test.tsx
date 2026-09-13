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

describe('Slider default DOM (regression guard)', () => {
  it('range mode renders exactly rail, fill and two inputs — no extras', () => {
    const { container } = render(
      <Slider range value={[20, 80]} aria-label={['minimum', 'maximum']} />
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.children).toHaveLength(4);
    expect(wrapper?.querySelectorAll('input')).toHaveLength(2);
    // No tooltip bubbles, no marks.
    expect(wrapper?.querySelectorAll('[data-state]')).toHaveLength(0);
    expect(wrapper?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it('single mode keeps the bare input as root — no wrapper, no bubble', () => {
    const { container } = render(<Slider value={40} aria-label="volume" />);
    expect(container.firstElementChild?.tagName).toBe('INPUT');
    expect(container.querySelectorAll('span')).toHaveLength(0);
    expect(container.querySelectorAll('[data-state]')).toHaveLength(0);
  });

  it('leaves the step attribute untouched by default', () => {
    render(<Slider aria-label="volume" />);
    expect(screen.getByRole('slider')).not.toHaveAttribute('step');
  });
});

describe('Slider tooltip', () => {
  it('shows the bubble while dragging and hides it on release', () => {
    const { container } = render(
      <Slider tooltip value={40} aria-label="volume" />
    );
    const input = screen.getByRole('slider');
    const bubble = container.querySelector('[data-state]');
    expect(bubble).toHaveAttribute('data-state', 'closed');
    expect(bubble).toHaveTextContent('40');

    fireEvent.pointerDown(input);
    expect(bubble).toHaveAttribute('data-state', 'open');
    // The bubble tracks the thumb.
    fireEvent.change(input, { target: { value: '70' } });
    expect(bubble).toHaveTextContent('70');
    expect(bubble).toHaveStyle({ insetInlineStart: '70%' });

    fireEvent.pointerUp(input, { bubbles: true });
    expect(bubble).toHaveAttribute('data-state', 'closed');
  });

  it('shows the bubble on keyboard focus and hides it on blur', () => {
    const { container } = render(
      <Slider tooltip value={40} aria-label="volume" />
    );
    const input = screen.getByRole('slider');
    const bubble = container.querySelector('[data-state]');

    fireEvent.focus(input);
    expect(bubble).toHaveAttribute('data-state', 'open');
    fireEvent.blur(input);
    expect(bubble).toHaveAttribute('data-state', 'closed');
  });

  it('formats the bubble content with tooltipFormatter', () => {
    const { container } = render(
      <Slider
        tooltip
        tooltipFormatter={(v) => `${v}%`}
        value={40}
        aria-label="volume"
      />
    );
    expect(container.querySelector('[data-state]')).toHaveTextContent('40%');
  });

  it('renders one bubble per thumb in range mode, following each value', () => {
    const { container } = render(
      <Slider
        range
        tooltip
        value={[20, 80]}
        aria-label={['minimum', 'maximum']}
      />
    );
    const bubbles = container.querySelectorAll('[data-state]');
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0]).toHaveTextContent('20');
    expect(bubbles[0]).toHaveStyle({ insetInlineStart: '20%' });
    expect(bubbles[1]).toHaveTextContent('80');
    expect(bubbles[1]).toHaveStyle({ insetInlineStart: '80%' });

    // Dragging the low thumb opens its bubble only.
    const [lowThumb] = screen.getAllByRole('slider');
    fireEvent.pointerDown(lowThumb!);
    expect(bubbles[0]).toHaveAttribute('data-state', 'open');
    expect(bubbles[1]).toHaveAttribute('data-state', 'closed');
    fireEvent.pointerUp(lowThumb!, { bubbles: true });
    expect(bubbles[0]).toHaveAttribute('data-state', 'closed');
  });

  it('keeps the bubble aria-hidden so the native value stays the announcement', () => {
    const { container } = render(
      <Slider tooltip value={40} aria-label="volume" />
    );
    const bubble = container.querySelector('[data-state]');
    expect(bubble).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext');
  });

  it('does not open the bubble on a disabled slider', () => {
    const { container } = render(
      <Slider tooltip disabled value={40} aria-label="volume" />
    );
    const input = screen.getByRole('slider');
    fireEvent.pointerDown(input);
    expect(container.querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'closed'
    );
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Slider tooltip value={40} aria-label="volume" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Slider marks', () => {
  const quarterMarks = { 0: 'Min', 25: 'Low', 50: 'Mid', 75: 'High', 100: 'Max' };

  it('renders the labels under the track at their value positions', () => {
    render(
      <Slider marks={quarterMarks} value={50} aria-label="volume" />
    );
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Mid')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    // The clickable mark container sits at the value's track percent.
    expect(screen.getByText('Mid').parentElement).toHaveStyle({
      insetInlineStart: '50%',
    });
    expect(screen.getByText('Max').parentElement).toHaveStyle({
      insetInlineStart: '100%',
    });
  });

  it('clicking a mark commits its value in single mode', async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <Slider
        marks={quarterMarks}
        value={10}
        onValuesChange={onValuesChange}
        aria-label="volume"
      />
    );
    await user.click(screen.getByText('High'));
    expect(screen.getByRole('slider')).toHaveValue('75');
    expect(onValuesChange).toHaveBeenCalledWith(75);
  });

  it('clicking a mark moves the nearest thumb in range mode', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        range
        marks={quarterMarks}
        value={[20, 80]}
        aria-label={['minimum', 'maximum']}
      />
    );
    // Closer to the high thumb.
    await user.click(screen.getByText('High'));
    expect(screen.getAllByRole('slider')[1]).toHaveValue('75');
    // Closer to the low thumb.
    await user.click(screen.getByText('Low'));
    expect(screen.getAllByRole('slider')[0]).toHaveValue('25');
    // Equidistant — the low thumb wins.
    await user.click(screen.getByText('Mid'));
    expect(screen.getAllByRole('slider')[0]).toHaveValue('50');
    expect(screen.getAllByRole('slider')[1]).toHaveValue('75');
  });

  it('moves the nearest thumb without ever crossing the other', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        range
        marks={quarterMarks}
        value={[70, 80]}
        aria-label={['minimum', 'maximum']}
      />
    );
    // 100 is nearer the high thumb: it moves, the low thumb stays.
    await user.click(screen.getByText('Max'));
    expect(screen.getAllByRole('slider')[0]).toHaveValue('70');
    expect(screen.getAllByRole('slider')[1]).toHaveValue('100');
    // 50 is nearer the low thumb.
    await user.click(screen.getByText('Mid'));
    expect(screen.getAllByRole('slider')[0]).toHaveValue('50');
    expect(screen.getAllByRole('slider')[1]).toHaveValue('100');
  });

  it('keeps equal thumbs pinned when a tie mark would cross them', async () => {
    const user = userEvent.setup();
    render(
      <Slider
        range
        marks={quarterMarks}
        value={[80, 80]}
        aria-label={['minimum', 'maximum']}
      />
    );
    // The tie goes to the low thumb, whose 100 clamps at the high
    // thumb — a mark click never swaps thumb order.
    await user.click(screen.getByText('Max'));
    expect(screen.getAllByRole('slider')[0]).toHaveValue('80');
    expect(screen.getAllByRole('slider')[1]).toHaveValue('80');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<Slider marks={quarterMarks} value={50} aria-label="volume" />);
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('Slider marks snapping (step=null)', () => {
  const quarterMarks = { 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' };

  it('frees the native step and snaps changes onto the nearest mark', () => {
    const onValuesChange = vi.fn();
    render(
      <Slider
        marks={quarterMarks}
        step={null}
        value={30}
        onValuesChange={onValuesChange}
        aria-label="volume"
      />
    );
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('step', 'any');

    fireEvent.change(input, { target: { value: '37' } });
    expect(input).toHaveValue('25');
    expect(onValuesChange).toHaveBeenCalledWith(25);

    fireEvent.change(input, { target: { value: '40' } });
    expect(input).toHaveValue('50');
  });

  it('snaps keyboard steps too (dir=rtl mirror path)', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Slider
          marks={quarterMarks}
          step={null}
          value={30}
          aria-label="volume"
        />
      </div>
    );
    const input = screen.getByRole('slider');
    input.focus();
    // Mirrored ArrowLeft steps +1 → 31, which snaps back to 25.
    await user.keyboard('{ArrowLeft}');
    expect(input).toHaveValue('25');
  });

  it('keeps the snap ordering when a thumb steps past the other', () => {
    render(
      <Slider
        range
        marks={quarterMarks}
        step={null}
        value={[20, 80]}
        aria-label={['minimum', 'maximum']}
      />
    );
    const [low] = screen.getAllByRole('slider');
    // 76 is nearest 75, below the high thumb.
    fireEvent.change(low!, { target: { value: '76' } });
    expect(low).toHaveValue('75');
    // 99 snaps to 100, past the high thumb → sticks at 80.
    fireEvent.change(low!, { target: { value: '99' } });
    expect(low).toHaveValue('80');
  });

  it('moves freely when step=null is given without marks', () => {
    render(<Slider step={null} value={30} aria-label="volume" />);
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('step', 'any');
    fireEvent.change(input, { target: { value: '37' } });
    expect(input).toHaveValue('37');
  });
});

describe('Slider vertical', () => {
  it('wraps the input in a positioning span and keeps slider semantics', () => {
    const { container } = render(
      <Slider vertical value={40} aria-label="volume" />
    );
    const root = container.firstElementChild;
    expect(root?.tagName).toBe('SPAN');
    const slider = screen.getByRole('slider', { name: 'volume' });
    expect(slider).toHaveValue('40');
    expect(slider).toBeInstanceOf(HTMLInputElement);
  });

  it('paints the range fill along the vertical axis', () => {
    const { container } = render(
      <Slider
        range
        vertical
        value={[25, 75]}
        aria-label={['minimum', 'maximum']}
      />
    );
    const fill = container.firstElementChild?.children[1];
    // From the top: the fill covers 100−75=25% down to 100−25=75%.
    expect(fill).toHaveStyle({ insetBlockStart: '25%', height: '50%' });
    expect((fill as HTMLElement).style.width).toBe('');
  });

  it('places vertical marks along the track', () => {
    const { container } = render(
      <Slider
        vertical
        marks={{ 0: 'Min', 50: 'Mid', 100: 'Max' }}
        value={50}
        aria-label="volume"
      />
    );
    expect(screen.getByText('Mid').parentElement).toHaveStyle({
      insetBlockEnd: '50%',
    });
    expect(container.firstElementChild?.tagName).toBe('SPAN');
  });

  it('places the vertical bubble beside the thumb', () => {
    const { container } = render(
      <Slider vertical tooltip value={40} aria-label="volume" />
    );
    const bubble = container.querySelector('[data-state]');
    expect(bubble).toHaveStyle({ insetBlockEnd: '40%' });
    fireEvent.pointerDown(screen.getByRole('slider'));
    expect(bubble).toHaveAttribute('data-state', 'open');
  });

  it('keeps arrow keys native under dir=rtl (no mirror on vertical)', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Slider vertical value={40} aria-label="volume" />
      </div>
    );
    const slider = screen.getByRole('slider');
    slider.focus();
    // The input-level rtl is the orientation recipe, not an RTL
    // context — the JS mirror stays off in vertical mode.
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveValue('40');
  });

  it('keeps horizontal rtl mirroring with marks and tooltip present', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Slider
          tooltip
          marks={{ 0: 'Min', 50: 'Mid', 100: 'Max' }}
          value={40}
          aria-label="volume"
        />
      </div>
    );
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveValue('41');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const { container } = render(
      <Slider
        range
        vertical
        tooltip
        marks={{ 0: 'Min', 100: 'Max' }}
        value={[25, 75]}
        aria-label={['minimum', 'maximum']}
      />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
    expect(container.firstElementChild).toBeDefined();
  });
});

