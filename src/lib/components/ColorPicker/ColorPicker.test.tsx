import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';
import { useControl } from 'react-use-control';

import ColorPicker from './ColorPicker';
import ColorPickerCore from './ColorPickerCore';

/** A clickable rect mock for pointer-driven surfaces. */
function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {left, top, width, height, right: left + width, bottom: top + height, x: left, y: top} as DOMRect;
}

async function openPanel(
  user: ReturnType<typeof userEvent.setup>,
  name = 'Pick color'
) {
  await user.click(screen.getByRole('button', {name}));
  return screen.getByRole('dialog');
}

/** aria-labels of every button inside the open panel, in DOM order. */
function panelButtonLabels(panel: HTMLElement): (string | null)[] {
  return [...panel.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
}

describe('ColorPicker', () => {
  it('renders a swatch trigger with popup semantics', () => {
    render(<ColorPicker value="#ff0000" />);
    const trigger = screen.getByRole('button', {name: 'Pick color'});
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // The panel is linked but idle while closed (the hidden state rides
    // data-state — jsdom applies no CSS, so visibility is not asserted).
    const panel = document.getElementById(trigger.getAttribute('aria-controls')!);
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('data-state', 'closed');
  });

  it('paints the trigger with the current color', () => {
    render(<ColorPicker value="#00ff00" />);
    const fill = screen.getByRole('button', {name: 'Pick color'}).querySelector('span');
    expect(fill).toHaveStyle({background: 'rgba(0, 255, 0, 1)'});
  });

  it('opens the panel on trigger click and focuses the SV slider', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" />);
    await user.click(screen.getByRole('button', {name: 'Pick color'}));
    expect(screen.getByRole('button', {name: 'Pick color'})).toHaveAttribute('aria-expanded', 'true');
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2); // SV + hue, no alpha by default
    expect(document.activeElement).toBe(sliders[0]);
  });

  it('closes on a second trigger click', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" />);
    const trigger = screen.getByRole('button', {name: 'Pick color'});
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
  });

  it('closes on outside pointerdown', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" />);
    await openPanel(user);
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('button', {name: 'Pick color'})).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" />);
    await openPanel(user);
    fireEvent.keyDown(document.body, {key: 'Escape'});
    expect(screen.getByRole('button', {name: 'Pick color'})).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports a controlled open state', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [, setOpen, ctrl] = useControl(undefined, true);
      return (
        <>
          <ColorPicker open={ctrl} value="#ff0000" />
          {/* Fixed-direction buttons: an outside *toggle* would reopen
              on the click that follows the pointerdown light-dismiss. */}
          <button type="button" onClick={() => setOpen(false)}>close-outer</button>
          <button type="button" onClick={() => setOpen(true)}>open-outer</button>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'close-outer'}));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
    await user.click(screen.getByRole('button', {name: 'open-outer'}));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The trigger still toggles through the same control.
    await user.click(screen.getByRole('button', {name: 'Pick color'}));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
  });

  it('applies className to the panel', () => {
    render(<ColorPicker value="#ff0000" className="custom" />);
    expect(screen.getByRole('button', {name: 'Pick color'}).parentElement).not.toHaveClass('custom');
    const panelId = screen.getByRole('button', {name: 'Pick color'}).getAttribute('aria-controls');
    expect(document.getElementById(panelId!)).toHaveClass('custom');
  });

  it('commits continuously across an SV panel drag', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} recent />);
    const panel = await openPanel(user);
    const sv = screen.getAllByRole('slider')[0]!;
    vi.spyOn(sv, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 200, 100));

    // Center: hue 0 (red), s = 0.5, v = 0.5 → #804040.
    fireEvent.pointerDown(sv, {pointerId: 1, clientX: 100, clientY: 50});
    expect(onChange).toHaveBeenCalledWith('#804040');
    // Drag moves stream values; no commit while the gesture runs.
    fireEvent.pointerMove(sv, {pointerId: 1, clientX: 200, clientY: 0});
    expect(onChange).toHaveBeenCalledWith('#ff0000');
    expect(panelButtonLabels(panel)).toEqual([]);
    // Release commits the settled color (recent row records it).
    fireEvent.pointerUp(sv, {pointerId: 1, clientX: 200, clientY: 0});
    expect(panelButtonLabels(panel)).toEqual(['#ff0000']);
  });

  it('moves the hue via pointer on the hue rail', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    await openPanel(user);
    const hue = screen.getAllByRole('slider')[1]!;
    vi.spyOn(hue, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 360, 12));
    fireEvent.pointerDown(hue, {pointerId: 1, clientX: 120, clientY: 6});
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });

  it('exposes hue value semantics for screen readers', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" />);
    await openPanel(user);
    const hue = screen.getAllByRole('slider')[1]!;
    expect(hue).toHaveAttribute('aria-valuenow', '0');
    expect(hue).toHaveAttribute('aria-valuemin', '0');
    expect(hue).toHaveAttribute('aria-valuemax', '360');
  });

  it('adjusts hue with arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    await openPanel(user);
    const hue = screen.getAllByRole('slider')[1]!;
    fireEvent.keyDown(hue, {key: 'ArrowRight'});
    expect(onChange).toHaveBeenCalledWith('#ff0400');
  });

  it('serializes alpha when allowAlpha is set', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" allowAlpha onChange={onChange} />);
    await openPanel(user);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(3); // SV + hue + alpha
    const alpha = sliders[2]!;
    vi.spyOn(alpha, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 100, 12));
    fireEvent.pointerDown(alpha, {pointerId: 1, clientX: 50, clientY: 6});
    expect(onChange).toHaveBeenCalledWith('#ff000080');
    expect(alpha).toHaveAttribute('aria-valuenow', '50');
  });

  it('rounds alpha to the nearest byte', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" allowAlpha onChange={onChange} />);
    await openPanel(user);
    const alpha = screen.getAllByRole('slider')[2]!;
    vi.spyOn(alpha, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 3, 12));
    fireEvent.pointerDown(alpha, {pointerId: 1, clientX: 1, clientY: 6});
    // 1/3 opacity → 85/255 → 0x55.
    expect(onChange).toHaveBeenCalledWith('#ff000055');
  });

  it('shows and accepts the rgb format', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" format="rgb" onChange={onChange} />);
    await openPanel(user);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('rgb(255, 0, 0)');
    fireEvent.change(input, {target: {value: 'rgb(0, 255, 0)'}});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onChange).toHaveBeenCalledWith('rgb(0, 255, 0)');
    // Serialized output follows the format prop.
    expect(input).toHaveValue('rgb(0, 255, 0)');
  });

  it('shows the hsl format', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" format="hsl" />);
    await openPanel(user);
    expect(screen.getByRole('textbox')).toHaveValue('hsl(0, 100%, 50%)');
  });

  it('accepts any format in the text field and normalizes it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" format="rgb" onChange={onChange} />);
    await openPanel(user);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: '#0000ff'}});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onChange).toHaveBeenCalledWith('rgb(0, 0, 255)');
  });

  it('treats unparsable text input as a no-op', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    await openPanel(user);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'notacolor'}});
    expect(input).toHaveValue('notacolor');
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(onChange).not.toHaveBeenCalled();
    // Draft discarded: the formatted value comes back.
    expect(input).toHaveValue('#ff0000');
  });

  it('drops the draft on Escape without closing the panel', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    await openPanel(user);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'zzz'}});
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('#ff0000');
    expect(screen.getByRole('button', {name: 'Pick color'})).toHaveAttribute('aria-expanded', 'true');
  });

  it('picks preset colors and normalizes them to the format', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorPicker
        value="#ff0000"
        presets={['#ff0000', '#00ff00', '#0000ff']}
        format="rgb"
        onChange={onChange}
      />
    );
    await openPanel(user);
    await user.click(screen.getByLabelText('#00ff00'));
    expect(onChange).toHaveBeenCalledWith('rgb(0, 255, 0)');
  });

  it('tracks recent colors newest-first, deduplicated', async () => {
    const user = userEvent.setup();
    render(
      <ColorPicker
        value="#ff0000"
        presets={['#ff0000', '#00ff00', '#0000ff']}
        recent
      />
    );
    const panel = await openPanel(user);
    // Preset row only.
    expect(panelButtonLabels(panel)).toEqual(['#ff0000', '#00ff00', '#0000ff']);

    await user.click(screen.getByLabelText('#00ff00'));
    expect(panelButtonLabels(panel)).toEqual([
      '#ff0000', '#00ff00', '#0000ff', // presets
      '#00ff00', // recent
    ]);

    await user.click(screen.getByLabelText('#0000ff'));
    expect(panelButtonLabels(panel)).toEqual([
      '#ff0000', '#00ff00', '#0000ff', // presets
      '#0000ff', '#00ff00', // recent, newest first
    ]);

    // Re-picking an existing color moves it to the front, no duplicate.
    // (The preset row renders first, so index 0 is the preset swatch.)
    await user.click(screen.getAllByLabelText('#00ff00')[0]!);
    const labels = panelButtonLabels(panel);
    expect(labels.slice(-2)).toEqual(['#00ff00', '#0000ff']);
    expect(labels.filter((l) => l === '#00ff00').length).toBe(2); // preset + recent
  });

  it('caps recent colors at ten', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#000000" recent />);
    const panel = await openPanel(user);
    const input = screen.getByRole('textbox');
    for (let i = 1; i <= 12; i++) {
      const hex = `#0000${i.toString(16).padStart(2, '0')}`;
      fireEvent.change(input, {target: {value: hex}});
      fireEvent.keyDown(input, {key: 'Enter'});
    }
    // 12 committed colors → recent capped at 10, newest first.
    const labels = panelButtonLabels(panel);
    expect(labels.length).toBe(10);
    expect(labels[0]).toBe('#00000c');
    expect(labels[9]).toBe('#000003');
  });

  it('updates uncontrolled value on preset pick', async () => {
    const user = userEvent.setup();
    render(<ColorPicker value="#ff0000" presets={['#00ff00']} />);
    await openPanel(user);
    await user.click(screen.getByLabelText('#00ff00'));
    expect(screen.getByRole('textbox')).toHaveValue('#00ff00');
    const fill = screen.getByRole('button', {name: 'Pick color'}).querySelector('span');
    expect(fill).toHaveStyle({background: 'rgba(0, 255, 0, 1)'});
  });

  it('follows a controlled value control in both directions', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [, setValue, ctrl] = useControl(undefined, '#ff0000');
      return (
        <>
          <ColorPicker value={ctrl} presets={['#00ff00']} />
          <button type="button" onClick={() => setValue('#0000ff')}>ext</button>
        </>
      );
    }
    render(<Harness />);
    await openPanel(user);
    expect(screen.getByRole('textbox')).toHaveValue('#ff0000');
    // External write through the control drives the panel.
    await user.click(screen.getByRole('button', {name: 'ext'}));
    expect(screen.getByRole('textbox')).toHaveValue('#0000ff');
    // Panel commits write back through the same control.
    await user.click(screen.getByLabelText('#00ff00'));
    expect(screen.getByRole('textbox')).toHaveValue('#00ff00');
  });

  it('renders an always-visible panel in inline mode', () => {
    render(<ColorPicker inline value="#ff0000" presets={['#00ff00']} className="custom" />);
    expect(screen.queryByRole('button', {name: 'Pick color'})).toBeNull();
    expect(screen.getAllByRole('slider').length).toBe(2);
    expect(screen.getByRole('textbox')).toHaveValue('#ff0000');
    // Inline root is the panel card: className lands there.
    const input = screen.getByRole('textbox');
    expect(input.closest('.custom')).not.toBeNull();
  });

  it('has no axe violations (closed)', async () => {
    const {axe} = await import('jest-axe');
    render(<ColorPicker value="#ff0000" presets={['#ff0000', '#00ff00']} />);
    const results = await axe(document.body, {rules: {region: {enabled: false}}});
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations (open, alpha + presets + recent)', async () => {
    const {axe} = await import('jest-axe');
    const user = userEvent.setup();
    render(
      <ColorPicker
        value="#ff0000"
        allowAlpha
        presets={['#ff0000', '#00ff00']}
        recent
        aria-label="Background color"
      />
    );
    await openPanel(user, 'Background color');
    const results = await axe(document.body, {rules: {region: {enabled: false}}});
    expect(results.violations).toEqual([]);
  });

  it('has no axe violations (inline)', async () => {
    const {axe} = await import('jest-axe');
    render(
      <ColorPicker
        inline
        value="#ff0000"
        allowAlpha
        presets={['#ff0000', '#00ff00']}
        recent
      />
    );
    const results = await axe(document.body, {rules: {region: {enabled: false}}});
    expect(results.violations).toEqual([]);
  });
});

describe('ColorPickerCore', () => {
  it('renders the given value in both inputs', () => {
    render(<ColorPickerCore value="#00ff00" onChange={() => undefined} />);
    expect(screen.getAllByDisplayValue('#00ff00').length).toBe(2);
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<ColorPickerCore value="#ff0000" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    // a controlled core resets the DOM value to its `value` prop on every
    // render, so set the whole string in one change event
    fireEvent.change(input, {target: {value: '#0000ff'}});
    expect(onChange).toHaveBeenCalledWith('#0000ff');
  });

  it('calls onChange with the preset color on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorPickerCore
        value="#ff0000"
        onChange={onChange}
        presets={['#00ff00']}
      />
    );
    await user.click(screen.getByLabelText('#00ff00'));
    expect(onChange).toHaveBeenCalledWith('#00ff00');
  });
});

describe('ColorPicker ref forwarding', () => {
  it('forwards ref to the trigger button (floating mode)', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ColorPicker ref={ref} value="#ff0000" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    ref.current?.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('forwards ref to the panel card (inline mode)', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ColorPicker inline ref={ref} value="#ff0000" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toContainElement(screen.getAllByRole('slider')[0]!);
  });
});
