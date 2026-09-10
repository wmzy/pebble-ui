/**
 * Keyboard-critical harness for the engine-extended e2e spec
 * (e2e/keyboard-critical.spec.ts): the three keyboard-heavy surfaces
 * whose interaction contracts must hold on every engine —
 *   - Tree: APG tree keyboard roving (Tab entry, arrows, Enter select);
 *   - Combobox multiple: keyboard open + highlight + Enter chip toggles
 *     + Backspace chip drop, all without closing the panel;
 *   - Calendar picker='month': grid roving, PageUp/Down year hops and
 *     Enter committing "YYYY-MM".
 *
 * The Tree and Calendar pick their results into <output> elements so the
 * spec can assert the committed values without reading component state.
 */
import { useState } from 'react';

import Calendar from '../../../src/lib/components/Calendar/Calendar';
import Combobox from '../../../src/lib/components/Combobox/Combobox';
import Tree from '../../../src/lib/components/Tree/Tree';

import { mountPage } from './mount';

const treeData = [
  {
    key: '0-0',
    title: 'parent 0',
    children: [
      { key: '0-0-0', title: 'leaf 0-0-0' },
      { key: '0-0-1', title: 'leaf 0-0-1' },
    ],
  },
  {
    key: '0-1',
    title: 'parent 1',
    children: [{ key: '0-1-0', title: 'leaf 0-1-0' }],
  },
];

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

function App() {
  const [treePick, setTreePick] = useState('none');
  const [monthPick, setMonthPick] = useState('none');
  return (
    <>
      <section data-testid="case-tree">
        <Tree
          treeData={treeData}
          onSelect={(keys) => setTreePick(keys.join(',') || 'none')}
        />
        <output data-testid="tree-out">{treePick}</output>
      </section>
      <section data-testid="case-combobox">
        <Combobox multiple options={fruits} placeholder="Pick fruit" />
      </section>
      <section data-testid="case-calendar">
        <Calendar
          picker="month"
          value="2026-03"
          onSelect={(v) => setMonthPick(v)}
        />
        <output data-testid="calendar-out">{monthPick}</output>
      </section>
    </>
  );
}

mountPage(<App />);
