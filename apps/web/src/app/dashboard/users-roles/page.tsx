"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
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

type Role = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  is_active: boolean;
  permissions: Permission[];
};

type Permission = {
  id: number;
  key: string;
  name: string;
  module: string;
};

type Company = {
  id: number;
  code: string;
  name: string;
};

type Department = {
  id: number;
  company_id: number;
  code: string;
  name: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  company_id: number | null;
  department_id: number | null;
  company: Company | null;
  department: Omit<Department, "company_id"> | null;
  roles: Pick<Role, "id" | "key" | "name">[];
};

type UsersRolesResponse = {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  companies: Company[];
  departments: Department[];
};

type UserForm = {
  id?: number;
  name: string;
  email: string;
  password: string;
  company_id: string;
  department_id: string;
  is_active: boolean;
  role_ids: number[];
};

type RoleForm = {
  id?: number;
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  permission_ids: number[];
};

const emptyUserForm: UserForm = {
  name: "",
  email: "",
  password: "",
  company_id: "",
  department_id: "",
  is_active: true,
  role_ids: [],
};

const emptyRoleForm: RoleForm = {
  key: "",
  name: "",
  description: "",
  is_active: true,
  permission_ids: [],
};

function getToken() {
  return localStorage.getItem("erp_token");
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export default function UsersRolesPage() {
  const router = useRouter();
  const [data, setData] = useState<UsersRolesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);

  const permissionsByModule = useMemo(() => {
    if (!data) {
      return {};
    }

    return data.permissions.reduce<Record<string, Permission[]>>(
      (groups, permission) => {
        groups[permission.module] = groups[permission.module] || [];
        groups[permission.module].push(permission);

        return groups;
      },
      {},
    );
  }, [data]);

  async function loadData() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<UsersRolesResponse>(
        "/core/users-roles",
        { token },
      );

      setData(response);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gagal memuat users & roles.",
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

    apiFetch<UsersRolesResponse>("/core/users-roles", { token })
      .then((response) => {
        setData(response);
        setError("");
      })
      .catch((error) => {
        setError(
          error instanceof Error
            ? error.message
            : "Gagal memuat users & roles.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  function openCreateUser() {
    setUserForm(emptyUserForm);
    setUserDialogOpen(true);
  }

  function openEditUser(user: User) {
    setUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      company_id: user.company_id ? String(user.company_id) : "",
      department_id: user.department_id ? String(user.department_id) : "",
      is_active: user.is_active,
      role_ids: user.roles.map((role) => role.id),
    });
    setUserDialogOpen(true);
  }

  function openCreateRole() {
    setRoleForm(emptyRoleForm);
    setRoleDialogOpen(true);
  }

  function openEditRole(role: Role) {
    setRoleForm({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description || "",
      is_active: role.is_active,
      permission_ids: role.permissions.map((permission) => permission.id),
    });
    setRoleDialogOpen(true);
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        password: userForm.password || undefined,
        company_id: userForm.company_id ? Number(userForm.company_id) : null,
        department_id: userForm.department_id
          ? Number(userForm.department_id)
          : null,
        is_active: userForm.is_active,
        role_ids: userForm.role_ids,
      };

      await apiFetch(
        userForm.id ? `/core/users/${userForm.id}` : "/core/users",
        {
          method: userForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify(payload),
        },
      );

      setUserDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan user.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
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
        roleForm.id ? `/core/roles/${roleForm.id}` : "/core/roles",
        {
          method: roleForm.id ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            key: roleForm.key,
            name: roleForm.name,
            description: roleForm.description || null,
            is_active: roleForm.is_active,
            permission_ids: roleForm.permission_ids,
          }),
        },
      );

      setRoleDialogOpen(false);
      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Gagal menyimpan role.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeUsers = data?.users.filter((user) => user.is_active).length || 0;
  const activeRoles = data?.roles.filter((role) => role.is_active).length || 0;
  const userColumns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        id: "user",
        header: "User",
        accessor: (user) => `${user.name} ${user.email}`,
        cell: (user) => (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        ),
      },
      {
        id: "company",
        header: "Company",
        accessor: (user) =>
          `${user.company?.name || ""} ${user.department?.name || ""}`,
        cell: (user) => (
          <div className="text-muted-foreground">
            {user.company?.name || "-"}
            {user.department && (
              <div className="text-xs">{user.department.name}</div>
            )}
          </div>
        ),
      },
      {
        id: "roles",
        header: "Roles",
        accessor: (user) => user.roles.map((role) => role.name).join(" "),
        cell: (user) => (
          <div className="flex flex-wrap gap-1">
            {user.roles.length ? (
              user.roles.map((role) => (
                <Badge key={role.id} variant="secondary" className="font-normal">
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No role</span>
            )}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessor: (user) => (user.is_active ? "Active" : "Inactive"),
        cell: (user) => (
          <Badge variant={user.is_active ? "default" : "secondary"}>
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        headerClassName: "w-12",
        cell: (user) => (
          <Button variant="ghost" size="icon" onClick={() => openEditUser(user)}>
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  );
  const userFilters = useMemo<DataTableFilter<User>[]>(
    () => [
      {
        id: "status",
        label: "All statuses",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
        predicate: (user, value) =>
          value === "active" ? user.is_active : !user.is_active,
      },
      {
        id: "role",
        label: "All roles",
        options:
          data?.roles.map((role) => ({
            label: role.name,
            value: String(role.id),
          })) || [],
        predicate: (user, value) =>
          user.roles.some((role) => role.id === Number(value)),
      },
    ],
    [data?.roles],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1.5 bg-background">
            <ShieldCheck className="size-3" />
            Core Access
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              Users & Roles
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Kelola akun pengguna, assignment role, dan permission role untuk
              fondasi akses ERP.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw />
            Refresh
          </Button>
          <Button variant="outline" onClick={openCreateRole}>
            <ShieldCheck />
            New Role
          </Button>
          <Button onClick={openCreateUser}>
            <Plus />
            New User
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
            Memuat users & roles
          </div>
        </div>
      ) : data ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Active / total</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {activeUsers}/{data.users.length}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>Active / total</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {activeRoles}/{data.roles.length}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>Registered access keys</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {data.permissions.length}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="shadow-sm">
              <CardHeader>
                <CardTitle>Companies</CardTitle>
                <CardDescription>Available scope</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {data.companies.length}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4" />
                  Users
                </CardTitle>
                <CardDescription>
                  Daftar user dan role yang terhubung ke akun.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={data.users}
                  columns={userColumns}
                  filters={userFilters}
                  getRowId={(user) => user.id}
                  getSearchValue={(user) =>
                    [
                      user.name,
                      user.email,
                      user.company?.name,
                      user.department?.name,
                      user.roles.map((role) => role.name).join(" "),
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  searchPlaceholder="Search users..."
                  emptyTitle="No users found"
                  emptyDescription="Try changing the search or filter values."
                />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Roles
                </CardTitle>
                <CardDescription>
                  Role dan permission yang melekat pada setiap role.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.roles.map((role) => (
                    <div key={role.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {role.key}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditRole(role)}
                        >
                          <Pencil />
                        </Button>
                      </div>
                      {role.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {role.permissions.slice(0, 6).map((permission) => (
                          <Badge
                            key={permission.id}
                            variant="outline"
                            className="font-normal"
                          >
                            {permission.key}
                          </Badge>
                        ))}
                        {role.permissions.length > 6 && (
                          <Badge variant="secondary">
                            +{role.permissions.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleUserSubmit}>
            <DialogHeader>
              <DialogTitle>
                {userForm.id ? "Edit User" : "Create User"}
              </DialogTitle>
              <DialogDescription>
                Atur profil user, scope organisasi, dan role akses.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">
                  Password {userForm.id && "(optional)"}
                </Label>
                <Input
                  id="user-password"
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      password: event.target.value,
                    }))
                  }
                  required={!userForm.id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-status">Status</Label>
                <select
                  id="user-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={userForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      is_active: event.target.value === "1",
                    }))
                  }
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-company">Company</Label>
                <select
                  id="user-company"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={userForm.company_id}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      company_id: event.target.value,
                      department_id: "",
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
                <Label htmlFor="user-department">Department</Label>
                <select
                  id="user-department"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={userForm.department_id}
                  onChange={(event) =>
                    setUserForm((form) => ({
                      ...form,
                      department_id: event.target.value,
                    }))
                  }
                >
                  <option value="">No department</option>
                  {data?.departments
                    .filter(
                      (department) =>
                        !userForm.company_id ||
                        department.company_id === Number(userForm.company_id),
                    )
                    .map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pb-4">
              <Label>Roles</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {data?.roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={userForm.role_ids.includes(role.id)}
                      onChange={() =>
                        setUserForm((form) => ({
                          ...form,
                          role_ids: toggleId(form.role_ids, role.id),
                        }))
                      }
                    />
                    <span>{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <form onSubmit={handleRoleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {roleForm.id ? "Edit Role" : "Create Role"}
              </DialogTitle>
              <DialogDescription>
                Role menentukan permission yang akan diwariskan ke user.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-key">Key</Label>
                <Input
                  id="role-key"
                  value={roleForm.key}
                  onChange={(event) =>
                    setRoleForm((form) => ({
                      ...form,
                      key: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-name">Name</Label>
                <Input
                  id="role-name"
                  value={roleForm.name}
                  onChange={(event) =>
                    setRoleForm((form) => ({
                      ...form,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  value={roleForm.description}
                  onChange={(event) =>
                    setRoleForm((form) => ({
                      ...form,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-status">Status</Label>
                <select
                  id="role-status"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={roleForm.is_active ? "1" : "0"}
                  onChange={(event) =>
                    setRoleForm((form) => ({
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

            <div className="max-h-[340px] space-y-4 overflow-auto pb-4 pr-1">
              {Object.entries(permissionsByModule).map(
                ([module, permissions]) => (
                  <div key={module} className="space-y-2">
                    <div className="text-sm font-medium capitalize">
                      {module}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={roleForm.permission_ids.includes(
                              permission.id,
                            )}
                            onChange={() =>
                              setRoleForm((form) => ({
                                ...form,
                                permission_ids: toggleId(
                                  form.permission_ids,
                                  permission.id,
                                ),
                              }))
                            }
                          />
                          <span>{permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                Save Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
