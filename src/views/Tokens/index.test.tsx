import type {Route} from '@native-router/react';

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from '@native-router/react';

import {COMPONENT_TOKENS, TOKEN_REGISTRY} from '@/lib';
import {ThemeProvider, useTheme} from '@/contexts/theme';

import Tokens from './index';

/*
 * /tokens 总览页契约：
 * - TOKEN_REGISTRY 全量渲染（数据行数对账，抽样 light/dark 解析值）；
 * - COMPONENT_TOKENS 区全量渲染（每组件一行）；
 * - 客户端过滤（token 名/分类/值 + 组件名/其令牌）；
 * - live swatch 引用 var(--haze-*)，当前模式列随站级主题切换。
 */

// jsdom 30 没有 matchMedia——ThemeProvider 的 getSystemPreference 与
// prefers-color-scheme 订阅都需要。默认不匹配（system → light）；本页只
// 关心这一条查询，其它查询进来即抛错。
function installPrefersScheme() {
  const query = '(prefers-color-scheme: dark)';
  window.matchMedia = ((q: string): MediaQueryList => {
    if (q !== query) throw new Error(`unexpected query: ${q}`);
    return {
      matches: false,
      media: q,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    };
  });
}

const routes = [
  {path: '/tokens', component: () => Promise.resolve({default: () => null})},
  {path: '/components/:name', component: () => Promise.resolve({default: () => null})},
] as Route[];

function renderTokens() {
  return render(
    <ThemeProvider>
      <MemoryRouter routes={routes} initialEntries={['/tokens']}>
        <Tokens />
      </MemoryRouter>
    </ThemeProvider>
  );
}

function categoryCount(): number {
  return new Set(TOKEN_REGISTRY.map((t) => t.category)).size;
}

/** 数据行 + 每个非空分类一个表头行。 */
function expectedRowCount(): number {
  return TOKEN_REGISTRY.length + categoryCount();
}

describe('Tokens overview page', () => {
  beforeEach(() => {
    installPrefersScheme();
    localStorage.clear();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('renders every TOKEN_REGISTRY entry with light and dark values', () => {
    renderTokens();

    expect(screen.getAllByRole('row')).toHaveLength(expectedRowCount());

    const primary = TOKEN_REGISTRY.find(
      (t) => t.name === '--haze-color-primary'
    );
    expect(primary).toBeDefined();
    expect(screen.getAllByText(primary!.light).length).toBeGreaterThan(0);
    expect(screen.getAllByText(primary!.dark).length).toBeGreaterThan(0);
  });

  it('renders the COMPONENT_TOKENS section with every component', () => {
    const {container} = renderTokens();

    const rows = container.querySelectorAll('[data-component]');
    expect(rows).toHaveLength(Object.keys(COMPONENT_TOKENS).length);

    // registry 键是无分隔小写；展示名换算自 COMPONENT_GROUPS。
    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getByText('ConfirmDialog')).toBeInTheDocument();
    // button 的令牌 chip 里包含其尺寸令牌。
    expect(screen.getAllByText('--haze-button-height-md').length).toBeGreaterThan(0);
  });

  it('renders live color swatches referencing the css variable', () => {
    const {container} = renderTokens();

    const live = container.querySelector('[data-live="--haze-color-primary"]');
    expect(live).not.toBeNull();
    expect(live!.getAttribute('style')).toContain(
      'var(--haze-color-primary)'
    );
  });

  it('filters tokens and components client-side', async () => {
    const user = userEvent.setup();
    renderTokens();

    const input = screen.getByRole('textbox', {name: 'Filter tokens'});
    await user.type(input, 'radius-full');

    // 只剩 radius 分类里的 --haze-radius-full 一行（1 表头 + 1 数据）。
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(
      screen.getAllByText('--haze-radius-full').length
    ).toBeGreaterThan(0);
    // 消费该令牌的组件仍在组件令牌区。
    expect(screen.getByText('Badge')).toBeInTheDocument();
    // 未使用它的组件被过滤掉。
    expect(screen.queryByText('List')).not.toBeInTheDocument();

    // 清空回到全量。
    await user.clear(input);
    expect(screen.getAllByRole('row')).toHaveLength(expectedRowCount());
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderTokens();

    await user.type(
      screen.getByRole('textbox', {name: 'Filter tokens'}),
      'zzzz-nothing'
    );

    expect(screen.queryByRole('row')).not.toBeInTheDocument();
    expect(
      screen.getByText(/no tokens or components match/i)
    ).toBeInTheDocument();
  });

  it('marks the active mode column and follows site theme switches', async () => {
    const user = userEvent.setup();

    function ModeSwitch() {
      const {setBaseTheme} = useTheme();
      return (
        <button onClick={() => setBaseTheme('dark')}>go dark</button>
      );
    }

    render(
      <ThemeProvider>
        <MemoryRouter routes={routes} initialEntries={['/tokens']}>
          <ModeSwitch />
          <Tokens />
        </MemoryRouter>
      </ThemeProvider>
    );

    // 默认 light：每个分类表一个 current 标记，全部落在 Light 列。
    const lightTags = screen.getAllByText('current');
    expect(lightTags).toHaveLength(categoryCount());
    for (const tag of lightTags) {
      expect(tag.closest('th')?.textContent).toContain('Light');
    }

    await user.click(screen.getByRole('button', {name: 'go dark'}));
    const darkTags = screen.getAllByText('current');
    expect(darkTags).toHaveLength(categoryCount());
    for (const tag of darkTags) {
      expect(tag.closest('th')?.textContent).toContain('Dark');
    }
  });
});
