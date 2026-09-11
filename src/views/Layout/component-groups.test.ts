import generatedProps from '@/generated/props.json';

import {
  ALIASES,
  COMPONENT_GROUPS,
  assertGroupCoverage,
  type ComponentItem,
} from './component-groups';

const ROUTES: string[] = COMPONENT_GROUPS.flatMap((g) =>
  g.items.map((i) => i.route)
);

const GROUP_NAMES = [
  'General',
  'Layout',
  'Forms',
  'Overlays',
  'Data Display',
  'Navigation',
  'Feedback',
  'AI & Chat',
  'Utilities',
];

/*
 * props.json 的 routeKey 与 demo 路由同源（均 kebab 化，见
 * component-groups.ts 头注释），对账直接比对 routeKey，无需换算。
 */

describe('component groups', () => {
  it('passes the module-load coverage guard', () => {
    // import 本身已在模块加载时执行守卫；这里再显式跑一遍断言可重入。
    expect(() => assertGroupCoverage()).not.toThrow();
  });

  it('covers every props.json component exactly once (no gaps, no dupes)', () => {
    const counts = new Map<string, number>();
    for (const route of ROUTES) {
      counts.set(route, (counts.get(route) ?? 0) + 1);
    }

    for (const count of counts.values()) {
      expect(count).toBe(1);
    }

    const entries = Object.values(generatedProps.components);
    for (const entry of entries) {
      expect(counts.get(entry.routeKey) ?? 0).toBe(1);
    }
  });

  it('has unique display names across all groups', () => {
    const names = COMPONENT_GROUPS.flatMap((g) => g.items.map((i) => i.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('uses the nine contract groups in order, each non-empty', () => {
    expect(COMPONENT_GROUPS.map((g) => g.group)).toEqual(GROUP_NAMES);
    for (const group of COMPONENT_GROUPS) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('uses kebab-case routes everywhere (no lowercase-concat slugs)', () => {
    // 旧形态（'numberinput'）与小写连写残留都不得回归
    expect(ROUTES.length).toBeGreaterThan(0);
    for (const route of ROUTES) {
      expect(route).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('renders PascalCase display names for kebab routes', () => {
    const byRoute = new Map<string, ComponentItem>(
      COMPONENT_GROUPS.flatMap((g) => g.items).map((i) => [i.route, i])
    );
    expect(byRoute.get('number-input')?.name).toBe('NumberInput');
    expect(byRoute.get('data-table')?.name).toBe('DataTable');
    expect(byRoute.get('date-range-picker')?.name).toBe('DateRangePicker');
    expect(byRoute.get('otp-input')?.name).toBe('OTPInput');
    expect(byRoute.get('qr-code')?.name).toBe('QRCode');
  });

  it('keys every alias entry by an existing route', () => {
    expect(Object.keys(ALIASES).length).toBeGreaterThan(0);
    for (const route of Object.keys(ALIASES)) {
      expect(ROUTES).toContain(route);
      for (const alias of ALIASES[route]!) {
        expect(alias.trim()).toBe(alias);
        expect(alias.length).toBeGreaterThan(0);
      }
    }
  });
});
