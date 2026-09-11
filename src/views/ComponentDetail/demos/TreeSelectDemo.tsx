import type { TreeNodeData } from '@/lib/components/Tree';

import { useCallback } from 'react';
import { useControl } from 'react-use-control';

import { TreeSelect } from '@/lib';

import { intro, section, fieldRow, codeBlock } from '../styles';

// ─── TreeSelect ────────────────────────────────────────────────

/** The shared sample tree (single, multiple and search sections). */
const TREE_DATA: TreeNodeData[] = [
  {
    key: 'ecosphere',
    title: 'Ecosphere',
    children: [
      {
        key: 'animals',
        title: 'Animals',
        children: [
          { key: 'mammals', title: 'Mammals' },
          { key: 'birds', title: 'Birds' },
        ],
      },
      {
        key: 'plants',
        title: 'Plants',
        children: [
          { key: 'trees', title: 'Trees' },
          { key: 'flowers', title: 'Flowers' },
        ],
      },
    ],
  },
  {
    key: 'technology',
    title: 'Technology',
    children: [
      { key: 'ai', title: 'AI' },
      { key: 'web', title: 'Web' },
    ],
  },
];

/**
 * Fake server for the lazy-loading demo: 400 ms latency, deterministic
 * children keyed off the node's key (TreeDemo's lazy-server pattern).
 */
function useLazyServer() {
  return useCallback((node: TreeNodeData) => {
    return new Promise<TreeNodeData[]>((resolve) => {
      setTimeout(() => {
        resolve(
          Array.from({ length: 3 }, (_, i) => ({
            key: `${node.key}-member-${i}`,
            title: `Member ${node.key}-${i + 1}`,
          }))
        );
      }, 400);
    });
  }, []);
}

/** Single selection, shared with the parent through a control. */
function SingleDemo() {
  const [value, , control] = useControl('');
  return (
    <>
      <div className={fieldRow} style={{ maxWidth: 320 }}>
        <TreeSelect
          treeData={TREE_DATA}
          value={control}
          placeholder='Select a node'
          treeDefaultExpandAll
          allowClear
          aria-label='Single tree select'
        />
      </div>
      <pre className={codeBlock}>{JSON.stringify(value)}</pre>
    </>
  );
}

/** Multiple selection with cascading checkboxes. */
function MultipleDemo() {
  const [value, , control] = useControl<string[]>([]);
  return (
    <>
      <div className={fieldRow} style={{ maxWidth: 360 }}>
        <TreeSelect
          treeData={TREE_DATA}
          multiple
          value={control}
          placeholder='Select nodes'
          treeDefaultExpandAll
          maxTagCount={2}
          allowClear
          aria-label='Multiple tree select'
        />
      </div>
      <pre className={codeBlock}>{JSON.stringify(value)}</pre>
    </>
  );
}

/** Panel search filtering (Tree's searchValue under the hood). */
function SearchDemo() {
  const [value, , control] = useControl('');
  return (
    <>
      <div className={fieldRow} style={{ maxWidth: 320 }}>
        <TreeSelect
          treeData={TREE_DATA}
          showSearch
          value={control}
          placeholder='Search a node'
          aria-label='Searchable tree select'
        />
      </div>
      <pre className={codeBlock}>{JSON.stringify(value)}</pre>
    </>
  );
}

/** Async children through loadData (spinner on the switcher, cached). */
function LazyDemo() {
  const loadData = useLazyServer();
  const [value, , control] = useControl('');
  return (
    <>
      <div className={fieldRow} style={{ maxWidth: 320 }}>
        <TreeSelect
          treeData={[
            { key: 'team-a', title: 'Team A' },
            { key: 'team-b', title: 'Team B' },
          ]}
          loadData={loadData}
          value={control}
          placeholder='Select a member'
          aria-label='Lazy tree select'
        />
      </div>
      <pre className={codeBlock}>{JSON.stringify(value)}</pre>
    </>
  );
}

export default function TreeSelectDemo() {
  return (
    <>
      <h1>TreeSelect</h1>
      <p className={intro}>
        Tree selection in a floating panel (the Ant Design TreeSelect
        counterpart): a combobox trigger opens a full <code>Tree</code> —
        selectable rows commit a single value, cascading checkboxes commit a{' '}
        <code>string[]</code> — with panel search, lazy loading and chip
        overflow on the same controllable-state contract as the rest of the
        library.
      </p>

      <div className={section}>
        <h2>Single — shared control</h2>
        <p>
          Rows are selectable (parents commit too — click the switcher arrow
          to expand without committing); a commit closes the panel, and the
          next open focuses the selected row. <code>allowClear</code> adds
          the hover ×, <code>treeDefaultExpandAll</code> opens every parent
          on first open.
        </p>
        <SingleDemo />
      </div>

      <div className={section}>
        <h2>Multiple — cascading checkboxes</h2>
        <p>
          Checking a parent checks its whole subtree and commits the
          normalized fully-checked set (AntD semantics — parents included
          only while every descendant is checked); unchecking one child
          demotes the parent to half-checked and drops it from the value.
          Removing a parent chip unchecks its subtree.{' '}
          <code>checkStrictly</code> turns the cascade off;{' '}
          <code>maxTagCount</code> collapses the overflow into a +N badge.
        </p>
        <MultipleDemo />
      </div>

      <div className={section}>
        <h2>Search — panel filter</h2>
        <p>
          <code>showSearch</code> heads the panel with a filter input:
          matches are highlighted, their ancestor paths stay visible, and
          the query resets when the panel closes. The trigger is{' '}
          <code>role=&quot;combobox&quot;</code> (name-from-author) — label
          it with <code>aria-label</code>.
        </p>
        <SearchDemo />
      </div>

      <div className={section}>
        <h2>Lazy loading — loadData</h2>
        <p>
          Childless non-leaf nodes fetch children on first expand (spinner
          on the switcher, results cached), and the trigger resolves labels
          from the loaded nodes — this fake server answers in 400 ms.
        </p>
        <LazyDemo />
      </div>

      <div className={section}>
        <h2>Usage</h2>
        <pre className={codeBlock}>{`import { TreeSelect } from 'haze-ui';

<TreeSelect
  treeData={nodes}            // TreeNodeData[] (Tree's shape)
  value={keyCtrl}             // Control<string> | string
  onChange={(key) => save(key)}
  placeholder="Select a node"
  treeDefaultExpandAll
  aria-label="Select a node"
/>

<TreeSelect
  treeData={nodes}
  multiple                    // string[] value, cascading checkboxes
  checkStrictly               // optional: no cascade
  maxTagCount={2}
  showSearch
  loadData={(node) => fetchChildren(node.key)}
/>`}</pre>
      </div>
    </>
  );
}
