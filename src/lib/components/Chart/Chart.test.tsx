import type { ReactNode } from 'react';

import type { ChartTooltipPayload } from './chart-elements';

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
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import Chart from './Chart';
import {
  buildTooltipContent,
  chartElement,
  pieRingRadii,
  resolveChartSeries,
  seriesElement,
} from './chart-elements';

type SalesDatum = { month: string; sales: number; costs: number };

const DATA: SalesDatum[] = [
  { month: 'Jan', sales: 12, costs: 8 },
  { month: 'Feb', sales: 18, costs: 10 },
  { month: 'Mar', sales: 9, costs: 7 },
];

/** The semantic palette cycle pie sectors repeat (mirrors cycleColor). */
const CYCLED = [
  'var(--haze-color-primary)',
  'var(--haze-color-info)',
  'var(--haze-color-success)',
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

  /* Stand-in payload recharts would hand a custom tooltip content function
   * — the mocked Tooltip invokes `content` with it so the bridge mapping
   * and the rendered output stay observable. */
  const tooltipPayloadItem = {
    name: 'Revenue',
    value: 12,
    color: '#ff0000',
    dataKey: 'sales',
    payload: { month: 'Jan', sales: 12, costs: 8 },
  };

  return {
    ResponsiveContainer: frame('responsive-container'),
    LineChart: frame('line-chart'),
    AreaChart: frame('area-chart'),
    BarChart: frame('bar-chart'),
    PieChart: frame('pie-chart'),
    RadarChart: frame('radar-chart'),
    ScatterChart: frame('scatter-chart'),
    XAxis: frame('x-axis'),
    YAxis: frame('y-axis'),
    CartesianGrid: frame('grid'),
    PolarGrid: frame('polar-grid'),
    PolarAngleAxis: frame('polar-angle-axis'),
    PolarRadiusAxis: frame('polar-radius-axis'),
    Tooltip: vi.fn((props: Record<string, unknown>) =>
      createElement(
        'div',
        { 'data-tooltip': '' },
        typeof props.content === 'function'
          ? (props.content as (p: unknown) => ReactNode)({
              payload: [tooltipPayloadItem],
              label: 'Jan',
            })
          : (props.children as ReactNode)
      )
    ),
    Legend: frame('legend'),
    Line: plotted('line'),
    Area: plotted('area'),
    Bar: plotted('bar'),
    Radar: plotted('radar'),
    Scatter: plotted('scatter'),
    Pie: vi.fn((props: Record<string, unknown>) =>
      createElement(
        'div',
        {
          'data-pie': '',
          'data-key': props.dataKey as string,
          'data-name-key': props.nameKey as string,
          'data-inner-radius': String(props.innerRadius),
          'data-outer-radius': String(props.outerRadius),
        },
        props.children as ReactNode
      )
    ),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveChartSeries', () => {
  it('falls label back to key and keeps color explicit-only', () => {
    const resolved = resolveChartSeries([
      { key: 'a' },
      { key: 'b' },
      { key: 'c' },
    ]);

    expect(resolved).toEqual([
      { key: 'a', label: 'a', color: undefined },
      { key: 'b', label: 'b', color: undefined },
      { key: 'c', label: 'c', color: undefined },
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

  it('passes per-series type and stackId through untouched', () => {
    expect(
      resolveChartSeries([
        { key: 'sales', type: 'bar', stackId: 'total' },
        { key: 'costs', type: 'line' },
      ])
    ).toEqual([
      { key: 'sales', label: 'sales', type: 'bar', stackId: 'total' },
      { key: 'costs', label: 'costs', type: 'line' },
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

  it('cycles the semantic tokens per series index when color is omitted', () => {
    expect(seriesElement('line', { key: 'a', label: 'a' }, 1).props).toEqual(
      expect.objectContaining({ stroke: 'var(--haze-color-info)' })
    );
    // sixth series wraps back around the five-token palette
    expect(seriesElement('bar', { key: 'a', label: 'a' }, 5).props).toEqual(
      expect.objectContaining({ fill: 'var(--haze-color-primary)' })
    );
  });

  it('forwards stackId to area and bar, not to line', () => {
    expect(
      seriesElement('area', { ...entry, stackId: 'total' }).props
    ).toEqual({
      dataKey: 'sales',
      name: 'Revenue',
      stroke: 'var(--haze-color-primary)',
      fill: 'var(--haze-color-primary)',
      stackId: 'total',
    });
    expect(seriesElement('bar', { ...entry, stackId: 'total' }).props).toEqual(
      {
        dataKey: 'sales',
        name: 'Revenue',
        fill: 'var(--haze-color-primary)',
        stackId: 'total',
      }
    );
    // stacking is an Area/Bar concern — Line has no baseline to stack onto
    expect(seriesElement('line', { ...entry, stackId: 'total' }).props).toEqual(
      {
        dataKey: 'sales',
        name: 'Revenue',
        stroke: 'var(--haze-color-primary)',
      }
    );
  });

  it('strokes radar polygons with a translucent fill and fills scatter points', () => {
    expect(seriesElement('radar', entry).type).toBe(Radar);
    expect(seriesElement('radar', entry).props).toEqual({
      dataKey: 'sales',
      name: 'Revenue',
      stroke: 'var(--haze-color-primary)',
      fill: 'var(--haze-color-primary)',
      fillOpacity: 0.3,
    });
    expect(seriesElement('scatter', entry).type).toBe(Scatter);
    expect(seriesElement('scatter', entry).props).toEqual({
      dataKey: 'sales',
      name: 'Revenue',
      fill: 'var(--haze-color-primary)',
    });
  });
});

describe('pieRingRadii', () => {
  it('spans a single ring from innerRadius to 80%', () => {
    expect(pieRingRadii(0, 1, 0)).toEqual({
      innerRadius: 0,
      outerRadius: '80%',
    });
    expect(pieRingRadii(0, 1, 60)).toEqual({
      innerRadius: 60,
      outerRadius: '80%',
    });
  });

  it('bands multiple rings evenly, series 0 innermost', () => {
    expect(pieRingRadii(0, 2, 0)).toEqual({
      innerRadius: '0%',
      outerRadius: '40%',
    });
    expect(pieRingRadii(1, 2, 0)).toEqual({
      innerRadius: '40%',
      outerRadius: '80%',
    });
  });

  it('offsets the innermost ring by a percentage innerRadius', () => {
    expect(pieRingRadii(0, 2, '30%')).toEqual({
      innerRadius: '30%',
      outerRadius: '55%',
    });
    expect(pieRingRadii(1, 2, '30%')).toEqual({
      innerRadius: '55%',
      outerRadius: '80%',
    });
  });
});

describe('buildTooltipContent', () => {
  it('maps recharts payload items onto tooltip entries', () => {
    const seen: unknown[] = [];
    const content = buildTooltipContent((payload) => {
      seen.push(payload);
      return 'custom tooltip';
    });

    const rendered = content({
      label: 'Jan',
      payload: [
        {
          name: 'Revenue',
          value: 12,
          color: '#ff0000',
          dataKey: 'sales',
          payload: DATA[0],
        },
        {
          value: 8,
          color: 'var(--haze-color-info)',
          dataKey: 'costs',
          payload: DATA[1],
        },
      ],
    });

    expect(rendered).toBe('custom tooltip');
    expect(seen).toEqual([
      {
        label: 'Jan',
        entries: [
          { name: 'Revenue', value: 12, color: '#ff0000', dataEntry: DATA[0] },
          {
            name: 'costs',
            value: 8,
            color: 'var(--haze-color-info)',
            dataEntry: DATA[1],
          },
        ],
      },
    ]);
  });

  it('defaults missing names, values and colors', () => {
    const seen: unknown[] = [];
    const content = buildTooltipContent((payload) => {
      seen.push(payload);
      return null;
    });

    void content({ payload: [{ value: 3 }] });

    expect(seen).toEqual([
      {
        label: undefined,
        entries: [{ name: '', value: 3, color: '', dataEntry: undefined }],
      },
    ]);
  });
});

describe('chartElement', () => {
  it('maps the chart type to the matching recharts container and forwards data', () => {
    expect(chartElement('line', DATA, null).type).toBe(LineChart);
    expect(chartElement('area', DATA, null).type).toBe(AreaChart);
    expect(chartElement('bar', DATA, null).props).toEqual(
      expect.objectContaining({ data: DATA, layout: 'horizontal' })
    );
    expect(chartElement('pie', DATA, null).type).toBe(PieChart);
  });

  it('passes layout through to cartesian containers', () => {
    expect(chartElement('bar', DATA, null, 'vertical').props).toEqual(
      expect.objectContaining({ layout: 'vertical' })
    );
  });

  it('maps radar and scatter onto their containers without a layout prop', () => {
    const radar = chartElement('radar', DATA, null);
    expect(radar.type).toBe(RadarChart);
    expect(radar.props).toEqual(expect.objectContaining({ data: DATA }));
    expect(radar.props).not.toHaveProperty('layout');
    const scatter = chartElement('scatter', DATA, null);
    expect(scatter.type).toBe(ScatterChart);
    expect(scatter.props).toEqual(expect.objectContaining({ data: DATA }));
    expect(scatter.props).not.toHaveProperty('layout');
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

  it('mixes per-series types inside one cartesian container', () => {
    const { container } = render(
      <Chart
        type='line'
        data={DATA}
        xKey='month'
        series={[
          { key: 'sales', label: 'Revenue', type: 'bar' },
          { key: 'costs', label: 'Costs' },
        ]}
      />
    );
    // both element families render inside the single line chart container
    const bars = container.querySelectorAll('[data-line-chart] [data-bar]');
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAttribute('data-key', 'sales');
    const lines = container.querySelectorAll('[data-line-chart] [data-line]');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveAttribute('data-key', 'costs');
    expect(Bar).toHaveBeenCalledWith(
      expect.objectContaining({
        dataKey: 'sales',
        name: 'Revenue',
        fill: 'var(--haze-color-primary)',
      }),
      undefined
    );
    expect(Line).toHaveBeenCalledWith(
      expect.objectContaining({
        dataKey: 'costs',
        name: 'Costs',
        stroke: 'var(--haze-color-info)',
      }),
      undefined
    );
  });

  it('stacks area series sharing a stackId', () => {
    render(
      <Chart
        type='area'
        data={DATA}
        xKey='month'
        series={[
          { key: 'sales', stackId: 'total' },
          { key: 'costs', stackId: 'total' },
        ]}
      />
    );
    expect(Area).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ dataKey: 'sales', stackId: 'total' }),
      undefined
    );
    expect(Area).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ dataKey: 'costs', stackId: 'total' }),
      undefined
    );
  });

  it('leaves stackId unset when no series declares one', () => {
    render(
      <Chart type='bar' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );
    expect(Bar).toHaveBeenCalledTimes(1);
    const barProps = vi.mocked(Bar).mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(barProps.stackId).toBeUndefined();
  });

  it('ignores per-series type and stackId in polar charts', () => {
    const { container } = render(
      <Chart
        type='radar'
        data={DATA}
        xKey='month'
        series={[
          { key: 'sales', type: 'bar', stackId: 'total' },
          { key: 'costs', type: 'line' },
        ]}
      />
    );
    // one polygon per series: the cartesian-only overrides change neither
    // the element shape nor the stacking, and nothing crashes
    expect(container.querySelectorAll('[data-radar]')).toHaveLength(2);
    expect(container.querySelector('[data-bar]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-line]')).not.toBeInTheDocument();
    const radarProps = vi.mocked(Radar).mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(radarProps).not.toHaveProperty('stackId');
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

  it('renders one pie sector per datum with cycled token colors', () => {
    render(
      <Chart type='pie' data={DATA} series={[{ key: 'sales' }]} xKey='month' />
    );

    expect(PieChart).toHaveBeenCalledWith(
      expect.objectContaining({ data: DATA }),
      undefined
    );
    expect(Pie).toHaveBeenCalledWith(
      expect.objectContaining({
        // per-datum `fill` presentation props replace the deprecated <Cell>
        data: DATA.map((datum, i) => ({
          ...datum,
          fill: CYCLED[i] ?? 'var(--haze-color-warning)',
        })),
        dataKey: 'sales',
        nameKey: 'month',
        innerRadius: 0,
        outerRadius: '80%',
      }),
      undefined
    );

    // polar chart: no cartesian axes or grid
    expect(XAxis).not.toHaveBeenCalled();
    expect(YAxis).not.toHaveBeenCalled();
    expect(CartesianGrid).not.toHaveBeenCalled();
  });

  it('passes innerRadius through to render a donut', () => {
    render(
      <Chart
        type='pie'
        data={DATA}
        series={[{ key: 'sales' }]}
        xKey='month'
        innerRadius={60}
      />
    );
    expect(Pie).toHaveBeenCalledWith(
      expect.objectContaining({ innerRadius: 60, outerRadius: '80%' }),
      undefined
    );
  });

  it('bands one ring per pie series and honors an explicit ring color', () => {
    render(
      <Chart
        type='pie'
        data={DATA}
        series={[
          { key: 'sales' },
          { key: 'costs', color: 'var(--haze-color-text)' },
        ]}
        xKey='month'
      />
    );

    expect(Pie).toHaveBeenCalledTimes(2);
    expect(Pie).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        dataKey: 'sales',
        innerRadius: '0%',
        outerRadius: '40%',
      }),
      undefined
    );
    expect(Pie).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        dataKey: 'costs',
        innerRadius: '40%',
        outerRadius: '80%',
      }),
      undefined
    );

    // ring 0 cycles per datum, ring 1 is pinned by its explicit series color
    const ringData = (n: number) =>
      vi.mocked(Pie).mock.calls[n - 1]?.[0] as { data: { fill?: string }[] };
    expect(ringData(1).data.map((d) => d.fill)).toEqual([
      'var(--haze-color-primary)',
      'var(--haze-color-info)',
      'var(--haze-color-success)',
    ]);
    expect(ringData(2).data.map((d) => d.fill)).toEqual(
      DATA.map(() => 'var(--haze-color-text)')
    );
  });

  it('renders custom tooltip content from the recharts payload', () => {
    const renderTooltip = vi.fn(
      (payload: ChartTooltipPayload<SalesDatum>) =>
        `${String(payload.label)} / ${payload.entries
          .map((entry) => `${entry.name}=${entry.value}@${entry.color}`)
          .join('&')}`
    );

    const { container } = render(
      <Chart
        type='line'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }]}
        xKey='month'
        renderTooltip={renderTooltip}
      />
    );

    expect(renderTooltip).toHaveBeenCalledTimes(1);
    expect(renderTooltip).toHaveBeenCalledWith({
      label: 'Jan',
      entries: [
        { name: 'Revenue', value: 12, color: '#ff0000', dataEntry: DATA[0] },
      ],
    });
    expect(container.querySelector('[data-tooltip]')).toHaveTextContent(
      'Jan / Revenue=12@#ff0000'
    );
  });

  it('renders horizontal bars through layout=vertical', () => {
    render(
      <Chart
        type='bar'
        layout='vertical'
        data={DATA}
        series={[{ key: 'sales' }]}
        xKey='month'
      />
    );

    expect(BarChart).toHaveBeenCalledWith(
      expect.objectContaining({ data: DATA, layout: 'vertical' }),
      undefined
    );
    // the axes swap roles: X counts values, Y carries the xKey categories
    expect(XAxis).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'number' }),
      undefined
    );
    expect(YAxis).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'category', dataKey: 'month' }),
      undefined
    );
  });

  it('renders one radar polygon per series over polar axes', () => {
    const { container } = render(
      <Chart
        type='radar'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }, { key: 'costs' }]}
        xKey='month'
        showLegend
      />
    );
    expect(RadarChart).toHaveBeenCalledWith(
      expect.objectContaining({ data: DATA }),
      undefined
    );
    expect(PolarGrid).toHaveBeenCalledTimes(1);
    expect(PolarAngleAxis).toHaveBeenCalledWith(
      expect.objectContaining({ dataKey: 'month' }),
      undefined
    );
    expect(PolarRadiusAxis).toHaveBeenCalledTimes(1);
    const polygons = container.querySelectorAll('[data-radar]');
    expect(polygons).toHaveLength(2);
    expect(polygons[0]).toHaveAttribute('data-name', 'Revenue');
    expect(polygons[0]).toHaveAttribute(
      'data-color',
      'var(--haze-color-primary)'
    );
    expect(polygons[1]).toHaveAttribute(
      'data-color',
      'var(--haze-color-info)'
    );
    // polar chart: no cartesian grid or X/Y axes
    expect(CartesianGrid).not.toHaveBeenCalled();
    expect(XAxis).not.toHaveBeenCalled();
    expect(YAxis).not.toHaveBeenCalled();
  });

  it('drops the polar grid when showGrid is false', () => {
    render(
      <Chart
        type='radar'
        data={DATA}
        series={[{ key: 'sales' }]}
        xKey='month'
        showGrid={false}
      />
    );
    expect(PolarGrid).not.toHaveBeenCalled();
  });

  it('renders scatter on numeric axes, one point set per series', () => {
    const { container } = render(
      <Chart
        type='scatter'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }, { key: 'costs' }]}
        xKey='month'
      />
    );
    expect(ScatterChart).toHaveBeenCalledWith(
      expect.objectContaining({ data: DATA }),
      undefined
    );
    expect(CartesianGrid).toHaveBeenCalledTimes(1);
    expect(XAxis).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'number', dataKey: 'month' }),
      undefined
    );
    expect(YAxis).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'number' }),
      undefined
    );
    // YAxis carries no dataKey: each Scatter resolves its own series key
    // as the Y column (recharts falls back to the item dataKey)
    const yAxisProps = vi.mocked(YAxis).mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(yAxisProps).not.toHaveProperty('dataKey');
    const points = container.querySelectorAll('[data-scatter]');
    expect(points).toHaveLength(2);
    expect(points[0]).toHaveAttribute('data-name', 'Revenue');
    expect(points[0]).toHaveAttribute(
      'data-color',
      'var(--haze-color-primary)'
    );
    expect(points[1]).toHaveAttribute(
      'data-color',
      'var(--haze-color-info)'
    );
  });

  it('hands the radar tooltip payload through renderTooltip', () => {
    const renderTooltip = vi.fn(
      (payload: ChartTooltipPayload<SalesDatum>) =>
        `${String(payload.label)} / ${payload.entries
          .map((entry) => `${entry.name}=${entry.value}`)
          .join('&')}`
    );

    const { container } = render(
      <Chart
        type='radar'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }]}
        xKey='month'
        renderTooltip={renderTooltip}
      />
    );

    expect(renderTooltip).toHaveBeenCalledTimes(1);
    expect(renderTooltip).toHaveBeenCalledWith({
      label: 'Jan',
      entries: [
        { name: 'Revenue', value: 12, color: '#ff0000', dataEntry: DATA[0] },
      ],
    });
    expect(container.querySelector('[data-tooltip]')).toHaveTextContent(
      'Jan / Revenue=12'
    );
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
    render(
      <Chart
        type='pie'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }]}
        xKey='month'
        innerRadius={40}
        showLegend
      />
    );
    render(
      <Chart
        type='radar'
        data={DATA}
        series={[{ key: 'sales', label: 'Revenue' }]}
        xKey='month'
        showLegend
      />
    );
    render(
      <Chart
        type='scatter'
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
