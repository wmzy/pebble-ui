# Haze UI Component Conventions

## File Structure

Each component lives in its own directory under `src/lib/components/`:

```
src/lib/components/
  Button/
    index.ts          # barrel export
    Button.tsx         # main component
    Button.test.tsx    # tests (optional at early stage)
  Select/
    index.ts
    Select.tsx
    Option.tsx         # sub-component
    Select.test.tsx
```

Rules:

- Directory name = PascalCase component name
- `index.ts` only re-exports, no logic
- One primary component per directory; sub-components (e.g. `Option` for `Select`) live alongside
- Compound components export from the same `index.ts`

## Naming

| Item               | Convention                        | Example                        |
| ------------------ | --------------------------------- | ------------------------------ |
| Component file     | `PascalCase.tsx`                  | `Button.tsx`                   |
| Type alias         | `PascalCase` + descriptive suffix | `ButtonProps`, `SelectControl` |
| CSS class variable | `camelCase`                       | `const wrapper = css\`...\``   |
| Token CSS variable | `--haze-{category}-{name}`        | `--haze-color-primary`         |
| Exported constant  | `camelCase`                       | `export const buttonVariants`  |

## Props Design

### Basic pattern

Use `type` (not `interface`). Inline props for simple components; extract a named type when props are complex or reused:

```tsx
// simple — inline
export default function Badge({children, className}: {
  children: ReactNode;
  className?: string;
}) { ... }

// complex — named type
type ButtonProps = {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};
```

### HTML attribute passthrough

For components wrapping a single HTML element, extend the native attributes and spread the rest:

```tsx
type ButtonProps = {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>;

export default function Button({
  variant = 'solid',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type='button'
      x-class={[baseStyle, variants[variant], sizes[size], className]}
      {...rest}
    />
  );
}
```

### `className` passthrough

Every component MUST accept an optional `className` prop and merge it into the root element via `x-class={[..., className]}`. This allows consumers to add custom styles.

### control prop

Stateful components MUST support the control pattern from `react-use-control`:

```tsx
import { useControl, type ControlOrValue } from 'react-use-control';

type SelectProps = {
  value?: ControlOrValue<string>;
  className?: string;
  children: ReactNode;
};

export default function Select({
  value: valueControl,
  className,
  children,
}: SelectProps) {
  const [value, setValue, valueCtrl] = useControl(valueControl);
  // ...
}
```

Rules:

- Prop name should match the semantic state it represents (e.g. `value`, `open`, `checked`), not a generic `control`
- Prop type is `ControlOrValue<T>` (an alias for `Control<T> | T`) — accepts either a control object (controlled) or a plain value (uncontrolled default)
- Pass the prop directly to `useControl()` as the single argument: `useControl(valueControl)`
- Destructure the prop with an alias to avoid shadowing: `value: valueControl`
- The third return value (`valueCtrl`) can be passed to sub-components for state sharing
- Use `controlEqual` with `memo` when the component is expensive to render

### `ref` forwarding to the focusable element

Field controls MUST forward their `ref` prop (React 19 ref-as-prop — no
`forwardRef` wrapper) to the actual focusable element: the input the user
types into, the trigger button, or the current tab-stop item in a roving
group (Rating's selected star, Segmented's selected button, RadioGroup's
checked radio). This is the channel form integration (react-f0rm's
`focusRef` via FormItem), tests and assistive tooling grab onto — a ref
aimed at a wrapper `<div>` is a dead channel. When the component keeps
its own element handle on the same node (floating triggers, inner
inputs), merge both refs (`mergeRefs` from `src/lib/utils/refs.ts`).

Components exposing a richer imperative surface than focus (open/close,
scroll-to-index, …) expose an `XxxHandle` ref instead:
`ref?: Ref<XxxHandle>`. Don't add one preemptively — the plain element
ref covers the field-control contract.

## Styling

### Use design tokens

Always reference CSS variables from the token system. Never hardcode colors, spacing, or typography values:

```tsx
// good
const base = css`
  color: var(--haze-color-text);
  padding: var(--haze-space-2) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  font-size: var(--haze-text-sm);
`;

// bad
const base = css`
  color: #1a1a1a;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
`;
```

### Linaria usage

- Use `css` tagged template from `@linaria/core` for class names
- Use `x-class` (from `babel-plugin-transform-jsx-class`) to apply classes, which supports arrays and falsy values for conditional application
- Extract reusable style fragments as `css` constants in the same file or in `src/lib/utils/`

```tsx
import { css } from '@linaria/core';

const base = css`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
`;

const disabled = css`
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
`;

export default function Button({
  disabled: isDisabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button x-class={[base, isDisabled && disabled, className]} {...rest} />
  );
}
```

### Variant styles

Use a plain object to map variant names to Linaria classes. Avoid conditional branches:

```tsx
const variants = {
  solid: css`
    background: var(--haze-color-primary);
    color: var(--haze-color-text-inverse);
  `,
  outline: css`
    background: transparent;
    border: 1px solid var(--haze-color-border);
    color: var(--haze-color-text);
  `,
  ghost: css`
    background: transparent;
    color: var(--haze-color-text);
  `,
} as const;
```

## Exports

### Component barrel export

Each component's `index.ts`:

```ts
export { default as Button } from './Button';
export type { ButtonProps } from './Button';
```

### Library entry

Register every public component in `src/lib/index.ts`:

```ts
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';
```

Only export what consumers need. Internal helpers, sub-components used only within a compound component, and style constants stay unexported.

## Code Style

- Use `type` over `interface` and `enum`
- Prefer `const` over `let`; use IIFE when a computed `const` is needed
- Prefer function declarations for components (`export default function Button`)
- Minimize conditional branches; use lookup objects (variant maps) or helper functions
- No classes or OOP patterns
- Import types with `import type` when possible

## Testing

- Test file: `ComponentName.test.tsx` alongside the component
- Use `@testing-library/react` for rendering and interaction
- Test both controlled and uncontrolled modes for stateful components
- Test `className` passthrough
- Test keyboard accessibility where applicable
