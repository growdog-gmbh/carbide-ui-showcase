import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart } from "./BarChart.js";
import type { ChartSeries } from "./types.js";

interface HourlyIrrigation {
  at: number;
  zone1: number;
  zone2: number;
  zone3: number;
}

function generateHours(): HourlyIrrigation[] {
  let seed = 5;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const start = Date.UTC(2026, 8, 10, 6, 0);
  return Array.from({ length: 7 }, (_, index) => ({
    at: start + index * 60 * 60_000,
    zone1: Math.round(2 + random() * 6),
    zone2: Math.round(1 + random() * 5),
    zone3: Math.round(3 + random() * 5),
  }));
}

const DATA = generateHours();

const SERIES: ChartSeries<HourlyIrrigation>[] = [
  { id: "zone1", name: "Zone 1", slot: 1, accessorKey: "zone1" },
  { id: "zone2", name: "Zone 2", slot: 2, accessorKey: "zone2" },
  { id: "zone3", name: "Zone 3", slot: 3, accessorKey: "zone3" },
];

const meta: Meta<typeof BarChart<HourlyIrrigation>> = {
  title: "Charts/BarChart",
  component: BarChart,
  args: { data: DATA, series: SERIES },
};
export default meta;

type Story = StoryObj<typeof BarChart<HourlyIrrigation>>;

export const Default: Story = {};

// Discrete events, one tick each: the bars stay slim and every shot is
// labelled on the axis instead of whatever spacing recharts picks.
export const OneTickPerEvent: Story = {
  args: { barSize: 8, ticks: DATA.map((row) => row.at) },
};
