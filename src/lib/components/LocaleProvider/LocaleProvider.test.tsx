import { render, screen, within } from '@testing-library/react';

import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import Empty from '../Empty/Empty';
import Pagination from '../Pagination/Pagination';

import LocaleProvider from './LocaleProvider';

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
