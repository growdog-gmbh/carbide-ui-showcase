import { Bar } from "recharts";
import { dataKeyOf } from "./axes.js";
import { CartesianChart, type CartesianChartProps } from "./CartesianChart.js";
import { seriesColor } from "./series.js";

export interface BarChartProps<TRow> extends Omit<CartesianChartProps<TRow>, "renderSeries"> {
  /** Width of one bar in px; omitted, recharts sizes bars to the band. */
  barSize?: number | undefined;
}

export function BarChart<TRow>({ barSize, ...props }: BarChartProps<TRow>) {
  return (
    <CartesianChart
      {...props}
      axisFromZero
      renderSeries={(entry, axisId) => (
        <Bar
          {...(barSize === undefined ? {} : { barSize })}
          dataKey={dataKeyOf(entry)}
          fill={seriesColor(entry.slot)}
          isAnimationActive={false}
          key={entry.id}
          name={entry.name}
          yAxisId={axisId}
        />
      )}
    />
  );
}
