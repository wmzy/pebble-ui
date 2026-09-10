import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import userEvent from '@testing-library/user-event';

import RadioGroup from './RadioGroup';
import RadioGroupCore from './RadioGroupCore';
import Radio from './Radio';

function RadioFixture({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <RadioGroup value={defaultValue} name="color">
      <Radio value="red">Red</Radio>
      <Radio value="blue">Blue</Radio>
      <Radio value="green">Green</Radio>
    </RadioGroup>
  );
}

describe('RadioGroup + Radio', () => {
  it('renders radio inputs within a fieldset', () => {
    render(<RadioFixture />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('all radios share the same name', () => {
    render(<RadioFixture />);
    const radios = screen.getAllByRole('radio');
    const name = radios[0]!.getAttribute('name');
    expect(name).toBe('color');
    radios.forEach((r) => expect(r).toHaveAttribute('name', name));
  });

  it('selects the initial value', () => {
    render(<RadioFixture defaultValue="blue" />);
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Red' })).not.toBeChecked();
  });

  it('changes selection on click', async () => {
    const user = userEvent.setup();
    render(<RadioFixture />);
    await user.click(screen.getByRole('radio', { name: 'Green' }));
    expect(screen.getByRole('radio', { name: 'Green' })).toBeChecked();
  });

  it('applies className to RadioGroup', () => {
    render(
      <RadioGroup className="custom">
        <Radio value="a">A</Radio>
      </RadioGroup>
    );
    const fieldset = screen.getByRole('group');
    expect(fieldset).toHaveClass('custom');
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(<RadioFixture defaultValue="blue" />);
    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});

describe('RadioGroupCore', () => {
  it('renders the given value as the checked radio', () => {
    render(
      <RadioGroupCore value="blue" onChange={() => undefined} name="color">
        <Radio value="red">Red</Radio>
        <Radio value="blue">Blue</Radio>
      </RadioGroupCore>
    );
    expect(screen.getByRole('radio', {name: 'Blue'})).toBeChecked();
    expect(screen.getByRole('radio', {name: 'Red'})).not.toBeChecked();
  });

  it('calls onChange with the selected value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioGroupCore value="" onChange={onChange} name="color">
        <Radio value="red">Red</Radio>
        <Radio value="green">Green</Radio>
      </RadioGroupCore>
    );
    await user.click(screen.getByRole('radio', {name: 'Green'}));
    expect(onChange).toHaveBeenCalledWith('green');
  });

  it('does not select on its own: rerender drives the DOM', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const {rerender} = render(
      <RadioGroupCore value="" onChange={onChange} name="color">
        <Radio value="green">Green</Radio>
      </RadioGroupCore>
    );
    await user.click(screen.getByRole('radio', {name: 'Green'}));
    expect(screen.getByRole('radio', {name: 'Green'})).not.toBeChecked();
    rerender(
      <RadioGroupCore value="green" onChange={onChange} name="color">
        <Radio value="green">Green</Radio>
      </RadioGroupCore>
    );
    expect(screen.getByRole('radio', {name: 'Green'})).toBeChecked();
  });
});

describe('Radio ref forwarding', () => {
  it('forwards Radio ref to the radio input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio ref={ref} value='a'>Option A</Radio>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  it('forwards RadioGroup ref to the checked-or-first radio input', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <RadioGroup ref={ref}>
        <Radio value='a'>A</Radio>
        <Radio value='b'>B</Radio>
      </RadioGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    ref.current!.focus();
    expect(document.activeElement).toBe(ref.current);
    expect(ref.current).toHaveAttribute('value', 'a');
  });
});
