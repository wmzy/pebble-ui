import { css } from '@linaria/core';

import { useStepperContext } from './StepperContext';

type StepProps = {
  title: string;
  description?: string;
  className?: string;
  index?: number;
};

const step = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
`;

const stepConnector = css`
  position: absolute;
  top: 16px;
  inset-inline-start: 50%;
  width: 100%;
  height: 2px;
  background: var(--haze-color-border);

  /* Forced-colors: the connector line flattens onto Canvas. */
  @media (forced-colors: active) {
    background: CanvasText;
  }
`;

const stepActiveConnector = css`
  background: var(--haze-color-primary);

  /* Forced-colors: the completed connector flattens onto Canvas —
     restated as Highlight so progress between steps stays visible. */
  @media (forced-colors: active) {
    background: Highlight;
  }
`;

const circle = css`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--haze-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-medium);
  border: 2px solid var(--haze-color-border);
  background: var(--haze-color-bg);
  color: var(--haze-color-text-muted);
  transition: all var(--haze-duration-normal);
`;

const activeCircle = css`
  border-color: var(--haze-color-primary);
  background: var(--haze-color-primary);
  color: var(--haze-color-text-inverse);

  /* Forced-colors: the primary fill flattens onto Canvas — the
     current step would be indistinguishable from a pending one. The
     Windows-native Highlight chip renders instead. */
  @media (forced-colors: active) {
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }
`;

const completedCircle = css`
  border-color: var(--haze-color-primary);
  background: var(--haze-color-primary);
  color: var(--haze-color-text-inverse);

  /* Forced-colors: same Highlight chip as the active circle — the ✓
     glyph rides in as HighlightText. */
  @media (forced-colors: active) {
    border-color: Highlight;
    background: Highlight;
    color: HighlightText;
  }
`;

const titleStyle = css`
  margin-top: var(--haze-space-2);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  text-align: center;
`;

const activeTitle = css`
  color: var(--haze-color-text);
  font-weight: var(--haze-weight-medium);
`;

const completedTitle = css`
  color: var(--haze-color-primary);
`;

const descStyle = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  text-align: center;
  margin-top: var(--haze-space-1);
`;

export default function Step({ title, description, className, index = 0 }: StepProps) {
  const { activeStep, totalSteps } = useStepperContext();
  const isActive = index === activeStep;
  const isCompleted = index < activeStep;

  return (
    <div data-slot='step' x-class={[step, className]} role="listitem">
      <div data-slot='icon' x-class={[circle, isActive && activeCircle, isCompleted && completedCircle]}>
        {isCompleted ? '✓' : index + 1}
      </div>
      <div data-slot='title' x-class={[titleStyle, isActive && activeTitle, isCompleted && completedTitle]}>
        {title}
      </div>
      {description && (
        <div data-slot='description' x-class={[descStyle]}>{description}</div>
      )}
      {index < totalSteps - 1 && (
        <div data-slot='connector' x-class={[stepConnector, isCompleted && stepActiveConnector]} />
      )}
    </div>
  );
}

export type { StepProps };
