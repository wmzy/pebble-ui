import type { ComponentPropsWithoutRef } from 'react';

import type { ChartSeries, ChartType } from './chart-elements';

import { useMemo } from 'react';

import { css } from '@linaria/core';

import {
  chartTree,
  resolveChartSeries,
} from './chart-elements';

type ChartProps<T> = {
  /** Which recharts chart family to render. */
  type: ChartType;
  /** One datum per point; series values are read by `ChartSeries.key`. */
  data: T[];
  /** The series to plot — colors cycle through the semantic status tokens
   * when `color` is omitted. */
  series: ChartSeries[];
  /** Datum field driving the X axis. */
  xKey: keyof T & string;
  /** Container height in px; the chart stretches to the full width. */
  height?: number;
  /** Renders a recharts Legend naming each series. Default `false`. */
  showLegend?: boolean;
  /** Renders background grid lines. Default `true`. */
  showGrid?: boolean;
  /** Renders a hover tooltip. Default `true`. */
  showTooltip?: boolean;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/** Fixed-height container: ResponsiveContainer measures its parent, so the
 * wrapper carries the height while width comes from the layout flow. */
const root = css`
  width: 100%;
`;

/** Token-driven chart over recharts: line, area or bar series rendered
 * with haze semantic colors, axis/grid/tooltip/legend chrome toggles, and
 * the default-omittable `series`/`xKey` mapping. recharts is an optional
 * peer — this module's helpers import it statically, so under
 * preserveModules only bundles that actually render Chart resolve the
 * dependency. */
export default function Chart<T>({
  type,
  data,
  series,
  xKey,
  height = 300,
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  className,
  style,
  ...rest
}: ChartProps<T>) {
  const resolvedSeries = useMemo(() => resolveChartSeries(series), [series]);

  return (
    <div x-class={[root, className]} style={{ height, ...style }} {...rest}>
      {chartTree({
        type,
        data,
        xKey,
        showGrid,
        showTooltip,
        showLegend,
        series: resolvedSeries,
      })}
    </div>
  );
}

export type { ChartProps, ChartSeries, ChartType };
