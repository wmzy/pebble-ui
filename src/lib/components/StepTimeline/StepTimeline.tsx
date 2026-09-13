import type { ReactNode } from 'react';

import { css } from '@linaria/core';

type StepStatus = 'pending' | 'active' | 'done' | 'error';

type StepTimelineProps = {
  children: ReactNode;
  className?: string;
};

type StepTimelineItemProps = {
  label: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
  className?: string;
};

const list = css`
  display: flex;
  flex-direction: column;
  font-family: var(--haze-font-sans);
`;

const item = css`
  display: flex;
  gap: var(--haze-space-3);
  padding-bottom: var(--haze-space-4);
  position: relative;

  &:last-child {
    padding-bottom: 0;
  }

  &:not(:last-child)::before {
    content: '';
    position: absolute;
    inset-inline-start: 0.5625rem;
    top: 1.5rem;
    bottom: 0;
    width: 2px;
    background: var(--haze-color-border);
  }
`;

const marker = css`
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: var(--haze-radius-full);
  border: 2px solid var(--haze-color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  z-index: 1;
`;

const markerPending = css`
  border-color: var(--haze-color-border);
  background: var(--haze-color-bg);
`;

const markerActive = css`
  border-color: var(--haze-color-primary);
  background: var(--haze-color-primary);
`;

const markerDone = css`
  border-color: var(--haze-color-success);
  background: var(--haze-color-success);
  color: var(--haze-color-text-inverse);
`;

const markerError = css`
  border-color: var(--haze-color-danger);
  background: var(--haze-color-danger);
  color: var(--haze-color-text-inverse);
`;

const body = css`
  flex: 1;
  min-width: 0;
  padding-top: 0.0625rem;
`;

const labelStyle = css`
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text);
`;

const descriptionStyle = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  margin-top: var(--haze-space-1);
`;

const markerMap: Record<StepStatus, string> = {
  pending: markerPending,
  active: markerActive,
  done: markerDone,
  error: markerError,
};

function StepTimelineItem({ label, description, status = 'pending', className }: StepTimelineItemProps) {
  return (
    <div data-slot='item' x-class={[item, className]}>
      <div data-slot='dot' x-class={[marker, markerMap[status]]}>
        {status === 'done' && '✓'}
        {status === 'error' && '!'}
      </div>
      <div data-slot='content' x-class={[body]}>
        <div data-slot='label' x-class={[labelStyle]}>{label}</div>
        {description && <div data-slot='description' x-class={[descriptionStyle]}>{description}</div>}
      </div>
    </div>
  );
}

function StepTimeline({ children, className }: StepTimelineProps) {
  return (
    <div data-slot='step-timeline' x-class={[list, className]}>
      {children}
    </div>
  );
}

export default StepTimeline;
export { StepTimelineItem };
export type { StepTimelineProps, StepTimelineItemProps, StepStatus };
