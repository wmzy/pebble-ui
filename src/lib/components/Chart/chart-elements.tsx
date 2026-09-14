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

/** One plotted series: `key` picks the datum field to plot, `label` names
 * the series in the legend and tooltip (defaults to `key`), and `color`
 * opts out of the semantic token cycle. */
export type ChartSeries = {
  key: string;
  label?: string;
  color?: string;
  /** Cartesian containers only (line/area/bar charts): overrides the
   * element shape for this one series — bars under a line chart, a line
   * over an area chart (composed charts). Ignored by pie/radar/scatter,
   * which have a single series shape each. */
  type?: CartesianChartType;
  /** Cartesian containers only: series sharing a `stackId` stack onto the
   * same baseline (Area and Bar shapes). Line ignores it — compose with a
   * per-series `type: 'area'` when stacked lines are the goal. Ignored by
   * pie/radar/scatter. */
  stackId?: string;
};

/** A series after Chart's label default is applied — what reaches
 * recharts. `color` is only present when the consumer set it; the plot
 * elements apply the semantic cycle themselves (cartesian: per series
 * index, pie: per datum index). */
export type ResolvedChartSeries = {
  key: string;
  label: string;
  color?: string;
  /** Per-series cartesian shape override; `undefined` follows the chart
   * type (see `ChartSeries.type`). */
  type?: CartesianChartType;
  /** Stacking group: Area/Bar series sharing the id stack. */
  stackId?: string;
};

/** Cartesian chart shapes; each maps onto a recharts chart container and
 * its matching series element (see `chartElement` / `seriesElement`). */
export type CartesianChartType = 'line' | 'area' | 'bar';

/** Series-bearing chart shapes: every `ChartSeries` maps onto one recharts
 * graphical element via `seriesElement`. */
export type SeriesChartType = CartesianChartType | 'radar' | 'scatter';

/** Supported chart shapes — the cartesian families plus `pie` (each datum
 * is one sector named by the chart's `xKey`), `radar` (each datum is one
 * spoke named by `xKey`) and `scatter` (numeric `xKey` vs each series
 * `key`). */
export type ChartType = CartesianChartType | 'radar' | 'scatter' | 'pie';

/** One hovered entry as handed to Chart's `renderTooltip` slot. */
export type ChartTooltipEntry<T = unknown> = {
  /** Series label (cartesian) or sector name (pie). */
  name: string;
  /** The plotted value. */
  value: number | string;
  /** The series/sector color as passed to recharts (any CSS color). */
  color: string;
  /** The source datum the entry was plotted from. */
  dataEntry: T;
};

/** Payload handed to Chart's `renderTooltip` slot. */
export type ChartTooltipPayload<T = unknown> = {
  /** The hovered X value (cartesian) or sector name (pie). */
  label?: unknown;
  /** One entry per series (cartesian) or per sector (pie). */
  entries: ChartTooltipEntry<T>[];
};

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

/** The palette entry for `index`, cycling once sectors/series outnumber
 * the five semantic tokens. */
function cycleColor(index: number): string {
  return SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!;
}

/** Applies the per-series default: `label` falls back to `key`. An
 * explicit `color` passes through untouched — the plot elements cycle
 * `SERIES_COLOR_CYCLE` when it is omitted. `type` and `stackId` pass
 * through untouched for the cartesian branch of `chartTree`. */
export function resolveChartSeries(
  series: readonly ChartSeries[]
): ResolvedChartSeries[] {
  return series.map((entry) => ({
    key: entry.key,
    label: entry.label ?? entry.key,
    color: entry.color,
    type: entry.type,
    stackId: entry.stackId,
  }));
}

/** The recharts series element for one resolved entry — `type` is the
 * series' own override when set (composed charts), else the chart type.
 * Line and Area carry the token color as `stroke` (Area also fills with
 * it — recharts applies its default 0.6 fill opacity), Bar carries it as
 * `fill`. Radar strokes and fills its polygon — translucent, so
 * overlapping polygons stay readable — and Scatter fills its points.
 * `stackId` is forwarded to Area and Bar: recharts stacks every series
 * sharing an id onto the same baseline. Line ignores it — a stacked line
 * chart is just a harder-to-read stacked area, so Area/Bar are the
 * stacking shapes. */
export function seriesElement(
  type: SeriesChartType,
  entry: ResolvedChartSeries,
  index = 0
): ReactElement {
  const { key, label, stackId } = entry;
  const color = entry.color ?? cycleColor(index);
  switch (type) {
    case 'area':
      return (
        <Area
          key={key}
          dataKey={key}
          name={label}
          stroke={color}
          fill={color}
          stackId={stackId}
        />
      );
    case 'bar':
      return (
        <Bar
          key={key}
          dataKey={key}
          name={label}
          fill={color}
          stackId={stackId}
        />
      );
    case 'line':
      /* No stackId on Line: it has no baseline to stack onto — compose
       * with a per-series type 'area' when stacking is the goal. */
      return <Line key={key} dataKey={key} name={label} stroke={color} />;
    case 'radar':
      return (
        <Radar
          key={key}
          dataKey={key}
          name={label}
          stroke={color}
          fill={color}
          fillOpacity={0.3}
        />
      );
    case 'scatter':
      return <Scatter key={key} dataKey={key} name={label} fill={color} />;
  }
}

/** Radial band for pie ring `index` of `ringCount`: a single ring spans
 * [innerRadius, 80%]; multiple rings band the radial space evenly with
 * series 0 innermost. A percentage `innerRadius` offsets the innermost
 * ring — a pixel value only applies to single-ring charts. */
export function pieRingRadii(
  index: number,
  ringCount: number,
  innerRadius: number | string
): { innerRadius: number | string; outerRadius: string } {
  if (ringCount <= 1) {
    return { innerRadius, outerRadius: '80%' };
  }
  const parsed =
    typeof innerRadius === 'string' ? Number.parseFloat(innerRadius) : 0;
  const base = Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  const band = (80 - base) / ringCount;
  return {
    innerRadius: `${base + index * band}%`,
    outerRadius: `${base + (index + 1) * band}%`,
  };
}

/** The recharts Pie for one resolved series: every datum is one sector
 * named by `nameKey` and valued by the series `key`. Sector fills cycle
 * the semantic tokens per datum unless the series pins an explicit
 * `color`, which monochromes the whole ring. */
export function pieElement(options: {
  entry: ResolvedChartSeries;
  data: readonly unknown[];
  nameKey: string;
  ringIndex: number;
  ringCount: number;
  innerRadius: number | string;
}): ReactElement {
  const { entry, data, nameKey, ringIndex, ringCount, innerRadius } = options;
  const radii = pieRingRadii(ringIndex, ringCount, innerRadius);
  // Recharts 3 deprecates <Cell> (removed in 4.0) in favor of presentation
  // props on the data items: the datum object is spread into its sector, so
  // a per-datum `fill` colors it. Copies only — consumer data is untouched.
  const pieData = data.map((datum, datumIndex) => ({
    ...(datum as Record<string, unknown>),
    fill: entry.color ?? cycleColor(datumIndex),
  }));
  return (
    <Pie
      key={entry.key}
      data={pieData}
      dataKey={entry.key}
      nameKey={nameKey}
      innerRadius={radii.innerRadius}
      outerRadius={radii.outerRadius}
      stroke='var(--haze-color-bg)'
    />
  );
}

/** The recharts chart container for `type` (line → LineChart, area →
 * AreaChart, bar → BarChart, pie → PieChart, radar → RadarChart, scatter
 * → ScatterChart) plotting `data` with the given series children; cartesian
 * containers carry `layout`. */
export function chartElement(
  type: ChartType,
  data: readonly unknown[],
  children: ReactNode,
  layout: 'horizontal' | 'vertical' = 'horizontal'
): ReactElement {
  switch (type) {
    case 'area':
      return (
        <AreaChart data={data} layout={layout}>
          {children}
        </AreaChart>
      );
    case 'bar':
      return (
        <BarChart data={data} layout={layout}>
          {children}
        </BarChart>
      );
    case 'line':
      return (
        <LineChart data={data} layout={layout}>
          {children}
        </LineChart>
      );
    case 'pie':
      return <PieChart data={data}>{children}</PieChart>;
    case 'radar':
      return <RadarChart data={data}>{children}</RadarChart>;
    case 'scatter':
      return <ScatterChart data={data}>{children}</ScatterChart>;
  }
}

/** The payload items recharts hands a custom Tooltip content function —
 * kept loose (and cast at the boundary) because recharts types its
 * payload against its own chart generics. */
type RechartsTooltipItem = {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: unknown;
  dataKey?: string | number;
};

/** Wraps a `renderTooltip` slot into a recharts Tooltip `content`
 * function, mapping recharts' payload items onto ChartTooltipEntry
 * (name falling back to the dataKey, missing colors to ''). */
export function buildTooltipContent(
  render: (payload: ChartTooltipPayload) => ReactNode
): (props: unknown) => ReactNode {
  return (props) => {
    const { payload, label } = props as {
      payload?: readonly RechartsTooltipItem[];
      label?: unknown;
    };
    return render({
      label,
      entries: (payload ?? []).map((item) => ({
        name: String(item.name ?? item.dataKey ?? ''),
        value: item.value ?? '',
        color: item.color ?? '',
        dataEntry: item.payload,
      })),
    });
  };
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
  layout?: 'horizontal' | 'vertical';
  innerRadius?: number | string;
  renderTooltip?: (payload: ChartTooltipPayload) => ReactNode;
}): ReactElement {
  const {
    type,
    data,
    xKey,
    showGrid,
    showTooltip,
    showLegend,
    series,
    layout = 'horizontal',
    innerRadius = 0,
    renderTooltip,
  } = options;

  const tooltipContent = renderTooltip
    ? buildTooltipContent(renderTooltip)
    : undefined;

  /* Pie is polar: no cartesian axes or grid, cursor left to recharts'
   * default sector outline, and each series one concentric ring. */
  if (type === 'pie') {
    return (
      <ResponsiveContainer width='100%' height='100%'>
        {chartElement(
          type,
          data,
          <>
            {showTooltip && (
              <Tooltip contentStyle={TOOLTIP_STYLE} content={tooltipContent} />
            )}
            {showLegend && <Legend wrapperStyle={LEGEND_STYLE} />}
            {/* Per-series `type` and `stackId` are cartesian-only — each pie
             * series is one ring regardless, so both are ignored here. */}
            {series.map((entry, index) =>
              pieElement({
                entry,
                data,
                nameKey: xKey,
                ringIndex: index,
                ringCount: series.length,
                innerRadius,
              })
            )}
          </>
        )}
      </ResponsiveContainer>
    );
  }

  /* Radar is polar: spokes named by xKey, one translucent polygon per
   * series, and token-styled polar grid/axis chrome instead of the
   * cartesian grid and X/Y axes. */
  if (type === 'radar') {
    return (
      <ResponsiveContainer width='100%' height='100%'>
        {chartElement(
          type,
          data,
          <>
            {showGrid && <PolarGrid stroke={AXIS_STROKE} />}
            <PolarAngleAxis dataKey={xKey} tick={AXIS_TICK} />
            <PolarRadiusAxis tick={AXIS_TICK} />
            {showTooltip && (
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                content={tooltipContent}
              />
            )}
            {showLegend && <Legend wrapperStyle={LEGEND_STYLE} />}
            {/* Per-series `type` and `stackId` are cartesian-only — radar
             * renders one polygon per series regardless, so both are
             * ignored here. */}
            {series.map((entry, index) => seriesElement('radar', entry, index))}
          </>
        )}
      </ResponsiveContainer>
    );
  }

  /* Scatter is numeric on both axes: X reads the shared xKey column and
   * the YAxis stays dataKey-less — recharts resolves a nullish axis
   * dataKey against each graphical item's own dataKey, so every Scatter
   * picks up its series key as the Y column while sharing the chart's
   * single datum-per-point dataset. */
  if (type === 'scatter') {
    return (
      <ResponsiveContainer width='100%' height='100%'>
        {chartElement(
          type,
          data,
          <>
            {showGrid && <CartesianGrid stroke={AXIS_STROKE} />}
            <XAxis
              type='number'
              dataKey={xKey}
              stroke={AXIS_STROKE}
              tick={AXIS_TICK}
            />
            <YAxis type='number' stroke={AXIS_STROKE} tick={AXIS_TICK} />
            {showTooltip && (
              <Tooltip
                cursor={{ stroke: AXIS_STROKE }}
                contentStyle={TOOLTIP_STYLE}
                content={tooltipContent}
              />
            )}
            {showLegend && <Legend wrapperStyle={LEGEND_STYLE} />}
            {/* Same as radar: `type`/`stackId` are cartesian-only — scatter
             * renders one point set per series regardless. */}
            {series.map((entry, index) =>
              seriesElement('scatter', entry, index)
            )}
          </>
        )}
      </ResponsiveContainer>
    );
  }

  const vertical = layout === 'vertical';
  return (
    <ResponsiveContainer width='100%' height='100%'>
      {chartElement(
        type,
        data,
        <>
          {showGrid && <CartesianGrid stroke={AXIS_STROKE} />}
          {/* recharts types dataKey against its own datum generic; Chart's
           * bare <T> can't satisfy it, so widen to the string recharts
           * indexes each datum with at runtime. Vertical layout swaps the
           * axes: X counts values, Y carries the xKey categories. */}
          {vertical ? (
            <>
              <XAxis type='number' stroke={AXIS_STROKE} tick={AXIS_TICK} />
              <YAxis
                type='category'
                dataKey={xKey}
                stroke={AXIS_STROKE}
                tick={AXIS_TICK}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} stroke={AXIS_STROKE} tick={AXIS_TICK} />
              <YAxis stroke={AXIS_STROKE} tick={AXIS_TICK} />
            </>
          )}
          {showTooltip && (
            <Tooltip
              cursor={{ stroke: AXIS_STROKE }}
              contentStyle={TOOLTIP_STYLE}
              content={tooltipContent}
            />
          )}
          {showLegend && <Legend wrapperStyle={LEGEND_STYLE} />}
          {/* Composed charts: a per-series `type` overrides that series'
           * element shape (bar series inside a line chart, a line over an
           * area chart) while the chart-level `type` picks the container;
           * `stackId` flows through `seriesElement` to stack the Area/Bar
           * series sharing an id. Series without a type follow the chart
           * type. */}
          {series.map((entry, index) =>
            seriesElement(entry.type ?? type, entry, index)
          )}
        </>,
        layout
      )}
    </ResponsiveContainer>
  );
}
