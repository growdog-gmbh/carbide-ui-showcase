import type { ColumnDef, RowSelectionState, SortingState, Updater } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ButtonDropdown, type ButtonDropdownItem } from "../ButtonDropdown/ButtonDropdown.js";
import { Checkbox } from "../Checkbox/Checkbox.js";
import { formatNumber } from "../format/number.js";
import { t } from "../i18n/t.js";
import { Pagination, type PaginationProps } from "../Pagination/Pagination.js";
import { ScrollArea } from "../ScrollArea/ScrollArea.js";
import { Search } from "../Search/Search.js";
import styles from "./DataGrid.module.css";

export type DataGridColumnType = "text" | "number";

export interface DataGridColumn<TRow> {
  id: string;

  header: string;

  accessorKey?: keyof TRow & string;
  accessorFn?: (row: TRow) => unknown;

  cell?: (row: TRow) => ReactNode;

  type?: DataGridColumnType;

  width?: string;

  sortable?: boolean;
}

export type DataGridSorting = SortingState;

export interface DataGridRowAction<TRow> extends ButtonDropdownItem {
  isVisible?: (row: TRow) => boolean;
}

export type DataGridPagination = Pick<
  PaginationProps,
  | "page"
  | "pageSize"
  | "total"
  | "pageSizes"
  | "onPageChange"
  | "onPageSizeChange"
  | "pageSizeLabel"
  | "rangeText"
>;

export interface DataGridProps<TRow> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  columns: DataGridColumn<TRow>[];
  rows: TRow[];

  getRowId?: (row: TRow, index: number) => string;

  sorting?: DataGridSorting;
  onSortingChange?: (sorting: DataGridSorting) => void;

  manualSorting?: boolean;

  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;

  rowActions?: DataGridRowAction<TRow>[];
  onRowAction?: (id: string, row: TRow) => void;

  rowActionsLabel?: string;

  globalFilter?: string;
  onGlobalFilterChange?: (globalFilter: string) => void;

  manualFiltering?: boolean;

  globalFilterPlaceholder?: string;

  pagination?: DataGridPagination;
  loading?: boolean;

  emptyText?: string;

  loadingText?: string;
}

const DEFAULT_ROW_HEIGHT = 32;

const DEFAULT_ROW_COUNT = 20;
const OVERSCAN = 5;

function defaultRowId<TRow>(row: TRow, index: number): string {
  if (typeof row === "object" && row !== null && "id" in row) {
    const id: unknown = row.id;
    if (typeof id === "string" || typeof id === "number") {
      return String(id);
    }
  }
  return String(index);
}

function asText(value: unknown, type: DataGridColumnType): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return type === "number" ? formatNumber(value) : String(value);
  }
  return String(value);
}

function toColumnDef<TRow>(column: DataGridColumn<TRow>): ColumnDef<TRow, unknown> {
  const { id, header, accessorKey, accessorFn, cell, type = "text", sortable = true } = column;
  const accessor: (row: TRow) => unknown =
    accessorFn ?? (accessorKey === undefined ? () => undefined : (row) => row[accessorKey]);
  return {
    id,
    header,
    accessorFn: accessor,
    enableSorting: sortable,
    cell:
      cell === undefined ? (ctx) => asText(ctx.getValue(), type) : (ctx) => cell(ctx.row.original),
  };
}

const SELECTION_COLUMN_ID = "select";

function selectionColumn<TRow>(): ColumnDef<TRow, unknown> {
  return {
    id: SELECTION_COLUMN_ID,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        hideLabel
        indeterminate={!table.getIsAllRowsSelected() && table.getIsSomeRowsSelected()}
        label={t("table.selectAll")}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        hideLabel
        label={t("table.selectRow")}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    ),
  };
}

const ACTIONS_COLUMN_ID = "row-actions";

function actionsColumn<TRow>(
  rowActions: DataGridRowAction<TRow>[],
  rowActionsLabel: string,
  onRowAction: ((id: string, row: TRow) => void) | undefined,
): ColumnDef<TRow, unknown> {
  return {
    id: ACTIONS_COLUMN_ID,
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const visibleActions = rowActions.filter(
        (action) => action.isVisible?.(row.original) ?? true,
      );
      if (visibleActions.length === 0) {
        return null;
      }
      return (
        <ButtonDropdown
          items={visibleActions}
          label={rowActionsLabel}
          onItemSelect={(id) => onRowAction?.(id, row.original)}
        />
      );
    },
  };
}

function columnType(
  id: string,
  types: ReadonlyMap<string, DataGridColumnType>,
): string | undefined {
  if (id === SELECTION_COLUMN_ID) {
    return "select";
  }
  if (id === ACTIONS_COLUMN_ID) {
    return "actions";
  }
  return types.get(id);
}

function ariaSort(sortable: boolean, direction: false | "asc" | "desc") {
  if (!sortable) {
    return undefined;
  }
  if (direction === "asc") {
    return "ascending";
  }
  return direction === "desc" ? "descending" : "none";
}

export function DataGrid<TRow>({
  columns,
  rows,
  getRowId = defaultRowId,
  sorting,
  onSortingChange,
  manualSorting = false,
  selectedIds,
  onSelectionChange,
  rowActions,
  onRowAction,
  rowActionsLabel,
  globalFilter,
  onGlobalFilterChange,
  manualFiltering = false,
  globalFilterPlaceholder,
  pagination,
  loading = false,
  emptyText,
  loadingText,
  ...rest
}: DataGridProps<TRow>) {
  const [ownSorting, setOwnSorting] = useState<SortingState>([]);
  const resolvedSorting = sorting ?? ownSorting;

  const [ownSelection, setOwnSelection] = useState<Set<string>>(() => new Set());
  const selection = selectedIds ?? ownSelection;

  const selectionActive = selectedIds !== undefined || onSelectionChange !== undefined;
  const selectionState = useMemo(() => {
    const next: RowSelectionState = {};
    for (const id of selection) {
      next[id] = true;
    }
    return next;
  }, [selection]);

  const [ownFilter, setOwnFilter] = useState("");
  const filterValue = globalFilter ?? ownFilter;

  const filterActive = globalFilter !== undefined || onGlobalFilterChange !== undefined;

  const columnDefs = useMemo(() => {
    const columnList = columns.map(toColumnDef);
    const leading = selectionActive ? [selectionColumn<TRow>()] : [];
    const trailing =
      rowActions === undefined
        ? []
        : [actionsColumn(rowActions, rowActionsLabel ?? t("table.rowActions"), onRowAction)];
    return [...leading, ...columnList, ...trailing];
  }, [columns, selectionActive, rowActions, rowActionsLabel, onRowAction]);
  const types = useMemo(
    () => new Map(columns.map((column) => [column.id, column.type ?? "text"])),
    [columns],
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    getRowId,
    state: { sorting: resolvedSorting, rowSelection: selectionState, globalFilter: filterValue },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(resolvedSorting) : updater;
      if (sorting === undefined) {
        setOwnSorting(next);
      }
      onSortingChange?.(next);
    },
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      const nextState = typeof updater === "function" ? updater(selectionState) : updater;
      const nextSelection = new Set(Object.keys(nextState).filter((id) => nextState[id] === true));
      if (selectedIds === undefined) {
        setOwnSelection(nextSelection);
      }
      onSelectionChange?.(nextSelection);
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      const nextFilter = typeof updater === "function" ? updater(filterValue) : updater;
      if (globalFilter === undefined) {
        setOwnFilter(nextFilter);
      }
      onGlobalFilterChange?.(nextFilter);
    },
    enableRowSelection: selectionActive,
    manualSorting,
    manualFiltering,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const tableRows = table.getRowModel().rows;
  const empty = rows.length === 0;

  const viewportRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableRowElement>(null);
  const rowHeightRef = useRef(DEFAULT_ROW_HEIGHT);

  const virtualizer = useVirtualizer({
    count: loading ? 0 : tableRows.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => rowHeightRef.current,
    overscan: OVERSCAN,

    scrollMargin: rowHeightRef.current,
    initialRect: { width: 0, height: DEFAULT_ROW_HEIGHT * (DEFAULT_ROW_COUNT + 1) },
  });

  useEffect(() => {
    const headerEl = headerRef.current;
    if (headerEl === null) {
      return;
    }
    const measure = () => {
      const measuredHeight = headerEl.getBoundingClientRect().height;
      if (measuredHeight > 0 && measuredHeight !== rowHeightRef.current) {
        rowHeightRef.current = measuredHeight;

        virtualizer.measure();
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(headerEl);
    return () => observer.disconnect();
  }, [virtualizer]);

  const rowHeight = rowHeightRef.current;
  const visibleItems = virtualizer.getVirtualItems();
  const first = visibleItems[0];
  const last = visibleItems[visibleItems.length - 1];
  const spacerTop = first === undefined ? 0 : first.start - rowHeight;
  const spacerBottom = last === undefined ? 0 : virtualizer.getTotalSize() - (last.end - rowHeight);

  const message = loading ? (loadingText ?? t("table.loading")) : (emptyText ?? t("table.empty"));

  return (
    <div
      aria-busy={loading || undefined}
      {...rest}
      className={styles.root}
      data-empty={empty && !loading ? "" : undefined}
      data-loading={loading ? "" : undefined}
    >
      {filterActive && (
        <div className={styles.filterBar}>
          <Search
            onValueChange={table.setGlobalFilter}
            placeholder={globalFilterPlaceholder}
            value={filterValue}
          />
        </div>
      )}
      <ScrollArea axis="vertical" className={styles.scrollArea} ref={viewportRef}>
        <table aria-rowcount={tableRows.length + 1} className={styles.table}>
          <colgroup>
            {selectionActive && <col style={{ width: "var(--carbide-control-h)" }} />}
            {columns.map((column) => (
              <col
                key={column.id}
                style={column.width === undefined ? undefined : { width: column.width }}
              />
            ))}
            {rowActions !== undefined && <col />}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr aria-rowindex={1} className={styles.row} key={group.id} ref={headerRef}>
                {group.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const direction = header.column.getIsSorted();
                  const label = flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      aria-sort={ariaSort(sortable, direction)}
                      className={styles.headerCell}
                      data-sortable={sortable ? "" : undefined}
                      data-type={columnType(header.column.id, types)}
                      key={header.id}
                      scope="col"
                    >
                      {sortable ? (
                        <button
                          className={styles.sortButton}
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          <span className={styles.label}>{label}</span>
                          <svg
                            aria-hidden="true"
                            className={styles.sortIndicator}
                            data-sort={direction === false ? "none" : direction}
                            viewBox="0 0 16 16"
                          >
                            <path
                              d="M8 3v10M4 7l4-4 4 4"
                              fill="none"
                              stroke="currentcolor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      ) : (
                        <span className={styles.label}>{label}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading || empty ? (
              <tr className={styles.row}>
                <td className={styles.message} colSpan={columnDefs.length}>
                  {message}
                </td>
              </tr>
            ) : (
              <>
                {spacerTop > 0 && (
                  <tr className={styles.spacer}>
                    <td colSpan={columnDefs.length} style={{ blockSize: spacerTop }} />
                  </tr>
                )}
                {visibleItems.map((item) => {
                  const matchedRow = tableRows[item.index];
                  if (matchedRow === undefined) {
                    return null;
                  }
                  return (
                    <tr aria-rowindex={item.index + 2} className={styles.row} key={matchedRow.id}>
                      {matchedRow.getVisibleCells().map((tableCell) => (
                        <td
                          className={styles.cell}
                          data-type={columnType(tableCell.column.id, types)}
                          key={tableCell.id}
                        >
                          {flexRender(tableCell.column.columnDef.cell, tableCell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {spacerBottom > 0 && (
                  <tr className={styles.spacer}>
                    <td colSpan={columnDefs.length} style={{ blockSize: spacerBottom }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </ScrollArea>
      {pagination !== undefined && (
        <div className={styles.pagination}>
          <Pagination
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageSizeLabel={pagination.pageSizeLabel}
            pageSizes={pagination.pageSizes}
            rangeText={pagination.rangeText}
            total={pagination.total}
          />
        </div>
      )}
    </div>
  );
}
