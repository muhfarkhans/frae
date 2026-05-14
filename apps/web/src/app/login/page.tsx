"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@frae.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("erp_token", data.token);
      localStorage.setItem("erp_user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden lg:block">
          <Badge variant="outline" className="mb-6 gap-1.5 bg-background">
            <ShieldCheck className="size-3" />
            Internal ERP Workspace
          </Badge>

          <div className="max-w-xl space-y-5">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-normal text-foreground">
                Frae
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                Satu ruang kerja untuk mengelola operasi internal, mulai dari
                inventory, purchasing, sales, manufacturing, finance, sampai HR.
              </p>
            </div>
          </div>

          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Core", "Inventory", "Finance"].map((item) => (
              <div
                key={item}
                className="rounded-lg border bg-background p-4 text-sm font-medium"
              >
                {item}
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Ready for setup
                </p>
              </div>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                <Building2 className="size-5" />
              </div>
              <Badge variant="secondary">Frae ERP</Badge>
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">
                Masuk ke dashboard
              </CardTitle>
              <CardDescription>
                Gunakan akun internal untuk mengakses modul ERP.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    className="h-10 pl-8"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    className="h-10 pl-8"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button disabled={loading} className="h-10 w-full" type="submit">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Memproses
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight />
                  </>
                )}
              </Button>
            </form>

            <Separator className="my-5" />

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Akun demo</p>
              <p className="mt-1">admin@frae.test / password</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
