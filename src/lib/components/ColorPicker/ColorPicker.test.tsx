import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import ColorPicker from './ColorPicker';
import ColorPickerCore from './ColorPickerCore';

describe('ColorPicker', () => {
  it('renders a color input', () => {
    render(<ColorPicker value="#ff0000" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<ColorPicker value="#ff0000" className="custom" />);
    expect(screen.getByRole('textbox').parentElement?.parentElement).toHaveClass('custom');
  });

  it('displays current color', () => {
    render(<ColorPicker value="#00ff00" />);
    expect(screen.getAllByDisplayValue('#00ff00').length).toBe(2);
  });

  it('calls onChange on text input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '#0000ff');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders preset colors', () => {
    render(<ColorPicker value="#ff0000" presets={['#ff0000', '#00ff00']} />);
    expect(screen.getByLabelText('#ff0000')).toBeInTheDocument();
    expect(screen.getByLabelText('#00ff00')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <ColorPicker value="#ff0000" presets={['#ff0000', '#00ff00', '#0000ff']} />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
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
  it('forwards ref to the color swatch input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<ColorPicker ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute('type', 'color');
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
