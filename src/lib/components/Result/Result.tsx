import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { css } from '@linaria/core';

type ResultStatus =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | '403'
  | '404'
  | '500';

type ResultProps = {
  /** Determines the default illustration. Default 'info'. */
  status?: ResultStatus;
  /** Custom illustration replacing the status default. */
  icon?: ReactNode;
  /** Primary statement, rendered semibold at `--haze-text-xl`. */
  title?: ReactNode;
  /** Secondary explanation below the title. */
  subTitle?: ReactNode;
  /** Action area (buttons, links) below the content. */
  extra?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'title'>;

const base = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--haze-space-8) var(--haze-space-4);
  text-align: center;
  font-family: var(--haze-font-sans);
`;

const iconStyle = css`
  margin-bottom: var(--haze-space-4);
`;

const titleStyle = css`
  font-size: var(--haze-text-xl);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
`;

const subTitleStyle = css`
  margin-top: var(--haze-space-2);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
`;

const extraStyle = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  margin-top: var(--haze-space-6);
`;

// Geometric-minimal status illustrations on the Empty defaultImage blueprint:
// token strokes/fills only, no hardcoded colors. The four semantic statuses
// use their status colors; the 403/404/500 pages use text-secondary with
// primary accents. All are decorative (aria-hidden) — the title/subTitle
// carry the message.
const statusIcons: Record<ResultStatus, ReactNode> = {
  success: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="26" stroke="var(--haze-color-success)" strokeWidth="3" />
      <path
        d="M21 32.5l8 8 14-16"
        stroke="var(--haze-color-success)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="26" stroke="var(--haze-color-danger)" strokeWidth="3" />
      <path
        d="M24 24l16 16M40 24l-16 16"
        stroke="var(--haze-color-danger)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="26" stroke="var(--haze-color-info)" strokeWidth="3" />
      <path
        d="M32 30v14"
        stroke="var(--haze-color-info)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="21.5" r="2.75" fill="var(--haze-color-info)" />
    </svg>
  ),
  warning: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 10l24 42H8Z"
        stroke="var(--haze-color-warning)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 26v11"
        stroke="var(--haze-color-warning)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="45.5" r="2.75" fill="var(--haze-color-warning)" />
    </svg>
  ),
  '403': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="32"
        y="46"
        textAnchor="middle"
        fontSize="22"
        fontWeight="600"
        fill="var(--haze-color-text-secondary)"
      >
        403
      </text>
      <path
        d="M47 13v-3a4 4 0 0 1 8 0v3"
        stroke="var(--haze-color-primary)"
        strokeWidth="2.5"
        fill="none"
      />
      <rect
        x="44.5"
        y="13"
        width="13"
        height="10"
        rx="2.5"
        fill="var(--haze-color-primary)"
      />
      <circle cx="12" cy="52" r="2.5" fill="var(--haze-color-primary)" />
    </svg>
  ),
  '404': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="32"
        y="46"
        textAnchor="middle"
        fontSize="22"
        fontWeight="600"
        fill="var(--haze-color-text-secondary)"
      >
        404
      </text>
      <circle cx="47" cy="14" r="7" stroke="var(--haze-color-primary)" strokeWidth="2.5" />
      <path
        d="M42 19l-5 5"
        stroke="var(--haze-color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M10 50h10"
        stroke="var(--haze-color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  '500': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontSize="22"
        fontWeight="600"
        fill="var(--haze-color-text-secondary)"
      >
        500
      </text>
      <path d="M32 4L23 18h6l-3 10 12-14h-7l3-8z" fill="var(--haze-color-primary)" />
    </svg>
  ),
};

export default function Result({
  status = 'info',
  icon,
  title,
  subTitle,
  extra,
  className,
  ...rest
}: ResultProps) {
  return (
    <div x-class={[base, className]} {...rest}>
      <div x-class={[iconStyle]}>{icon ?? statusIcons[status]}</div>
      {title != null && <div x-class={[titleStyle]}>{title}</div>}
      {subTitle != null && <div x-class={[subTitleStyle]}>{subTitle}</div>}
      {extra != null && <div x-class={[extraStyle]}>{extra}</div>}
    </div>
  );
}

export type { ResultProps, ResultStatus };
