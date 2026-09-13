import type { ComponentPropsWithoutRef, Ref } from 'react';

import { css } from '@linaria/core';

type SwitchCoreProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Native click event passthrough — invoked with the DOM event after
   * `onChange`, so a spread can never override the controlled callback. */
  onNativeClick?: ComponentPropsWithoutRef<'button'>['onClick'];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Forwarded to the switch `<button>` element. */
  ref?: Ref<HTMLButtonElement>;
} & Omit<ComponentPropsWithoutRef<'button'>, 'type' | 'checked' | 'onChange'>;

const track = css`
  position: relative;
  display: inline-flex;
  align-items: center;
  border: none;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  cursor: pointer;
  padding: 2px;
  transition: background var(--haze-duration-normal);

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Forced-colors: the UA flattens both the muted and the primary
     track onto Canvas and the white thumb onto Canvas — the switch
     would disappear. The track keeps a CanvasText boundary with a
     CanvasText thumb; when on, the Windows-native rendering takes
     over (Highlight track, HighlightText thumb). Disabled tracks drop
     the dim and render GrayText. */
  @media (forced-colors: active) {
    border: 1px solid CanvasText;

    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 1;
      border-color: GrayText;

      & [data-slot='thumb'] {
        background: GrayText;
      }
    }
  }
`;

const trackChecked = css`
  background: var(--haze-color-primary);

  @media (forced-colors: active) {
    background: Highlight;
    border-color: Highlight;

    & [data-slot='thumb'] {
      background: HighlightText;
    }

    &:disabled {
      background: GrayText;
      border-color: GrayText;

      & [data-slot='thumb'] {
        background: Canvas;
      }
    }
  }
`;

const thumb = css`
  display: block;
  border-radius: var(--haze-radius-full);
  background: white;
  transition: transform var(--haze-duration-normal);
  box-shadow: var(--haze-shadow-sm);
`;

const trackSm = css`
  width: 2.25rem;
  height: 1.25rem;
`;

const trackMd = css`
  width: 40px;
  height: 22px;
`;

const trackLg = css`
  width: 48px;
  height: 26px;
`;

const thumbSm = css`
  width: 1rem;
  height: 1rem;
`;

const thumbMd = css`
  width: 18px;
  height: 18px;
`;

const thumbLg = css`
  width: 22px;
  height: 22px;
`;

const thumbCheckedSm = css`
  transform: translateX(1rem);
`;

const thumbCheckedMd = css`
  transform: translateX(18px);
`;

const thumbCheckedLg = css`
  transform: translateX(22px);
`;

const trackSizes = {
  sm: trackSm,
  md: trackMd,
  lg: trackLg,
} as const;

const thumbSizes = {
  sm: thumbSm,
  md: thumbMd,
  lg: thumbLg,
} as const;

const thumbCheckedSizes = {
  sm: thumbCheckedSm,
  md: thumbCheckedMd,
  lg: thumbCheckedLg,
} as const;

export default function SwitchCore({
  checked,
  onChange,
  onNativeClick,
  size = 'md',
  className,
  ref,
  ...rest
}: SwitchCoreProps) {
  return (
    <button
      ref={ref}
      type='button'
      role='switch'
      data-slot='switch'
      aria-checked={checked}
      x-class={[track, trackSizes[size], checked && trackChecked, className]}
      onClick={(e) => {
        onChange(!checked);
        onNativeClick?.(e);
      }}
      {...rest}
    >
      <span
        data-slot='thumb'
        x-class={[thumb, thumbSizes[size], checked && thumbCheckedSizes[size]]}
      />
    </button>
  );
}

export type { SwitchCoreProps };
