import { apiFetch } from "@/lib/api";

type HealthResponse = {
  status: string;
  app: string;
};

export default async function HomePage() {
  const health = await apiFetch<HealthResponse>("/health");

  return (
    <main className="min-h-screen p-8">
      <div className="rounded-xl border p-6">
        <h1 className="text-2xl font-bold">Frae</h1>
        <p className="mt-2 text-muted-foreground">
          Backend status: {health.status}
        </p>
        <p className="text-muted-foreground">App: {health.app}</p>
      </div>
    </main>
  );
}
