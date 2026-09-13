import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type EmptyProps = {
  description?: string;
  image?: ReactNode;
  className?: string;
  children?: ReactNode;
};

const base = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-8) var(--haze-space-4);
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-sans);
`;

const imageStyle = css`
  margin-bottom: var(--haze-space-4);
`;

const descStyle = css`
  font-size: var(--haze-text-sm);
`;

const actionStyle = css`
  margin-top: var(--haze-space-4);
`;

const defaultImage = (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="8" y="16" width="48" height="36" rx="4" stroke="var(--haze-color-border)" strokeWidth="2" />
    <path d="M8 28h48" stroke="var(--haze-color-border)" strokeWidth="2" />
    <circle cx="20" cy="22" r="2" fill="var(--haze-color-border)" />
    <circle cx="28" cy="22" r="2" fill="var(--haze-color-border)" />
    <path d="M24 38l6-6 4 4 8-8" stroke="var(--haze-color-border)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Empty({
  description,
  image,
  className,
  children,
}: EmptyProps) {
  const strings = useStrings('empty');
  const descriptionLabel = description ?? strings.description;
  return (
    <div data-slot="empty" x-class={[base, className]}>
      <div data-slot="illustration" x-class={[imageStyle]}>{image ?? defaultImage}</div>
      <div data-slot="description" x-class={[descStyle]}>{descriptionLabel}</div>
      {children && <div data-slot="actions" x-class={[actionStyle]}>{children}</div>}
    </div>
  );
}

export type { EmptyProps };
