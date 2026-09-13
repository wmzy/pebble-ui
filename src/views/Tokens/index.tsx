import type {ResolvedMode} from '@/contexts/theme';
import type {ComponentItem} from '@/views/Layout/component-groups';
import type {TokenDef} from '@/lib';

import {useMemo, useState} from 'react';
import {css} from '@linaria/core';
import {Link} from '@native-router/react';

import {COMPONENT_TOKENS, TOKEN_REGISTRY, Input} from '@/lib';
import {useTheme} from '@/contexts/theme';
import {COMPONENT_GROUPS} from '@/views/Layout/component-groups';
import {intro, page, section} from '@/views/ComponentDetail/styles';

/*
 * /tokens — 设计令牌总览。
 *
 * 数据源就是库的 TOKEN_REGISTRY / COMPONENT_TOKENS（与发布为
 * haze-ui/design-tokens/{light,dark}.json 的 W3C 文件、MCP 的
 * haze_get_tokens 工具同源），页面不复制任何值：registry 加条目这里
 * 自动出现。色板的 live swatch 直接引用 var(--haze-*)，因此跟随站级
 * ThemeProvider 的 light/dark（含自定义主题）实时变化；Light/Dark 两列
 * 文本则是 registry 的解析值快照，「current」标记当前生效的模式。
 */

const paragraph = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-base);
  color: var(--haze-color-text);
  line-height: var(--haze-leading-relaxed);
  margin: 0 0 var(--haze-space-4);
`;

const filterBar = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  flex-wrap: wrap;
  margin: 0 0 var(--haze-space-6);
  max-width: 560px;
`;

const filterInput = css`
  flex: 1;
  min-width: 220px;
`;

const countText = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  white-space: nowrap;
`;

const tableWrap = css`
  width: 100%;
  overflow-x: auto;
`;

const table = css`
  width: 100%;
  border-collapse: collapse;
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);

  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: var(--haze-space-2) var(--haze-space-3);
    border-bottom: 1px solid var(--haze-color-border);
  }

  th {
    font-weight: var(--haze-weight-semibold);
    color: var(--haze-color-text-secondary);
    font-size: var(--haze-text-xs);
    text-transform: uppercase;
  }
`;

const tokenCell = css`
  display: flex;
  align-items: flex-start;
  gap: var(--haze-space-2);
`;

const varName = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-primary);
  white-space: nowrap;
`;

const tokenLabel = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
  margin-top: var(--haze-space-1);
`;

const liveSwatch = css`
  width: var(--haze-space-4);
  height: var(--haze-space-4);
  border-radius: var(--haze-radius-sm);
  border: 1px solid var(--haze-color-border);
  flex-shrink: 0;
  margin-top: var(--haze-space-1);
`;

const usageCell = css`
  color: var(--haze-color-text-secondary);
  min-width: 200px;
`;

const swatchCell = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
`;

const staticSwatch = css`
  width: var(--haze-space-4);
  height: var(--haze-space-4);
  border-radius: var(--haze-radius-sm);
  border: 1px solid var(--haze-color-border);
  flex-shrink: 0;
`;

const valueText = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
  white-space: nowrap;
`;

const modeHeader = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-1);
`;

const modeTag = css`
  text-transform: none;
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-primary);
  background: var(--haze-color-primary-subtle);
  border-radius: var(--haze-radius-full);
  padding: var(--haze-space-0) var(--haze-space-2);
`;

const sectionCount = css`
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
  margin-left: var(--haze-space-2);
`;

const compList = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
`;

const compRow = css`
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  padding: var(--haze-space-3) var(--haze-space-4);
`;

const compHead = css`
  display: flex;
  align-items: baseline;
  gap: var(--haze-space-2);
  margin-bottom: var(--haze-space-2);
`;

const compName = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
`;

const compLink = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  font-weight: var(--haze-weight-semibold);
  color: var(--haze-color-text);
  text-decoration: none;

  &:hover {
    color: var(--haze-color-primary);
  }
`;

const compCount = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const chipRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--haze-space-1);
`;

const chip = css`
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-secondary);
  background: var(--haze-color-bg-subtle);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-sm);
  padding: var(--haze-space-0) var(--haze-space-2);
`;

const noTokens = css`
  font-size: var(--haze-text-xs);
  color: var(--haze-color-text-muted);
`;

const noMatch = css`
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
  padding: var(--haze-space-4) 0;
`;

/* ---- 数据准备（全部模块级一次算好，渲染期零开销） ---- */

const CATEGORY_ORDER: TokenDef['category'][] = [
  'color',
  'typography',
  'spacing',
  'radius',
  'shadow',
];

/* registry 未来出现新 category（如 motion）时自动落入队尾，而不是被静默丢掉。 */
const EXTRA_CATEGORIES = [
  ...new Set(TOKEN_REGISTRY.map((t) => t.category)),
].filter((c) => !CATEGORY_ORDER.includes(c));

const ALL_CATEGORIES: TokenDef['category'][] = [
  ...CATEGORY_ORDER,
  ...EXTRA_CATEGORIES,
];

const CATEGORY_TITLE: Record<string, string> = {
  color: 'Color',
  typography: 'Typography',
  spacing: 'Spacing',
  radius: 'Radius',
  shadow: 'Shadow',
};

const CATEGORY_BLURB: Record<string, string> = {
  color: 'Semantic colors with per-mode resolved values; hover / active / subtle variants are relative-color formulas over the base token.',
  typography: 'Font stacks plus the size, line-height and weight scales.',
  spacing: 'The 4px-base spacing scale used for padding, gap and margin.',
  radius: 'Corner rounding scale.',
  shadow: 'Elevation shadows.',
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_USAGE_BASE: Record<string, string> = {
  success: 'Positive status — completion, valid state.',
  warning: 'Caution — risky actions, needs attention.',
  danger: 'Destructive — errors, removal.',
  info: 'Informational — neutral notices.',
};

const STATUS_USAGE_SUFFIX: Record<string, string> = {
  '': '',
  '-hover': ' Hover state of the base status color.',
  '-active': ' Pressed state of the base status color.',
  '-subtle': ' Tinted background for the status.',
};

/* 状态色组条目在声明处一次性展开（单表达式、不可变构造）。wyw-in-js 在
 * 构建期求值本模块提取 css 时，声明后再被循环改写的对象一旦在模块级
 * 求值（TOKEN_REGISTRY.map 调 describeToken）中被读取，会触发依赖图缓存
 * 重置（UnknownDependencyGraphResetError，demo 构建稳定复现）；保持不可
 * 变构造即可规避。 */
const STATUS_USAGE_ENTRIES: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_USAGE_BASE).flatMap(([status, base]) =>
    Object.entries(STATUS_USAGE_SUFFIX).map(
      ([suffix, extra]) =>
        [
          `--haze-color-${status}${suffix}`,
          base + extra,
        ] as [string, string]
    )
  )
);

const COLOR_USAGE: Record<string, string> = {
  '--haze-color-primary': 'Brand color — primary buttons, links, active emphasis.',
  '--haze-color-primary-hover': 'Hover state of primary (relative-color lightness shift).',
  '--haze-color-primary-active': 'Pressed state of primary.',
  '--haze-color-primary-subtle': 'Tinted primary background — selection, subtle emphasis.',
  '--haze-color-bg': 'Default page surface.',
  '--haze-color-bg-subtle': 'Raised surface — headers, cards, inputs.',
  '--haze-color-bg-muted': 'Recessed surface — wells, skeletons, code blocks.',
  '--haze-color-text': 'Default text color.',
  '--haze-color-text-secondary': 'Secondary text — descriptions, meta.',
  '--haze-color-text-muted': 'De-emphasized text — placeholders, hints.',
  '--haze-color-text-inverse': 'Text on filled primary / status surfaces.',
  '--haze-color-border': 'Borders and dividers.',
  '--haze-color-border-hover': 'Hover state of border.',
  '--haze-color-focus-ring': 'Keyboard focus outline color.',
  ...STATUS_USAGE_ENTRIES,
};

function describeToken(token: TokenDef): string {
  if (token.category === 'color') return COLOR_USAGE[token.name] ?? token.label;
  if (token.name.startsWith('--haze-font-')) {
    return token.name === '--haze-font-mono'
      ? 'Monospace stack — code and data.'
      : 'Sans stack — UI text.';
  }
  if (token.name.startsWith('--haze-text-')) return 'Font size step.';
  if (token.name.startsWith('--haze-leading-')) return 'Line-height step.';
  if (token.name.startsWith('--haze-weight-')) return 'Font weight step.';
  if (token.category === 'spacing') {
    return token.name === '--haze-space-0'
      ? 'Zero spacing — resets.'
      : 'Spacing step — padding, gap, margin.';
  }
  if (token.name === '--haze-radius-full') return 'Fully rounded — pills, circles.';
  if (token.name === '--haze-radius-none') return 'Square corners.';
  if (token.category === 'radius') return 'Corner rounding step.';
  return 'Elevation shadow.';
}

const TOKENS_WITH_USAGE: {token: TokenDef; usage: string}[] =
  TOKEN_REGISTRY.map((token) => ({token, usage: describeToken(token)}));

/* registry 键是无分隔小写（confirmdialog）；用 COMPONENT_GROUPS 换算展示名
 * 与文档路由，查不到时退回原始键。 */
const ITEM_BY_FLAT_NAME = new Map<string, ComponentItem>();
for (const group of COMPONENT_GROUPS) {
  for (const item of group.items) {
    ITEM_BY_FLAT_NAME.set(
      item.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      item
    );
  }
}

type ComponentTokenMeta = {
  key: string;
  name: string;
  route: string | null;
  tokens: string[];
};

const ALL_COMPONENTS: ComponentTokenMeta[] = Object.keys(COMPONENT_TOKENS)
  .sort()
  .map((key) => {
    const item = ITEM_BY_FLAT_NAME.get(key);
    return {
      key,
      name: item?.name ?? key,
      route: item?.route ?? null,
      tokens: COMPONENT_TOKENS[key] ?? [],
    };
  });

function tokenMatches(token: TokenDef, usage: string, q: string): boolean {
  return (
    token.name.includes(q) ||
    token.label.toLowerCase().includes(q) ||
    token.category.includes(q) ||
    usage.toLowerCase().includes(q) ||
    token.light.toLowerCase().includes(q) ||
    token.dark.toLowerCase().includes(q)
  );
}

function componentMatches(component: ComponentTokenMeta, q: string): boolean {
  if (
    component.key.includes(q) ||
    component.name.toLowerCase().includes(q)
  ) {
    return true;
  }
  return component.tokens.some((t) => t.includes(q));
}

/* ---- 渲染 ---- */

function ModeHeader({mode, active}: {mode: ResolvedMode; active: boolean}) {
  return (
    <span className={modeHeader}>
      {mode === 'light' ? 'Light' : 'Dark'}
      {active && <span className={modeTag}>current</span>}
    </span>
  );
}

function TokenValue({token, mode}: {token: TokenDef; mode: ResolvedMode}) {
  const value = mode === 'light' ? token.light : token.dark;
  if (token.type !== 'color') {
    return <span className={valueText}>{value}</span>;
  }
  return (
    <span className={swatchCell}>
      <span className={staticSwatch} style={{background: value}} />
      <span className={valueText}>{value}</span>
    </span>
  );
}

export default function Tokens() {
  const {resolvedMode} = useTheme();
  const [filter, setFilter] = useState('');
  const q = filter.trim().toLowerCase();

  const filteredByCategory = useMemo(() => {
    const map = new Map<TokenDef['category'], {token: TokenDef; usage: string}[]>();
    for (const category of ALL_CATEGORIES) {
      map.set(
        category,
        TOKENS_WITH_USAGE.filter(
          ({token, usage}) =>
            token.category === category &&
            (q === '' || tokenMatches(token, usage, q))
        )
      );
    }
    return map;
  }, [q]);

  const matchedRegistry = useMemo(
    () =>
      ALL_CATEGORIES.reduce(
        (sum, category) => sum + (filteredByCategory.get(category)?.length ?? 0),
        0
      ),
    [filteredByCategory]
  );

  const filteredComponents = useMemo(
    () =>
      q === ''
        ? ALL_COMPONENTS
        : ALL_COMPONENTS.filter((component) => componentMatches(component, q)),
    [q]
  );

  return (
    <div className={page}>
      <h1>Tokens</h1>
      <p className={intro}>
        Every visual decision in Haze UI — color, typography, spacing, radius,
        shadow — resolves to a <code>--haze-*</code> design token. This page
        renders the library&rsquo;s <code>TOKEN_REGISTRY</code> and{' '}
        <code>COMPONENT_TOKENS</code> directly: the same source that feeds the
        W3C design-token JSON (<code>haze-ui/design-tokens/*.json</code>) and
        the MCP <code>haze_get_tokens</code> tool. Color swatches marked
        &ldquo;live&rdquo; reference the CSS variable, so they follow the
        site-wide theme switcher (including custom brand themes); the Light /
        Dark columns show the registry&rsquo;s resolved default-theme values.
      </p>

      <div className={filterBar}>
        <Input
          size='sm'
          className={filterInput}
          placeholder='Filter tokens, values or components…'
          aria-label='Filter tokens'
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <span className={countText}>
          {matchedRegistry} / {TOKEN_REGISTRY.length} tokens ·{' '}
          {filteredComponents.length} / {ALL_COMPONENTS.length} components
        </span>
      </div>

      {matchedRegistry === 0 && filteredComponents.length === 0 && q !== '' ? (
        <p className={noMatch}>
          No tokens or components match &ldquo;{filter.trim()}&rdquo;.
        </p>
      ) : (
        ALL_CATEGORIES.map((category) => {
          const entries = filteredByCategory.get(category) ?? [];
          if (entries.length === 0) return null;
          return (
            <div key={category} className={section}>
              <h2>
                {CATEGORY_TITLE[category] ?? titleCase(category)}
                <span className={sectionCount}>{entries.length}</span>
              </h2>
              <p className={paragraph}>
                {CATEGORY_BLURB[category] ?? 'Design tokens in this category.'}
              </p>
              <div className={tableWrap}>
                <table className={table}>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Usage</th>
                      <th>
                        <ModeHeader mode='light' active={resolvedMode === 'light'} />
                      </th>
                      <th>
                        <ModeHeader mode='dark' active={resolvedMode === 'dark'} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(({token, usage}) => (
                      <tr key={token.name}>
                        <td>
                          <div className={tokenCell}>
                            {token.type === 'color' && (
                              <span
                                className={liveSwatch}
                                data-live={token.name}
                                style={{background: `var(${token.name})`}}
                              />
                            )}
                            <div>
                              <code className={varName}>{token.name}</code>
                              <div className={tokenLabel}>{token.label}</div>
                            </div>
                          </div>
                        </td>
                        <td className={usageCell}>{usage}</td>
                        <td>
                          <TokenValue token={token} mode='light' />
                        </td>
                        <td>
                          <TokenValue token={token} mode='dark' />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      <div className={section}>
        <h2>
          Component tokens
          <span className={sectionCount}>{filteredComponents.length}</span>
        </h2>
        <p className={paragraph}>
          <code>COMPONENT_TOKENS</code> maps every component to the tokens its
          stylesheet consumes — the same registry that powers the per-component
          token tables on each component page. Filter by a token name to see
          which components depend on it.
        </p>
        <div className={compList}>
          {filteredComponents.map(({key, name, route, tokens}) => (
            <div key={key} className={compRow} data-component={key}>
              <div className={compHead}>
                {route ? (
                  <Link className={compLink} to={`/components/${route}`}>
                    {name}
                  </Link>
                ) : (
                  <span className={compName}>{name}</span>
                )}
                <span className={compCount}>
                  {tokens.length > 0 ? `${tokens.length} tokens` : 'no tokens'}
                </span>
              </div>
              {tokens.length > 0 ? (
                <div className={chipRow}>
                  {tokens.map((t) => (
                    <code key={t} className={chip}>
                      {t}
                    </code>
                  ))}
                </div>
              ) : (
                <div className={noTokens}>—</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
