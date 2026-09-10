import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ControlOrValue } from 'react-use-control';

import type { MentionsOption } from './MentionsCore';

import { useControl } from 'react-use-control';

import MentionsCore from './MentionsCore';

type MentionsProps = {
  value?: ControlOrValue<string>;
  onChange?: (value: string) => void;
  options: MentionsOption[];
  /**
   * Single character that opens the suggestion panel while typing.
   * Defaults to '@'.
   */
  trigger?: string;
  placeholder?: string;
  className?: string;
  /** Forwarded to the underlying `<textarea>` — the element form bridges
   * and `ref.current.focus()` reach. */
  ref?: Ref<HTMLTextAreaElement>;
} & Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'onChange' | 'placeholder' | 'className' | 'style'
>;

export default function Mentions({
  value: valueControl,
  onChange,
  ref,
  ...rest
}: MentionsProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <MentionsCore
      ref={ref}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...rest}
    />
  );
}

export type { MentionsProps };
