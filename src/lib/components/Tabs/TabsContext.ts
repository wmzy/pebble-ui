import type {Dispatch, SetStateAction} from 'react';

import {createContext, useContext} from 'react';

/**
 * Semantic slot classes (AntD v6 `classNames` shape) for the Tabs
 * family: declared once on the `<Tabs>` root and distributed to every
 * part through context — the sub-components stay prop-light while one
 * record themes the whole strip. Consumer classes are appended at the
 * end of each part's class list (able to override component defaults);
 * per-part `className` props remain for one-off tweaks and still land
 * after the slot class.
 */
export type TabsClassNames = {
  /** The wrapper `<div>` `<Tabs>` renders. */
  root?: string;
  /** The `<TabList>` strip (`role="tablist"`). */
  list?: string;
  /** Every `<Tab>` button (`role="tab"`). */
  tab?: string;
  /** Every `<TabPanel>` (`role="tabpanel"`). */
  panel?: string;
};

type TabsContextValue = {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  classNames: TabsClassNames | undefined;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export const TabsProvider = TabsContext.Provider;

export function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}
