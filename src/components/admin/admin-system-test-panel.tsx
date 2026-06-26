"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TestState = "pass" | "fail" | "warn";

type SystemTest = {
  key: string;
  label: string;
  state: TestState;
  detail: string;
};

type SystemTestResponse = {
  status: TestState;
  checkedAt: string;
  tests: SystemTest[];
};

function stateLabel(state: TestState) {
  if (state === "pass") return "Connected";
  if (state === "warn") return "Needs attention";
  return "Broken";
}

function StateIcon({ state }: { state: TestState }) {
  if (state === "pass") return <CheckCircle2 size={17} />;
  if (state === "warn") return <AlertTriangle size={17} />;
  return <XCircle size={17} />;
}

export function AdminSystemTestPanel() {
  const [data, setData] = useState<SystemTestResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const counts = useMemo(() => {
    const tests = data?.tests ?? [];
    return {
      pass: tests.filter((test) => test.state === "pass").length,
      warn: tests.filter((test) => test.state === "warn").length,
      fail: tests.filter((test) => test.state === "fail").length,
    };
  }, [data]);

  async function run() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/system-test", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Backend test failed.");
        setData(null);
        return;
      }
      setData(json);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Backend test failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void run();
  }, []);

  return (
    <Card className="border-black/10 bg-white text-black">
      <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Backend to frontend connection</CardTitle>
          <CardDescription className="mt-2 max-w-3xl">
            This panel tests the same database, public loaders, gallery source, and Google Drive source used by the website.
          </CardDescription>
        </div>
        <Button type="button" variant="green" onClick={() => void run()} disabled={loading}>
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          Run API tests
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5">
        {error ? (
          <div className="rounded-md border border-red-500/20 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-black/10 bg-[var(--color-soft-white)] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-black/42">Status</p>
            <p className={cn("mt-2 flex items-center gap-2 text-lg font-medium", data?.status === "fail" ? "text-red-700" : data?.status === "warn" ? "text-amber-700" : "text-[var(--color-heritage-green)]")}>
              {data ? <StateIcon state={data.status} /> : null}
              {data ? stateLabel(data.status) : loading ? "Testing" : "Not tested"}
            </p>
          </div>
          <Metric label="Passing" value={counts.pass} className="text-[var(--color-heritage-green)]" />
          <Metric label="Warnings" value={counts.warn} className="text-amber-700" />
          <Metric label="Broken" value={counts.fail} className="text-red-700" />
        </div>

        <div className="grid gap-3">
          {(data?.tests ?? []).map((test) => (
            <article key={test.key} className="grid gap-2 rounded-md border border-black/10 bg-white p-4 md:grid-cols-[220px_120px_1fr] md:items-start">
              <p className="font-medium">{test.label}</p>
              <p className={cn("inline-flex items-center gap-2 text-sm font-medium", test.state === "pass" ? "text-[var(--color-heritage-green)]" : test.state === "warn" ? "text-amber-700" : "text-red-700")}>
                <StateIcon state={test.state} />
                {stateLabel(test.state)}
              </p>
              <p className="text-sm leading-6 text-black/58">{test.detail}</p>
            </article>
          ))}
        </div>

        {data?.checkedAt ? <p className="text-xs text-black/42">Last checked: {new Date(data.checkedAt).toLocaleString()}</p> : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-md border border-black/10 bg-[var(--color-soft-white)] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-black/42">{label}</p>
      <p className={cn("mt-2 text-3xl font-medium", className)}>{value}</p>
    </div>
  );
}
