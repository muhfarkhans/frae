"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Pencil, Plus, RefreshCw, Rows3 } from "lucide-react";
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
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  departments_count: number;
};

type Department = {
  id: number;
  company_id: number;
  code: string;
  name: string;
  is_active: boolean;
  positions_count: number;
  company: Pick<Company, "id" | "code" | "name">;
};

type Position = {
  id: number;
  department_id: number | null;
  code: string;
  name: string;
  is_active: boolean;
  department: (Pick<Department, "id" | "company_id" | "code" | "name"> & {
    company?: Pick<Company, "id" | "code" | "name">;
  }) | null;
};

type OrganizationResponse = {
  companies: Company[];
  departments: Department[];
  positions: Position[];
};

type CompanyForm = {
  id?: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
};

type DepartmentForm = {
  id?: number;
  company_id: string;
  code: string;
  name: string;
  is_active: boolean;
};

type PositionForm = {
  id?: number;
  department_id: string;
  code: string;
  name: string;
  is_active: boolean;
};

const emptyCompanyForm: CompanyForm = {
  code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  is_active: true,
};

const emptyDepartmentForm: DepartmentForm = {
  company_id: "",
  code: "",
  name: "",
  is_active: true,
};

const emptyPositionForm: PositionForm = {
  department_id: "",
  code: "",
  name: "",
  is_active: true,
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

export default function OrganizationPage() {
  const router = useRouter();
  const [data, setData] = useState<OrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
  const [departmentForm, setDepartmentForm] =
    useState<DepartmentForm>(emptyDepartmentForm);
  const [positionForm, setPositionForm] =
    useState<PositionForm>(emptyPositionForm);

  async function loadData() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<OrganizationResponse>(
        "/core/organization",
        { token },
      );

      setData(response);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal memuat organisasi.",
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

    apiFetch<OrganizationResponse>("/core/organization", { token })
      .then((response) => {
        setData(response);
        setError("");
      })
      .catch((error) => {
        setError(
          error instanceof Error ? error.message : "Gagal memuat organisasi.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  function openCreateCompany() {
    setCompanyForm(emptyCompanyForm);
    setCompanyDialogOpen(true);
  }

  function openEditCompany(company: Company) {
    setCompanyForm({
      id: company.id,
      code: company.code,
      name: company.name,
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
      is_active: company.is_active,
    });
    setCompanyDialogOpen(true);
  }

  function openCreateDepartment() {
    setDepartmentForm(emptyDepartmentForm);
    setDepartmentDialogOpen(true);
  }

  function openEditDepartment(department: Department) {
    setDepartmentForm({
      id: department.id,
      company_id: String(department.company_id),
      code: department.code,
      name: department.name,
      is_active: department.is_active,
    });
    setDepartmentDialogOpen(true);
  }

  function openCreatePosition() {
    setPositionForm(emptyPositionForm);
    setPositionDialogOpen(true);
  }

  function openEditPosition(position: Position) {
    setPositionForm({
      id: position.id,
      department_id: position.department_id ? String(position.department_id) : "",
      code: position.code,
      name: position.name,
      is_active: position.is_active,
    });
    setPositionDialogOpen(true);
  }

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
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
        companyForm.id
          ? `/core/companies/${companyForm.id}`
          : "/core/companies",
        {
          method: companyForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            code: companyForm.code,
            name: companyForm.name,
            address: companyForm.address || null,
            phone: companyForm.phone || null,
            email: companyForm.email || null,
            is_active: companyForm.is_active,
          }),
        },
      );

      setCompanyDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan company.");
    } finally {
      setSaving(false);
    }
  }

  async function saveDepartment(event: FormEvent<HTMLFormElement>) {
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
        departmentForm.id
          ? `/core/departments/${departmentForm.id}`
          : "/core/departments",
        {
          method: departmentForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            company_id: Number(departmentForm.company_id),
            code: departmentForm.code,
            name: departmentForm.name,
            is_active: departmentForm.is_active,
          }),
        },
      );

      setDepartmentDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan department.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePosition(event: FormEvent<HTMLFormElement>) {
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
        positionForm.id
          ? `/core/positions/${positionForm.id}`
          : "/core/positions",
        {
          method: positionForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            department_id: positionForm.department_id
              ? Number(positionForm.department_id)
              : null,
            code: positionForm.code,
            name: positionForm.name,
            is_active: positionForm.is_active,
          }),
        },
      );

      setPositionDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan position.");
    } finally {
      setSaving(false);
    }
  }

  const companyColumns = useMemo<DataTableColumn<Company>[]>(
    () => [
      {
        id: "company",
        header: "Company",
        accessor: (company) => `${company.code} ${company.name}`,
        cell: (company) => (
          <div>
            <div className="font-medium">{company.name}</div>
            <div className="text-xs text-muted-foreground">{company.code}</div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        accessor: (company) => `${company.email || ""} ${company.phone || ""}`,
        cell: (company) => (
          <div className="text-muted-foreground">
            {company.email || "-"}
            {company.phone && <div className="text-xs">{company.phone}</div>}
          </div>
        ),
      },
      {
        id: "departments",
        header: "Departments",
        accessor: (company) => company.departments_count,
        cell: (company) => company.departments_count,
      },
      {
        id: "status",
        header: "Status",
        accessor: (company) => (company.is_active ? "Active" : "Inactive"),
        cell: (company) => <StatusBadge active={company.is_active} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (company) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditCompany(company)}
          >
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const departmentColumns = useMemo<DataTableColumn<Department>[]>(
    () => [
      {
        id: "department",
        header: "Department",
        accessor: (department) => `${department.code} ${department.name}`,
        cell: (department) => (
          <div>
            <div className="font-medium">{department.name}</div>
            <div className="text-xs text-muted-foreground">{department.code}</div>
          </div>
        ),
      },
      {
        id: "company",
        header: "Company",
        accessor: (department) => department.company.name,
        cell: (department) => department.company.name,
      },
      {
        id: "positions",
        header: "Positions",
        accessor: (department) => department.positions_count,
        cell: (department) => department.positions_count,
      },
      {
        id: "status",
        header: "Status",
        accessor: (department) => (department.is_active ? "Active" : "Inactive"),
        cell: (department) => <StatusBadge active={department.is_active} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (department) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDepartment(department)}
          >
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const positionColumns = useMemo<DataTableColumn<Position>[]>(
    () => [
      {
        id: "position",
        header: "Position",
        accessor: (position) => `${position.code} ${position.name}`,
        cell: (position) => (
          <div>
            <div className="font-medium">{position.name}</div>
            <div className="text-xs text-muted-foreground">{position.code}</div>
          </div>
        ),
      },
      {
        id: "department",
        header: "Department",
        accessor: (position) => position.department?.name || "",
        cell: (position) => (
          <div className="text-muted-foreground">
            {position.department?.name || "-"}
            {position.department?.company && (
              <div className="text-xs">{position.department.company.name}</div>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessor: (position) => (position.is_active ? "Active" : "Inactive"),
        cell: (position) => <StatusBadge active={position.is_active} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (position) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditPosition(position)}
          >
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );

  const statusFilter = useMemo<DataTableFilter<{ is_active: boolean }>[]>(
    () => [
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
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1.5 bg-background">
            <Building2 className="size-3" />
            Core Data
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              Organization
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Kelola profil company, department, dan position sebagai scope dasar
              user dan transaksi ERP.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw />
            Refresh
          </Button>
          <Button variant="outline" onClick={openCreatePosition}>
            <Rows3 />
            New Position
          </Button>
          <Button variant="outline" onClick={openCreateDepartment}>
            <Plus />
            New Department
          </Button>
          <Button onClick={openCreateCompany}>
            <Plus />
            New Company
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
            Memuat organisasi
          </div>
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardDescription>Registered company scope</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.companies.length}</p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Business units</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {data.departments.length}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Positions</CardTitle>
                <CardDescription>Job positions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.positions.length}</p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardDescription>Profil dan kontak company.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.companies}
                  columns={companyColumns}
                  filters={statusFilter}
                  getRowId={(company) => company.id}
                  searchPlaceholder="Search companies..."
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Department per company.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.departments}
                  columns={departmentColumns}
                  filters={statusFilter}
                  getRowId={(department) => department.id}
                  searchPlaceholder="Search departments..."
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Positions</CardTitle>
                <CardDescription>Position yang bisa dipasang ke user.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.positions}
                  columns={positionColumns}
                  filters={statusFilter}
                  getRowId={(position) => position.id}
                  searchPlaceholder="Search positions..."
                />
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={saveCompany}>
            <DialogHeader>
              <DialogTitle>
                {companyForm.id ? "Edit Company" : "Create Company"}
              </DialogTitle>
              <DialogDescription>
                Simpan profil company utama untuk scope ERP.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-code">Code</Label>
                <Input
                  id="company-code"
                  value={companyForm.code}
                  onChange={(event) =>
                    setCompanyForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Name</Label>
                <Input
                  id="company-name"
                  value={companyForm.name}
                  onChange={(event) =>
                    setCompanyForm((form) => ({ ...form, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyForm.email}
                  onChange={(event) =>
                    setCompanyForm((form) => ({
                      ...form,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  value={companyForm.phone}
                  onChange={(event) =>
                    setCompanyForm((form) => ({
                      ...form,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company-address">Address</Label>
                <textarea
                  id="company-address"
                  className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={companyForm.address}
                  onChange={(event) =>
                    setCompanyForm((form) => ({
                      ...form,
                      address: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-status">Status</Label>
                <select
                  id="company-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={companyForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setCompanyForm((form) => ({
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
                onClick={() => setCompanyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent>
          <form onSubmit={saveDepartment}>
            <DialogHeader>
              <DialogTitle>
                {departmentForm.id ? "Edit Department" : "Create Department"}
              </DialogTitle>
              <DialogDescription>
                Hubungkan department ke company aktif.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="department-company">Company</Label>
                <select
                  id="department-company"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={departmentForm.company_id}
                  onChange={(event) =>
                    setDepartmentForm((form) => ({
                      ...form,
                      company_id: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select company</option>
                  {data?.companies
                    .filter((company) => company.is_active)
                    .map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-code">Code</Label>
                <Input
                  id="department-code"
                  value={departmentForm.code}
                  onChange={(event) =>
                    setDepartmentForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-name">Name</Label>
                <Input
                  id="department-name"
                  value={departmentForm.name}
                  onChange={(event) =>
                    setDepartmentForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-status">Status</Label>
                <select
                  id="department-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={departmentForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setDepartmentForm((form) => ({
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
                onClick={() => setDepartmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <DialogContent>
          <form onSubmit={savePosition}>
            <DialogHeader>
              <DialogTitle>
                {positionForm.id ? "Edit Position" : "Create Position"}
              </DialogTitle>
              <DialogDescription>
                Position dapat dihubungkan ke department.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="position-department">Department</Label>
                <select
                  id="position-department"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={positionForm.department_id}
                  onChange={(event) =>
                    setPositionForm((form) => ({
                      ...form,
                      department_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No department</option>
                  {data?.departments
                    .filter((department) => department.is_active)
                    .map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position-code">Code</Label>
                <Input
                  id="position-code"
                  value={positionForm.code}
                  onChange={(event) =>
                    setPositionForm((form) => ({
                      ...form,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position-name">Name</Label>
                <Input
                  id="position-name"
                  value={positionForm.name}
                  onChange={(event) =>
                    setPositionForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position-status">Status</Label>
                <select
                  id="position-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={positionForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setPositionForm((form) => ({
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
                onClick={() => setPositionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Position
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
