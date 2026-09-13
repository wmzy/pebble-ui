import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useStrings } from '../LocaleProvider';

type AsyncSectionProps = {
  /**
   * 为真时渲染加载占位（Spinner + loadingText）。优先级最高：错误未
   * 清除时点重试（loading 与 error 同时为真）显示的是加载态。
   */
  loading?: boolean;
  /**
   * 非空值（null/undefined 之外）时渲染错误态（Alert 样式框 + Retry）。
   * Error 实例自动取 message 作为文案，其余值落在通用兜底文案上。
   */
  error?: unknown;
  /** Retry 按钮回调；不传时不渲染按钮，只显示错误信息。 */
  onRetry?: () => void;
  loadingText?: string;
  errorText?: string;
  retryText?: string;
  className?: string;
  children: ReactNode;
};

const base = css`
  font-family: var(--haze-font-sans);
  color: var(--haze-color-text);
`;

const placeholder = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--haze-space-3);
  padding: var(--haze-space-8) var(--haze-space-4);
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-sm);
`;

const spin = css`
  display: inline-flex;
  width: 24px;
  height: 24px;
  animation: spin 0.8s linear infinite;

  /* WCAG 2.3.3: the loop period is a literal on purpose (the motion
     tokens model transition durations, not multi-second cycles), so
     reduced-motion needs this explicit collapse. A single 0.01ms
     iteration parks the spinner at its rest frame beside the loading
     text — still recognizably a busy section. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// 与 Alert danger 变体同一套配色（subtle 背景 + 25% color-mix 边框），保持错误语义的视觉一致。
const errorBox = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--haze-space-4);
  padding: var(--haze-space-3) var(--haze-space-4);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-danger-subtle);
  border: 1px solid
    color-mix(in srgb, var(--haze-color-danger) 25%, transparent);
  font-size: var(--haze-text-sm);
  line-height: var(--haze-leading-normal);
`;

const errorMessage = css`
  margin: 0;
  color: var(--haze-color-danger);
`;

const retryButton = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-1) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: transparent;
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  line-height: var(--haze-leading-tight);
  cursor: pointer;
  user-select: none;
  transition:
    background var(--haze-duration-fast),
    border-color var(--haze-duration-fast);

  &:hover {
    border-color: var(--haze-color-border-hover);
    background: var(--haze-color-bg-subtle);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--haze-color-focus-ring);
  }
`;

export default function AsyncSection({
  loading = false,
  error,
  onRetry,
  loadingText,
  errorText,
  retryText,
  className,
  children,
}: AsyncSectionProps) {
  const strings = useStrings('asyncSection');
  const loadingLabel = loadingText ?? strings.loading;
  const retryLabel = retryText ?? strings.retry;
  if (loading) {
    return (
      <section x-class={[base, className]} aria-busy="true">
        <div x-class={[placeholder]} role="status">
          <span x-class={[spin]} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="var(--haze-color-border)"
                strokeWidth="3"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="var(--haze-color-primary)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {loadingLabel}
        </div>
      </section>
    );
  }

  if (error !== null && error !== undefined) {
    const message =
      errorText ??
      (error instanceof Error && error.message ? error.message : undefined) ??
      strings.error;
    return (
      <section x-class={[base, className]}>
        <div x-class={[errorBox]} role="alert">
          <p x-class={[errorMessage]}>{message}</p>
          {onRetry && (
            <button type="button" x-class={[retryButton]} onClick={onRetry}>
              {retryLabel}
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section x-class={[base, className]}>
      {children}
    </section>
  );
}

export type { AsyncSectionProps };
