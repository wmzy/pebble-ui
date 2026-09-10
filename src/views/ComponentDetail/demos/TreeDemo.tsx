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

  // 200 groups × 6 rows = 1200 nodes for the virtualized example.
  const virtualData: TreeNodeData[] = Array.from(
    { length: 200 },
    (_, group) => ({
      key: `group-${group}`,
      title: `Group ${group}`,
      children: Array.from({ length: 5 }, (_, i) => ({
        key: `group-${group}-${i}`,
        title: `Item ${group}-${i}`,
      })),
    })
  );

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
        <h2>Keyboard Navigation</h2>
        <p>
          The tree follows the WAI-ARIA tree pattern with a roving tabindex:
          Tab enters at the current node, and every node is reachable without
          a mouse. Under <code>dir=&quot;rtl&quot;</code> the horizontal
          arrows mirror.
        </p>
        <div style={{ maxWidth: 320, marginBottom: 16 }}>
          <Tree treeData={treeData} checkable />
        </div>
        <ul>
          <li>
            <kbd>↑</kbd> / <kbd>↓</kbd> — move between visible nodes
            (collapsed subtrees are skipped, no wrapping)
          </li>
          <li>
            <kbd>→</kbd> — expand a collapsed node, or move to its first
            child when open
          </li>
          <li>
            <kbd>←</kbd> — collapse an open node, or move to its parent
          </li>
          <li>
            <kbd>Home</kbd> / <kbd>End</kbd> — first / last visible node
          </li>
          <li>
            <kbd>Enter</kbd> — select the focused node
          </li>
          <li>
            <kbd>Space</kbd> — toggle the focused node&apos;s checkbox (with{' '}
            <code>checkable</code>)
          </li>
        </ul>
      </div>

      <div className={section}>
        <h2>Virtualized (1200 nodes)</h2>
        <p>
          With <code>virtualized</code> the visible rows are flattened and
          rendered through <code>VirtualList</code> — only the window (plus
          overscan) stays mounted, and keyboard navigation scrolls the
          focused row into view. State props (
          <code>expandedKeys</code> / <code>selectedKeys</code> /{' '}
          <code>checkedKeys</code>) behave exactly as on the plain path.
        </p>
        <div style={{ maxWidth: 320 }}>
          <Tree
            treeData={virtualData}
            virtualized={{ height: 288 }}
            expandedKeys={['group-0']}
            checkable
          />
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
              <strong>role=&quot;tree&quot;</strong> /{' '}
              <strong>role=&quot;treeitem&quot;</strong> semantics with{' '}
              <strong>aria-expanded</strong> / <strong>aria-level</strong> on
              each node
            </li>
            <li>
              Selected state via <strong>aria-selected</strong>, checked state
              via <strong>aria-checked</strong>
            </li>
            <li>
              Roving tabindex: one tab stop per tree, full keyboard operation
              (see Keyboard Navigation above)
            </li>
          </ul>
        </A11yNote>
      </div>

      <CssVarsSection component='tree' />
    </>
  );
}
