import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import type {
  ChartSeries,
  ChartTooltipEntry,
  ChartTooltipPayload,
  ChartType,
} from './chart-elements';

import { useMemo } from 'react';

import { css } from '@linaria/core';

import {
  chartTree,
  resolveChartSeries,
} from './chart-elements';

type ChartProps<T> = {
  /** Which recharts chart family to render. `pie` maps each datum to one
   * sector named by `xKey` and valued by each series `key`; `radar` maps
   * each datum to one spoke named by `xKey`; `scatter` plots the numeric
   * `xKey` column against each series `key`. In the cartesian families
   * the chart `type` picks the container and the default series shape —
   * override the shape per series via `ChartSeries.type`. */
  type: ChartType;
  /** One datum per point (pie: per sector; radar: per spoke); series
   * values are read by `ChartSeries.key`. */
  data: T[];
  /** The series to plot — colors cycle through the semantic status tokens
   * when `color` is omitted. With `type='pie'` each series is one
   * concentric ring. In cartesian charts (line/area/bar) a per-series
   * `type` overrides that series' shape for composed charts (bars under a
   * line, a line over areas), and series sharing a `stackId` stack
   * (Area/Bar shapes). Both are ignored by pie/radar/scatter. */
  series: ChartSeries[];
  /** Datum field driving the X axis — the cartesian categories, the pie
   * sector names, the radar spoke names, or the numeric scatter X
   * column. */
  xKey: keyof T & string;
  /** Container height in px; the chart stretches to the full width. */
  height?: number;
  /** Pie only: inner radius in px (or a % string) — above 0 renders a
   * donut. Multiple pie series band the radial space evenly; a %
   * `innerRadius` offsets the innermost ring. Default `0`. */
  innerRadius?: number | string;
  /** Cartesian charts only: `vertical` swaps the axes for horizontal
   * bars/lines (ignored by `pie`). Default `'horizontal'`. */
  layout?: 'horizontal' | 'vertical';
  /** Replaces the default recharts tooltip. Receives the hovered label
   * (X value / sector name) plus one entry per series or sector. */
  renderTooltip?: (payload: ChartTooltipPayload<T>) => ReactNode;
  /** Renders a recharts Legend naming each series. Default `false`. */
  showLegend?: boolean;
  /** Renders background grid lines (cartesian and radar charts; ignored
   * by `pie`). Default `true`. */
  showGrid?: boolean;
  /** Renders a hover tooltip. Default `true`. */
  showTooltip?: boolean;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/** Fixed-height container: ResponsiveContainer measures its parent, so the
 * wrapper carries the height while width comes from the layout flow. */
const root = css`
  width: 100%;
`;

/** Token-driven chart over recharts: line, area, bar, pie, radar or
 * scatter series rendered with haze semantic colors, axis/grid/tooltip/legend chrome
 * toggles, and the default-omittable `series`/`xKey` mapping. Cartesian
 * charts double as composed charts — a per-series `type` mixes line/area/bar
 * shapes inside one chart, and `stackId` stacks the Area/Bar series sharing
 * an id. recharts is a haze-ui dependency — this module's helpers import it
 * statically, so under preserveModules only bundles that actually render
 * Chart include the dependency. */
export default function Chart<T>({
  type,
  data,
  series,
  xKey,
  height = 300,
  innerRadius = 0,
  layout = 'horizontal',
  renderTooltip,
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  className,
  style,
  ...rest
}: ChartProps<T>) {
  const resolvedSeries = useMemo(() => resolveChartSeries(series), [series]);

  return (
    <div data-slot='chart' x-class={[root, className]} style={{ height, ...style }} {...rest}>
      {chartTree({
        type,
        data,
        xKey,
        showGrid,
        showTooltip,
        showLegend,
        series: resolvedSeries,
        layout,
        innerRadius,
        renderTooltip: renderTooltip
          ? (payload) => renderTooltip(payload as ChartTooltipPayload<T>)
          : undefined,
      })}
    </div>
  );
}

export type {
  ChartProps,
  ChartSeries,
  ChartTooltipEntry,
  ChartTooltipPayload,
  ChartType,
};
