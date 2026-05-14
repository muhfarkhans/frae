"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    headerClassName?: string;
  }
}

export type DataTableColumn<TData> = {
  id: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  accessor?: (row: TData) => string | number | boolean | null | undefined;
  sortValue?: (row: TData) => string | number | boolean | null | undefined;
  enableSorting?: boolean;
  className?: string;
  headerClassName?: string;
};

export type DataTableFilter<TData> = {
  id: string;
  label: string;
  options: {
    label: string;
    value: string;
  }[];
  predicate: (row: TData, value: string) => boolean;
};

type DataTableProps<TData> = {
  data: TData[];
  columns: DataTableColumn<TData>[];
  filters?: DataTableFilter<TData>[];
  actions?: ReactNode;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  getRowId: (row: TData, index: number) => string | number;
  getSearchValue?: (row: TData) => string;
};

function normalizeValue(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function compareValues(
  first: string | number | boolean | null | undefined,
  second: string | number | boolean | null | undefined,
) {
  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  return String(first ?? "").localeCompare(String(second ?? ""));
}

export function DataTable<TData>({
  data,
  columns,
  filters = [],
  actions,
  searchPlaceholder = "Search...",
  emptyTitle = "No data",
  emptyDescription = "No records match the current view.",
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  getRowId,
  getSearchValue,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const globalFilterFn = useMemo<FilterFn<TData>>(
    () => (row, _columnId, filterValue) => {
      const searchTerm = normalizeValue(filterValue).trim();

      if (!searchTerm) {
        return true;
      }

      const value = getSearchValue
        ? getSearchValue(row.original)
        : columns
            .map((column) => column.accessor?.(row.original))
            .filter((item) => item !== undefined && item !== null)
            .join(" ");

      return normalizeValue(value).includes(searchTerm);
    },
    [columns, getSearchValue],
  );

  const tanstackColumns = useMemo<ColumnDef<TData>[]>(
    () => [
      ...columns.map<ColumnDef<TData>>((column) => {
        const matchingFilter = filters.find((filter) => filter.id === column.id);

        return {
          id: column.id,
          accessorFn: (row) => (column.sortValue || column.accessor)?.(row) ?? "",
          header: () => column.header,
          cell: ({ row }) => column.cell(row.original),
          enableSorting: column.enableSorting !== false,
          sortingFn: (first, second) =>
            compareValues(
              (column.sortValue || column.accessor)?.(first.original),
              (column.sortValue || column.accessor)?.(second.original),
            ),
          filterFn: matchingFilter
            ? (row, _columnId, value) =>
                matchingFilter.predicate(row.original, String(value))
            : "auto",
          meta: {
            className: column.className,
            headerClassName: column.headerClassName,
          },
        };
      }),
      ...filters
        .filter((filter) => !columns.some((column) => column.id === filter.id))
        .map<ColumnDef<TData>>((filter) => ({
          id: filter.id,
          accessorFn: () => "",
          header: () => null,
          cell: () => null,
          enableHiding: true,
          filterFn: (row, _columnId, value) =>
            filter.predicate(row.original, String(value)),
        })),
    ],
    [columns, filters],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      columnVisibility: Object.fromEntries(
        filters
          .filter((filter) => !columns.some((column) => column.id === filter.id))
          .map((filter) => [filter.id, false]),
      ),
    },
    getRowId: (row, index) => String(getRowId(row, index)),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;
  const activeFilterCount =
    Number(Boolean(globalFilter)) +
    columnFilters.filter((filter) => Boolean(filter.value)).length;
  const start = pagination.pageIndex * pagination.pageSize;

  function setFilterValue(filterId: string, value: string) {
    table.getColumn(filterId)?.setFilterValue(value || undefined);
    table.setPageIndex(0);
  }

  function resetFilters() {
    table.resetGlobalFilter();
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-8"
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(event) => {
                table.setGlobalFilter(event.target.value);
                table.setPageIndex(0);
              }}
            />
          </div>

          {filters.map((filter) => (
            <select
              key={filter.id}
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
              value={
                (table.getColumn(filter.id)?.getFilterValue() as string) || ""
              }
              onChange={(event) => setFilterValue(filter.id, event.target.value)}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}

          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={resetFilters}>
              <X />
              Reset
            </Button>
          )}
        </div>

        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const className =
                    header.column.columnDef.meta?.headerClassName;

                  return (
                    <TableHead key={header.id} className={className}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex h-8 items-center gap-1 text-left font-medium"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <span
                            className={cn(
                              "text-xs text-muted-foreground",
                              header.column.getIsSorted() && "text-foreground",
                            )}
                          >
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted() as string] || "↕"}
                          </span>
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {pageRows.length ? (
              pageRows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const className = cell.column.columnDef.meta?.className;

                    return (
                      <TableCell key={cell.id} className={className}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center"
                >
                  <div className="font-medium">{emptyTitle}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {emptyDescription}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          Showing {filteredRowCount ? start + 1 : 0}-
          {Math.min(start + pagination.pageSize, filteredRowCount)} of{" "}
          {filteredRowCount} rows
        </div>

        <div className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>
            Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
