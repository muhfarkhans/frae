"use client";

import { ReactNode, useMemo, useState } from "react";
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

type SortDirection = "asc" | "desc";

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
  direction: SortDirection,
) {
  const multiplier = direction === "asc" ? 1 : -1;

  if (typeof first === "number" && typeof second === "number") {
    return (first - second) * multiplier;
  }

  return String(first ?? "").localeCompare(String(second ?? "")) * multiplier;
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
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const activeFilterCount =
    Number(Boolean(search)) +
    Object.values(filterValues).filter(Boolean).length;

  const processedRows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const filteredRows = data.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        normalizeValue(
          getSearchValue
            ? getSearchValue(row)
            : columns
                .map((column) => column.accessor?.(row))
                .filter((value) => value !== undefined && value !== null)
                .join(" "),
        ).includes(searchTerm);

      const matchesFilters = filters.every((filter) => {
        const value = filterValues[filter.id];

        return !value || filter.predicate(row, value);
      });

      return matchesSearch && matchesFilters;
    });

    if (!sortColumn) {
      return filteredRows;
    }

    const column = columns.find((item) => item.id === sortColumn);

    if (!column) {
      return filteredRows;
    }

    return [...filteredRows].sort((first, second) =>
      compareValues(
        (column.sortValue || column.accessor)?.(first),
        (column.sortValue || column.accessor)?.(second),
        sortDirection,
      ),
    );
  }, [columns, data, filterValues, filters, getSearchValue, search, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const start = safePageIndex * pageSize;
  const paginatedRows = processedRows.slice(start, start + pageSize);

  function updateSort(column: DataTableColumn<TData>) {
    if (column.enableSorting === false) {
      return;
    }

    setPageIndex(0);

    if (sortColumn !== column.id) {
      setSortColumn(column.id);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortColumn(null);
    setSortDirection("asc");
  }

  function resetFilters() {
    setSearch("");
    setFilterValues({});
    setPageIndex(0);
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
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
            />
          </div>

          {filters.map((filter) => (
            <select
              key={filter.id}
              className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm"
              value={filterValues[filter.id] || ""}
              onChange={(event) => {
                setFilterValues((values) => ({
                  ...values,
                  [filter.id]: event.target.value,
                }));
                setPageIndex(0);
              }}
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
            <TableRow>
              {columns.map((column) => {
                const sortable = column.enableSorting !== false;
                const active = sortColumn === column.id;

                return (
                  <TableHead
                    key={column.id}
                    className={column.headerClassName}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => updateSort(column)}
                        className="flex h-8 items-center gap-1 text-left font-medium"
                      >
                        {column.header}
                        <span
                          className={cn(
                            "text-xs text-muted-foreground",
                            active && "text-foreground",
                          )}
                        >
                          {active ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length ? (
              paginatedRows.map((row, index) => (
                <TableRow key={getRowId(row, start + index)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
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
          Showing {processedRows.length ? start + 1 : 0}-
          {Math.min(start + pageSize, processedRows.length)} of{" "}
          {processedRows.length} rows
        </div>

        <div className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>
            Page {safePageIndex + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePageIndex === 0}
              onClick={() => setPageIndex(0)}
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePageIndex === 0}
              onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePageIndex >= totalPages - 1}
              onClick={() =>
                setPageIndex((page) => Math.min(totalPages - 1, page + 1))
              }
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePageIndex >= totalPages - 1}
              onClick={() => setPageIndex(totalPages - 1)}
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
