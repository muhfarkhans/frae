"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menus = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
  },
  {
    title: "Purchasing",
    href: "/dashboard/purchasing",
  },
  {
    title: "Sales",
    href: "/dashboard/sales",
  },
  {
    title: "Finance",
    href: "/dashboard/finance",
  },
  {
    title: "HR",
    href: "/dashboard/hr",
  },
  {
    title: "Manufacturing",
    href: "/dashboard/manufacturing",
  },
  {
    title: "Project Management",
    href: "/dashboard/projects",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">ERP System</h1>
            <p className="text-xs text-slate-500">Internal Management</p>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {menus.map((menu) => {
            const active = pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`block rounded-lg px-4 py-2 text-sm font-medium ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {menu.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <p className="text-sm font-medium text-slate-900">Dashboard</p>
            <p className="text-xs text-slate-500">ERP Management System</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
