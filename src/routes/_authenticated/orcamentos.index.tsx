import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { OrcamentoStatusBadge } from "@/components/OrcamentoStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatDate } from "@/lib/format";
import { ORCAMENTO_STATUS, ORCAMENTO_STATUS_LABEL, type OrcamentoStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/orcamentos/")({
  head: () => ({
    meta: [
      { title: "Orçamentos — CONNECT SISTEMAS" },
      { name: "description", content: "Crie, aprove e acompanhe orçamentos de reparo dos clientes." },
      { property: "og:title", content: "Orçamentos — CONNECT SISTEMAS" },
      { property: "og:description", content: "Crie, aprove e acompanhe orçamentos de reparo dos clientes." },
    ],
  }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<OrcamentoStatus | "todos">("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["orcamentos", status],
    queryFn: async () => {
      let q = supabase
        .from("orcamentos")
        .select(
          "id, status, valor_final, validade, created_at, defeito, clientes(nome), aparelhos(marca, modelo), ordens_servico(numero)",
        )
        .order("created_at", { ascending: false });
      if (status !== "todos") q = q.eq("status", status);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  const termo = busca.trim().toLowerCase();
  const lista = (data ?? []).filter((o) =>
    termo
      ? (o.clientes?.nome ?? "").toLowerCase().includes(termo) ||
        String(o.ordens_servico?.numero ?? "").includes(termo)
      : true,
  );

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Aprovações e valores estimados de reparo."
        action={
          <Button asChild className="h-10">
            <Link to="/orcamentos/novo">
              <Plus className="mr-1.5 size-4" /> Novo
            </Link>
          </Button>
        }
      />

      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente ou número da OS..."
          className="h-11 pl-9"
        />
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {(["todos", ...ORCAMENTO_STATUS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
            }`}
          >
            {s === "todos" ? "Todos" : ORCAMENTO_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState title="Nenhum orçamento" description="Crie um orçamento para enviar ao cliente." />
      ) : (
        <div className="space-y-2">
          {lista.map((o) => (
            <Link
              key={o.id}
              to="/orcamentos/$id"
              params={{ id: o.id }}
              className="block rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{o.clientes?.nome ?? "Cliente"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[o.aparelhos?.marca, o.aparelhos?.modelo].filter(Boolean).join(" ") || "Sem aparelho"}
                    {o.ordens_servico?.numero ? ` · OS #${o.ordens_servico.numero}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Criado em {formatDate(o.created_at)}
                    {o.validade ? ` · válido até ${formatDate(o.validade)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <OrcamentoStatusBadge status={o.status as OrcamentoStatus} />
                  <span className="text-xs font-medium">{formatBRL(o.valor_final)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
