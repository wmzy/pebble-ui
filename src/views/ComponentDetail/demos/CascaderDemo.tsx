import type { ReactNode } from 'react';
import type { CascaderOption } from '@/lib';

import { useEffect, useRef, useState } from 'react';
import { useControl } from 'react-use-control';

import { Cascader } from '@/lib';

import PropsTable from '../PropsTable';
import A11yNote from '../A11yNote';

import { intro, section, fieldRow, codeBlock } from '../styles';

// ─── Cascader ──────────────────────────────────────────────────
const REGIONS: CascaderOption[] = [
  {
    label: '浙江',
    value: 'zj',
    children: [
      {
        label: '杭州',
        value: 'hz',
        children: [
          { label: '西湖区', value: 'xihu' },
          { label: '滨江区', value: 'binjiang' },
        ],
      },
      { label: '宁波', value: 'nb' },
    ],
  },
  {
    label: '广东',
    value: 'gd',
    children: [
      {
        label: '深圳',
        value: 'sz',
        children: [
          { label: '南山区', value: 'nanshan' },
          { label: '福田区', value: 'futian' },
        ],
      },
      { label: '广州', value: 'gz' },
    ],
  },
  { label: '北京', value: 'bj' },
];

// A wide tree (25 provinces × 120 cities) for the virtualized example.
const MANY_REGIONS: CascaderOption[] = Array.from(
  { length: 25 },
  (_, province) => ({
    label: `Province ${province + 1}`,
    value: `prov-${province}`,
    children: Array.from({ length: 120 }, (_, city) => ({
      label: `City ${province + 1}-${city + 1}`,
      value: `city-${province}-${city}`,
    })),
  })
);

/** String form of a (possibly node) label, for the fake server below. */
const labelText = (label: ReactNode): string =>
  typeof label === 'string' ? label : '';

/**
 * Fake server for the remote-search example: rebuilds the region tree
 * with only the branches whose city or district labels match the raw
 * query — exactly what a real backend would return for Cascader's
 * onSearch (the component itself never filters).
 */
function searchRegions(query: string): CascaderOption[] {
  const needle = query.trim();
  if (needle === '') return REGIONS;
  const matches: CascaderOption[] = [];
  for (const province of REGIONS) {
    if ((province.children ?? []).length === 0) {
      if (labelText(province.label).includes(needle)) matches.push(province);
      continue;
    }
    const children = (province.children ?? []).flatMap((city): CascaderOption[] => {
      const districts = (city.children ?? []).filter((district) =>
        labelText(district.label).includes(needle)
      );
      if (districts.length > 0) return [{ ...city, children: districts }];
      return labelText(city.label).includes(needle) ? [city] : [];
    });
    if (children.length > 0) matches.push({ ...province, children });
  }
  return matches;
}

export default function CascaderDemo() {
  const [path, , pathCtrl] = useControl(undefined, [] as string[]);
  // Remote-search stand-in: the fake server rebuilds the tree per
  // query after a delay. A pending timer is cancelled on unmount (and
  // superseded by the next query).
  const [remoteRegions, setRemoteRegions] = useState<CascaderOption[]>(REGIONS);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (remoteTimer.current !== null) clearTimeout(remoteTimer.current);
    },
    []
  );
  const handleRemoteSearch = (query: string) => {
    setRemoteLoading(true);
    if (remoteTimer.current !== null) clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(() => {
      setRemoteLoading(false);
      setRemoteRegions(searchRegions(query));
    }, 400);
  };

  return (
    <>
      <h1>Cascader</h1>
      <p className={intro}>
        Drill-down cascading selection for hierarchical paths (region
        pickers, category trees). The panel shows one scrolling column per
        level; the trigger displays the committed path.
      </p>

      <div className={section}>
        <h2>Basic — leaf selection</h2>
        <div className={fieldRow}>
          <Cascader
            options={REGIONS}
            value={pathCtrl}
            placeholder='Select region'
          />
        </div>
        <pre className={codeBlock}>{JSON.stringify(path)}</pre>
      </div>

      <div className={section}>
        <h2>changeOnSelect — commit every level</h2>
        <div className={fieldRow}>
          <Cascader
            options={REGIONS}
            changeOnSelect
            placeholder='Select region'
          />
        </div>
      </div>

      <div className={section}>
        <h2>expandTrigger=&quot;hover&quot;</h2>
        <div className={fieldRow}>
          <Cascader
            options={REGIONS}
            expandTrigger='hover'
            placeholder='Select region'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Virtualized — wide trees</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>virtualized</code> renders every column through{' '}
          <code>VirtualList</code>: only the visible window per column
          stays mounted. Keyboard focus steps scroll the target row into
          the window before focusing it, and{' '}
          <code>aria-posinset</code>/<code>aria-setsize</code> keep the
          unmounted remainder of each column addressable. Pass an object
          to tune <code>{'{ itemHeight, overscan }'}</code>.
        </p>
        <div className={fieldRow}>
          <Cascader
            options={MANY_REGIONS}
            virtualized
            placeholder='Select province / city'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Remote search</h2>
        <p
          style={{
            fontSize: 'var(--haze-text-sm)',
            color: 'var(--haze-color-text-secondary)',
            margin: '0 0 var(--haze-space-3)',
          }}
        >
          <code>onSearch</code> adds a search field to the panel: every
          query transition fires the callback with the raw query — each
          keystroke, clearing the field, and the reset back to{' '}
          <code>&apos;&apos;</code> when the panel closes (so you can
          restore the full tree) — and the panel renders exactly the{' '}
          <code>options</code> you rebuild in response, committing the
          path that rebuilt tree defines. Pair with <code>loading</code>{' '}
          for the pending state; debouncing is the consumer&apos;s
          concern. This fake server prunes the tree per query — try{' '}
          <code>西湖</code> or <code>南山</code>.
        </p>
        <div className={fieldRow}>
          <Cascader
            options={remoteRegions}
            onSearch={handleRemoteSearch}
            loading={remoteLoading}
            placeholder='Search regions…'
          />
        </div>
      </div>

      <div className={section}>
        <h2>Usage</h2>
        <pre className={codeBlock}>{`import { Cascader } from 'haze-ui';

<Cascader
  options={regions}
  value={pathCtrl}          // Control<string[]> | string[]
  onChange={(next) => save(next)}
  placeholder="Select region"
  changeOnSelect={false}    // true: every level commits
  expandTrigger="click"     // 'hover' also available
/>`}</pre>
      </div>

      <div className={section}>
        <h2>Props</h2>
        <PropsTable of='CascaderProps' />
      </div>

      <div className={section}>
        <h2>Accessibility</h2>
        <A11yNote>
          <ul>
            <li>
              Trigger exposes <code>aria-expanded</code> /
              <code>aria-haspopup=&quot;menu&quot;</code>
            </li>
            <li>
              Columns are menus; parents carry <code>aria-haspopup</code> and{' '}
              <code>aria-expanded</code>, with an expand glyph labelled
              through the locale dictionary
            </li>
            <li>
              Arrow keys navigate, <strong>Enter</strong> drills or commits,{' '}
              <strong>Escape</strong> closes and restores focus to the trigger
            </li>
          </ul>
        </A11yNote>
      </div>
    </>
  );
}
