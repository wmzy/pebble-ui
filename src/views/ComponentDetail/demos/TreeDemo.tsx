import { useCallback, useRef, useState } from 'react';

import { Tree, type TreeNodeData } from '@/lib';

import PropsTable from '../PropsTable';

import A11yNote from '../A11yNote';

import { intro, section } from '../styles';

import { CssVarsSection } from './shared';

// ─── Tree ───────────────────────────────────────────────────────

/** The shared sample tree (basic, checkable, and search sections). */
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

/** Fake server for the lazy-loading demo: 600 ms latency, one
 *  deliberate failure per "flaky" node, deterministic children keyed
 *  off the node's key (titles are ReactNode — never stringify them). */
function useLazyServer() {
  const failedOnce = useRef(new Set<string>());
  return useCallback((node: TreeNodeData) => {
    const key = node.key;
    return new Promise<TreeNodeData[]>((resolve, reject) => {
      setTimeout(() => {
        if (key.startsWith('flaky') && !failedOnce.current.has(key)) {
          failedOnce.current.add(key);
          reject(new Error('simulated server error'));
          return;
        }
        resolve(
          Array.from({ length: 3 }, (_, i) => ({
            key: `${key}-${i}`,
            title: `${key} item ${i + 1}`,
          }))
        );
      }, 600);
    });
  }, []);
}

function LazyTreeDemo() {
  const loadData = useLazyServer();
  return (
    <Tree
      treeData={[
        { key: 'docs', title: 'Documents' },
        { key: 'media', title: 'Media', isLeaf: true },
        { key: 'flaky', title: 'Flaky server' },
      ]}
      loadData={loadData}
    />
  );
}

function SearchTreeDemo() {
  const [searchValue, setSearchValue] = useState('');
  return (
    <>
      <input
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder='Search the tree… (try “2-1”)'
        style={{
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: 12,
          padding: '6px 10px',
        }}
      />
      <Tree treeData={treeData} searchValue={searchValue} />
    </>
  );
}

export default function TreeDemo() {
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
        <h2>Lazy Loading (loadData)</h2>
        <p>
          With <code>loadData</code>, nodes that ship no children (and are not{' '}
          <code>isLeaf</code>) fetch them from your server the first time they
          are expanded, show a spinner while in flight, and cache the result —
          collapsing and re-expanding never requests again. The cache resets
          when controlled <code>treeData</code> stops mapping onto it. A
          rejected load renders an inline <em>Load failed · Retry</em>{' '}
          affordance; expanding the failed node again retries too.{' '}
          <code>Media</code> below is <code>isLeaf</code> and never loads;{' '}
          <code>Flaky server</code> fails once on purpose.
        </p>
        <div style={{ maxWidth: 320 }}>
          <LazyTreeDemo />
        </div>
      </div>

      <div className={section}>
        <h2>Search Filtering (searchValue)</h2>
        <p>
          A non-empty <code>searchValue</code> keeps only the nodes whose title
          matches (case-insensitive) plus the ancestor path to them —
          ancestors auto-expand so hits stay visible — and wraps each match in
          a highlighted <code>&lt;mark&gt;</code>. When nothing matches, the
          localized empty state is shown. Controlled{' '}
          <code>expandedKeys</code> keep working underneath the filter.
        </p>
        <div style={{ maxWidth: 320 }}>
          <SearchTreeDemo />
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
