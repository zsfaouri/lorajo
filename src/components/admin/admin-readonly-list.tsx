import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Item = {
  id: string;
  title?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  message?: string | null;
  createdAt?: Date | string | null;
  [key: string]: unknown;
};

export function AdminReadonlyList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Item[];
}) {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/40">Admin</p>
        <h1 className="mt-3 text-4xl font-medium">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/48">{description}</p>
      </div>
      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader>
          <CardTitle>Records</CardTitle>
          <CardDescription className="text-white/45">{items.length} records</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 bg-black/22 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg">{item.title ?? item.name ?? item.email ?? item.id}</p>
                  <p className="mt-1 text-sm text-white/42">
                    {[item.email, item.status, item.createdAt ? new Date(item.createdAt).toLocaleString() : null].filter(Boolean).join(" / ")}
                  </p>
                </div>
              </div>
              {item.message ? <p className="mt-3 text-sm leading-6 text-white/56">{item.message}</p> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
