import type { ComponentPropsWithoutRef } from 'react';

import { css } from '@linaria/core';
import { Children } from 'react';

import { useStrings } from '../LocaleProvider';
import { formatString } from '../LocaleProvider/locale';

type AvatarGroupProps = {
  /** Maximum number of avatars rendered before the "+N" overflow chip. */
  max?: number;
  /** Overflow count to display instead of children count - max when truncating. */
  total?: number;
} & ComponentPropsWithoutRef<'div'>;

const base = css`
  display: inline-flex;
  align-items: center;
`;

/* Each avatar sits in a circular frame whose bg-colored ring occludes the
   avatar underneath; DOM order paints later children above earlier ones. */
const item = css`
  display: inline-flex;
  border-radius: var(--haze-radius-full);
  border: 2px solid var(--haze-color-bg);
`;

const itemStacked = css`
  margin-inline-start: calc(-1 * var(--haze-space-3));
`;

const overflowChip = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  border-radius: var(--haze-radius-full);
  background: var(--haze-color-bg-muted);
  color: var(--haze-color-text-secondary);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  white-space: nowrap;
`;

export default function AvatarGroup({
  max,
  total,
  className,
  children,
  ...rest
}: AvatarGroupProps) {
  const strings = useStrings('avatarGroup');

  const items = Children.toArray(children);
  const limit = max === undefined ? items.length : Math.max(max, 0);
  const truncating = items.length > limit;
  const visible = truncating ? items.slice(0, limit) : items;
  const overflowCount = total ?? items.length - limit;

  return (
    <div x-class={[base, className]} {...rest}>
      {visible.map((child, index) => (
        <span key={index} x-class={[item, index > 0 && itemStacked]}>
          {child}
        </span>
      ))}
      {truncating && (
        <span
          x-class={[item, overflowChip, visible.length > 0 && itemStacked]}
        >
          {formatString(strings.more, { count: overflowCount })}
        </span>
      )}
    </div>
  );
}

export type { AvatarGroupProps };
