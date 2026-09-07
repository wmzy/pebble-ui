import type { ReactNode } from 'react';

import { expect } from 'vitest';

import { render } from '@testing-library/react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

import Chart from './Chart';
import { chartElement, resolveChartSeries, seriesElement } from './chart-elements';

type SalesDatum = { month: string; sales: number; costs: number };

const DATA: SalesDatum[] = [
  { month: 'Jan', sales: 12, costs: 8 },
  { month: 'Feb', sales: 18, costs: 10 },
  { month: 'Mar', sales: 9, costs: 7 },
];

/* jsdom reports ResponsiveContainer's box as 0×0, so real recharts never
 * draws a chart. The module mock swaps every component for a vi.fn that
 * renders a data-* div, making both the props Chart passes (via mock call
 * arguments) and the resulting structure (via the DOM) observable. */
vi.mock('recharts', async () => {
  const { createElement } = await import('react');

  const frame = (name: string) =>
    vi.fn((props: Record<string, unknown>) =>
      createElement(
        'div',
        { [`data-${name}`]: '' },
        props.children as ReactNode
      )
    );

  const plotted = (name: string) =>
    vi.fn((props: Record<string, unknown>) =>
      createElement('div', {
        [`data-${name}`]: '',
        'data-key': props.dataKey as string,
        'data-name': props.name as string,
        'data-color': (props.stroke ?? props.fill) as string,
      })
    );

  return {
    ResponsiveContainer: frame('responsive-container'),
    LineChart: frame('line-chart'),
    AreaChart: frame('area-chart'),
    BarChart: frame('bar-chart'),
    XAxis: frame('x-axis'),
    YAxis: frame('y-axis'),
    CartesianGrid: frame('grid'),
    Tooltip: frame('tooltip'),
    Legend: frame('legend'),
    Line: plotted('line'),
    Area: plotted('area'),
    Bar: plotted('bar'),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveChartSeries', () => {
  it('falls label back to key and cycles the semantic color tokens', () => {
    const resolved = resolveChartSeries([
      { key: 'a' },
      { key: 'b' },
      { key: 'c' },
      { key: 'd' },
      { key: 'e' },
      { key: 'f' },
    ]);

    expect(resolved.map(({ label }) => label)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
    expect(resolved.map(({ color }) => color)).toEqual([
      'var(--haze-color-primary)',
      'var(--haze-color-info)',
      'var(--haze-color-success)',
      'var(--haze-color-warning)',
      'var(--haze-color-danger)',
      'var(--haze-color-primary)',
    ]);
  });

  it('keeps explicit labels and colors', () => {
    expect(
      resolveChartSeries([
        {
          key: 'sales',
          label: 'Revenue',
          color: 'var(--haze-color-text)',
        },
      ])
    ).toEqual([
      { key: 'sales', label: 'Revenue', color: 'var(--haze-color-text)' },
    ]);
  });
});

describe('seriesElement', () => {
  const entry = {
    key: 'sales',
    label: 'Revenue',
    color: 'var(--haze-color-primary)',
  };

  it('maps the chart type to the matching recharts series component', () => {
    expect(seriesElement('line', entry).type).toBe(Line);
    expect(seriesElement('area', entry).type).toBe(Area);
    expect(seriesElement('bar', entry).type).toBe(Bar);
  });

  it('strokes line and area series, fills bar series', () => {
    expect(seriesElement('line', entry).props).toEqual({
      dataKey: 'sales',
      name: 'Revenue',
      stroke: 'var(--haze-color-primary)',
    });
    expect(seriesElement('area', entry).props).toEqual({
      dataKey: 'sales',
      name: 'Revenue',
      stroke: 'var(--haze-color-primary)',
      fill: 'var(--haze-color-primary)',
    });
    expect(seriesElement('bar', entry).props).toEqual({
      dataKey: 'sales',
      name: 'Revenue',
      fill: 'var(--haze-color-primary)',
    });
  });
});

describe('chartElement', () => {
  it('maps the chart type to the matching recharts container and forwards data', () => {
    expect(chartElement('line', DATA, null).type).toBe(LineChart);
    expect(chartElement('area', DATA, null).type).toBe(AreaChart);
    expect(chartElement('bar', DATA, null).props).toEqual(
      expect.objectContaining({ data: DATA })
    );
  });
});

describe('Chart', () => {
  it('renders the fixed-height container with merged className', () => {
    const { container } = render(
      <Chart
        type='line'
        data={DATA}
        series={[{ key: 'sales' }]}
        xKey='month'
        className='custom'
      />
    );
    const rootEl = container.firstElementChild as HTMLElement;
    expect(rootEl).toHaveClass('custom');
    expect(rootEl).toHaveStyle({ height: '300px' });
  });

  it('applies a custom height and forwards data-* attributes', () => {
    const { container } = render(
      <Chart
        type='line'
        data={DATA}
        series={[{ key: 'sales' }]}
        xKey='month'
        height={420}
        data-chart-source='demo'
      />
    );
    const rootEl = container.firstElementChild as HTMLElement;
    expect(rootEl).toHaveStyle({ height: '420px' });
    expect(rootEl).toHaveAttribute('data-chart-source', 'demo');
  });

  it('stretches a ResponsiveContainer into the matching chart container', () => {
    const { container } = render(
      <Chart type='line' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );
    expect(ResponsiveContainer).toHaveBeenCalledWith(
      expect.objectContaining({ width: '100%', height: '100%' }),
      undefined
    );
    expect(
      container.querySelector('[data-responsive-container] [data-line-chart]')
    ).toBeInTheDocument();
  });

  it('passes data and xKey through to the chart', () => {
    render(
      <Chart type='line' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );
    expect(LineChart).toHaveBeenCalledWith(
      expect.objectContaining({ data: DATA }),
      undefined
    );
    expect(XAxis).toHaveBeenCalledWith(
      expect.objectContaining({ dataKey: 'month' }),
      undefined
    );
  });

  it('renders one line per series with resolved names and cycled colors', () => {
    const { container } = render(
      <Chart
        type='line'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }, { key: 'costs' }]}
        xKey='month'
      />
    );
    const lines = container.querySelectorAll('[data-line]');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveAttribute('data-name', 'Revenue');
    expect(lines[0]).toHaveAttribute('data-color', 'var(--haze-color-primary)');
    expect(lines[1]).toHaveAttribute('data-name', 'costs');
    expect(lines[1]).toHaveAttribute('data-color', 'var(--haze-color-info)');
  });

  it('renders area and bar charts through their matching components', () => {
    const { rerender } = render(
      <Chart type='area' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );
    expect(AreaChart).toHaveBeenCalledTimes(1);
    expect(Area).toHaveBeenCalledWith(
      expect.objectContaining({
        dataKey: 'sales',
        stroke: 'var(--haze-color-primary)',
        fill: 'var(--haze-color-primary)',
      }),
      undefined
    );

    rerender(
      <Chart type='bar' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );
    expect(BarChart).toHaveBeenCalledTimes(1);
    expect(Bar).toHaveBeenCalledWith(
      expect.objectContaining({
        dataKey: 'sales',
        fill: 'var(--haze-color-primary)',
      }),
      undefined
    );
  });

  it('honors an explicit series color', () => {
    render(
      <Chart
        type='bar'
        data={DATA}
        series={[{ key: 'sales', color: 'var(--haze-color-text)' }]}
        xKey='month'
      />
    );
    expect(Bar).toHaveBeenCalledWith(
      expect.objectContaining({ fill: 'var(--haze-color-text)' }),
      undefined
    );
  });

  it('toggles grid, tooltip and legend', () => {
    const { rerender } = render(
      <Chart type='line' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );
    expect(CartesianGrid).toHaveBeenCalledTimes(1);
    expect(Tooltip).toHaveBeenCalledTimes(1);
    expect(Legend).not.toHaveBeenCalled();

    rerender(
      <Chart
        type='line'
        data={DATA}
        series={[{ key: 'sales' }]}
        xKey='month'
        showGrid={false}
        showTooltip={false}
        showLegend
      />
    );
    // Grid and tooltip dropped from the tree — their mock counts stay put.
    expect(CartesianGrid).toHaveBeenCalledTimes(1);
    expect(Tooltip).toHaveBeenCalledTimes(1);
    expect(Legend).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { axe } = await import('jest-axe');
    render(
      <Chart
        type='area'
        data={DATA}
        series={[
          { key: 'sales', label: 'Revenue' },
          { key: 'costs', label: 'Costs' },
        ]}
        xKey='month'
        showLegend
      />
    );
    const results = await axe(document.body, {
      rules: { region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
