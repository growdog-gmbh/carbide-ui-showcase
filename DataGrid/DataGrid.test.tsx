// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatNumber } from "../format/number.js";
import { renderRoot } from "../test/render.js";
import {
  DataGrid,
  type DataGridColumn,
  type DataGridProps,
  type DataGridRowAction,
} from "./DataGrid.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function measureScrollArea() {
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.tagName === "TR" ? 32 : 320;
  });
}

function ControlledSelection<TRow>(
  props: Omit<DataGridProps<TRow>, "onSelectionChange" | "selectedIds"> & {
    onSelectionChange: (selectedIds: Set<string>) => void;
  },
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  return (
    <DataGrid
      {...props}
      onSelectionChange={(ids) => {
        setSelectedIds(ids);
        props.onSelectionChange(ids);
      }}
      selectedIds={selectedIds}
    />
  );
}

interface Row {
  id: string;
  name: string;
  count: number;
}

const ROWS: Row[] = [
  { id: "b", name: "Beta", count: 1250 },
  { id: "a", name: "Alpha", count: 3 },
  { id: "c", name: "Gamma", count: 42 },
];

const COLUMNS: DataGridColumn<Row>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "count", header: "Count", accessorKey: "count", type: "number" },
];

function firstColumn(markup: string): string[] {
  return [...markup.matchAll(/<td[^>]*>([^<]*)</g)]
    .map((match) => match[1] ?? "")
    .filter((_, index) => index % COLUMNS.length === 0);
}

describe("DataGrid", () => {
  it("renders a table with a header row, one row per record and cells", () => {
    const { tag, attrs, markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(tag).toBe("div");
    expect(attrs).not.toHaveProperty("data-empty");
    expect(attrs).not.toHaveProperty("data-loading");
    expect(markup).toContain('<table aria-rowcount="4"');
    expect(markup.match(/<th /g)).toHaveLength(2);
    expect(markup.match(/<tr /g)).toHaveLength(4);
    expect(markup.match(/<td /g)).toHaveLength(6);
  });

  it("shows numbers formatted in cells with data-type number, text unchanged", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(markup).toMatch(new RegExp(`data-type="number"[^>]*>${formatNumber(1250)}<`));
    expect(markup).toMatch(/data-type="text"[^>]*>Beta</);
  });

  it("leaves the order as delivered without sorting", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(firstColumn(markup)).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("sorts by the controlled sorting and shows aria-sort on the header", () => {
    const ascending = renderRoot(
      <DataGrid columns={COLUMNS} rows={ROWS} sorting={[{ id: "name", desc: false }]} />,
    ).markup;
    expect(firstColumn(ascending)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(ascending).toMatch(/aria-sort="ascending"[^>]*data-type="text"/);
    expect(ascending).toMatch(/data-sort="asc"/);

    const descending = renderRoot(
      <DataGrid columns={COLUMNS} rows={ROWS} sorting={[{ id: "count", desc: true }]} />,
    ).markup;
    expect(firstColumn(descending)).toEqual(["Beta", "Gamma", "Alpha"]);
    expect(descending).toMatch(/aria-sort="descending"[^>]*data-type="number"/);
  });

  it("leaves the order unchanged with manualSorting and only reports the request", () => {
    const { markup } = renderRoot(
      <DataGrid
        columns={COLUMNS}
        manualSorting
        rows={ROWS}
        sorting={[{ id: "name", desc: false }]}
      />,
    );
    expect(firstColumn(markup)).toEqual(["Beta", "Alpha", "Gamma"]);
    expect(markup).toMatch(/aria-sort="ascending"/);
  });

  it("makes a column with sortable false not sortable", () => {
    const columns: DataGridColumn<Row>[] = [
      { id: "name", header: "Name", accessorKey: "name", sortable: false },
    ];
    const { markup } = renderRoot(<DataGrid columns={columns} rows={ROWS} />);
    expect(markup).not.toContain("aria-sort");
    expect(markup).not.toContain("<button");
  });

  it("renders only the visible rows and an overscan, not all of them", () => {
    const many = Array.from({ length: 10_000 }, (_, index) => ({
      id: String(index),
      name: `Row ${index}`,
      count: index,
    }));
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={many} />);
    const rowCount = (markup.match(/aria-rowindex="/g) ?? []).length - 1;
    expect(markup).toContain('aria-rowcount="10001"');
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThan(100);

    expect(markup).toMatch(/<td colSpan="2" style="block-size:\d{5,}px"/);
  });

  it("shows the empty text and data-empty without rows", () => {
    const { attrs, markup } = renderRoot(<DataGrid columns={COLUMNS} rows={[]} />);
    expect(attrs["data-empty"]).toBe("");
    expect(markup).toContain("No entries");
    expect(markup.match(/<td /g)).toHaveLength(1);
  });

  it("shows the loading text, aria-busy and data-loading while loading, but no rows", () => {
    const { attrs, markup } = renderRoot(<DataGrid columns={COLUMNS} loading rows={ROWS} />);
    expect(attrs["data-loading"]).toBe("");
    expect(attrs["aria-busy"]).toBe("true");
    expect(attrs).not.toHaveProperty("data-empty");
    expect(markup).toContain("Loading");
    expect(markup.match(/<td /g)).toHaveLength(1);
  });

  it("lets both texts be overridden", () => {
    expect(
      renderRoot(<DataGrid columns={COLUMNS} emptyText="Nothing" rows={[]} />).markup,
    ).toContain("Nothing");
    expect(
      renderRoot(<DataGrid columns={COLUMNS} loading loadingText="Wait" rows={[]} />).markup,
    ).toContain("Wait");
  });

  it("renders a custom cell and computed values", () => {
    const columns: DataGridColumn<Row>[] = [
      { id: "both", header: "Both", accessorFn: (row) => `${row.name}/${row.count}` },
      { id: "bold", header: "Bold", cell: (row) => <b>{row.name}</b> },
    ];
    const { markup } = renderRoot(<DataGrid columns={columns} rows={ROWS.slice(0, 1)} />);
    expect(markup).toContain(">Beta/1250<");
    expect(markup).toContain("<b>Beta</b>");
  });

  it("sets the column widths on col, columns without a width stay free", () => {
    const columns: DataGridColumn<Row>[] = [
      { id: "name", header: "Name", accessorKey: "name", width: "8rem" },
      { id: "count", header: "Count", accessorKey: "count" },
    ];
    const { markup } = renderRoot(<DataGrid columns={columns} rows={ROWS} />);
    expect(markup).toContain('<col style="width:8rem"/><col/>');
  });

  it("passes native attributes through", () => {
    const { attrs } = renderRoot(<DataGrid aria-label="Batches" columns={COLUMNS} rows={ROWS} />);
    expect(attrs["aria-label"]).toBe("Batches");
  });

  it("shows no selection column without selectedIds and onSelectionChange", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(markup.match(/<th /g)).toHaveLength(COLUMNS.length);
    expect(markup).not.toContain('type="checkbox"');
  });

  it("delivers the IDs of the selected rows on selection", async () => {
    measureScrollArea();
    const onSelectionChange = vi.fn();
    render(
      <ControlledSelection columns={COLUMNS} onSelectionChange={onSelectionChange} rows={ROWS} />,
    );

    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[1] as HTMLElement);
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a"])));

    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select row" })[0] as HTMLElement);
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a", "b"])));

    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    await waitFor(() =>
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["b", "a", "c"])),
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(new Set()));
  });

  it("shows no actions column without rowActions", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(markup.match(/<th /g)).toHaveLength(COLUMNS.length);
    expect(markup).not.toContain('data-type="actions"');
  });

  it("shows a ButtonDropdown button per row, isVisible hides entries selectively", () => {
    const actions: DataGridRowAction<Row>[] = [
      { id: "activate", label: "Activate" },
      { id: "remove", isVisible: (row) => row.id !== "a", label: "Remove" },
    ];
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rowActions={actions} rows={ROWS} />);
    expect(markup).toMatch(/data-type="actions"/);

    expect(markup.match(/>Actions</g)).toHaveLength(ROWS.length);

    expect(markup.match(/>Activate</g)).toHaveLength(ROWS.length);
    expect(markup.match(/>Remove</g)).toHaveLength(ROWS.length - 1);
  });

  it("leaves the cell empty when no action of a row is visible", () => {
    const actions: DataGridRowAction<Row>[] = [
      { id: "remove", isVisible: (row) => row.id !== "b", label: "Remove" },
    ];
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rowActions={actions} rows={ROWS} />);

    expect(markup.match(/>Actions</g)).toHaveLength(ROWS.length - 1);
  });

  it("lets the actions button label be overridden", () => {
    const { markup } = renderRoot(
      <DataGrid
        columns={COLUMNS}
        rowActions={[{ id: "x", label: "X" }]}
        rowActionsLabel="More"
        rows={ROWS}
      />,
    );
    expect(markup.match(/>More</g)).toHaveLength(ROWS.length);
    expect(markup).not.toContain(">Actions<");
  });

  it("shows no filter bar without globalFilter and onGlobalFilterChange", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(markup).not.toContain('type="search"');
  });

  it("filters rows by the global search text", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} globalFilter="Beta" rows={ROWS} />);
    expect(firstColumn(markup)).toEqual(["Beta"]);
  });

  it("reports aria-rowcount for the filtered rows, not the full dataset", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} globalFilter="Beta" rows={ROWS} />);
    expect(markup).toMatch(/<table[^>]*aria-rowcount="2"/);
  });

  it("leaves the rows unchanged with manualFiltering and only reports the request", () => {
    const { markup } = renderRoot(
      <DataGrid columns={COLUMNS} globalFilter="Beta" manualFiltering rows={ROWS} />,
    );
    expect(firstColumn(markup)).toEqual(["Beta", "Alpha", "Gamma"]);
  });

  it("lets the search field placeholder be overridden", () => {
    const { markup } = renderRoot(
      <DataGrid
        columns={COLUMNS}
        globalFilter=""
        globalFilterPlaceholder="Find a batch"
        onGlobalFilterChange={() => {}}
        rows={ROWS}
      />,
    );
    expect(markup).toContain('placeholder="Find a batch"');
  });

  it("reports the search text via onGlobalFilterChange", () => {
    const onGlobalFilterChange = vi.fn();
    render(
      <DataGrid
        columns={COLUMNS}
        globalFilter=""
        onGlobalFilterChange={onGlobalFilterChange}
        rows={ROWS}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Beta" } });
    expect(onGlobalFilterChange).toHaveBeenCalledWith("Beta");
  });

  it("shows no pagination below the table without pagination", () => {
    const { markup } = renderRoot(<DataGrid columns={COLUMNS} rows={ROWS} />);
    expect(markup).not.toContain('aria-label="Pagination"');
  });

  it("passes pagination props through", () => {
    const { markup } = renderRoot(
      <DataGrid columns={COLUMNS} pagination={{ page: 2, pageSize: 1, total: 3 }} rows={ROWS} />,
    );
    expect(markup).toContain('aria-label="Pagination"');
    expect(markup).toContain(`${formatNumber(2)}–${formatNumber(2)} of ${formatNumber(3)}`);
  });

  it("reports a page change via onPageChange", async () => {
    const onPageChange = vi.fn();
    render(
      <DataGrid
        columns={COLUMNS}
        pagination={{ onPageChange, page: 1, pageSize: 1, total: 3 }}
        rows={ROWS}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(3));
  });
});
