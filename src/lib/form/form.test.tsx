import type {
  ComponentPropsWithoutRef,
  ChangeEvent,
  ReactNode
} from 'react';

import type {
  FieldValidator,
  FormInstance,
  FormItemBinding,
  FormItemRawElementBinding
} from './index';

import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Form,
  createForm,
  getError,
  getFieldErrors,
  getValue,
  reset,
  setFocus,
  setValue
} from 'react-f0rm';

import {CheckboxCore} from '../components/Checkbox';
import {InputCore} from '../components/Input';
import {SelectCore} from '../components/Select';
import {TagInputCore} from '../components/TagInput';
import {TransferCore} from '../components/Transfer';
import {UploadCore} from '../components/Upload';

import {FormItem} from '.';


type Profile = {name: string; email: string};

/** A DOM-element-shaped control: forwards everything to a raw `<input>`,
 * so its `onChange` emits the DOM event, not the next plain value. */
function NativeInput(props: ComponentPropsWithoutRef<'input'>) {
  return <input data-testid='native-input' {...props} />;
}

describe('FormItem', () => {
  function renderEmailItem(form: FormInstance<Profile>, extra?: object) {
    render(
      <FormItem form={form} name='email' label='Email' {...extra}>
        {({id, errorId, invalid, value, onChange}) => (
          <InputCore
            id={id}
            data-testid='email-input'
            value={value}
            onChange={onChange}
            aria-describedby={errorId}
            aria-invalid={invalid}
          />
        )}
      </FormItem>
    );
    return screen.getByTestId('email-input');
  }

  it('wires label, ids and value/onChange binding; renders no error element when clean', () => {
    const form = createForm({initialValues: {name: '', email: 'a@b.c'}});
    const input = renderEmailItem(form);

    expect(screen.getByText('Email')).toHaveAttribute(
      'for',
      input.getAttribute('id')!
    );
    expect(input).toHaveValue('a@b.c');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the input two-way bound through the binding', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});
    const input = renderEmailItem(form);

    await user.type(input, 'x@y.z');
    expect(getValue(form, 'email')).toBe('x@y.z');

    act(() => setValue(form, 'email', 'back@flow.dev'));
    expect(input).toHaveValue('back@flow.dev');
  });

  it('re-validates on typing through the binding after a failed submit (default reValidateMode)', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          validate={(v: string) =>
            v.includes('@') ? undefined : 'must be an email'
          }
        >
          {({id, errorId, invalid, value, onChange}) => (
            <InputCore
              id={id}
              data-testid='email-input'
              value={value}
              onChange={onChange}
              aria-describedby={errorId}
              aria-invalid={invalid}
            />
          )}
        </FormItem>
        <button type='submit'>Submit</button>
      </Form>
    );

    // Failed submit surfaces the error (mode onSubmit).
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    expect(screen.getByRole('alert')).toHaveTextContent('must be an email');

    // Typing a valid value through the binding must re-validate
    // immediately — reValidateMode 'onChange' (the default) is reachable
    // from changeValueByPath writes, exactly as it is from
    // useField.onChange. No second submit, no blur needed.
    await user.type(screen.getByTestId('email-input'), 'a@b.c');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getError(form, 'email')).toBeUndefined();
    expect(getValue(form, 'email')).toBe('a@b.c');
  });

  it('fires mode-gated validation on typing through the binding', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <FormItem
        form={form}
        name='email'
        label='Email'
        mode='onChange'
        validate={(v: string) => (v.includes('@') ? undefined : 'must be an email')}
      >
        {({id, errorId, invalid, value, onChange}) => (
          <InputCore
            id={id}
            data-testid='email-input'
            value={value}
            onChange={onChange}
            aria-describedby={errorId}
            aria-invalid={invalid}
          />
        )}
      </FormItem>
    );

    // Per-field mode 'onChange': the very first invalid keystroke through
    // the binding validates — no submit, no blur.
    await user.type(screen.getByTestId('email-input'), 'nope');
    expect(screen.getByRole('alert')).toHaveTextContent('must be an email');

    // …and typing the rest of a valid value clears it, same channel.
    await user.type(screen.getByTestId('email-input'), '@x.y');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders role=alert, aria-invalid and aria-describedby once the field errors', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          validate={(v: string) =>
            v.includes('@') ? undefined : 'must be an email'
          }
        >
          {({id, errorId, invalid, value, onChange}) => (
            <InputCore
              id={id}
              data-testid='email-input'
              value={value}
              onChange={onChange}
              aria-describedby={errorId}
              aria-invalid={invalid}
            />
          )}
        </FormItem>
        <button type='submit'>Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', {name: 'Submit'}));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('must be an email');
    expect(alert.getAttribute('id')).toBeTruthy();

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('blocks invalid submits and passes once fixed', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});
    const onSubmit = vi.fn();

    render(
      <Form form={form} onSubmit={onSubmit}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          validate={(v) => (v ? undefined : 'required')}
        >
          {({id, errorId, invalid, value, onChange}) => (
            <InputCore
              id={id}
              data-testid='email-input'
              value={value}
              onChange={onChange}
              aria-invalid={invalid}
              aria-describedby={errorId}
            />
          )}
        </FormItem>
        <button type='submit'>Submit</button>
      </Form>
    );

    // invalid: submit blocked, error surfaced
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('required');

    // fix the field and submit again
    await user.type(screen.getByTestId('email-input'), 'a@b.c');
    await user.click(screen.getByRole('button', {name: 'Submit'}));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      {name: '', email: 'a@b.c'},
      expect.anything()
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toHaveAttribute(
      'aria-invalid',
      'false'
    );
  });

  it('re-seeds bindings on reset(form, newValues)', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <FormItem form={form} name='name' label='Name'>
        {({id, value, onChange}) => (
          <>
            <InputCore
              id={id}
              data-testid='name'
              // render the value through a DOM-safe channel for the
              // reset()-to-undefined case: <input value={undefined}>
              // falls back to uncontrolled and keeps its old DOM text,
              // which would mask what the binding actually forwards.
              value={(value as string | undefined) ?? ''}
              onChange={onChange}
            />
            <output data-testid='probe'>{`${typeof value}:${value}`}</output>
          </>
        )}
      </FormItem>
    );
    const input = screen.getByTestId('name');
    const probe = screen.getByTestId('probe');

    await user.type(input, 'typed');
    expect(input).toHaveValue('typed');

    // reset() with new values clears the store and re-emits a global
    // change: the binding picks up the fresh seed without any remounting.
    act(() => reset(form, {name: 'seeded', email: ''}));
    expect(input).toHaveValue('seeded');
    expect(getValue(form, 'name')).toBe('seeded');

    // reset() without values is react-f0rm 1.3's "undo everything"
    // shape: the form keeps its current initialValues — the baseline the
    // previous reset(form, newValues) installed — so every field returns
    // to it. Typing over the seed then undoing proves the round-trip
    // without remounting.
    await user.type(input, 'more');
    expect(input).toHaveValue('seededmore');
    act(() => reset(form));
    expect(probe).toHaveTextContent('string:seeded');
    expect(getValue(form, 'name')).toBe('seeded');

    // reset(form, undefined) is the same undo against the current
    // baseline; a fresh baseline only comes from passing new values.
    act(() => reset(form, {name: '', email: ''}));
    expect(probe).toHaveTextContent('string:');
    expect(getValue(form, 'name')).toBe('');
  });

  it('mode="onBlur" validates on blur; without mode validation waits for submit', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='name'
          label='Name'
          validate={(v: string) => (v ? undefined : 'name required')}
        >
          {({id, invalid, value, onChange}) => (
            <InputCore
              id={id}
              data-testid='name-input'
              value={value}
              onChange={onChange}
              aria-invalid={invalid}
            />
          )}
        </FormItem>
        <FormItem
          form={form}
          name='email'
          label='Email'
          mode='onBlur'
          validate={(v: string) => (v ? undefined : 'email required')}
        >
          {({id, invalid, onBlur, value, onChange}) => (
            <InputCore
              id={id}
              data-testid='email-input'
              value={value}
              onChange={onChange}
              aria-invalid={invalid}
              onBlur={onBlur}
            />
          )}
        </FormItem>
        <button type='submit'>Submit</button>
      </Form>
    );

    // mode='onBlur': focus and leave the field empty → blur alone errors it
    await user.click(screen.getByTestId('email-input'));
    await user.tab();
    expect(await screen.findByText('email required')).toBeInTheDocument();
    expect(screen.queryByText('name required')).not.toBeInTheDocument();

    // no mode: blurring the field does NOT validate it…
    await user.click(screen.getByTestId('name-input'));
    await user.tab();
    expect(screen.queryByText('name required')).not.toBeInTheDocument();

    // …only submitting does
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    expect(screen.getByText('name required')).toBeInTheDocument();
  });

  it('rejects a misspelled mode at compile time', () => {
    const form = createForm({initialValues: {email: ''}});
    const element = (
      <FormItem
        form={form}
        name='email'
        // @ts-expect-error 'onFocuse' is not a ValidationMode literal
        mode='onFocuse'
      >
        {() => null}
      </FormItem>
    );
    expect(element).toBeTruthy();
  });

  it('validateDebounce: kicks inside the window collapse into one validator run', () => {
    vi.useFakeTimers();
    try {
      const form = createForm({initialValues: {name: '', email: ''}});
      const validate = vi.fn((v: string) =>
        v.includes('@') ? undefined : 'must be an email'
      );

      renderEmailItem(form, {validate, validateDebounce: 300});

      // three kicks inside the window — none may run the validator yet
      act(() => setValue(form, 'email', 'a', {shouldValidate: true}));
      act(() => setValue(form, 'email', 'ab', {shouldValidate: true}));
      act(() => setValue(form, 'email', 'abc@x.dev', {shouldValidate: true}));
      expect(validate).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(validate).toHaveBeenCalledTimes(1);
      // the surviving run sees the last value and gets react-f0rm's meta
      expect(validate).toHaveBeenLastCalledWith(
        'abc@x.dev',
        expect.objectContaining({
          form,
          signal: expect.any(AbortSignal) as AbortSignal
        })
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('delayError: a newly appearing error waits out the window before rendering', () => {
    vi.useFakeTimers();
    try {
      const form = createForm({initialValues: {name: '', email: ''}});

      renderEmailItem(form, {
        validate: (v: string) =>
          v.includes('@') ? undefined : 'must be an email',
        delayError: 500
      });

      // invalid value: the form's error store is immediate…
      act(() => setValue(form, 'email', 'nope', {shouldValidate: true}));
      expect(getError(form, 'email')!.message).toBe('must be an email');
      // …but the rendered error span waits out the delay window
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // once the window passes, the error span shows up
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'must be an email'
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('rules: declarative constraints validate and merge ahead of validate', () => {
    const form = createForm({initialValues: {name: '', email: ''}});
    const validate = vi.fn(() => 'also invalid');

    renderEmailItem(form, {
      validate,
      rules: {required: 'email is required', minLength: 4}
    });

    // empty value: required fails and lands first — and short-circuits
    // the rest of the kick, skipping the field validator entirely
    // (react-f0rm 1.3: a failing `required` reports only itself, the
    // async check never sees an empty value)
    act(() => setValue(form, 'email', '', {shouldValidate: true}));
    const first = getError(form, 'email')!;
    expect(first.type).toBe('required');
    expect(first.message).toBe('email is required');
    expect(screen.getByRole('alert')).toHaveTextContent('email is required');
    expect(validate).not.toHaveBeenCalled();

    // at 3 chars required passes but minLength fails — non-required
    // rules compose with the validator: both sources' errors merge,
    // rules ahead
    act(() => setValue(form, 'email', 'abc', {shouldValidate: true}));
    const errors = getFieldErrors(form, 'email');
    // 'custom' is react-f0rm's error kind for a plain string return from
    // the field validator (vs rule-typed errors like 'minLength')
    expect(errors.map((e) => e.type)).toEqual(['minLength', 'custom']);
    expect(validate).toHaveBeenCalledTimes(1);

    // at 4 chars the rules pass; only the validator's error remains
    act(() => setValue(form, 'email', 'abcd', {shouldValidate: true}));
    expect(getError(form, 'email')!.message).toBe('also invalid');
    expect(screen.getByRole('alert')).toHaveTextContent('also invalid');
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('as={InputCore}: declarative binding wires label, aria and two-way value', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          as={InputCore}
          asProps={{'data-testid': 'email-input'}}
          validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
        />
        <button type='submit'>Submit</button>
      </Form>
    );

    const input = screen.getByTestId('email-input');
    // the label points at the control `as` rendered
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id);
    expect(input).toHaveValue('');

    // failed submit errors the field: the as-mode aria wiring lights up
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('must be an email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);

    // typing through the as control writes back through the binding and
    // (default reValidateMode) clears the error as soon as the value is valid
    await user.type(input, 'a@b.c');
    expect(getValue(form, 'email')).toBe('a@b.c');
    expect(input).toHaveValue('a@b.c');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // invalid is false → the as-mode attributes are omitted (undefined),
    // not rendered as "false"
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('as + valueToProps/eventToValue adapt checkbox-style controls both ways', async () => {
    const user = userEvent.setup();
    const form = createForm({
      initialValues: {email: '', subscribed: false, newsletter: false}
    });

    // A DOM-element-shaped control: its onChange receives the raw event and
    // its value lives in `checked` — exactly the shape eventToValue and
    // valueToProps each adapt in one line.
    function NativeCheckbox(props: Record<string, any>) {
      return <input type='checkbox' data-testid='native-cb' {...props} />;
    }

    render(
      <>
        <FormItem
          form={form}
          name='subscribed'
          label='Subscribe'
          as={NativeCheckbox}
          valueToProps={(checked) => ({checked: !!checked})}
          eventToValue={(e: ChangeEvent<HTMLInputElement>) =>
            e.target.checked
          }
        />
        <FormItem
          form={form}
          name='newsletter'
          label='Newsletter'
          as={CheckboxCore}
          asProps={{'data-testid': 'core-cb'}}
          valueToProps={(checked) => ({checked: !!checked})}
        />
      </>
    );

    const native = screen.getByTestId('native-cb');
    const core = screen.getByTestId('core-cb');
    expect(screen.getByLabelText('Subscribe')).toBe(native);
    expect(native).not.toBeChecked();
    expect(core).not.toBeChecked();

    // DOM event → field value through eventToValue; field value → checked
    // prop through valueToProps
    await user.click(native);
    expect(getValue(form, 'subscribed')).toBe(true);
    expect(native).toBeChecked();

    // …and the other direction: a store write re-renders the adapted control
    act(() => setValue(form, 'subscribed', false));
    expect(native).not.toBeChecked();

    // CheckboxCore: same valueToProps, identity eventToValue (haze cores
    // emit the next plain value — no adapter needed)
    await user.click(core);
    expect(getValue(form, 'newsletter')).toBe(true);
    act(() => setValue(form, 'newsletter', false));
    expect(core).not.toBeChecked();
  });

  it('as: asProps land before the wiring — colliding props lose, the rest pass through', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {email: ''}});
    const asPropsOnChange = vi.fn();
    const asPropsOnBlur = vi.fn();

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          as={InputCore}
          asProps={{
            'data-testid': 'email-input',
            'aria-label': 'Contact address',
            id: 'asProps-id',
            'aria-invalid': 'false',
            'aria-describedby': 'asProps-desc',
            onChange: asPropsOnChange,
            onBlur: asPropsOnBlur
          }}
          validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
        />
        <button type='submit'>Submit</button>
      </Form>
    );

    const input = screen.getByTestId('email-input');

    // non-colliding asProps pass through untouched…
    expect(input).toHaveAttribute('aria-label', 'Contact address');
    // …while every colliding one loses to the bridge wiring, the same
    // precedence as the input channel: the generated id wins, and the
    // label still points at the control the wiring identified
    expect(input.id).toMatch(/^haze-field-/);
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id);

    // typing runs the wiring's onChange — the store gets the value, the
    // asProps copy never fires
    await user.type(input, 'no-at-sign');
    expect(asPropsOnChange).not.toHaveBeenCalled();
    expect(getValue(form, 'email')).toBe('no-at-sign');
    expect(input).toHaveValue('no-at-sign');

    // the submit click blurs the field — the wiring's onBlur runs, the
    // asProps copy doesn't — and the failed submit errors the field
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    expect(asPropsOnBlur).not.toHaveBeenCalled();
    expect(asPropsOnChange).not.toHaveBeenCalled();

    // the wiring's aria chain lights up over the asProps values:
    // aria-invalid/aria-describedby come from the bridge, not asProps
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('must be an email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('as: the store value wins over a colliding asProps.value', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {email: 'from-store'}});

    render(
      <FormItem
        form={form}
        name='email'
        as={InputCore}
        asProps={{
          'data-testid': 'email-input',
          value: 'from-asProps'
        }}
      />
    );

    // rendered value comes from the store, not asProps
    expect(screen.getByTestId('email-input')).toHaveValue('from-store');

    // and keeps tracking the store as the field changes
    await user.type(screen.getByTestId('email-input'), '-typed');
    expect(getValue(form, 'email')).toBe('from-store-typed');
    expect(screen.getByTestId('email-input')).toHaveValue('from-store-typed');
  });

  it('input: forwarded props pass through while the wiring onChange writes back to the store', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {email: ''}});

    render(
      <FormItem
        form={form}
        name='email'
        input={InputCore}
        placeholder='you@x.dev'
        data-testid='email-input'
      />
    );

    // forwarded rest props reach the control untouched, symmetric with
    // the as channel's asProps passthrough
    const input = screen.getByTestId('email-input');
    expect(input).toHaveAttribute('placeholder', 'you@x.dev');

    // user changes route through the bridge's onChange into the store —
    // the same wiring that wins collisions on the as channel
    await user.type(input, 'a@b');
    expect(getValue(form, 'email')).toBe('a@b');
    expect(input).toHaveValue('a@b');
  });

  it('renderError customizes the error span while keeping the alert wiring', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          as={InputCore}
          asProps={{'data-testid': 'email-input'}}
          validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
          renderError={(error, id) => (
            <em data-testid='custom-error' data-error-id={id}>
              {`custom: ${error}`}
            </em>
          )}
        />
        <button type='submit'>Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', {name: 'Submit'}));

    const alert = screen.getByRole('alert');
    const custom = screen.getByTestId('custom-error');
    // the custom renderer's content lives inside the same alert span…
    expect(alert).toContainElement(custom);
    expect(custom).toHaveTextContent('custom: must be an email');
    // …its second argument is that span's id…
    expect(custom).toHaveAttribute('data-error-id', alert.id);
    // …and the control still describes the span
    expect(screen.getByTestId('email-input')).toHaveAttribute(
      'aria-describedby',
      alert.id
    );
  });

  it('input={InputCore}: declarative bridge wires aria chain and forwards props', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          input={InputCore}
          placeholder='you@x.dev'
          type='email'
          data-testid='email-input'
          validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
        />
        <button type='submit'>Submit</button>
      </Form>
    );

    const input = screen.getByTestId('email-input');
    // forwarded rest props reach the control untouched
    expect(input).toHaveAttribute('placeholder', 'you@x.dev');
    expect(input).toHaveAttribute('type', 'email');
    // the label points at the control `input` rendered
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id);

    // failed submit lights the declarative aria chain: invalid control
    // pointing at the error span
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('must be an email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);

    // typing is two-way through the bridge and clears the error
    await user.type(input, 'a@b.c');
    expect(getValue(form, 'email')).toBe('a@b.c');
    expect(input).toHaveValue('a@b.c');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');

    // …and store writes flow back into the control
    act(() => setValue(form, 'email', 'back@flow.dev'));
    expect(input).toHaveValue('back@flow.dev');
  });

  it('input forwards JSX children to the control (SelectCore options)', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {role: 'viewer'}});

    render(
      <FormItem form={form} name='role' label='Role' input={SelectCore}>
        <option value='admin'>Admin</option>
        <option value='maintainer'>Maintainer</option>
        <option value='viewer'>Viewer</option>
      </FormItem>
    );

    const select = screen.getByLabelText('Role');
    // children forwarded: the options render and the seeded value holds
    expect(select).toHaveValue('viewer');
    expect(
      screen.getByRole('option', {name: 'Maintainer'})
    ).toBeInTheDocument();

    await user.selectOptions(select, 'admin');
    expect(getValue(form, 'role')).toBe('admin');
    act(() => setValue(form, 'role', 'maintainer'));
    expect(select).toHaveValue('maintainer');
  });

  it('input={TagInputCore}: string[] value channel needs no adapter, aria lands on the inner input', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {tagList: [] as string[]}});

    render(
      <FormItem
        form={form}
        name='tagList'
        label='Tags'
        input={TagInputCore}
        placeholder='Add tags'
        validate={(tags: string[]) =>
          tags.length > 0 ? undefined : 'at least one tag'
        }
      />
    );

    // the wired id lands on the focusable inner input, not the root div
    const inner = screen.getByPlaceholderText('Add tags');
    expect(screen.getByText('Tags')).toHaveAttribute('for', inner.id);

    // adding a tag writes the plain string[] — no event unwrapping
    await user.type(inner, 'react{Enter}');
    expect(getValue(form, 'tagList')).toEqual(['react']);
    expect(screen.getByText('react')).toBeInTheDocument();

    // the declarative aria chain reaches the inner input once errored
    act(() => setValue(form, 'tagList', [], {shouldValidate: true}));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('at least one tag');
    expect(inner).toHaveAttribute('aria-invalid', 'true');
    expect(inner).toHaveAttribute('aria-describedby', alert.id);
  });

  it('input={TransferCore}: string[] target keys two-way bound, aria chain on the root', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {members: [] as string[]}});

    render(
      <FormItem
        form={form}
        name='members'
        label='Members'
        input={TransferCore}
        dataSource={[
          {key: 'a', title: 'Alice'},
          {key: 'b', title: 'Bob'},
          {key: 'c', title: 'Carol'}
        ]}
        validate={(keys: string[]) =>
          keys.length > 0 ? undefined : 'pick at least one member'
        }
      />
    );

    // seeded empty value renders all items on the source side
    expect(screen.getByText('Source (3)')).toBeInTheDocument();
    expect(screen.getByText('Target (0)')).toBeInTheDocument();

    // moving a member writes the plain string[] — no event unwrapping
    await user.click(screen.getByRole('checkbox', {name: 'Alice'}));
    await user.click(screen.getByRole('button', {name: '>'}));
    expect(getValue(form, 'members')).toEqual(['a']);

    // external writes flow back into the panels
    act(() => setValue(form, 'members', ['a', 'b']));
    expect(screen.getByText('Source (1)')).toBeInTheDocument();
    expect(screen.getByText('Target (2)')).toBeInTheDocument();

    // the declarative aria chain reaches the control root once errored
    act(() => setValue(form, 'members', [], {shouldValidate: true}));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('pick at least one member');
    const control = document.querySelector(
      `[aria-describedby="${alert.id}"]`
    );
    expect(control).toHaveAttribute('aria-invalid', 'true');
  });

  it('input={UploadCore}: File[] value channel, label htmlFor reaches the dropzone', async () => {
    const form = createForm({initialValues: {attachments: [] as File[]}});

    render(
      <FormItem
        form={form}
        name='attachments'
        label='Attachments'
        input={UploadCore}
        multiple
        validate={(files: File[]) =>
          files.length > 0 ? undefined : 'at least one file'
        }
      />
    );

    // the dropzone is the focusable root, so the label chain lands on it
    const dropzone = screen.getByRole('button');
    expect(screen.getByText('Attachments')).toHaveAttribute(
      'for',
      dropzone.getAttribute('id')!
    );

    // picking files writes the plain File[] — no event unwrapping
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"]'
    )!;
    const file = new File(['hello'], 'hello.txt', {type: 'text/plain'});
    await userEvent.upload(input, file);
    expect(getValue(form, 'attachments')).toEqual([file]);

    // the declarative aria chain reaches the dropzone once errored
    act(() => setValue(form, 'attachments', [], {shouldValidate: true}));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('at least one file');
    expect(dropzone).toHaveAttribute('aria-invalid', 'true');
    expect(dropzone).toHaveAttribute('aria-describedby', alert.id);
  });

  it('input + valueToProps adapts checkbox-style controls', async () => {
    const user = userEvent.setup();
    const form = createForm({
      initialValues: {email: '', subscribed: false}
    });

    render(
      <FormItem
        form={form}
        name='subscribed'
        label='Subscribe'
        input={CheckboxCore}
        data-testid='subscribe'
        valueToProps={(checked) => ({checked: !!checked})}
      />
    );

    const checkbox = screen.getByTestId('subscribe');
    expect(screen.getByLabelText('Subscribe')).toBe(checkbox);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(getValue(form, 'subscribed')).toBe(true);
    act(() => setValue(form, 'subscribed', false));
    expect(checkbox).not.toBeChecked();
  });

  it("input={element: 'input'}: raw native input wires the same bridge two-way", async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          input={{element: 'input', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
          type='email'
          placeholder='you@x.dev'
          maxLength={16}
          validate={(v) => (v.includes('@') ? undefined : 'must be an email')}
        />
        <button type='submit'>Submit</button>
      </Form>
    );

    const input = screen.getByPlaceholderText('you@x.dev');
    // forwarded element attributes reach the native input untouched
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('maxlength', '16');
    // the label points at the native element the binding rendered
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id);

    // failed submit lights the same declarative aria chain as the cores
    await user.click(screen.getByRole('button', {name: 'Submit'}));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('must be an email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);

    // typing extracts the value through the binding's own adapter
    await user.type(input, 'a@b.c');
    expect(getValue(form, 'email')).toBe('a@b.c');
    expect(input).toHaveValue('a@b.c');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');

    // …and store writes flow back into the native element
    act(() => setValue(form, 'email', 'back@flow.dev'));
    expect(input).toHaveValue('back@flow.dev');
  });

  it("input={element: 'textarea' | 'select'}: element attrs forward, options render as children", async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {bio: '', role: 'viewer'}});

    render(
      <>
        <FormItem
          form={form}
          name='bio'
          label='Bio'
          input={{element: 'textarea', eventToValue: (e: ChangeEvent<HTMLTextAreaElement>) => e.target.value}}
          rows={4}
        />
        <FormItem
          form={form}
          name='role'
          label='Role'
          input={{element: 'select', eventToValue: (e: ChangeEvent<HTMLSelectElement>) => e.target.value}}
        >
          <option value='admin'>Admin</option>
          <option value='maintainer'>Maintainer</option>
          <option value='viewer'>Viewer</option>
        </FormItem>
      </>
    );

    const bio = screen.getByLabelText('Bio');
    expect(bio).toHaveAttribute('rows', '4');
    await user.type(bio, 'hello');
    expect(getValue(form, 'bio')).toBe('hello');
    act(() => setValue(form, 'bio', 'back'));
    expect(bio).toHaveValue('back');

    const select = screen.getByLabelText('Role');
    expect(select).toHaveValue('viewer');
    expect(screen.getByRole('option', {name: 'Maintainer'})).toBeInTheDocument();
    await user.selectOptions(select, 'admin');
    expect(getValue(form, 'role')).toBe('admin');
    act(() => setValue(form, 'role', 'maintainer'));
    expect(select).toHaveValue('maintainer');
  });

  it('input + eventToValue opts a DOM-element-shaped component into raw semantics', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {email: ''}});

    render(
      <FormItem
        form={form}
        name='email'
        label='Email'
        input={NativeInput}
        eventToValue={(e: ChangeEvent<HTMLInputElement>) => e.target.value}
        placeholder='native'
      />
    );

    const input = screen.getByTestId('native-input');
    expect(screen.getByText('Email')).toHaveAttribute('for', input.id);
    await user.type(input, 'x@y.z');
    expect(getValue(form, 'email')).toBe('x@y.z');
    act(() => setValue(form, 'email', 'back@flow.dev'));
    expect(input).toHaveValue('back@flow.dev');
  });

  it('a raw element binding without eventToValue still extracts target.value (untyped callers)', async () => {
    const user = userEvent.setup();
    const form = createForm({initialValues: {email: ''}});

    render(
      <FormItem
        form={form}
        name='email'
        label='Email'
        // typed callers cannot build this (the binding requires its
        // adapter) — reach it the way an untyped caller would
        input={{element: 'input'} as unknown as FormItemRawElementBinding}
      />
    );

    await user.type(screen.getByLabelText('Email'), 'a@b.c');
    expect(getValue(form, 'email')).toBe('a@b.c');
  });

  it('input rejects the render-prop children at runtime (mutually exclusive)', () => {
    const form = createForm({initialValues: {email: ''}});
    // a migration leftover: the render-prop kept next to `input` — typed
    // callers can't build this (the union excludes it), so reach it the
    // way an untyped caller would
    const legacyRenderProp = ({
      value,
      onChange
    }: FormItemBinding<{email: string}, 'email'>) => (
      <InputCore value={value} onChange={onChange} />
    );

    expect(() =>
      render(
        <FormItem form={form} name='email' input={InputCore}>
          {legacyRenderProp as unknown as ReactNode}
        </FormItem>
      )
    ).toThrow(/mutually exclusive/);

    // the raw element binding is a full `input` form — same exclusion
    expect(() =>
      render(
        <FormItem
          form={form}
          name='email'
          input={{element: 'input', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
        >
          {(() => null) as unknown as ReactNode}
        </FormItem>
      )
    ).toThrow(/mutually exclusive/);
  });

  it('input: forwarded props are type-checked, wired props are reserved', () => {
    const form = createForm({initialValues: {email: ''}});
    const element = (
      <>
        <FormItem form={form} name='email' input={InputCore} size='lg' />
        {/* forwarded props check against InputCoreProps: 'xl' is not a size */}
        <FormItem
          form={form}
          name='email'
          input={InputCore}
          // @ts-expect-error 'xl' is not 'sm' | 'md' | 'lg'
          size='xl'
        />
        {/* the wiring is FormItem's — onChange can't be forwarded through input */}
        <FormItem
          form={form}
          name='email'
          input={InputCore}
          // @ts-expect-error onChange is wired by the bridge, not forwarded
          onChange={(v: string) => v}
        />
        {/* without input the prop surface stays closed */}
        <FormItem
          form={form}
          name='email'
          // @ts-expect-error unknown prop on the render-prop form
          placeholder='nope'
        >
          {() => null}
        </FormItem>
      </>
    );
    expect(element).toBeTruthy();
  });

  it('input raw bindings: adapter required, element attrs checked, wired props reserved', () => {
    const form = createForm({initialValues: {bio: '', email: '', role: ''}});
    const element = (
      <>
        {/* raw element: forwarded props check against the element's own
            attributes, per element */}
        <FormItem
          form={form}
          name='email'
          input={{element: 'input', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
          type='email'
          placeholder='x'
        />
        <FormItem
          form={form}
          name='bio'
          input={{element: 'textarea', eventToValue: (e: ChangeEvent<HTMLTextAreaElement>) => e.target.value}}
          rows={4}
        />
        {/* raw component: the top-level eventToValue is the explicit
            opt-in from plain-value (core) to event-emitting (raw) */}
        <FormItem
          form={form}
          name='email'
          input={NativeInput}
          eventToValue={(e: ChangeEvent<HTMLInputElement>) => e.target.value}
          placeholder='x'
        />
        {/* the raw element binding requires its own adapter */}
        <FormItem
          form={form}
          name='email'
          // @ts-expect-error eventToValue is required in the binding object
          input={{element: 'input'}}
          placeholder='x'
        />
        {/* forwarded props check against the element's attributes */}
        <FormItem
          form={form}
          name='email'
          input={{element: 'input', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
          // @ts-expect-error not an <input> attribute
          badProp='x'
        />
        <FormItem
          form={form}
          name='bio'
          input={{element: 'textarea', eventToValue: (e: ChangeEvent<HTMLTextAreaElement>) => e.target.value}}
          // @ts-expect-error list is not a <textarea> attribute
          list='datalist-id'
        />
        {/* wired props stay reserved on the raw channel */}
        <FormItem
          form={form}
          name='email'
          input={{element: 'input', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
          // @ts-expect-error onChange is wired by the bridge, not forwarded
          onChange={() => 'x'}
        />
        {/* only the three form elements are raw-bindable */}
        <FormItem
          form={form}
          name='email'
          // @ts-expect-error 'text' is not a raw element name
          input={{element: 'text', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
        />
        {/* the adapter lives in the binding, not at the top level */}
        {/* @ts-expect-error pick one adapter slot, not both */}
        <FormItem
          form={form}
          name='email'
          input={{element: 'input', eventToValue: (e: ChangeEvent<HTMLInputElement>) => e.target.value}}
          eventToValue={(e: ChangeEvent<HTMLInputElement>) => e.target.value}
        />
        {/* per-element attrs: maxLength is not a <select> attribute */}
        <FormItem
          form={form}
          name='role'
          input={{element: 'select', eventToValue: (e: ChangeEvent<HTMLSelectElement>) => e.target.value}}
          // @ts-expect-error maxLength is not a <select> attribute
          maxLength={3}
        >
          <option value='admin'>Admin</option>
        </FormItem>
      </>
    );
    expect(element).toBeTruthy();
  });

  it('generic validate: a typed form flows PathValueOf<TValues, P> into the validator', () => {
    const form = createForm({initialValues: {name: '', email: ''}});
    const seen: string[] = [];

    // Compile-time contract: with a typed form, the value argument is the
    // field's actual type — Profile['email'] is string, so `v.includes`
    // typechecks — and a mismatched parameterization is rejected.
    const typed: FieldValidator<Profile, 'email'> = (v) => {
      seen.push(v);
      return v.includes('@') ? undefined : 'must be an email';
    };
    // @ts-expect-error Profile['name'] is string — number parameters don't fit
    const mismatch: FieldValidator<Profile, 'name'> = (v: number) => `${v}`;
    expect([typed, mismatch].every((fn) => typeof fn === 'function')).toBe(
      true
    );

    renderEmailItem(form, {validate: typed});

    act(() => setValue(form, 'email', 'nope', {shouldValidate: true}));
    expect(seen).toEqual(['nope']);
    expect(screen.getByRole('alert')).toHaveTextContent('must be an email');

    act(() => setValue(form, 'email', 'ok@x.dev', {shouldValidate: true}));
    expect(seen).toEqual(['nope', 'ok@x.dev']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    const user = userEvent.setup();
    const form = createForm({initialValues: {name: '', email: ''}});

    // Same fixture as the aria-chain case above: a failed submit leaves a
    // field with a visible validation error in the document.
    render(
      <Form form={form} onSubmit={() => undefined}>
        <FormItem
          form={form}
          name='email'
          label='Email'
          validate={(v: string) =>
            v.includes('@') ? undefined : 'must be an email'
          }
        >
          {({id, errorId, invalid, value, onChange}) => (
            <InputCore
              id={id}
              data-testid='email-input'
              value={value}
              onChange={onChange}
              aria-describedby={errorId}
              aria-invalid={invalid}
            />
          )}
        </FormItem>
        <button type='submit'>Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', {name: 'Submit'}));
    expect(screen.getByRole('alert')).toHaveTextContent('must be an email');

    // 'region' fires for any content outside a landmark — an artifact of
    // the bare test document, not the component.
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  describe('focus channel (react-f0rm focusRef)', () => {
    it('setFocus focuses the as-channel control', () => {
      const form = createForm({initialValues: {name: ''}});
      render(
        <FormItem form={form} name='name' label='Name' as={InputCore} />
      );

      act(() => setFocus(form, 'name'));
      expect(document.activeElement).toBe(screen.getByLabelText('Name'));
    });

    it('setFocus focuses the render-prop control wired through binding.focusRef', () => {
      const form = createForm({initialValues: {name: ''}});
      render(
        <FormItem form={form} name='name' label='Name'>
          {({id, value, onChange, focusRef}) => (
            <InputCore
              id={id}
              data-testid='name-input'
              value={value}
              onChange={onChange}
              ref={focusRef}
            />
          )}
        </FormItem>
      );

      act(() => setFocus(form, 'name'));
      expect(document.activeElement).toBe(screen.getByTestId('name-input'));
    });

    it('auto-focuses the first errored field on a failed submit', async () => {
      const user = userEvent.setup();
      const form = createForm({initialValues: {name: '', email: ''}});
      render(
        <Form form={form} onSubmit={() => undefined}>
          <FormItem
            form={form}
            name='name'
            label='Name'
            as={InputCore}
            validate={(v) => (v ? undefined : 'required')}
          />
          <FormItem
            form={form}
            name='email'
            label='Email'
            as={InputCore}
            validate={(v) => (v ? undefined : 'required')}
          />
          <button type='submit'>Submit</button>
        </Form>
      );

      await user.click(screen.getByRole('button', {name: 'Submit'}));
      expect(screen.getByLabelText('Name')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(document.activeElement).toBe(screen.getByLabelText('Name'));
    });
  });
});

