"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Factory,
  Loader2,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DashboardMetric = {
  key: string;
  title: string;
  value: number;
  unit: string;
  description: string;
  href: string;
};

type RoadmapItem = {
  module: string;
  owner: string;
  status: string;
  scope: string;
};

type DashboardSummary = {
  user: {
    id: number;
    name: string;
    email: string;
    roles: {
      id: number;
      key: string;
      name: string;
    }[];
  };
  metrics: DashboardMetric[];
  core_stats: {
    companies: number;
    departments: number;
    users: number;
    roles: number;
    permissions: number;
  };
  roadmap: RoadmapItem[];
};

const metricIcons = {
  inventory: Package,
  purchasing: ShoppingCart,
  sales: TrendingUp,
  manufacturing: Factory,
};

const quickModules = [
  {
    title: "Finance",
    href: "/dashboard/finance",
    icon: CircleDollarSign,
  },
  {
    title: "HR",
    href: "/dashboard/hr",
    icon: Users,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: ClipboardList,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("erp_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    apiFetch<DashboardSummary>("/dashboard/summary", { token })
      .then(setSummary)
      .catch((error) => {
        if (error instanceof Error && error.message.includes("401")) {
          localStorage.removeItem("erp_token");
          localStorage.removeItem("erp_user");
          router.replace("/login");
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Gagal memuat dashboard.",
        );
      });
  }, [router]);

  if (!summary && !error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat dashboard
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Dashboard tidak bisa dimuat</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Coba lagi</Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="gap-1.5 bg-background">
            <Building2 className="size-3" />
            Frae ERP
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              Dashboard ERP
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Selamat datang, {summary.user.name}. Data dashboard ini diambil
              langsung dari API Laravel dengan autentikasi Sanctum.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">Settings</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/inventory">
              Open Inventory
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.metrics.map((metric) => {
          const Icon =
            metricIcons[metric.key as keyof typeof metricIcons] || Boxes;

          return (
            <Card key={metric.key} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <CardAction>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-foreground" />
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">
                    {metric.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  {metric.description}
                </p>
                <Button asChild variant="ghost" className="mt-3 px-0">
                  <Link href={metric.href}>
                    Buka modul
                    <ArrowUpRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {Object.entries(summary.core_stats).map(([key, value]) => (
          <Card key={key} size="sm" className="shadow-sm">
            <CardHeader>
              <CardTitle className="capitalize">{key}</CardTitle>
              <CardDescription>Core data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Development Roadmap</CardTitle>
            <CardDescription>
              Prioritas modul ERP dari backend summary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.roadmap.map((item) => (
                  <TableRow key={item.module}>
                    <TableCell className="font-medium">{item.module}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.owner}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.scope}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Area kerja lintas departemen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickModules.map((module) => {
              const Icon = module.icon;

              return (
                <Button
                  key={module.href}
                  asChild
                  variant="outline"
                  className="h-11 w-full justify-start"
                >
                  <Link href={module.href}>
                    <Icon />
                    {module.title}
                  </Link>
                </Button>
              );
            })}

            <Separator className="my-4" />

            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-background">
                  <Users className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {summary.user.roles[0]?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.user.email}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
