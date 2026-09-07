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
`;

const stepActiveConnector = css`
  background: var(--haze-color-primary);
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
`;

const completedCircle = css`
  border-color: var(--haze-color-primary);
  background: var(--haze-color-primary);
  color: var(--haze-color-text-inverse);
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
    <div x-class={[step, className]} role="listitem">
      <div x-class={[circle, isActive && activeCircle, isCompleted && completedCircle]}>
        {isCompleted ? '✓' : index + 1}
      </div>
      <div x-class={[titleStyle, isActive && activeTitle, isCompleted && completedTitle]}>
        {title}
      </div>
      {description && (
        <div x-class={[descStyle]}>{description}</div>
      )}
      {index < totalSteps - 1 && (
        <div x-class={[stepConnector, isCompleted && stepActiveConnector]} />
      )}
    </div>
  );
}

export type { StepProps };
