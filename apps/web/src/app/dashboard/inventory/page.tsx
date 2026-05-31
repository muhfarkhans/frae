"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Warehouse,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/data-table/data-table";

type Company = {
  id: number;
  code: string;
  name: string;
};

type Category = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  items_count: number;
};

type Unit = {
  id: number;
  code: string;
  name: string;
  precision: number;
  is_active: boolean;
  items_count: number;
};

type WarehouseRow = {
  id: number;
  company_id: number | null;
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
  company: Company | null;
};

type Item = {
  id: number;
  sku: string;
  name: string;
  category_id: number | null;
  unit_id: number;
  item_type: "stock" | "non-stock" | "service";
  track_stock: boolean;
  min_stock: string;
  description: string | null;
  is_active: boolean;
  category: Pick<Category, "id" | "code" | "name"> | null;
  unit: Pick<Unit, "id" | "code" | "name">;
};

type StockMovement = {
  id: number;
  item_id: number;
  warehouse_id: number;
  movement_date: string;
  movement_type: "opening" | "in" | "out" | "adjustment";
  direction: "in" | "out";
  quantity: number;
  signed_quantity: number;
  reference_no: string | null;
  notes: string | null;
  item: Pick<Item, "id" | "sku" | "name"> & {
    unit?: Pick<Unit, "id" | "code" | "name">;
  };
  warehouse: Pick<WarehouseRow, "id" | "code" | "name">;
};

type StockBalance = {
  item_id: number;
  warehouse_id: number;
  item: Pick<Item, "id" | "sku" | "name" | "min_stock"> & {
    unit?: Pick<Unit, "id" | "code" | "name">;
  };
  warehouse: Pick<WarehouseRow, "id" | "code" | "name">;
  balance: number;
  min_stock: number;
  is_low_stock: boolean;
};

type StockCardResponse = {
  item: Pick<Item, "id" | "sku" | "name"> & {
    unit?: Pick<Unit, "id" | "code" | "name">;
    category?: Pick<Category, "id" | "code" | "name"> | null;
  };
  balance: number;
  card: (StockMovement & {
    qty_in: number;
    qty_out: number;
    balance: number;
  })[];
};

type InventoryResponse = {
  items: Item[];
  categories: Category[];
  units: Unit[];
  warehouses: WarehouseRow[];
  stock_balances: StockBalance[];
  stock_movements: StockMovement[];
  companies: Company[];
};

type ItemForm = {
  id?: number;
  sku: string;
  name: string;
  category_id: string;
  unit_id: string;
  item_type: "stock" | "non-stock" | "service";
  track_stock: boolean;
  min_stock: string;
  description: string;
  is_active: boolean;
};

type CategoryForm = {
  id?: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
};

type UnitForm = {
  id?: number;
  code: string;
  name: string;
  precision: string;
  is_active: boolean;
};

type WarehouseForm = {
  id?: number;
  company_id: string;
  code: string;
  name: string;
  address: string;
  is_active: boolean;
};

type MovementForm = {
  item_id: string;
  warehouse_id: string;
  movement_date: string;
  movement_type: "opening" | "in" | "out" | "adjustment";
  direction: "in" | "out";
  quantity: string;
  reference_no: string;
  notes: string;
};

type StockCardFilter = {
  item_id: string;
  warehouse_id: string;
};

const emptyItemForm: ItemForm = {
  sku: "",
  name: "",
  category_id: "",
  unit_id: "",
  item_type: "stock",
  track_stock: true,
  min_stock: "0",
  description: "",
  is_active: true,
};

const emptyCategoryForm: CategoryForm = {
  code: "",
  name: "",
  description: "",
  is_active: true,
};

const emptyUnitForm: UnitForm = {
  code: "",
  name: "",
  precision: "0",
  is_active: true,
};

const emptyWarehouseForm: WarehouseForm = {
  company_id: "",
  code: "",
  name: "",
  address: "",
  is_active: true,
};

const emptyMovementForm: MovementForm = {
  item_id: "",
  warehouse_id: "",
  movement_date: new Date().toISOString().slice(0, 10),
  movement_type: "in",
  direction: "in",
  quantity: "1",
  reference_no: "",
  notes: "",
};

const emptyStockCardFilter: StockCardFilter = {
  item_id: "",
  warehouse_id: "",
};

function getToken() {
  return localStorage.getItem("erp_token");
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function createStatusFilter<T extends { is_active: boolean }>(): DataTableFilter<T>[] {
  return [
    {
      id: "status",
      label: "All statuses",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      predicate: (row, value) =>
        value === "active" ? row.is_active : !row.is_active,
    },
  ];
}

export default function InventoryPage() {
  const router = useRouter();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [stockCardLoading, setStockCardLoading] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(emptyCategoryForm);
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnitForm);
  const [warehouseForm, setWarehouseForm] =
    useState<WarehouseForm>(emptyWarehouseForm);
  const [movementForm, setMovementForm] =
    useState<MovementForm>(emptyMovementForm);
  const [stockCardFilter, setStockCardFilter] = useState<StockCardFilter>(
    emptyStockCardFilter,
  );
  const [stockCard, setStockCard] = useState<StockCardResponse | null>(null);

  async function loadData() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<InventoryResponse>("/inventory/master", {
        token,
      });

      setData(response);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal memuat inventory.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<InventoryResponse>("/inventory/master", { token })
      .then((response) => {
        setData(response);
        setError("");
      })
      .catch((error) => {
        setError(
          error instanceof Error ? error.message : "Gagal memuat inventory.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  function openCreateItem() {
    setItemForm(emptyItemForm);
    setItemDialogOpen(true);
  }

  function openEditItem(item: Item) {
    setItemForm({
      id: item.id,
      sku: item.sku,
      name: item.name,
      category_id: item.category_id ? String(item.category_id) : "",
      unit_id: String(item.unit_id),
      item_type: item.item_type,
      track_stock: item.track_stock,
      min_stock: String(item.min_stock),
      description: item.description || "",
      is_active: item.is_active,
    });
    setItemDialogOpen(true);
  }

  function openCreateCategory() {
    setCategoryForm(emptyCategoryForm);
    setCategoryDialogOpen(true);
  }

  function openEditCategory(category: Category) {
    setCategoryForm({
      id: category.id,
      code: category.code,
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setCategoryDialogOpen(true);
  }

  function openCreateUnit() {
    setUnitForm(emptyUnitForm);
    setUnitDialogOpen(true);
  }

  function openEditUnit(unit: Unit) {
    setUnitForm({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      precision: String(unit.precision),
      is_active: unit.is_active,
    });
    setUnitDialogOpen(true);
  }

  function openCreateWarehouse() {
    setWarehouseForm(emptyWarehouseForm);
    setWarehouseDialogOpen(true);
  }

  function openEditWarehouse(warehouse: WarehouseRow) {
    setWarehouseForm({
      id: warehouse.id,
      company_id: warehouse.company_id ? String(warehouse.company_id) : "",
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || "",
      is_active: warehouse.is_active,
    });
    setWarehouseDialogOpen(true);
  }

  function openCreateMovement() {
    setMovementForm(emptyMovementForm);
    setMovementDialogOpen(true);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiFetch(itemForm.id ? `/inventory/items/${itemForm.id}` : "/inventory/items", {
        method: itemForm.id ? "PUT" : "POST",
        token,
        body: JSON.stringify({
          sku: itemForm.sku,
          name: itemForm.name,
          category_id: itemForm.category_id ? Number(itemForm.category_id) : null,
          unit_id: Number(itemForm.unit_id),
          item_type: itemForm.item_type,
          track_stock: itemForm.track_stock,
          min_stock: Number(itemForm.min_stock || 0),
          description: itemForm.description || null,
          is_active: itemForm.is_active,
        }),
      });

      setItemDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan item.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiFetch(
        categoryForm.id
          ? `/inventory/categories/${categoryForm.id}`
          : "/inventory/categories",
        {
          method: categoryForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            code: categoryForm.code,
            name: categoryForm.name,
            description: categoryForm.description || null,
            is_active: categoryForm.is_active,
          }),
        },
      );

      setCategoryDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiFetch(unitForm.id ? `/inventory/units/${unitForm.id}` : "/inventory/units", {
        method: unitForm.id ? "PUT" : "POST",
        token,
        body: JSON.stringify({
          code: unitForm.code,
          name: unitForm.name,
          precision: Number(unitForm.precision || 0),
          is_active: unitForm.is_active,
        }),
      });

      setUnitDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan unit.");
    } finally {
      setSaving(false);
    }
  }

  async function saveWarehouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiFetch(
        warehouseForm.id
          ? `/inventory/warehouses/${warehouseForm.id}`
          : "/inventory/warehouses",
        {
          method: warehouseForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            company_id: warehouseForm.company_id
              ? Number(warehouseForm.company_id)
              : null,
            code: warehouseForm.code,
            name: warehouseForm.name,
            address: warehouseForm.address || null,
            is_active: warehouseForm.is_active,
          }),
        },
      );

      setWarehouseDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan warehouse.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiFetch("/inventory/stock-movements", {
        method: "POST",
        token,
        body: JSON.stringify({
          item_id: Number(movementForm.item_id),
          warehouse_id: Number(movementForm.warehouse_id),
          movement_date: movementForm.movement_date,
          movement_type: movementForm.movement_type,
          direction: movementForm.direction,
          quantity: Number(movementForm.quantity || 0),
          reference_no: movementForm.reference_no || null,
          notes: movementForm.notes || null,
        }),
      });

      setMovementDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan stock movement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function loadStockCard(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!stockCardFilter.item_id) {
      setError("Pilih item untuk melihat stock card.");
      return;
    }

    setStockCardLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        item_id: stockCardFilter.item_id,
      });

      if (stockCardFilter.warehouse_id) {
        params.set("warehouse_id", stockCardFilter.warehouse_id);
      }

      const response = await apiFetch<StockCardResponse>(
        `/inventory/stock-card?${params.toString()}`,
        { token },
      );

      setStockCard(response);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal memuat stock card.",
      );
    } finally {
      setStockCardLoading(false);
    }
  }

  const itemColumns = useMemo<DataTableColumn<Item>[]>(
    () => [
      {
        id: "item",
        header: "Item",
        accessor: (item) => `${item.sku} ${item.name}`,
        cell: (item) => (
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.sku}</div>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        accessor: (item) => item.category?.name || "",
        cell: (item) => item.category?.name || "-",
      },
      {
        id: "unit",
        header: "Unit",
        accessor: (item) => item.unit.name,
        cell: (item) => (
          <Badge variant="outline" className="font-normal">
            {item.unit.code}
          </Badge>
        ),
      },
      {
        id: "type",
        header: "Type",
        accessor: (item) => item.item_type,
        cell: (item) => item.item_type,
      },
      {
        id: "min_stock",
        header: "Min Stock",
        accessor: (item) => Number(item.min_stock),
        cell: (item) => Number(item.min_stock).toLocaleString(),
      },
      {
        id: "status",
        header: "Status",
        accessor: (item) => (item.is_active ? "Active" : "Inactive"),
        cell: (item) => <StatusBadge active={item.is_active} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (item) => (
          <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const categoryColumns = useMemo<DataTableColumn<Category>[]>(
    () => [
      {
        id: "category",
        header: "Category",
        accessor: (category) => `${category.code} ${category.name}`,
        cell: (category) => (
          <div>
            <div className="font-medium">{category.name}</div>
            <div className="text-xs text-muted-foreground">{category.code}</div>
          </div>
        ),
      },
      {
        id: "items",
        header: "Items",
        accessor: (category) => category.items_count,
        cell: (category) => category.items_count,
      },
      {
        id: "status",
        header: "Status",
        accessor: (category) => (category.is_active ? "Active" : "Inactive"),
        cell: (category) => <StatusBadge active={category.is_active} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (category) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEditCategory(category)}
          >
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const unitColumns = useMemo<DataTableColumn<Unit>[]>(
    () => [
      {
        id: "unit",
        header: "Unit",
        accessor: (unit) => `${unit.code} ${unit.name}`,
        cell: (unit) => (
          <div>
            <div className="font-medium">{unit.name}</div>
            <div className="text-xs text-muted-foreground">{unit.code}</div>
          </div>
        ),
      },
      {
        id: "precision",
        header: "Precision",
        accessor: (unit) => unit.precision,
        cell: (unit) => unit.precision,
      },
      {
        id: "items",
        header: "Items",
        accessor: (unit) => unit.items_count,
        cell: (unit) => unit.items_count,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (unit) => (
          <Button variant="ghost" size="icon-sm" onClick={() => openEditUnit(unit)}>
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const warehouseColumns = useMemo<DataTableColumn<WarehouseRow>[]>(
    () => [
      {
        id: "warehouse",
        header: "Warehouse",
        accessor: (warehouse) => `${warehouse.code} ${warehouse.name}`,
        cell: (warehouse) => (
          <div>
            <div className="font-medium">{warehouse.name}</div>
            <div className="text-xs text-muted-foreground">{warehouse.code}</div>
          </div>
        ),
      },
      {
        id: "company",
        header: "Company",
        accessor: (warehouse) => warehouse.company?.name || "",
        cell: (warehouse) => warehouse.company?.name || "-",
      },
      {
        id: "status",
        header: "Status",
        accessor: (warehouse) => (warehouse.is_active ? "Active" : "Inactive"),
        cell: (warehouse) => <StatusBadge active={warehouse.is_active} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (warehouse) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEditWarehouse(warehouse)}
          >
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const movementColumns = useMemo<DataTableColumn<StockMovement>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        accessor: (movement) => movement.movement_date,
        cell: (movement) => movement.movement_date,
      },
      {
        id: "item",
        header: "Item",
        accessor: (movement) => `${movement.item?.sku} ${movement.item?.name}`,
        cell: (movement) => (
          <div>
            <div className="font-medium">{movement.item?.name}</div>
            <div className="text-xs text-muted-foreground">
              {movement.item?.sku}
            </div>
          </div>
        ),
      },
      {
        id: "warehouse",
        header: "Warehouse",
        accessor: (movement) => movement.warehouse?.name || "",
        cell: (movement) => movement.warehouse?.name || "-",
      },
      {
        id: "type",
        header: "Type",
        accessor: (movement) => movement.movement_type,
        cell: (movement) => movement.movement_type,
      },
      {
        id: "quantity",
        header: "Qty",
        accessor: (movement) => movement.signed_quantity,
        cell: (movement) => (
          <span
            className={
              movement.direction === "out" ? "text-destructive" : "text-foreground"
            }
          >
            {movement.direction === "out" ? "-" : "+"}
            {movement.quantity.toLocaleString()} {movement.item?.unit?.code || ""}
          </span>
        ),
      },
      {
        id: "reference",
        header: "Reference",
        accessor: (movement) => movement.reference_no || "",
        cell: (movement) => movement.reference_no || "-",
      },
    ],
    [],
  );

  const balanceColumns = useMemo<DataTableColumn<StockBalance>[]>(
    () => [
      {
        id: "item",
        header: "Item",
        accessor: (balance) => `${balance.item?.sku} ${balance.item?.name}`,
        cell: (balance) => (
          <div>
            <div className="font-medium">{balance.item?.name}</div>
            <div className="text-xs text-muted-foreground">
              {balance.item?.sku}
            </div>
          </div>
        ),
      },
      {
        id: "warehouse",
        header: "Warehouse",
        accessor: (balance) => balance.warehouse?.name || "",
        cell: (balance) => balance.warehouse?.name || "-",
      },
      {
        id: "balance",
        header: "Balance",
        accessor: (balance) => balance.balance,
        cell: (balance) => (
          <div>
            <div className="font-medium">
              {balance.balance.toLocaleString()} {balance.item?.unit?.code || ""}
            </div>
            <div className="text-xs text-muted-foreground">
              Min {balance.min_stock.toLocaleString()}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessor: (balance) => (balance.is_low_stock ? "Low Stock" : "OK"),
        cell: (balance) => (
          <Badge variant={balance.is_low_stock ? "destructive" : "secondary"}>
            {balance.is_low_stock ? "Low Stock" : "OK"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const stockCardColumns = useMemo<
    DataTableColumn<StockCardResponse["card"][number]>[]
  >(
    () => [
      {
        id: "date",
        header: "Date",
        accessor: (row) => row.movement_date,
        cell: (row) => row.movement_date,
      },
      {
        id: "warehouse",
        header: "Warehouse",
        accessor: (row) => row.warehouse?.name || "",
        cell: (row) => row.warehouse?.name || "-",
      },
      {
        id: "type",
        header: "Type",
        accessor: (row) => row.movement_type,
        cell: (row) => row.movement_type,
      },
      {
        id: "in",
        header: "In",
        accessor: (row) => row.qty_in,
        cell: (row) => row.qty_in.toLocaleString(),
      },
      {
        id: "out",
        header: "Out",
        accessor: (row) => row.qty_out,
        cell: (row) => row.qty_out.toLocaleString(),
      },
      {
        id: "balance",
        header: "Balance",
        accessor: (row) => row.balance,
        cell: (row) => row.balance.toLocaleString(),
      },
      {
        id: "reference",
        header: "Reference",
        accessor: (row) => row.reference_no || "",
        cell: (row) => row.reference_no || "-",
      },
    ],
    [],
  );

  const itemFilters = useMemo<DataTableFilter<Item>[]>(
    () => [
      ...createStatusFilter<Item>(),
      {
        id: "category",
        label: "All categories",
        options:
          data?.categories.map((category) => ({
            label: category.name,
            value: String(category.id),
          })) || [],
        predicate: (item, value) => item.category_id === Number(value),
      },
    ],
    [data?.categories],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1.5 bg-background">
            <Boxes className="size-3" />
            Inventory
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              Inventory Master
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Kelola item master, category, unit, dan warehouse sebagai fondasi
              stok dan transaksi barang.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw />
            Refresh
          </Button>
          <Button variant="outline" onClick={openCreateMovement}>
            <ClipboardList />
            New Movement
          </Button>
          <Button variant="outline" onClick={openCreateWarehouse}>
            <Warehouse />
            New Warehouse
          </Button>
          <Button variant="outline" onClick={openCreateUnit}>
            <Ruler />
            New Unit
          </Button>
          <Button variant="outline" onClick={openCreateCategory}>
            <Plus />
            New Category
          </Button>
          <Button onClick={openCreateItem}>
            <Plus />
            New Item
          </Button>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat inventory
          </div>
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>Master item aktif dan nonaktif</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.items.length}</p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Grouping item</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {data.categories.length}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Units</CardTitle>
                <CardDescription>Satuan transaksi</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.units.length}</p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Movements</CardTitle>
                <CardDescription>Recent stock ledger</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {data.stock_movements.length}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Stock Balances</CardTitle>
                <CardDescription>
                  Saldo stok per item dan warehouse dari movement ledger.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.stock_balances}
                  columns={balanceColumns}
                  getRowId={(balance) =>
                    `${balance.item_id}-${balance.warehouse_id}`
                  }
                  searchPlaceholder="Search stock balances..."
                  emptyTitle="No stock balance yet"
                  emptyDescription="Create opening stock or stock movement first."
                  initialPageSize={5}
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Recent Movements</CardTitle>
                <CardDescription>
                  Transaksi stok terakhir dari semua warehouse.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.stock_movements}
                  columns={movementColumns}
                  getRowId={(movement) => movement.id}
                  searchPlaceholder="Search movements..."
                  emptyTitle="No movement found"
                  emptyDescription="Record opening, inbound, outbound, or adjustment movement."
                  initialPageSize={5}
                />
              </CardContent>
            </Card>
          </section>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Stock Card</CardTitle>
              <CardDescription>
                Kartu stok berjalan per item, bisa difilter per warehouse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                onSubmit={loadStockCard}
              >
                <div className="space-y-2">
                  <Label htmlFor="stock-card-item">Item</Label>
                  <select
                    id="stock-card-item"
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    value={stockCardFilter.item_id}
                    onChange={(event) =>
                      setStockCardFilter((filter) => ({
                        ...filter,
                        item_id: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Select item</option>
                    {data.items
                      .filter((item) => item.track_stock)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.sku} - {item.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock-card-warehouse">Warehouse</Label>
                  <select
                    id="stock-card-warehouse"
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                    value={stockCardFilter.warehouse_id}
                    onChange={(event) =>
                      setStockCardFilter((filter) => ({
                        ...filter,
                        warehouse_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">All warehouses</option>
                    {data.warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={stockCardLoading}>
                    {stockCardLoading && <Loader2 className="animate-spin" />}
                    Load Card
                  </Button>
                </div>
              </form>

              {stockCard && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                    <div>
                      <div className="font-medium">{stockCard.item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stockCard.item.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Balance</div>
                      <div className="font-semibold">
                        {stockCard.balance.toLocaleString()}{" "}
                        {stockCard.item.unit?.code || ""}
                      </div>
                    </div>
                  </div>
                  <DataTable
                    data={stockCard.card}
                    columns={stockCardColumns}
                    getRowId={(row) => row.id}
                    searchPlaceholder="Search stock card..."
                    emptyTitle="No stock card rows"
                    emptyDescription="This item has no movement for the selected warehouse."
                    initialPageSize={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>SKU, category, unit, dan minimum stock.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.items}
                  columns={itemColumns}
                  filters={itemFilters}
                  getRowId={(item) => item.id}
                  searchPlaceholder="Search items..."
                  emptyTitle="No items found"
                  emptyDescription="Create item master before stock transactions."
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Item grouping.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={data.categories}
                    columns={categoryColumns}
                    filters={createStatusFilter<Category>()}
                    getRowId={(category) => category.id}
                    searchPlaceholder="Search categories..."
                    initialPageSize={5}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Units</CardTitle>
                  <CardDescription>Satuan dan precision.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={data.units}
                    columns={unitColumns}
                    getRowId={(unit) => unit.id}
                    searchPlaceholder="Search units..."
                    initialPageSize={5}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Warehouses</CardTitle>
                  <CardDescription>Lokasi penyimpanan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={data.warehouses}
                    columns={warehouseColumns}
                    filters={createStatusFilter<WarehouseRow>()}
                    getRowId={(warehouse) => warehouse.id}
                    searchPlaceholder="Search warehouses..."
                    initialPageSize={5}
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      ) : null}

      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={saveMovement}>
            <DialogHeader>
              <DialogTitle>Create Stock Movement</DialogTitle>
              <DialogDescription>
                Catat opening stock, inbound, outbound, atau adjustment stok.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="movement-item">Item</Label>
                <select
                  id="movement-item"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={movementForm.item_id}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      item_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select item</option>
                  {data?.items
                    .filter((item) => item.is_active && item.track_stock)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} - {item.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-warehouse">Warehouse</Label>
                <select
                  id="movement-warehouse"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={movementForm.warehouse_id}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      warehouse_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select warehouse</option>
                  {data?.warehouses
                    .filter((warehouse) => warehouse.is_active)
                    .map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-date">Date</Label>
                <Input
                  id="movement-date"
                  type="date"
                  value={movementForm.movement_date}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      movement_date: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-type">Type</Label>
                <select
                  id="movement-type"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={movementForm.movement_type}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      movement_type: event.target.value as MovementForm["movement_type"],
                    }))
                  }
                >
                  <option value="opening">Opening</option>
                  <option value="in">Inbound</option>
                  <option value="out">Outbound</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-direction">Direction</Label>
                <select
                  id="movement-direction"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={movementForm.direction}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      direction: event.target.value as MovementForm["direction"],
                    }))
                  }
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movement-quantity">Quantity</Label>
                <Input
                  id="movement-quantity"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={movementForm.quantity}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      quantity: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="movement-reference">Reference</Label>
                <Input
                  id="movement-reference"
                  value={movementForm.reference_no}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      reference_no: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="movement-notes">Notes</Label>
                <textarea
                  id="movement-notes"
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={movementForm.notes}
                  onChange={(event) =>
                    setMovementForm((form) => ({
                      ...form,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMovementDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Movement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={saveItem}>
            <DialogHeader>
              <DialogTitle>{itemForm.id ? "Edit Item" : "Create Item"}</DialogTitle>
              <DialogDescription>
                Atur identitas item, satuan, category, dan aturan stock.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-sku">SKU</Label>
                <Input
                  id="item-sku"
                  value={itemForm.sku}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      sku: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(event) =>
                    setItemForm((form) => ({ ...form, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <select
                  id="item-category"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={itemForm.category_id}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      category_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No category</option>
                  {data?.categories
                    .filter((category) => category.is_active)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">Unit</Label>
                <select
                  id="item-unit"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={itemForm.unit_id}
                  onChange={(event) =>
                    setItemForm((form) => ({ ...form, unit_id: event.target.value }))
                  }
                  required
                >
                  <option value="">Select unit</option>
                  {data?.units
                    .filter((unit) => unit.is_active)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-type">Type</Label>
                <select
                  id="item-type"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={itemForm.item_type}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      item_type: event.target.value as ItemForm["item_type"],
                    }))
                  }
                >
                  <option value="stock">Stock</option>
                  <option value="non-stock">Non-stock</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-min-stock">Minimum Stock</Label>
                <Input
                  id="item-min-stock"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={itemForm.min_stock}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      min_stock: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-track-stock">Track Stock</Label>
                <select
                  id="item-track-stock"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={itemForm.track_stock ? "1" : "0"}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      track_stock: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-status">Status</Label>
                <select
                  id="item-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={itemForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      is_active: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="item-description">Description</Label>
                <textarea
                  id="item-description"
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={itemForm.description}
                  onChange={(event) =>
                    setItemForm((form) => ({
                      ...form,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <form onSubmit={saveCategory}>
            <DialogHeader>
              <DialogTitle>
                {categoryForm.id ? "Edit Category" : "Create Category"}
              </DialogTitle>
              <DialogDescription>Kelola grouping untuk item master.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-code">Code</Label>
                <Input
                  id="category-code"
                  value={categoryForm.code}
                  onChange={(event) =>
                    setCategoryForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <textarea
                  id="category-description"
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((form) => ({
                      ...form,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-status">Status</Label>
                <select
                  id="category-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={categoryForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setCategoryForm((form) => ({
                      ...form,
                      is_active: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent>
          <form onSubmit={saveUnit}>
            <DialogHeader>
              <DialogTitle>{unitForm.id ? "Edit Unit" : "Create Unit"}</DialogTitle>
              <DialogDescription>Kelola satuan dan decimal precision.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="unit-code">Code</Label>
                <Input
                  id="unit-code"
                  value={unitForm.code}
                  onChange={(event) =>
                    setUnitForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-name">Name</Label>
                <Input
                  id="unit-name"
                  value={unitForm.name}
                  onChange={(event) =>
                    setUnitForm((form) => ({ ...form, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-precision">Precision</Label>
                <Input
                  id="unit-precision"
                  type="number"
                  min="0"
                  max="6"
                  value={unitForm.precision}
                  onChange={(event) =>
                    setUnitForm((form) => ({
                      ...form,
                      precision: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-status">Status</Label>
                <select
                  id="unit-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={unitForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setUnitForm((form) => ({
                      ...form,
                      is_active: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Unit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent>
          <form onSubmit={saveWarehouse}>
            <DialogHeader>
              <DialogTitle>
                {warehouseForm.id ? "Edit Warehouse" : "Create Warehouse"}
              </DialogTitle>
              <DialogDescription>Kelola lokasi penyimpanan barang.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse-company">Company</Label>
                <select
                  id="warehouse-company"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={warehouseForm.company_id}
                  onChange={(event) =>
                    setWarehouseForm((form) => ({
                      ...form,
                      company_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No company</option>
                  {data?.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-code">Code</Label>
                <Input
                  id="warehouse-code"
                  value={warehouseForm.code}
                  onChange={(event) =>
                    setWarehouseForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-name">Name</Label>
                <Input
                  id="warehouse-name"
                  value={warehouseForm.name}
                  onChange={(event) =>
                    setWarehouseForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-address">Address</Label>
                <textarea
                  id="warehouse-address"
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={warehouseForm.address}
                  onChange={(event) =>
                    setWarehouseForm((form) => ({
                      ...form,
                      address: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-status">Status</Label>
                <select
                  id="warehouse-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={warehouseForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setWarehouseForm((form) => ({
                      ...form,
                      is_active: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWarehouseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Warehouse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
