"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  ChevronsUpDown,
  ClipboardList,
  Factory,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

type AuthUser = {
  id: number;
  name: string;
  email: string;
};

const menus = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    title: "Purchasing",
    href: "/dashboard/purchasing",
    icon: ShoppingCart,
  },
  {
    title: "Sales",
    href: "/dashboard/sales",
    icon: TrendingUp,
  },
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: WalletCards,
  },
  {
    title: "HR",
    href: "/dashboard/hr",
    icon: Users,
  },
  {
    title: "Manufacturing",
    href: "/dashboard/manufacturing",
    icon: Factory,
  },
  {
    title: "Project Management",
    href: "/dashboard/projects",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function getInitials(name?: string) {
  if (!name) {
    return "FR";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getPageTitle(pathname: string) {
  const activeMenu = menus.find((menu) => menu.href === pathname);

  if (pathname === "/dashboard/users-roles") {
    return "Users & Roles";
  }

  return activeMenu?.title || "Dashboard";
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("erp_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<{ user: AuthUser }>("/auth/me", { token })
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("erp_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_user");
        router.replace("/login");
      });
  }, [router]);

  async function handleLogout() {
    const token = localStorage.getItem("erp_token");

    if (token) {
      await apiFetch("/auth/logout", {
        method: "POST",
        token,
      }).catch(() => undefined);
    }

    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    router.push("/login");
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/dashboard">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Building2 className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Frae</span>
                      <span className="truncate text-xs">ERP Workspace</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menus.map((menu) => {
                    const Icon = menu.icon;
                    const active = pathname === menu.href;

                    return (
                      <SidebarMenuItem key={menu.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={menu.title}
                        >
                          <Link href={menu.href}>
                            <Icon />
                            <span>{menu.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Core Data</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Company">
                      <Building2 />
                      <span>Company</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Departments">
                      <Boxes />
                      <span>Departments</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/dashboard/users-roles"}
                      tooltip="Users & Roles"
                    >
                      <Link href="/dashboard/users-roles">
                        <Users />
                        <span>Users & Roles</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user?.name || "Frae User"}
                        </span>
                        <span className="truncate text-xs">
                          {user?.email || "ERP Management"}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="end"
                    sideOffset={8}
                    className="w-56"
                  >
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {getInitials(user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 text-sm leading-tight">
                          <span className="truncate font-medium">
                            {user?.name || "Frae User"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {user?.email || "ERP Management"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
