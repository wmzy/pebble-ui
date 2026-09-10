import type { ReactNode } from 'react';
import type { ControlOrValue } from 'react-use-control';
import type { TabsClassNames } from './TabsContext';

import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { TabsProvider } from './TabsContext';

type TabsProps = {
  value?: ControlOrValue<string>;
  /**
   * Semantic slot classes (AntD v6 `classNames` shape): declared once
   * here and distributed to every part through context — see
   * {@link TabsClassNames}. Omitting it changes nothing.
   */
  classNames?: TabsClassNames;
  className?: string;
  children: ReactNode;
};

const base = css`
  display: flex;
  flex-direction: column;
  font-family: var(--haze-font-sans);
`;

export default function Tabs({
  value: valueControl,
  classNames,
  className,
  children,
}: TabsProps) {
  const [value, setValue] = useControl(valueControl, '');

  return (
    <div x-class={[base, className, classNames?.root]}>
      <TabsProvider value={{ value, setValue, classNames }}>{children}</TabsProvider>
    </div>
  );
}

export type { TabsProps };
