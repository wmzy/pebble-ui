import type { Route } from '@native-router/react';

import { render, screen } from '@testing-library/react';

import { MemoryRouter, View } from '@native-router/react';

import { COMPONENT_GROUPS } from '../Layout/component-groups';

import ComponentDetail from './index';
import { LEGACY_REDIRECTS, suggestComponents } from './legacy-routes';


const ROUTES: string[] = COMPONENT_GROUPS.flatMap((g) =>
  g.items.map((i) => i.route)
);

function renderAt(path: string) {
  const routes = [
    {
      path: '/components/:name',
      component: () => Promise.resolve({ default: ComponentDetail }),
    },
  ] as Route[];
  return render(
    <MemoryRouter routes={routes} initialEntries={[path]}>
      <View />
    </MemoryRouter>
  );
}

describe('LEGACY_REDIRECTS', () => {
  it('maps every legacy lowercase-concat slug to its kebab route', () => {
    expect(LEGACY_REDIRECTS.numberinput).toBe('number-input');
    expect(LEGACY_REDIRECTS.chatmessage).toBe('chat-message');
    expect(LEGACY_REDIRECTS.taggroup).toBe('tag-group');
    expect(LEGACY_REDIRECTS.backtotop).toBe('back-to-top');
  });

  it('covers exactly the hyphenated routes, derived by stripping hyphens', () => {
    const expected = Object.fromEntries(
      ROUTES.filter((route) => route.includes('-')).map((route) => [
        route.replaceAll('-', ''),
        route,
      ])
    );
    expect(LEGACY_REDIRECTS).toEqual(expected);
  });

  it('never shadows a current route', () => {
    // 旧键都是去掉连字符的形态；若有键撞上现存路由，访问新路由反而会被改写
    for (const legacyKey of Object.keys(LEGACY_REDIRECTS)) {
      expect(ROUTES).not.toContain(legacyKey);
    }
  });
});

describe('suggestComponents', () => {
  it('returns fuzzy matches ranked by tier, capped at the limit', () => {
    // 'chat' 前缀档命中三个 chat-* 组件，按侧边栏顺序排列
    expect(suggestComponents('chat')).toEqual([
      { name: 'ChatContainer', route: 'chat-container' },
      { name: 'ChatInput', route: 'chat-input' },
      { name: 'ChatMessage', route: 'chat-message' },
    ]);
  });

  it('finds subsequence matches for misspelled slugs', () => {
    expect(suggestComponents('chatmsg')).toEqual([
      { name: 'ChatMessage', route: 'chat-message' },
    ]);
  });

  it('returns nothing for a slug that matches no component', () => {
    expect(suggestComponents('zzz')).toEqual([]);
  });

  it('respects the limit argument', () => {
    expect(suggestComponents('chat', 1)).toHaveLength(1);
  });
});

describe('ComponentDetail routing', () => {
  it('redirects a legacy slug to its kebab route and renders the demo', async () => {
    renderAt('/components/numberinput');
    // 重定向落地后渲染的是 NumberInputDemo（route 'number-input'）
    expect(await screen.findByText('Sizes')).toBeInTheDocument();
    expect(screen.queryByText(/Component not found/)).not.toBeInTheDocument();
  });

  it('renders not-found with a back link and no suggestions for gibberish', async () => {
    renderAt('/components/zzz');
    expect(
      await screen.findByText('Component not found: zzz')
    ).toBeInTheDocument();
    const back = screen.getByRole('link', { name: 'Back to all components' });
    expect(back).toHaveAttribute('href', '/components');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('suggests the closest matches on not-found', async () => {
    renderAt('/components/chatmsg');
    const suggestion = await screen.findByRole('link', { name: 'ChatMessage' });
    expect(suggestion).toHaveAttribute(
      'href',
      expect.stringContaining('/components/chat-message')
    );
  });

  it('has no axe violations on the not-found view', async () => {
    const { container } = renderAt('/components/zzz');
    await screen.findByText('Component not found: zzz');

    const { axe } = await import('jest-axe');
    const results = await axe(container, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
