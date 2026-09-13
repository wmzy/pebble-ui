import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {Form, createForm} from 'react-f0rm';

import {InputCore} from '../components/Input';

import {FormItem} from '.';
import {
  controlColumn,
  item,
  itemHorizontal,
  itemInline,
  labelColumn,
  labelText
} from './form-item-styles';

type Values = {name: string; email: string};

/** The layout-facing slice of FormItem props. */
type LayoutExtra = {
  layout?: 'vertical' | 'horizontal' | 'inline';
  labelWidth?: number | string;
  labelAlign?: 'left' | 'right';
};

/**
 * Render one email FormItem inside a submittable form. The item root is
 * located through the label — its parent element is the root in every
 * layout (horizontal wraps the control, never the label).
 */
function renderItem(extra: LayoutExtra = {}) {
  const form = createForm<Values>({initialValues: {name: '', email: ''}});
  const utils = render(
    <Form form={form} onSubmit={() => undefined}>
      <FormItem
        form={form}
        name='email'
        label='Email'
        input={InputCore}
        data-testid='email-input'
        validate={(v: string) =>
          v.includes('@') ? undefined : 'must be an email'
        }
        {...extra}
      />
      <button type='submit'>Submit</button>
    </Form>
  );
  const input = screen.getByTestId('email-input');
  const label = screen.getByText('Email');
  return {
    input,
    label,
    root: label.parentElement!,
    unmount: utils.unmount
  };
}

describe('FormItem layout', () => {
  it('default layout renders the historical vertical DOM', () => {
    const {root, input, label} = renderItem();

    expect(root).toHaveClass(item);
    expect(root).not.toHaveClass(itemHorizontal);
    expect(root).not.toHaveClass(itemInline);
    // flat structure: label and control are the root's only children —
    // no wrapper element between the control and the root
    expect(root.children).toHaveLength(2);
    expect(root.children[0]).toBe(label);
    expect(root.children[1]).toBe(input);
    expect(input.parentElement).toBe(root);
    expect(label).toHaveClass(labelText);
    expect(label).not.toHaveClass(labelColumn);
    expect(label).toHaveAttribute('for', input.id);
  });

  it('horizontal layout: label column + control column, error under the control', async () => {
    const user = userEvent.setup();
    const {root, input, label} = renderItem({layout: 'horizontal'});

    expect(root).toHaveClass(itemHorizontal);
    expect(root).not.toHaveClass(item);
    // the label and exactly one control column; the control lives in
    // the column, not directly under the root
    expect(root.children).toHaveLength(2);
    expect(root.children[0]).toBe(label);
    const column = root.children[1] as HTMLElement;
    expect(column).toHaveClass(controlColumn);
    expect(input.parentElement).toBe(column);
    // horizontal-only label chrome, same label→control association
    expect(label).toHaveClass(labelColumn);
    expect(label).toHaveAttribute('for', input.id);

    // a failed submit slots the error under the control column — never
    // a direct root child — so sibling rows keep their controls aligned
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    const alert = screen.getByRole('alert');
    expect(alert.tagName).toBe('SPAN');
    expect(alert.parentElement).toBe(column);
    expect(root.children).toHaveLength(2);
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('inline layout keeps the flat child order: label, control, error', async () => {
    const user = userEvent.setup();
    const {root, input, label} = renderItem({layout: 'inline'});

    expect(root).toHaveClass(itemInline);
    expect(root).not.toHaveClass(item);
    expect(input.parentElement).toBe(root);

    await user.click(screen.getByRole('button', {name: 'Submit'}));
    const alert = screen.getByRole('alert');
    expect(root.children).toHaveLength(3);
    expect(root.children[0]).toBe(label);
    expect(root.children[1]).toBe(input);
    expect(root.children[2]).toBe(alert);
    expect(input).toHaveAttribute('aria-describedby', alert.id);
    expect(label).toHaveAttribute('for', input.id);
  });

  it('labelWidth number is applied as px', () => {
    const {label} = renderItem({layout: 'horizontal', labelWidth: 80});
    expect(label.style.width).toBe('80px');
  });

  it('labelWidth string is applied verbatim', () => {
    const {label} = renderItem({layout: 'horizontal', labelWidth: '12em'});
    expect(label.style.width).toBe('12em');
  });

  it('labelWidth omitted leaves the label width auto', () => {
    const {label} = renderItem({layout: 'horizontal'});
    expect(label.style.width).toBe('');
  });

  it('labelAlign defaults to right and accepts left', () => {
    const {label, unmount} = renderItem({layout: 'horizontal'});
    expect(label.style.textAlign).toBe('right');
    unmount();

    const {label: leftAligned} = renderItem({
      layout: 'horizontal',
      labelAlign: 'left'
    });
    expect(leftAligned.style.textAlign).toBe('left');
  });

  it('vertical layout ignores labelWidth and labelAlign', () => {
    const {label} = renderItem({labelWidth: 80, labelAlign: 'left'});
    expect(label.style.width).toBe('');
    expect(label.style.textAlign).toBe('');
    expect(label).not.toHaveClass(labelColumn);
  });

  it('keeps the a11y contract identical across all three layouts', async () => {
    const user = userEvent.setup();
    for (const layout of ['vertical', 'horizontal', 'inline'] as const) {
      const {input, unmount} = renderItem({layout});

      await user.click(screen.getByRole('button', {name: 'Submit'}));

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('must be an email');
      // label association, invalid flag and error description wiring
      // survive every layout change untouched
      expect(screen.getByText('Email')).toHaveAttribute('for', input.id);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', alert.id);
      unmount();
    }
  });
});
