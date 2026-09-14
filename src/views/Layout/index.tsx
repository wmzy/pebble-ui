import { useEffect, useMemo, useState } from 'react';
import { css } from '@linaria/core';
import { useControl } from 'react-use-control';
import { Link, PrefetchLink, View } from '@native-router/react';

import { Sun, Moon, Monitor, Palette, Star, Menu } from 'lucide-react';

import {
  lightTheme,
  darkTheme,
  spacing,
  typography,
  Flex,
  List,
  ListItem,
  Disclosure,
  Button,
  Icon,
  Tooltip,
  Select,
  Option,
  Drawer,
  Segmented,
  useMediaQuery,
} from '@/lib';
import { useTheme } from '@/contexts/theme';
import { fill, useSiteLocale } from '@/views/i18n';
import { sourceUrl, shortCommit, versionInfo } from '@/views/version-info';

import SidebarSearch, { MatchText } from './SidebarSearch';
import CommandPalette from './CommandPalette';
import {
  ALIASES,
  COMPONENT_GROUPS,
  type ComponentItem,
} from './component-groups';
import { filterComponents } from './search-score';

const rootLayout = css`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const header = css`
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--haze-space-3);
  padding: 0 var(--haze-space-4);
  border-bottom: 1px solid var(--haze-color-border);
  background: var(--haze-color-bg-subtle);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
`;

const headerSpacer = css`
  flex: 1;
`;

const headerLink = css`
  display: inline-flex;
  align-items: center;
  color: var(--haze-color-text-secondary);
  transition: color 0.15s;

  &:hover {
    color: var(--haze-color-text);
  }
`;

const githubBtn = css`
  display: inline-flex;
  align-items: center;
  gap: var(--haze-space-2);
  padding: var(--haze-space-1) var(--haze-space-3);
  border: 1px solid var(--haze-color-border);
  border-radius: var(--haze-radius-md);
  background: var(--haze-color-bg);
  color: var(--haze-color-text);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  text-decoration: none;
  transition:
    background 0.15s,
    border-color 0.15s;
  white-space: nowrap;

  &:hover {
    background: var(--haze-color-bg-subtle);
    border-color: var(--haze-color-border-hover);
  }
`;

const starCount = css`
  color: var(--haze-color-text-secondary);
  font-weight: var(--haze-weight-normal);
`;

/* 页头版本徽标：链接到当前文档对应 tag 的源码 tree。 */
const versionTag = css`
  color: var(--haze-color-text-muted);
  font-family: var(--haze-font-mono);
  font-size: var(--haze-text-xs);
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: var(--haze-color-text);
  }
`;

const body = css`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const sidebar = css`
  width: 240px;
  flex-shrink: 0;
  height: 100%;
  border-right: 1px solid var(--haze-color-border);
  display: flex;
  flex-direction: column;
  background: var(--haze-color-bg);

  @media (max-width: 768px) {
    display: none;
  }
`;

const brand = css`
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--haze-space-4);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-lg);
  font-weight: var(--haze-weight-bold);
  color: var(--haze-color-primary);
  text-decoration: none;
  flex-shrink: 0;
  border-bottom: 1px solid var(--haze-color-border);
`;

const navArea = css`
  flex: 1;
  overflow-y: auto;
  padding: var(--haze-space-2) 0;
`;

const navLink = css`
  display: block;
  padding: var(--haze-space-1) var(--haze-space-4);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-secondary);
  text-decoration: none;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: var(--haze-color-text);
    background: var(--haze-color-bg-subtle);
  }
`;

/* 指南链接的一行摘要（仅 zh 模式渲染；en 侧边栏保持原样）。 */
const navSummary = css`
  padding: 0 var(--haze-space-4);
  margin-top: calc(-1 * var(--haze-space-1));
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  line-height: var(--haze-leading-tight);
  color: var(--haze-color-text-muted);
`;

const disclosureNav = css`
  border: none;
  border-radius: 0;

  & > summary {
    padding: var(--haze-space-1) var(--haze-space-4);
    font-size: var(--haze-text-sm);
    color: var(--haze-color-text-secondary);
  }

  & > div {
    padding: 0;
    border-top: none;
  }
`;

const groupSection = css`
  padding-bottom: var(--haze-space-2);
`;

const groupTitle = css`
  padding: var(--haze-space-2) var(--haze-space-4) var(--haze-space-1);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-xs);
  font-weight: var(--haze-weight-medium);
  color: var(--haze-color-text-muted);
  text-transform: uppercase;
`;

const noResult = css`
  padding: var(--haze-space-1) var(--haze-space-4);
  font-family: var(--haze-font-sans);
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text-muted);
`;

const mainContent = css`
  flex: 1;
  overflow-y: auto;
  background: var(--haze-color-bg);
`;

/* 与 MOBILE_QUERY 保持同一断点；CSS 负责隐藏，JS 负责汉堡/Drawer。 */
const menuBtnWrap = css`
  display: flex;

  @media (min-width: 769px) {
    display: none;
  }
`;

const drawerBody = css`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MOBILE_QUERY = '(max-width: 768px)';

const ALL_ITEMS: ComponentItem[] = COMPONENT_GROUPS.flatMap((g) => g.items);

/* 搜索候选以展示名小写为键（与 props.json 的 routeKey 一致），便于命中
 * 位置直接对展示名高亮；ALIASES 按 route 键入，这里换算到搜索键。 */
const SEARCH_NAMES = ALL_ITEMS.map((item) => item.name.toLowerCase());

const ITEM_BY_SEARCH_NAME = new Map(
  ALL_ITEMS.map((item) => [item.name.toLowerCase(), item])
);

const SEARCH_ALIASES: Record<string, string[]> = {};
for (const item of ALL_ITEMS) {
  const aliases = ALIASES[item.route];
  if (aliases) SEARCH_ALIASES[item.name.toLowerCase()] = aliases;
}

const REPO = 'wmzy/haze-ui';
const STAR_CACHE_KEY = 'haze-ui-stars';

/* Localized group title: zh overrides sit in the locale dictionary keyed
 * by the canonical English group name; unknown groups fall back to it. */
function groupLabel(groups: Record<string, string>, name: string): string {
  return groups[name] ?? name;
}

function useStarCount(): number | null {
  const [count, setCount] = useState<number | null>(() => {
    try {
      const cached = JSON.parse(
        localStorage.getItem(STAR_CACHE_KEY) ?? '{}'
      ) as { v?: number; t?: number };
      if (cached.v != null && cached.t && Date.now() - cached.t < 3600_000)
        return cached.v;
    } catch {
      /* ignore */
    }
    return null;
  });

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const stars = (data as Record<string, unknown>).stargazers_count;
        if (typeof stars === 'number') {
          setCount(stars);
          localStorage.setItem(
            STAR_CACHE_KEY,
            JSON.stringify({ v: stars, t: Date.now() })
          );
        }
      })
      .catch(() => {
        /* offline */
      });
  }, []);

  return count;
}

type SidebarNavProps = {
  search: string;
  onSearchChange: (value: string) => void;
  /** 抽屉内导航后收起（桌面侧边栏不传）。 */
  onNavigate?: () => void;
};

function SidebarNav({ search, onSearchChange, onNavigate }: SidebarNavProps) {
  const { locale, t } = useSiteLocale();
  const componentMatches = useMemo(
    () => filterComponents(SEARCH_NAMES, search, SEARCH_ALIASES),
    [search]
  );
  const searching = search.trim() !== '';

  /* 指南摘要行：仅 zh 渲染（en 侧边栏保持零变化），摘要文本走词典。
   * 放在 Link 外侧，避免污染链接的 accessible name。 */
  const guideSummary = (summary: string) =>
    locale === 'zh' ? <div className={navSummary}>{summary}</div> : null;

  return (
    <List variant='none'>
      <ListItem>
        <Link className={navLink} to='/' onClick={onNavigate}>
          {t.nav.home}
        </Link>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/getting-started' onClick={onNavigate}>
          {t.nav.gettingStarted}
        </Link>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/recipes' onClick={onNavigate}>
          {t.nav.recipes}
        </Link>
      </ListItem>
      <ListItem>
        <Disclosure
          open={true}
          summary={t.nav.guides}
          className={disclosureNav}
        >
          <List variant='none'>
            <ListItem>
              <Link
                className={navLink}
                to='/guides/dark-mode'
                onClick={onNavigate}
              >
                {t.guides.darkMode}
              </Link>
              {guideSummary(t.guideSummaries.darkMode)}
            </ListItem>
            <ListItem>
              <Link
                className={navLink}
                to='/guides/density'
                onClick={onNavigate}
              >
                {t.guides.density}
              </Link>
              {guideSummary(t.guideSummaries.density)}
            </ListItem>
            <ListItem>
              <Link className={navLink} to='/guides/a11y' onClick={onNavigate}>
                {t.guides.a11y}
              </Link>
              {guideSummary(t.guideSummaries.a11y)}
            </ListItem>
            <ListItem>
              <Link
                className={navLink}
                to='/guides/migration'
                onClick={onNavigate}
              >
                {t.guides.migration}
              </Link>
              {guideSummary(t.guideSummaries.migration)}
            </ListItem>
            <ListItem>
              <Link
                className={navLink}
                to='/guides/streaming-a11y'
                onClick={onNavigate}
              >
                {t.guides.streamingA11y}
              </Link>
              {guideSummary(t.guideSummaries.streamingA11y)}
            </ListItem>
            <ListItem>
              <Link className={navLink} to='/guides/motion' onClick={onNavigate}>
                {t.guides.motion}
              </Link>
              {guideSummary(t.guideSummaries.motion)}
            </ListItem>
          </List>
        </Disclosure>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/tokens' onClick={onNavigate}>
          {t.nav.tokens}
        </Link>
      </ListItem>
      <ListItem>
        <Disclosure
          open={true}
          summary={t.nav.components}
          className={disclosureNav}
        >
          <List variant='none'>
            <ListItem>
              <Link className={navLink} to='/components' onClick={onNavigate}>
                {t.nav.overview}
              </Link>
            </ListItem>
            <ListItem>
              <SidebarSearch value={search} onChange={onSearchChange} />
            </ListItem>
            {searching ? (
              <>
                {componentMatches.map((match) => {
                  const item = ITEM_BY_SEARCH_NAME.get(match.name);
                  if (!item) return null;
                  return (
                    <ListItem key={item.route}>
                      <Link
                        className={navLink}
                        to={`/components/${item.route}`}
                        onClick={onNavigate}
                      >
                        <MatchText text={item.name} indices={match.indices} />
                      </Link>
                    </ListItem>
                  );
                })}
                {componentMatches.length === 0 && (
                  <ListItem>
                    <div className={noResult}>
                      {fill(t.chrome.noComponentsMatch, {
                        query: search.trim(),
                      })}
                    </div>
                  </ListItem>
                )}
              </>
            ) : (
              COMPONENT_GROUPS.map((group) => (
                <div key={group.group} className={groupSection}>
                  <div className={groupTitle}>
                    {groupLabel(t.componentGroups, group.group)}
                  </div>
                  {group.items.map((item) => (
                    <Link
                      key={item.route}
                      className={navLink}
                      to={`/components/${item.route}`}
                      onClick={onNavigate}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ))
            )}
          </List>
        </Disclosure>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/ai-showcase' onClick={onNavigate}>
          {t.nav.aiShowcase}
        </Link>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/theme-editor' onClick={onNavigate}>
          {t.nav.themeEditor}
        </Link>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/changelog' onClick={onNavigate}>
          {t.nav.changelog}
        </Link>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/help' onClick={onNavigate}>
          {t.nav.help}
        </Link>
      </ListItem>
      <ListItem>
        <Link className={navLink} to='/about' onClick={onNavigate}>
          {t.nav.about}
        </Link>
      </ListItem>
    </List>
  );
}

export default function Layout() {
  const {
    baseTheme,
    resolvedMode,
    setBaseTheme,
    customThemes,
    activeCustomThemeId,
    setActiveTheme,
    activeCustomThemeStyle,
  } = useTheme();
  const { locale, setLocale, t } = useSiteLocale();

  const stars = useStarCount();

  const [search, setSearch] = useState('');
  // Drawer 的 open 是 ControlOrValue：传原始布尔值等于非受控初值（后续
  // prop 变化会被忽略），要随汉堡按钮切换必须传 Control。
  const [, setDrawerOpen, drawerOpenCtrl] = useControl(undefined, false);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // 断点回到桌面时收起抽屉，常驻侧边栏接管导航。
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile, setDrawerOpen]);

  const themeClass = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div
      className={rootLayout}
      x-class={[themeClass, spacing, typography]}
      style={activeCustomThemeStyle}
    >
      <header className={header}>
        <div className={menuBtnWrap}>
          <Button
            size='sm'
            square
            variant='ghost'
            aria-label={t.chrome.openNavigation}
            onClick={() => setDrawerOpen(true)}
          >
            <Icon icon={Menu} size='sm' />
          </Button>
        </div>
        <Flex gap='var(--haze-space-1)'>
          <Tooltip content={t.chrome.light}>
            <Button
              size='sm'
              square
              variant={baseTheme === 'light' ? 'solid' : 'ghost'}
              onClick={() => setBaseTheme('light')}
            >
              <Icon icon={Sun} size='sm' />
            </Button>
          </Tooltip>
          <Tooltip content={t.chrome.dark}>
            <Button
              size='sm'
              square
              variant={baseTheme === 'dark' ? 'solid' : 'ghost'}
              onClick={() => setBaseTheme('dark')}
            >
              <Icon icon={Moon} size='sm' />
            </Button>
          </Tooltip>
          <Tooltip content={t.chrome.auto}>
            <Button
              size='sm'
              square
              variant={baseTheme === 'auto' ? 'solid' : 'ghost'}
              onClick={() => setBaseTheme('auto')}
            >
              <Icon icon={Monitor} size='sm' />
            </Button>
          </Tooltip>
        </Flex>
        <Tooltip content={t.chrome.language}>
          <Segmented
            size='sm'
            options={[
              { value: 'en', label: 'EN' },
              { value: 'zh', label: '中文' },
            ]}
            value={locale}
            onChange={(next) => setLocale(next === 'zh' ? 'zh' : 'en')}
          />
        </Tooltip>
        {customThemes.length > 0 && (
          <Select
            size='sm'
            value={activeCustomThemeId ?? ''}
            onChange={(e) => setActiveTheme(e.target.value || null)}
          >
            <Option value=''>{t.chrome.noCustomTheme}</Option>
            {customThemes.map((cTheme) => (
              <Option key={cTheme.id} value={cTheme.id}>
                {cTheme.name}
              </Option>
            ))}
          </Select>
        )}
        <Tooltip content={t.chrome.themeEditor}>
          <Link className={headerLink} to='/theme-editor'>
            <Icon icon={Palette} size='sm' />
          </Link>
        </Tooltip>
        <div className={headerSpacer} />
        <CommandPalette />
        <a
          className={versionTag}
          href={sourceUrl}
          target='_blank'
          rel='noreferrer'
          title={
            shortCommit
              ? fill(t.chrome.viewSourceAt, {
                  version: versionInfo.version,
                  commit: shortCommit,
                })
              : t.chrome.viewSource
          }
        >
          {versionInfo.version}
        </a>
        <a
          className={githubBtn}
          href={`https://github.com/${REPO}`}
          target='_blank'
          rel='noreferrer'
        >
          <Icon icon={Star} size='sm' />
          {t.chrome.starOnGitHub}
          {stars != null && <span className={starCount}>{stars}</span>}
        </a>
      </header>
      <div className={body}>
        <aside className={sidebar}>
          <PrefetchLink className={brand} to='/'>
            Haze UI
          </PrefetchLink>
          <nav className={navArea}>
            <SidebarNav search={search} onSearchChange={setSearch} />
          </nav>
        </aside>
        <main className={mainContent}>
          <View />
        </main>
      </div>
      <Drawer open={drawerOpenCtrl} placement='left' onClose={closeDrawer}>
        <div className={drawerBody}>
          <PrefetchLink className={brand} to='/' onClick={closeDrawer}>
            Haze UI
          </PrefetchLink>
          <nav className={navArea}>
            <SidebarNav
              search={search}
              onSearchChange={setSearch}
              onNavigate={closeDrawer}
            />
          </nav>
        </div>
      </Drawer>
    </div>
  );
}
