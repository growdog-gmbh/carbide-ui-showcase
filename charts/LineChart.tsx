import { Line } from "recharts";
import { dataKeyOf } from "./axes.js";
import { CartesianChart, type CartesianChartProps } from "./CartesianChart.js";
import { seriesColor } from "./series.js";

export type LineChartProps<TRow> = Omit<CartesianChartProps<TRow>, "renderSeries">;

export function LineChart<TRow>(props: LineChartProps<TRow>) {
  return (
    <CartesianChart
      {...props}
      renderSeries={(entry, axisId) => (
        <Line
          dataKey={dataKeyOf(entry)}
          dot={false}
          isAnimationActive={false}
          key={entry.id}
          name={entry.name}
          stroke={seriesColor(entry.slot)}
          type="monotone"
          yAxisId={axisId}
        />
      )}
    />
  );
}
