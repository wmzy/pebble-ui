import { render, screen, within } from '@testing-library/react';

import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import Empty from '../Empty/Empty';
import Pagination from '../Pagination/Pagination';

import LocaleProvider from './LocaleProvider';
import { defaultStrings, enUS } from './locale';
import { zhCN } from './zh-cn';

describe('LocaleProvider', () => {
  it('renders default copy with no provider mounted', () => {
    render(<Pagination total={20} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('renders default copy for another consuming component', () => {
    render(<Empty />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('overrides Pagination text via the provider', () => {
    render(
      <LocaleProvider
        strings={{ pagination: { previous: '上一页', next: '下一页' } }}
      >
        <Pagination total={20} />
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous' })
    ).not.toBeInTheDocument();
  });

  it('keeps defaults for sections and keys the provider does not touch', () => {
    render(
      <LocaleProvider strings={{ pagination: { previous: '上一页' } }}>
        <Pagination total={20} />
        <Empty />
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    // key not overridden inside the same section falls back to its default
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    // section not overridden at all falls back wholesale
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('lets an explicit prop win over a provider override', () => {
    render(
      <LocaleProvider
        strings={{
          confirmDialog: { confirm: 'Provider Confirm', cancel: 'Provider Cancel' },
        }}
      >
        <ConfirmDialog open title="T" confirmText="Explicit Confirm">
          Body
        </ConfirmDialog>
      </LocaleProvider>
    );
    expect(
      screen.getByRole('button', { name: 'Explicit Confirm' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Provider Cancel' })
    ).toBeInTheDocument();
  });

  it('layers nested providers with the innermost override winning', () => {
    render(
      <LocaleProvider
        strings={{ pagination: { previous: 'Outer Prev', next: 'Outer Next' } }}
      >
        <Pagination total={20} />
        <LocaleProvider strings={{ pagination: { next: 'Inner Next' } }}>
          <Pagination total={20} />
        </LocaleProvider>
      </LocaleProvider>
    );

    const navs = screen.getAllByRole('navigation');
    expect(navs).toHaveLength(2);

    const outer = within(navs[0]!);
    expect(outer.getByRole('button', { name: 'Outer Prev' })).toBeInTheDocument();
    expect(outer.getByRole('button', { name: 'Outer Next' })).toBeInTheDocument();

    // Inner tree: the key the inner provider overrides wins, the silent
    // key inherits the outer override.
    const inner = within(navs[1]!);
    expect(inner.getByRole('button', { name: 'Outer Prev' })).toBeInTheDocument();
    expect(inner.getByRole('button', { name: 'Inner Next' })).toBeInTheDocument();
    expect(
      inner.queryByRole('button', { name: 'Outer Next' })
    ).not.toBeInTheDocument();
  });

  it('maps the zh-CN pack 1:1 onto the default pack', () => {
    const assertSameShape = (en: unknown, zh: unknown, path: string) => {
      expect(typeof zh).toBe(typeof en);
      if (typeof en === 'object' && en !== null) {
        expect(Object.keys(zh as object).sort()).toEqual(
          Object.keys(en).sort()
        );
        for (const key of Object.keys(en)) {
          assertSameShape(
            (en as Record<string, unknown>)[key],
            (zh as Record<string, unknown>)[key],
            `${path}.${key}`
          );
        }
      }
    };
    assertSameShape(defaultStrings, zhCN, 'strings');
  });

  it('keeps enUS as an alias of the default pack', () => {
    expect(enUS).toBe(defaultStrings);
  });

  it('serves the built-in zh-CN pack for locale="zh-CN"', () => {
    render(
      <LocaleProvider locale="zh-CN">
        <Pagination total={20} />
        <Empty />
      </LocaleProvider>
    );
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
  });

  it('maps every Chinese language tag variant to the zh-CN pack', () => {
    for (const locale of ['zh', 'zh-Hans', 'zh_TW']) {
      const { unmount } = render(
        <LocaleProvider locale={locale}>
          <Empty />
        </LocaleProvider>
      );
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
      unmount();
    }
  });

  it('falls back to English for non-Chinese locales', () => {
    render(
      <LocaleProvider locale="fr-FR">
        <Empty />
      </LocaleProvider>
    );
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('layers the strings prop on top of the selected pack', () => {
    render(
      <LocaleProvider
        locale="zh-CN"
        strings={{ empty: { description: '筛选结果为空' } }}
      >
        <Empty />
        <Pagination total={20} />
      </LocaleProvider>
    );
    expect(screen.getByText('筛选结果为空')).toBeInTheDocument();
    // untouched keys keep the pack copy
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
  });

  it('inherits locale down the provider chain with the innermost winning', () => {
    render(
      <LocaleProvider locale="zh-CN">
        <Empty />
        <LocaleProvider>
          <Empty />
        </LocaleProvider>
        <LocaleProvider locale="fr">
          <Empty />
        </LocaleProvider>
      </LocaleProvider>
    );
    expect(screen.getAllByText('暂无数据')).toHaveLength(2);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <LocaleProvider
        locale="zh-CN"
        strings={{ pagination: { previous: '上一页', next: '下一页' } }}
      >
        <Pagination total={20} />
        <Empty description="暂无数据" />
      </LocaleProvider>
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
