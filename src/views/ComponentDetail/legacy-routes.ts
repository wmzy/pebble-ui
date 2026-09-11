/*
 * Legacy slug redirect map + not-found suggestions for ComponentDetail.
 *
 * Sibling module (not re-exported from the component file) so the page
 * component file keeps `react-refresh/only-export-components` clean —
 * the repo's standing convention for sharing non-component values.
 */

import { ALIASES, COMPONENT_GROUPS } from '../Layout/component-groups';
import { filterComponents } from '../Layout/search-score';

const ITEMS = COMPONENT_GROUPS.flatMap((group) => group.items);
const ITEM_BY_ROUTE = new Map(ITEMS.map((item) => [item.route, item]));

/**
 * 旧→新路由映射：kebab 统一之前的多词路由是小写连写（'chatmessage'），
 * 旧链接/书签仍会打到这些 slug。新路由去掉连字符即旧形态，直接从当前
 * 路由表派生（只覆盖形态变化；单词路由如 'button' 两代相同，不出现）。
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> =
  Object.fromEntries(
    ITEMS.filter((item) => item.route.includes('-')).map((item) => [
      item.route.replaceAll('-', ''),
      item.route,
    ])
  );

/** 建议候选池：route 作搜索串（与 URL slug 同形），别名同权参与。 */
const ALIASES_BY_ROUTE: Record<string, string[]> = Object.fromEntries(
  ITEMS.map((item) => [item.route, ALIASES[item.route] ?? []])
);

/**
 * 404 兜底的最近匹配：用侧边栏搜索同款四档评分（./Layout/search-score）
 * 对全部组件 route 打分，按档位取前 `limit` 条；无任何命中返回 []。
 */
export function suggestComponents(
  name: string,
  limit = 3
): { name: string; route: string }[] {
  return filterComponents(
    ITEMS.map((item) => item.route),
    name,
    ALIASES_BY_ROUTE
  )
    .slice(0, limit)
    .map((match) => ITEM_BY_ROUTE.get(match.name))
    .filter((item) => item !== undefined)
    .map((item) => ({ name: item.name, route: item.route }));
}
