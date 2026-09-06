import { useEffect, useMemo, useState } from 'react';
import { css } from '@linaria/core';
import { Link, PrefetchLink, View } from '@native-router/react';

import { Sun, Moon, Monitor, Palette, Star } from 'lucide-react';

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
} from '@/lib';
import { useTheme } from '@/contexts/theme';

import SidebarSearch, { MatchText } from './SidebarSearch';
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

const COMPONENTS = [
  'button',
  'input',
  'select',
  'checkbox',
  'switch',
  'badge',
  'dialog',
  'tooltip',
  'popover',
  'card',
  'radio',
  'textarea',
  'slider',
  'tabs',
  'accordion',
  'alert',
  'avatar',
  'tag',
  'skeleton',
  'icon',
  'image',
  'flex',
  'breadcrumb',
  'disclosure',
  'menu',
  'numberinput',
  'fileinput',
  'toast',
  'list',
  'combobox',
  'table',
  'data-table',
  'carousel',
  'datepicker',
  'tree',
  'divider',
  'spinner',
  'empty',
  'progress',
  'pagination',
  'grid',
  'drawer',
  'stepper',
  'command',
  'resizable',
  'collapsible',
  'transfer',
  'upload',
  'colorpicker',
  'rating',
  'timeline',
  'typography',
  'stat',
  'segmented',
  'chip',
  'scrollarea',
  'timepicker',
  'daterangepicker',
  'otpinput',
  'passwordinput',
  'taginput',
  'inlineedit',
  'dropdownmenu',
  'contextmenu',
  'navigationbar',
  'backtotop',
  'affix',
  'container',
  'banner',
  'confirmdialog',
  'codeblock',
  'aspectratio',
  'virtuallist',
  'taggroup',
  'bottomsheet',
  'swipeaction',
  'kbd',
  'avatargroup',
  'calendar',
  'hovercard',
  'toolbar',
  'cascader',
  'sidebar',
  'tour',
  'localeprovider',
  'chatmessage',
  'chatcontainer',
  'chatinput',
  'streamingtext',
  'markdownrenderer',
  'toolcallcard',
  'thinkingindicator',
  'steptimeline',
  'approvalcard',
  'tokencounter',
  'modelpicker',
  'conversationlist',
  'diffviewer',
  'logviewer',
  'form',
] as const;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const REPO = 'wmzy/haze-ui';
const STAR_CACHE_KEY = 'haze-ui-stars';

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

  const stars = useStarCount();

  const [search, setSearch] = useState('');
  const componentMatches = useMemo(
    () => filterComponents(COMPONENTS, search),
    [search]
  );

  const themeClass = resolvedMode === 'dark' ? darkTheme : lightTheme;

  return (
    <div
      className={rootLayout}
      x-class={[themeClass, spacing, typography]}
      style={activeCustomThemeStyle}
    >
      <header className={header}>
        <Flex gap='var(--haze-space-1)'>
          <Tooltip content='Light'>
            <Button
              size='sm'
              square
              variant={baseTheme === 'light' ? 'solid' : 'ghost'}
              onClick={() => setBaseTheme('light')}
            >
              <Icon icon={Sun} size='sm' />
            </Button>
          </Tooltip>
          <Tooltip content='Dark'>
            <Button
              size='sm'
              square
              variant={baseTheme === 'dark' ? 'solid' : 'ghost'}
              onClick={() => setBaseTheme('dark')}
            >
              <Icon icon={Moon} size='sm' />
            </Button>
          </Tooltip>
          <Tooltip content='Auto'>
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
        {customThemes.length > 0 && (
          <Select
            size='sm'
            value={activeCustomThemeId ?? ''}
            onChange={(e) => setActiveTheme(e.target.value || null)}
          >
            <Option value=''>No custom theme</Option>
            {customThemes.map((t) => (
              <Option key={t.id} value={t.id}>
                {t.name}
              </Option>
            ))}
          </Select>
        )}
        <Tooltip content='Theme Editor'>
          <Link className={headerLink} to='/theme-editor'>
            <Icon icon={Palette} size='sm' />
          </Link>
        </Tooltip>
        <div className={headerSpacer} />
        <a
          className={githubBtn}
          href={`https://github.com/${REPO}`}
          target='_blank'
          rel='noreferrer'
        >
          <Icon icon={Star} size='sm' />
          Star on GitHub
          {stars != null && <span className={starCount}>{stars}</span>}
        </a>
      </header>
      <div className={body}>
        <aside className={sidebar}>
          <PrefetchLink className={brand} to='/'>
            Haze UI
          </PrefetchLink>
          <nav className={navArea}>
            <List variant='none'>
              <ListItem>
                <Link className={navLink} to='/'>
                  Home
                </Link>
              </ListItem>
              <ListItem>
                <Link className={navLink} to='/getting-started'>
                  Getting Started
                </Link>
              </ListItem>
              <ListItem>
                <Disclosure
                  open={true}
                  summary='Components'
                  className={disclosureNav}
                >
                  <List variant='none'>
                    <ListItem>
                      <Link className={navLink} to='/components'>
                        Overview
                      </Link>
                    </ListItem>
                    <ListItem>
                      <SidebarSearch value={search} onChange={setSearch} />
                    </ListItem>
                    {componentMatches.map((match) => (
                      <ListItem key={match.name}>
                        <Link
                          className={navLink}
                          to={`/components/${match.name}`}
                        >
                          <MatchText
                            text={capitalize(match.name)}
                            indices={match.indices}
                          />
                        </Link>
                      </ListItem>
                    ))}
                    {search.trim() !== '' && componentMatches.length === 0 && (
                      <ListItem>
                        <div className={noResult}>
                          No components match “{search.trim()}”
                        </div>
                      </ListItem>
                    )}
                  </List>
                </Disclosure>
              </ListItem>
              <ListItem>
                <Link className={navLink} to='/theme-editor'>
                  Theme Editor
                </Link>
              </ListItem>
              <ListItem>
                <Link className={navLink} to='/about'>
                  About
                </Link>
              </ListItem>
            </List>
          </nav>
        </aside>
        <main className={mainContent}>
          <View />
        </main>
      </div>
    </div>
  );
}
