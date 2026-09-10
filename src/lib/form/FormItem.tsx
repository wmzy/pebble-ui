import type {
  ComponentPropsWithoutRef,
  ComponentType,
  ReactNode
} from 'react';

import type {
  FieldError,
  FieldPath,
  FieldRules,
  Name,
  Path,
  PathSegments,
  ValidationMode,
  FormInstance,
  PathValueOf
} from 'react-f0rm';


import {useContext, useId} from 'react';
import {css} from '@linaria/core';
import {FormContext, useField} from 'react-f0rm';


/**
 * Field-level validator, structurally compatible with react-f0rm's
 * `Validator`: return an error (string, FieldError, or an array mixing
 * both) or `undefined` when valid; return a Promise for async validation.
 * `meta.signal` aborts as soon as the round is superseded.
 *
 * Generic like react-f0rm's own `useField` `validate`: with `form` (a
 * `FormInstance<TValues>`) and `name` (a `FieldPath<TValues>`) in scope,
 * the value argument is `PathValueOf<TValues, P>` — the field's actual
 * type — instead of `any`. The bare defaults keep untyped call sites
 * exactly as permissive as before.
 *
 * The `meta` shape mirrors react-f0rm's `Validator` (`form`/`path`/
 * `signal`) on purpose, so its resolver adapters — `zodResolver`,
 * `standardSchemaResolver` from `react-f0rm/resolvers/*` — slot straight
 * into `FormItem`'s `validate` prop without a wrapper.
 */
export type FieldValidator<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name
> = (
  value: PathValueOf<TValues, P>,
  meta: {form: FormInstance; path: Path; signal: AbortSignal}
) =>
  | string
  | FieldError
  | (string | FieldError)[]
  | undefined
  | Promise<string | FieldError | (string | FieldError)[] | undefined>;

/** Render binding handed to `FormItem`'s render-prop children. */
export type FormItemBinding<TValues, P extends FieldPath<TValues> | Name> = {
  /** id for the field control element (`<InputCore id={id}>`) */
  id: string;
  /** id of the error message element; pass as `aria-describedby` */
  errorId: string;
  /** true while the field has at least one error */
  invalid: boolean;
  /** every error registered for the field, in insertion order */
  errors: FieldError[];
  /** react-f0rm blur hook for this field — pass to the control's `onBlur`
   * (`<InputCore onBlur={onBlur}/>`) so blur-scheduled validation modes
   * (`mode='onBlur' | 'onTouched' | 'all'`) fire when the field loses focus. */
  onBlur: () => void;
  /** Field value subscribed per-field — pass to a controlled core
   * (`<InputCore value={value} onChange={onChange} />`). */
  value: PathValueOf<TValues, P>;
  /** react-f0rm's own field-change writer — pass to the core's `onChange`.
   * It routes through the same mode-gated, re-validating pipeline as
   * react-f0rm's built-in Field/Checkbox/Select. */
  onChange: (next: PathValueOf<TValues, P>) => void;
  /**
   * react-f0rm's focus channel (callback ref): attach it to the
   * control's `ref` (`<InputCore ref={focusRef} />`) so
   * `setFocus(form, name)` and a failed submit's first-error
   * auto-focus can reach this field's element. Without it, focus
   * requests aimed at this field are silent no-ops (react-f0rm's
   * `setFocus` contract).
   */
  focusRef: (el: any) => void;
};

/**
 * Declarative `as` binding for `FormItem` — the same props shape as
 * react-f0rm `Field`'s `as` (deliberately *not* Radix's `asChild`): pass
 * any component as the field control and `FormItem` wires the id, aria
 * attributes, `onBlur` and `onChange` itself.
 */
export type FormItemAsProps = {
  /** Component rendered as the field control. When provided it takes
   * precedence over the children render-prop. */
  as?: ComponentType<any>;
  /** Extra props spread onto the `as` component. They land before the
   * bridge wiring and the value props, so `id`, `aria-*`, `onBlur`,
   * `onChange` and `value`/`valueToProps` win conflicts — the same
   * precedence as the input channel and react-f0rm's `Field`. */
  asProps?: Record<string, any>;
  /** Converts what the control passes to its `onChange` into the field
   * value. Defaults to identity — haze cores' `onChange` emits the next
   * plain value; pass `(e) => e.target.value` when the control is
   * DOM-element-shaped (a raw `as` component, or a raw component on the
   * `input` channel, where passing the adapter is also the explicit
   * opt-in from core to raw semantics). */
  eventToValue?: (e: any) => any;
  /** Derives the value props for the `as` component from the field value —
   * e.g. `(checked) => ({checked})` for `CheckboxCore`. Defaults to
   * passing `{value}`. */
  valueToProps?: (value: any) => Record<string, any>;
};

/**
 * The raw DOM form elements `FormItem`'s `input` channel accepts by tag
 * name. Their `onChange` emits a DOM event, not a plain value, so the
 * binding always carries its own `eventToValue` adapter — see
 * `FormItemRawElementBinding`.
 */
export type FormItemRawElement = 'input' | 'textarea' | 'select';

/**
 * Raw-DOM binding for `FormItem`'s `input` channel — the explicit raw
 * counterpart of passing a core component: a native form element by tag
 * name, paired with the `eventToValue` adapter that extracts the next
 * value from the DOM event. Every other JSX prop forwards to the
 * element, type-checked against that element's own HTML attributes.
 */
export type FormItemRawElementBinding<
  TRawElement extends FormItemRawElement = FormItemRawElement
> = {
  element: TRawElement;
  eventToValue: (e: any) => any;
};

/** FormItem's own, non-polymorphic props — everything the item itself
 * consumes regardless of how the control is bound (render-prop, `as`
 * or `input`). */
export type FormItemOwnProps<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name
> = {
  /**
   * 表单实例（`useForm()`/`createForm()` 的返回值）。可省略：省略时从
   * 最近的 `<FormProvider value={form}>` 读取（react-f0rm 的 form
   * context），显式传入的 `form` 总是优先。两者都没有时 throw。
   */
  form?: FormInstance<TValues>;
  name: P;
  label?: ReactNode;
  /** Field-level validator, registered through react-f0rm's own
   * `useField` channel — validated per the form's `mode` and on submit.
   * With a typed form the value argument is `PathValueOf<TValues, P>`. */
  validate?: FieldValidator<TValues, P>;
  /** Per-field validation mode override (react-f0rm ≥0.6): when given,
   * this field validates on its own schedule — e.g. `'onBlur'` — instead
   * of the form's `mode`; other fields are unaffected. Omit to keep the
   * form-wide behavior. */
  mode?: ValidationMode;
  /** Milliseconds to debounce this field's validation kicks (react-f0rm
   * ≥0.6): only the last kick inside the window runs the validator — e.g.
   * `300` keeps a fast typist from firing a per-keystroke async validator.
   * While the timer is pending the field counts as validating. Omit for
   * immediate validation (react-f0rm's default). */
  validateDebounce?: number;
  /** Milliseconds to delay *showing* a newly appearing error in the render
   * layer (react-f0rm ≥0.6): the form's error state stays immediate —
   * submit/trigger still gate on it — only the rendered error span and
   * `invalid` wait out the window. An error that clears inside the window
   * never shows. Omit for immediate display. */
  delayError?: number;
  /** Declarative rules (required/min/max/minLength/maxLength/pattern;
   * react-f0rm ≥0.6), compiled into a validator that runs *before*
   * `validate` — both sources' errors merge, rules errors ahead. Omit for
   * `validate`-only validation. */
  rules?: FieldRules;
  /** Custom error renderer: when provided and the field has errors, the
   * built-in error span renders `renderError(errors[0].message, errorId)`
   * instead of the bare message. The span itself — id, `role='alert'`,
   * styling — stays FormItem's, in every control-binding mode. */
  renderError?: (error: string, id: string) => ReactNode;
  className?: string;
};

/**
 * Props FormItem wires itself onto an `input`/`as` control — the bridge's
 * own contract. Used to keep them out of the forwarded rest props
 * (type level) and to document that they always win (runtime level):
 * passing one anyway is a compile error, never a silent override.
 */
type FormItemWiredProps = {
  id?: unknown;
  /** the focus channel: react-f0rm's `focusRef` rides the control's
   * `ref` — `setFocus` and failed-submit auto-focus depend on it */
  ref?: unknown;
  onBlur?: unknown;
  onChange?: unknown;
  /** the value channel: `value` directly, or the prop `valueToProps`
   * derives (e.g. `checked` for CheckboxCore) — either way FormItem's */
  value?: unknown;
  checked?: unknown;
  'aria-invalid'?: unknown;
  'aria-describedby'?: unknown;
};

/**
 * Prop names the bridge owns or wires — excluded from the forwarded rest
 * props on every channel (core component, raw element, `as`).
 */
type FormItemReservedProps<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name
> =
  | keyof FormItemOwnProps<TValues, P>
  | keyof FormItemAsProps
  | keyof FormItemWiredProps
  | 'input';

export type FormItemProps<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name,
  // `Record<never, never>` (≡ {}) is intentional: the default input-props
  // surface must Omit to a bare object so the render-prop/as arms stay a
  // closed surface — `Record<string, unknown | never>` carries an index
  // signature that absorbs or rejects forwarded props. no-generated-empty-
  // object-type's replacements don't preserve `Omit<{}, K> = {}`.
  // eslint-disable-next-line @typescript-eslint/no-generated-empty-object-type
  TInputProps extends Record<string, any> = Record<never, never>,
  TRawElement extends FormItemRawElement = never
> = FormItemOwnProps<TValues, P> &
  Omit<FormItemAsProps, 'eventToValue'> & {
    /**
     * Declarative binding for the field control, in two forms:
     *
     * - a component (`InputCore`, `TextareaCore`, `TagInputCore`,
     *   `SelectCore`, `TransferCore`, `UploadCore`, `CheckboxCore`, …,
     *   or any DOM-element-shaped
     *   component): FormItem wires `id`, `aria-invalid`,
     *   `aria-describedby`, `onBlur`, `onChange` and the value channel
     *   itself. Haze cores' `onChange` emits the next plain value
     *   (identity `eventToValue`); checkbox-style controls pair with
     *   `valueToProps={(checked) => ({checked})}`. A DOM-element-shaped
     *   component opts into raw semantics by passing `eventToValue`
     *   (e.g. `(e) => e.target.value`) — the adapter's presence is the
     *   explicit switch from value-direct to event-emitting.
     * - a `FormItemRawElementBinding` — `{element: 'input' |
     *   'textarea' | 'select', eventToValue}` — for a native DOM
     *   element: same wiring, value extracted from the DOM event by the
     *   required adapter (the top-level `eventToValue` is not this
     *   form's slot).
     *
     * Every other prop — and JSX children (a `SelectCore`'s
     * `<option>`s) — is forwarded to the control, fully type-checked
     * against its own props (the component's, or the raw element's HTML
     * attributes). Props FormItem owns or wires (label, className, id,
     * aria-*, onBlur, onChange, value, checked, …) are reserved and
     * cannot be forwarded — use the render-prop or `as`/`asProps` for a
     * colliding control prop.
     */
    input?: ComponentType<TInputProps> | FormItemRawElementBinding<TRawElement>;
  } &
  ([TRawElement] extends [never]
    ? Omit<TInputProps, FormItemReservedProps<TValues, P>>
    : Omit<ComponentPropsWithoutRef<TRawElement>, FormItemReservedProps<TValues, P>>) &
  (
    | {
        as: ComponentType<any>;
        input?: never;
        children?: never;
        eventToValue?: FormItemAsProps['eventToValue'];
      }
    | {
        as?: undefined;
        input: ComponentType<TInputProps>;
        eventToValue?: FormItemAsProps['eventToValue'];
        /** JSX children forward to the control (SelectCore's options);
         * the render-prop form is mutually exclusive with `input`. */
        children?: 'children' extends keyof TInputProps
          ? TInputProps['children']
          : undefined;
      }
    | {
        as?: undefined;
        input: FormItemRawElementBinding<TRawElement>;
        /** the raw element binding carries its own `eventToValue` — the
         * top-level prop is not accepted next to it */
        eventToValue?: never;
        /** JSX children forward to the element (a select's options). */
        children?: ReactNode;
      }
    | {
        as?: undefined;
        input?: undefined;
        eventToValue?: never;
        children: (binding: FormItemBinding<TValues, P>) => ReactNode;
      }
  );

const item = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--haze-space-1);
`;

const labelText = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const errorText = css`
  font-size: var(--haze-text-sm);
  color: var(--haze-color-danger);
`;

/**
 * Glue a single field of a react-f0rm form to a haze-ui controlled core.
 * The binding layer is react-f0rm's own headless `useField` hook — the
 * same channel its built-in Field/Checkbox/Select use — so no adapter or
 * state-bridge lives here. FormItem contributes only the view: label,
 * error span and the id/aria convention.
 *
 * ```tsx
 * <FormItem form={form} name='email' label='Email'>
 *   {({id, errorId, invalid, value, onChange}) => (
 *     <InputCore
 *       id={id}
 *       value={value}
 *       onChange={onChange}
 *       aria-describedby={errorId}
 *       aria-invalid={invalid}
 *     />
 *   )}
 * </FormItem>
 * ```
 *
 * Or declaratively, react-f0rm `Field`-style (`as` and children are
 * mutually exclusive — pick one):
 *
 * ```tsx
 * <FormItem form={form} name='email' label='Email' as={InputCore} />
 * ```
 *
 * With `as`, the id/aria/onBlur/onChange wiring happens here: the control
 * gets `id`, `aria-invalid`/`aria-describedby` while the field errors,
 * `onChange={(v) => onChange(toValue(v))}` where `toValue` defaults
 * to identity (haze cores emit plain values — pass
 * `eventToValue={(e) => e.target.value}` for a raw DOM element) and the
 * value lands as `{value}` or, with `valueToProps`, whatever props the
 * control wants (e.g. `{checked}` for CheckboxCore). react-f0rm's focus
 * channel rides the control's `ref`, so `setFocus(form, name)` and a
 * failed submit's first-error auto-focus reach the field's element.
 *
 * The ergonomic form for haze-ui cores is `input`: the rest of the JSX
 * props — and JSX children, e.g. a `SelectCore`'s `<option>`s — are
 * forwarded to the component, type-checked against its own props
 * (`input` and the render-prop children are mutually exclusive):
 *
 * ```tsx
 * <FormItem
 *   form={form}
 *   name='email'
 *   input={InputCore}
 *   placeholder='Email'
 *   mode='onBlur'
 * />
 * ```
 *
 * The same wiring as `as` applies (id, aria, onBlur, onChange, value,
 * and the `ref`-riding focus channel); wired and FormItem-owned prop
 * names are reserved — a control prop that collides (CheckboxCore's
 * `label`) needs the render-prop or `as`/`asProps` channel.
 *
 * `input` also accepts raw DOM bindings — no core required:
 *
 * ```tsx
 * // a native element: the binding carries its own eventToValue, and the
 * // rest of the JSX is type-checked against that element's attributes
 * <FormItem
 *   form={form}
 *   name='email'
 *   input={{element: 'input', eventToValue: (e) => e.target.value}}
 *   type='email'
 *   placeholder='Email'
 * />
 *
 * // a DOM-element-shaped component: the top-level eventToValue is the
 * // explicit opt-in from plain-value (core) to event-emitting (raw)
 * <FormItem
 *   form={form}
 *   name='email'
 *   input={NativeInput}
 *   eventToValue={(e) => e.target.value}
 * />
 * ```
 *
 * When the field has errors, the first error's message is rendered into a
 * `<span id={errorId} role='alert'>` next to the control; with no errors
 * no extra element is rendered.
 */
export default function FormItem<
  TValues extends Record<string, any> = any,
  P extends FieldPath<TValues> | Name = Name,
  // See the identical note on FormItemProps above.
  // eslint-disable-next-line @typescript-eslint/no-generated-empty-object-type
  TInputProps extends Record<string, any> = Record<never, never>,
  TRawElement extends FormItemRawElement = never
>({
  form,
  name,
  label,
  validate,
  mode,
  validateDebounce,
  delayError,
  rules,
  className,
  renderError,
  as: As,
  asProps,
  input: Input,
  eventToValue,
  valueToProps,
  children,
  ...inputProps
}: FormItemProps<TValues, P, TInputProps, TRawElement>) {
  const generatedId = useId();
  const id = `haze-field-${generatedId}`;
  const errorId = `${id}-error`;

  // `form` prop first, then react-f0rm's form context (a mounted
  // <FormProvider value={form}>); neither — a descriptive error naming
  // both exits, instead of f0rm's bare internal "no form provided".
  const formFromContext = useContext(FormContext);
  const resolvedForm = form ?? formFromContext;
  if (!resolvedForm) {
    throw new Error(
      'FormItem: no form provided — pass `form={form}` or render inside a <FormProvider value={form}>.'
    );
  }

  // react-f0rm's useField is the single binding layer: per-field value
  // subscription, user-change writes with mode gating, blur-scheduled
  // validation, delayError-gated display errors. `focusRef` carries the
  // focus channel — wired onto the control's ref below so `setFocus`
  // and a failed submit's first-error auto-focus reach the field.
  //
  // f0rm 1.3 narrows useField's path generic to
  // `FieldPath<TValues> | PathSegments`, while FormItem deliberately
  // keeps the permissive public `P extends FieldPath<TValues> | Name`
  // (a plain string at untyped call sites). Explicit type arguments keep
  // the inferred result narrow (value is `PathValueOf<TValues, …>`, not
  // `any`); the value flows back out P-typed at the binding.
  const {value, onChange, onBlur, errors, focusRef} = useField<
    TValues,
    FieldPath<TValues> | PathSegments
  >({
    form: resolvedForm,
    name: name as FieldPath<TValues> | PathSegments,
    validate: validate as FieldValidator<TValues, FieldPath<TValues> | PathSegments>,
    mode,
    validateDebounce,
    delayError,
    rules
  });
  const invalid = errors.length > 0;

  // The raw element binding carries its own adapter; a bare component
  // falls back to the top-level `eventToValue` (the explicit raw opt-in
  // for a DOM-element-shaped component). Identity otherwise: haze cores'
  // onChange emits the next plain value. The `element` key discriminates
  // the binding from object-shaped components (memo/forwardRef).
  const rawBinding =
    Input && typeof Input === 'object' && 'element' in Input
      ? (Input as FormItemRawElementBinding)
      : undefined;

  // A raw element binding without its adapter is a type error; an
  // untyped caller that skips it anyway still gets the DOM contract —
  // all three supported elements carry the next value on
  // `event.target.value` (typed structurally) — instead of an Event
  // object in the store.
  const targetValue = (e: {target?: {value?: unknown}}) => e.target?.value;
  const toValue: (e: any) => any =
    rawBinding?.eventToValue ??
    eventToValue ??
    (rawBinding ? targetValue : (e: unknown) => e);

  // `input` and the render-prop children are mutually exclusive (types
  // enforce it; this guards untyped callers). A render-prop next to an
  // `input` is a migration leftover — fail loudly instead of silently
  // dropping one of the two bindings.
  if (Input && typeof children === 'function') {
    throw new Error(
      'FormItem: `input` and the render-prop `children` are mutually exclusive — the input component is wired declaratively; remove the render-prop.'
    );
  }

  // JSX on a bare type parameter trips overload resolution (children of
  // `(IntrinsicAttributes & TInputProps)["children"]`); render through a
  // permissive view of the component — the call-site types live on
  // FormItemProps, not here. The `ref` key in the permissive props keeps
  // the focus-channel wiring below type-checkable. A raw binding's
  // `element` is a tag name, which JSX accepts as the element type
  // directly.
  const InputComponent = (
    rawBinding ? rawBinding.element : Input
  ) as
    | ComponentType<Record<string, any> & {ref?: unknown}>
    | FormItemRawElement
    | undefined;

  return (
    <div x-class={[item, className]}>
      {label !== undefined && (
        <label x-class={labelText} htmlFor={id}>
          {label}
        </label>
      )}
      {InputComponent ? (
        <InputComponent
          // forwarded props first — the wiring below is the bridge's
          // contract and always wins (they're excluded from the
          // forwarded type, so a typed caller can never hit the clash)
          {...(inputProps as Record<string, any>)}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          // the focus channel rides the control's ref (raw DOM elements
          // and haze cores both accept a callback ref there)
          ref={focusRef}
          onBlur={onBlur}
          onChange={(e: any) => onChange(toValue(e) as PathValueOf<TValues, P>)}
          {...(valueToProps ? valueToProps(value) : {value})}>
          {children as ReactNode}
        </InputComponent>
      ) : As ? (
        <As
          // asProps first — the wiring below is the bridge's contract
          // and always wins, the same precedence as the input channel
          // (asProps is untyped, so a collision is a silent runtime
          // override by the wiring, never a compile error); the value
          // props still land last
          {...asProps}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          // the focus channel rides the control's ref (raw DOM elements
          // and haze cores both accept a callback ref there)
          ref={focusRef}
          onBlur={onBlur}
          onChange={(e: any) => onChange(toValue(e) as PathValueOf<TValues, P>)}
          {...(valueToProps ? valueToProps(value) : {value})}
        />
      ) : (
        (children as (binding: FormItemBinding<TValues, P>) => ReactNode)({
          id,
          errorId,
          invalid,
          errors,
          onBlur,
          value: value as PathValueOf<TValues, P>,
          onChange,
          focusRef
        })
      )}
      {invalid && (
        <span id={errorId} role='alert' x-class={errorText}>
          {renderError
            ? renderError(errors[0]!.message, errorId)
            : errors[0]!.message}
        </span>
      )}
    </div>
  );
}
