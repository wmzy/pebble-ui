import { Tree, type TreeNodeData } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Tree ───────────────────────────────────────────────────────
export default function TreeDemo() {
  const treeData: TreeNodeData[] = [
    {
      key: 'root',
      title: 'Root',
      children: [
        {
          key: 'parent-1',
          title: 'Parent 1',
          children: [
            { key: 'child-1-1', title: 'Child 1-1' },
            { key: 'child-1-2', title: 'Child 1-2' },
          ],
        },
        {
          key: 'parent-2',
          title: 'Parent 2',
          children: [
            { key: 'child-2-1', title: 'Child 2-1' },
            { key: 'child-2-2', title: 'Child 2-2' },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <h1>Tree</h1>
      <p className={intro}>
        Hierarchical data display with expandable nodes, selection, and checkbox
        support.
      </p>

      <div className={section}>
        <h2>Basic</h2>
        <div style={{ maxWidth: 320 }}>
          <Tree treeData={treeData} />
        </div>
      </div>

      <div className={section}>
        <h2>Checkable</h2>
        <div style={{ maxWidth: 320 }}>
          <Tree treeData={treeData} checkable />
        </div>
      </div>

      <div className={section}>
        <h2>With Icons and Lines</h2>
        <div style={{ maxWidth: 320 }}>
          <Tree treeData={treeData} showIcon showLine />
        </div>
      </div>

      <div className={section}>
        <h2>Tree Props</h2>
        <PropsTable of='TreeProps' />
      </div>

      <div className={section}>
        <h2>TreeNodeData</h2>
        <PropsTable of='TreeNodeData' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Uses nested <strong>&lt;ul&gt;</strong>/
              <strong>&lt;li&gt;</strong> with{' '}
              <strong>role=&quot;tree&quot;</strong>/
              <strong>role=&quot;treeitem&quot;</strong>
            </li>
            <li>
              Expanded/collapsed state via <strong>aria-expanded</strong>
            </li>
            <li>
              Selected state via <strong>aria-selected</strong>
            </li>
            <li>
              Checked state via <strong>aria-checked</strong>
            </li>
            <li>
              <strong>Arrow keys</strong> navigate between nodes,{' '}
              <strong>Enter</strong>/<strong>Space</strong> activates
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tree' />
    </>
  );
}
