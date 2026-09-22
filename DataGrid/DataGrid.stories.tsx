import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { matrix } from "../../../../.storybook/matrix.js";
import {
  DataGrid,
  type DataGridColumn,
  type DataGridProps,
  type DataGridRowAction,
  type DataGridSorting,
} from "./DataGrid.js";

interface Charge {
  id: string;
  batch: string;
  cultivar: string;
  room: string;
  plants: number;
  weight: number;
  planted: string;
}

const CULTIVARS = ["Aurora", "Borealis", "Cascade", "Dune", "Ember", "Fjord"] as const;
const ROOMS = ["Hall 1", "Hall 2", "Hall 3", "Nursery"] as const;

function batches(count: number): Charge[] {
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: count }, (_, index) => {
    const cultivar = CULTIVARS[Math.floor(random() * CULTIVARS.length)] ?? "Aurora";
    const room = ROOMS[Math.floor(random() * ROOMS.length)] ?? "Hall 1";
    const day = new Date(Date.UTC(2026, 0, 1 + Math.floor(random() * 240)));
    return {
      id: `batch-${index + 1}`,
      batch: `B-${String(index + 1).padStart(5, "0")}`,
      cultivar: cultivar,
      room: room,
      plants: 12 + Math.floor(random() * 400),
      weight: Math.round(random() * 12500) / 10,
      planted: day.toISOString().slice(0, 10),
    };
  });
}

const COLUMNS: DataGridColumn<Charge>[] = [
  { id: "batch", header: "Batch", accessorKey: "batch", width: "7rem" },
  { id: "cultivar", header: "Cultivar", accessorKey: "cultivar" },
  { id: "room", header: "Room", accessorKey: "room" },
  { id: "plants", header: "Plants", accessorKey: "plants", type: "number", width: "6rem" },
  { id: "weight", header: "Weight (g)", accessorKey: "weight", type: "number", width: "8rem" },
  { id: "planted", header: "Planted", accessorKey: "planted", width: "7rem", sortable: false },
];

const TWELVE = batches(12);
const TEN_THOUSAND = batches(10_000);

const ROW_ACTIONS: DataGridRowAction<Charge>[] = [
  { id: "rename", label: "Rename" },
  { id: "move", label: "Move to room" },
  {
    id: "delete",
    danger: true,
    group: "danger",
    isVisible: (row) => row.room !== "Nursery",
    label: "Delete",
  },
];

function ControlledTable(props: DataGridProps<Charge>) {
  const [sorting, setSorting] = useState<DataGridSorting>(props.sorting ?? []);
  return <DataGrid {...props} onSortingChange={setSorting} sorting={sorting} />;
}

function ControlledSelection(props: DataGridProps<Charge>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  return <DataGrid {...props} onSelectionChange={setSelectedIds} selectedIds={selectedIds} />;
}

function ControlledFiltering(props: DataGridProps<Charge>) {
  const [globalFilter, setGlobalFilter] = useState("");
  return <DataGrid {...props} globalFilter={globalFilter} onGlobalFilterChange={setGlobalFilter} />;
}

function ControlledPagination(props: DataGridProps<Charge>) {
  const all = props.rows;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const start = (page - 1) * pageSize;
  return (
    <DataGrid
      {...props}
      pagination={{
        onPageChange: setPage,
        onPageSizeChange: (nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        },
        page,
        pageSize,
        total: all.length,
      }}
      rows={all.slice(start, start + pageSize)}
    />
  );
}

const meta: Meta<typeof DataGrid<Charge>> = {
  title: "Core/DataGrid",
  component: DataGrid,
  args: { columns: COLUMNS, rows: TWELVE },
  argTypes: { onSortingChange: { control: false } },
  render: (args) => <ControlledTable {...args} />,
  decorators: [
    (Story) => (
      <div style={{ height: "20rem" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DataGrid<Charge>>;

export const Default: Story = {};

export const Sortable: Story = { args: { sorting: [{ id: "weight", desc: true }] } };

export const ManualSorting: Story = {
  args: { manualSorting: true, sorting: [{ id: "plants", desc: false }] },
};

export const Selectable: Story = { render: (args) => <ControlledSelection {...args} /> };

export const RowActions: Story = { args: { rowActions: ROW_ACTIONS } };

export const Filterable: Story = { render: (args) => <ControlledFiltering {...args} /> };

export const Paginated: Story = {
  args: { rows: batches(120) },
  render: (args) => <ControlledPagination {...args} />,
};

export const Empty: Story = { args: { rows: [] } };

export const Loading: Story = { args: { loading: true } };

export const LargeDataset: Story = { args: { rows: TEN_THOUSAND } };

export const LongText: Story = {
  args: {
    columns: [
      { id: "batch", header: "Batch", accessorKey: "batch", width: "7rem" },
      {
        id: "cultivar",
        header: "A column header that is far longer than its column is wide",
        accessorFn: (row) =>
          `${row.cultivar}, a cultivar name spelled out at a length no column can hold`,
        width: "10rem",
      },
      { id: "plants", header: "Plants", accessorKey: "plants", type: "number", width: "6rem" },
    ],
  },
};

export const Matrix: Story = {
  decorators: [matrix],
  parameters: { layout: "fullscreen" },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--carbide-sp-3)",
        width: "100%",
      }}
    >
      <div style={{ height: "12rem", width: "100%" }}>
        <DataGrid columns={COLUMNS} rows={TWELVE} sorting={[{ id: "weight", desc: true }]} />
      </div>
      <div style={{ height: "5rem", width: "100%" }}>
        <DataGrid columns={COLUMNS} rows={[]} />
      </div>
    </div>
  ),
};
