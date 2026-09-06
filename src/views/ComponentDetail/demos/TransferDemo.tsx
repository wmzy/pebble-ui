import { useState } from 'react';

import { Transfer } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

// ─── Transfer ───────────────────────────────────────────────────
export default function TransferDemo() {
  const [targetKeys, setTargetKeys] = useState<string[]>(['b']);

  return (
    <>
      <h1>Transfer</h1>
      <p className={intro}>Transfer list for moving items between source and target.</p>

      <div className={section}>
        <h2>Demo</h2>
        <Transfer
          dataSource={[
            { key: 'a', title: 'Item A' },
            { key: 'b', title: 'Item B' },
            { key: 'c', title: 'Item C' },
            { key: 'd', title: 'Item D' },
          ]}
          targetKeys={targetKeys}
          onChange={(keys) => setTargetKeys(keys)}
        />
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='TransferProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>Items use <strong>&lt;label&gt;</strong> with checkboxes</li>
            <li>Action buttons have <strong>aria-label</strong></li>
            <li>Disabled items cannot be selected</li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
