import { css } from '@linaria/core';
import { useControl } from 'react-use-control';

import { Tabs, TabList, Tab, TabPanel } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// classNames 槽位演示：一条记录从 <Tabs> 根分发到全部四个部位
// （root/list/tab/panel，键名见 TabsClassNames）。
const themedRoot = css`
  gap: var(--haze-space-2);
`;

const themedTab = css`
  font-weight: var(--haze-weight-bold);
`;

const themedPanel = css`
  background: var(--haze-color-primary-subtle);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-4);
`;

// ─── Tabs ──────────────────────────────────────────────────────
export default function TabsDemo() {
  const [, , tabCtrl] = useControl(undefined, 'tab1');

  return (
    <>
      <h1>Tabs</h1>
      <p className={intro}>
        Organize content into switchable panels with tabbed navigation.
      </p>

      <div className={section}>
        <h2>Demo</h2>
        <Tabs value={tabCtrl}>
          <TabList>
            <Tab value='tab1'>Tab One</Tab>
            <Tab value='tab2'>Tab Two</Tab>
            <Tab value='tab3'>Tab Three</Tab>
          </TabList>
          <TabPanel value='tab1'>Content for Tab One.</TabPanel>
          <TabPanel value='tab2'>Content for Tab Two.</TabPanel>
          <TabPanel value='tab3'>Content for Tab Three.</TabPanel>
        </Tabs>
      </div>

      <div className={section}>
        <h2>classNames slots</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          One <code>classNames</code> record on the{' '}
          <code>&lt;Tabs&gt;</code> root reaches every part through
          context (AntD v6 shape): <code>root</code>, <code>list</code>,{' '}
          <code>tab</code> (every tab, not just the active one) and{' '}
          <code>panel</code> (every panel). Slot classes arrive after the
          component defaults — here the panels get a primary-tinted
          surface and the tabs bold labels.
        </p>
        <Tabs value='tab1' classNames={{ root: themedRoot, tab: themedTab, panel: themedPanel }}>
          <TabList>
            <Tab value='tab1'>Tab One</Tab>
            <Tab value='tab2'>Tab Two</Tab>
          </TabList>
          <TabPanel value='tab1'>Content for Tab One.</TabPanel>
          <TabPanel value='tab2'>Content for Tab Two.</TabPanel>
        </Tabs>
      </div>

      <div className={section}>
        <h2>Tabs Props</h2>
        <PropsTable of='TabsProps' />
      </div>

      <div className={section}>
        <h2>Tab Props</h2>
        <PropsTable of='TabProps' />
      </div>

      <div className={section}>
        <h2>TabPanel Props</h2>
        <PropsTable of='TabPanelProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses <strong>role=&quot;tablist&quot;</strong>,{' '}
              <strong>role=&quot;tab&quot;</strong>,{' '}
              <strong>role=&quot;tabpanel&quot;</strong>
            </li>
            <li>
              Active tab has <strong>aria-selected=&quot;true&quot;</strong>
            </li>
            <li>
              Tabs linked to panels via <strong>aria-controls</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate between tabs
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tabs' />
    </>
  );
}
