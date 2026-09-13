import type { ReactNode } from 'react';

import { css } from '@linaria/core';

import { useTabsContext } from './TabsContext';

type TabPanelProps = {
  value: string;
  className?: string;
  children: ReactNode;
};

const base = css`
  padding: var(--haze-space-4) 0;
`;

const hidden = css`
  display: none;
`;

export default function TabPanel({
  value,
  className,
  children,
}: TabPanelProps) {
  const { value: current, classNames } = useTabsContext();
  const isActive = current === value;

  return (
    <div
      data-slot='tab-panel'
      role='tabpanel'
      id={`tabpanel-${value}`}
      x-class={[base, !isActive && hidden, className, classNames?.panel]}
    >
      {children}
    </div>
  );
}

export type { TabPanelProps };
