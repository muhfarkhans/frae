const cards = [
  {
    title: "Inventory",
    value: "0 Items",
    description: "Master item dan stok barang",
  },
  {
    title: "Purchasing",
    value: "0 PO",
    description: "Purchase request dan purchase order",
  },
  {
    title: "Sales",
    value: "0 SO",
    description: "Sales order dan invoice",
  },
  {
    title: "Manufacturing",
    value: "0 WO",
    description: "Work order dan produksi",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard ERP</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan awal sistem ERP internal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Development Roadmap
        </h2>

        <div className="mt-4 space-y-3">
          {[
            "Core System",
            "Inventory",
            "Purchasing",
            "Sales",
            "Project Management",
            "Manufacturing",
            "Finance",
            "HR",
          ].map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">
                {index + 1}. {item}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Planned
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
