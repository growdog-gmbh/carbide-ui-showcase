import type { Meta, StoryObj } from "@storybook/react-vite";
import { LineChart } from "./LineChart.js";
import type { ChartSeries } from "./types.js";

interface DataPoint {
  at: number;
  probe1: number;
  probe2: number;
  probe3: number;
}

function generateSeries(): DataPoint[] {
  let seed = 11;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const start = Date.UTC(2026, 8, 10, 0, 0);
  return Array.from({ length: 49 }, (_, index) => {
    const hour = index / 2;
    return {
      at: start + index * 30 * 60_000,
      probe1: 42 + 6 * Math.sin(hour / 3) + random() * 3,
      probe2: 55 + 5 * Math.sin(hour / 4 + 1) + random() * 3,
      probe3: 38 + 4 * Math.sin(hour / 5 + 2) + random() * 3,
    };
  });
}

const DATA = generateSeries();

const SERIES: ChartSeries<DataPoint>[] = [
  { id: "probe1", name: "Probe 1", slot: 1, accessorKey: "probe1", unit: "%" },
  { id: "probe2", name: "Probe 2", slot: 2, accessorKey: "probe2", unit: "%" },
  { id: "probe3", name: "Probe 3", slot: 3, accessorKey: "probe3", unit: "%" },
];

const meta: Meta<typeof LineChart<DataPoint>> = {
  title: "Charts/LineChart",
  component: LineChart,
  args: { data: DATA, series: SERIES },
};
export default meta;

type Story = StoryObj<typeof LineChart<DataPoint>>;

export const Default: Story = {
  args: {
    events: [
      {
        id: "irrigation",
        label: "Irrigation",
        from: Date.UTC(2026, 8, 10, 10, 0),
        to: Date.UTC(2026, 8, 10, 10, 30),
      },
    ],
    thresholds: [{ id: "max", label: "Max", value: 65, kind: "negative" }],
  },
};

export const WithoutEvents: Story = {};

interface SubstrateRow {
  at: number;
  temperature: number;
  vwc: number;
  bulkEc: number;
  ph: number;
}

function generateSubstrateSeries(): SubstrateRow[] {
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const start = Date.UTC(2026, 8, 10, 0, 0);
  return Array.from({ length: 25 }, (_, index) => {
    const hour = index / 2;
    return {
      at: start + index * 30 * 60_000,
      temperature: 21.5 + 0.4 * Math.sin(hour / 4) + random() * 0.2,
      vwc: 65 - hour * 1.8 + random() * 1.5,
      bulkEc: 2.6 + 0.1 * Math.sin(hour / 3) + random() * 0.1,
      ph: 6.1 + random() * 0.1,
    };
  });
}

const SUBSTRATE_DATA = generateSubstrateSeries();

// Four probes on four different scales in one chart. Each gets its own
// axisId so it scales independently, and axisHidden keeps the plot from
// drowning in tick labels -- the lines carry the story, not the axes.
const SUBSTRATE_SERIES: ChartSeries<SubstrateRow>[] = [
  {
    id: "temperature",
    name: "Substrate temperature",
    slot: 1,
    accessorKey: "temperature",
    unit: "°C",
    axisId: "temperature",
    axisHidden: true,
  },
  {
    id: "vwc",
    name: "VWC",
    slot: 2,
    accessorKey: "vwc",
    unit: "%",
    axisId: "vwc",
    axisHidden: true,
  },
  {
    id: "bulkEc",
    name: "Bulk EC",
    slot: 3,
    accessorKey: "bulkEc",
    unit: "mS/cm",
    axisId: "bulkEc",
    axisHidden: true,
  },
  {
    id: "ph",
    name: "pH",
    slot: 4,
    accessorKey: "ph",
    unit: "pH",
    axisId: "ph",
    axisHidden: true,
  },
];

export const MultiAxisHiddenSubstrateTrend: StoryObj<typeof LineChart<SubstrateRow>> = {
  args: {
    data: SUBSTRATE_DATA,
    series: SUBSTRATE_SERIES,
    events: [
      {
        id: "irrigation",
        label: "Irrigation",
        from: Date.UTC(2026, 8, 10, 6, 0),
        to: Date.UTC(2026, 8, 10, 6, 15),
      },
    ],
  },
};
