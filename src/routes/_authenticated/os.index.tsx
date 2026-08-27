import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatDate } from "@/lib/format";
import { OS_STATUS, OS_STATUS_LABEL, type OsStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/os/")({
  head: () => ({
    meta: [
      { title: "Ordens de serviço — CONNECT SISTEMAS" },
      { name: "description", content: "Acompanhe todas as ordens de serviço da assistência técnica." },
      { property: "og:title", content: "Ordens de serviço — CONNECT SISTEMAS" },
      { property: "og:description", content: "Acompanhe todas as ordens de serviço da assistência técnica." },
    ],
  }),
  component: OsPage,
});

function OsPage() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<OsStatus | "todos">("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["ordens", busca, status],
    queryFn: async () => {
      let q = supabase
        .from("ordens_servico")
        .select("id, numero, status, valor_total, data_entrada, previsao_entrega, clientes(nome), aparelhos(marca, modelo)")
        .order("numero", { ascending: false });
      if (status !== "todos") q = q.eq("status", status);
      const n = Number(busca.trim());
      if (Number.isFinite(n) && busca.trim()) q = q.eq("numero", n);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Ordens de serviço"
        description="Filtre por status ou busque pelo número da OS."
        action={
          <Button asChild className="h-10">
            <Link to="/os/novo">
              <Plus className="mr-1.5 size-4" /> Nova OS
            </Link>
          </Button>
        }
      />

      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          inputMode="numeric"
          placeholder="Buscar pelo número da OS..."
          className="h-11 pl-9"
        />
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["todos", ...OS_STATUS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {s === "todos" ? "Todas" : OS_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nenhuma ordem de serviço" description="Abra uma nova OS para começar o atendimento." />
      ) : (
        <div className="space-y-2">
          {data.map((os) => (
            <Link
              key={os.id}
              to="/os/$id"
              params={{ id: os.id }}
              className="block rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">OS #{os.numero}</p>
                  <p className="truncate text-sm">{os.clientes?.nome ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[os.aparelhos?.marca, os.aparelhos?.modelo].filter(Boolean).join(" ") || "Sem aparelho"} ·
                    entrada {formatDate(os.data_entrada)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={os.status as OsStatus} />
                  <span className="text-xs font-medium">{formatBRL(os.valor_total)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
