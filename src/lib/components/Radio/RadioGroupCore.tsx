import type { ReactNode, Ref } from 'react';

import { css } from '@linaria/core';
import { useCallback, useEffect, useId, useRef } from 'react';

import { mergeRefs } from '../../utils/refs';

import { RadioProvider } from './RadioContext';

type RadioGroupCoreProps = {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
  children: ReactNode;
  /**
   * Forwarded to the group's focus target — the checked radio `<input>`
   * (falling back to the first), matching where a browser Tab lands.
   */
  ref?: Ref<HTMLInputElement>;
};

const base = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  border: none;
  padding: 0;
  margin: 0;
`;

/** The group's focus target: the checked radio (the tab stop a browser
 * lands on), falling back to the first radio. */
function radioFocusTarget(
  node: HTMLFieldSetElement | null
): HTMLInputElement | null {
  return (
    node?.querySelector<HTMLInputElement>('input:checked') ??
    node?.querySelector<HTMLInputElement>('input') ??
    null
  );
}

export default function RadioGroupCore({
  value,
  onChange,
  name,
  className,
  children,
  ref,
}: RadioGroupCoreProps) {
  const autoName = useId();
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  // The consumer's ref resolves to the checked radio (the group's tab
  // stop), falling back to the first — focus() lands where a browser
  // Tab would.
  const attachRadio = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(ref)(node),
    [ref]
  );
  const setFieldsetRef = useCallback(
    (node: HTMLFieldSetElement | null) => {
      fieldsetRef.current = node;
      attachRadio(radioFocusTarget(node));
    },
    [attachRadio]
  );

  // Re-resolve as the selection moves so the ref always points at the
  // current tab stop, not the radio that happened to be checked at
  // mount.
  useEffect(() => {
    attachRadio(radioFocusTarget(fieldsetRef.current));
  }, [value, attachRadio]);

  return (
    <fieldset data-slot='radio-group' ref={setFieldsetRef} x-class={[base, className]}>
      <RadioProvider value={{ name: name ?? autoName, value, setValue: onChange }}>
        {children}
      </RadioProvider>
    </fieldset>
  );
}

export type { RadioGroupCoreProps };
