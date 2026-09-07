import type { ReactElement, ReactNode } from 'react';

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
  YAxis,
} from 'recharts';

/** One plotted series: `key` picks the datum field to plot, `label` names
 * the series in the legend and tooltip (defaults to `key`), and `color`
 * opts out of the semantic token cycle. */
export type ChartSeries = {
  key: string;
  label?: string;
  color?: string;
};

/** A series after Chart's defaults are applied — what reaches recharts. */
export type ResolvedChartSeries = {
  key: string;
  label: string;
  color: string;
};

/** Supported chart shapes; each maps onto a recharts chart container and
 * its matching series element (see `chartElement` / `seriesElement`). */
export type ChartType = 'line' | 'area' | 'bar';

/** Default series palette: the five semantic status tokens. recharts takes
 * CSS variable strings for stroke/fill, so theme switches and consumer
 * color overrides propagate without re-rendering the chart. */
const SERIES_COLOR_CYCLE = [
  'var(--haze-color-primary)',
  'var(--haze-color-info)',
  'var(--haze-color-success)',
  'var(--haze-color-warning)',
  'var(--haze-color-danger)',
] as const;

/* Token-only chrome shared by every chart: hairline border-colored axes and
 * grid, text-size tokens for tick, tooltip and legend copy. */
export const AXIS_STROKE = 'var(--haze-color-border)';
export const AXIS_TICK = {
  fontSize: 'var(--haze-text-sm)',
  fill: 'var(--haze-color-text-secondary)',
} as const;
export const TOOLTIP_STYLE = {
  fontSize: 'var(--haze-text-sm)',
  color: 'var(--haze-color-text)',
} as const;
export const LEGEND_STYLE = { fontSize: 'var(--haze-text-sm)' } as const;

/** Applies the per-series defaults: `label` falls back to `key`, and a
 * missing color cycles through `SERIES_COLOR_CYCLE`. */
export function resolveChartSeries(
  series: readonly ChartSeries[]
): ResolvedChartSeries[] {
  return series.map((entry, index) => ({
    key: entry.key,
    label: entry.label ?? entry.key,
    color: entry.color ?? SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!,
  }));
}

/** The recharts series element for one resolved entry. Line and Area carry
 * the token color as `stroke` (Area also fills with it — recharts applies
 * its default 0.6 fill opacity), Bar carries it as `fill`. */
export function seriesElement(
  type: ChartType,
  entry: ResolvedChartSeries
): ReactElement {
  const { key, label, color } = entry;
  switch (type) {
    case 'area':
      return (
        <Area key={key} dataKey={key} name={label} stroke={color} fill={color} />
      );
    case 'bar':
      return <Bar key={key} dataKey={key} name={label} fill={color} />;
    case 'line':
      return <Line key={key} dataKey={key} name={label} stroke={color} />;
  }
}

/** The recharts chart container for `type` (line → LineChart, area →
 * AreaChart, bar → BarChart) plotting `data` with the given axes, grid,
 * tooltip, legend and series children. */
export function chartElement(
  type: ChartType,
  data: readonly unknown[],
  children: ReactNode
): ReactElement {
  switch (type) {
    case 'area':
      return <AreaChart data={data}>{children}</AreaChart>;
    case 'bar':
      return <BarChart data={data}>{children}</BarChart>;
    case 'line':
      return <LineChart data={data}>{children}</LineChart>;
  }
}

/** The full token-styled chart tree Chart renders — kept beside the pure
 * helpers so the component module stays a single component export. */
export function chartTree(options: {
  type: ChartType;
  data: readonly unknown[];
  xKey: string;
  showGrid: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  series: readonly ResolvedChartSeries[];
}): ReactElement {
  const { type, data, xKey, showGrid, showTooltip, showLegend, series } =
    options;
  return (
    <ResponsiveContainer width='100%' height='100%'>
      {chartElement(
        type,
        data,
        <>
          {showGrid && <CartesianGrid stroke={AXIS_STROKE} />}
          {/* recharts types dataKey against its own datum generic; Chart's
           * bare <T> can't satisfy it, so widen to the string recharts
           * indexes each datum with at runtime. */}
          <XAxis dataKey={xKey} stroke={AXIS_STROKE} tick={AXIS_TICK} />
          <YAxis stroke={AXIS_STROKE} tick={AXIS_TICK} />
          {showTooltip && (
            <Tooltip cursor={{ stroke: AXIS_STROKE }} contentStyle={TOOLTIP_STYLE} />
          )}
          {showLegend && <Legend wrapperStyle={LEGEND_STYLE} />}
          {series.map((entry) => seriesElement(type, entry))}
        </>
      )}
    </ResponsiveContainer>
  );
}
