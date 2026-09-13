import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';

import { css } from '@linaria/core';
import { Children, cloneElement, isValidElement } from 'react';
import { useControl } from 'react-use-control';

import { StepperProvider } from './StepperContext';

type StepperProps = {
  activeStep?: ControlOrValue<number>;
  children: ReactNode;
  className?: string;
};

const stepper = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-2);
  align-items: flex-start;
  font-family: var(--haze-font-sans);
`;

export default function Stepper({
  activeStep: activeStepControl,
  children,
  className,
}: StepperProps) {
  const [activeStep, setActiveStep] = useControl(activeStepControl, 0);
  const totalSteps = Children.count(children);

  return (
    <StepperProvider value={{ activeStep, setActiveStep, totalSteps }}>
      <div data-slot='stepper' x-class={[stepper, className]} role="list">
        {Children.map(children, (child, index) =>
          isValidElement(child) ? cloneElement(child as React.ReactElement<{ index?: number }>, { index }) : child
        )}
      </div>
    </StepperProvider>
  );
}

export type { StepperProps };
