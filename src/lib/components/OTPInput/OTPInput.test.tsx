import { render } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import OTPInput from './OTPInput';
import OTPInputCore from './OTPInputCore';

describe('OTPInput', () => {
  it('renders correct number of inputs', () => {
    const { container } = render(<OTPInput />);
    expect(container.querySelectorAll('input')).toHaveLength(6);
  });

  it('renders custom length', () => {
    const { container } = render(<OTPInput length={4} />);
    expect(container.querySelectorAll('input')).toHaveLength(4);
  });

  it('applies className', () => {
    const { container } = render(<OTPInput className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('accepts value', () => {
    const { container } = render(<OTPInput value="123" length={4} />);
    const inputs = container.querySelectorAll('input');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('');
  });

  it('calls onChange on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<OTPInput onChange={onChange} />);
    const input = container.querySelector('input')!;
    await user.type(input, '5');
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<OTPInput value="12" length={4} />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('OTPInputCore', () => {
  it('renders the given value across cells', () => {
    const { container } = render(
      <OTPInputCore value="123" length={4} onChange={() => undefined} />
    );
    const inputs = container.querySelectorAll('input');
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveValue('2');
    expect(inputs[2]).toHaveValue('3');
    expect(inputs[3]).toHaveValue('');
  });

  it('calls onChange with the updated code on input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<OTPInputCore value="" onChange={onChange} />);
    await user.type(container.querySelector('input')!, '5');
    expect(onChange).toHaveBeenCalledWith('5');
  });
});

describe('OTPInput ref forwarding', () => {
  it('forwards ref to the first cell input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<OTPInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });
});
