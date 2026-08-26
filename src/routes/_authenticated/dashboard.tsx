import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus, Smartphone, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL, formatDate } from "@/lib/format";
import type { OsStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CONNECT SISTEMAS" },
      { name: "description", content: "Visão geral das ordens de serviço, clientes e aparelhos." },
      { property: "og:title", content: "Dashboard — CONNECT SISTEMAS" },
      { property: "og:description", content: "Visão geral das ordens de serviço, clientes e aparelhos." },
    ],
  }),
  component: Dashboard,
});

async function carregar() {
  const count = { count: "exact" as const, head: true };
  const statusCount = (s: OsStatus) =>
    supabase.from("ordens_servico").select("id", count).eq("status", s);

  const [clientes, aparelhos, recebido, emAnalise, aguardandoPeca, pronto, entregue, recentes] =
    await Promise.all([
      supabase.from("clientes").select("id", count),
      supabase.from("aparelhos").select("id", count),
      statusCount("recebido"),
      statusCount("em_analise"),
      statusCount("aguardando_peca"),
      statusCount("pronto"),
      statusCount("entregue"),
      supabase
        .from("ordens_servico")
        .select("id, numero, status, valor_total, data_entrada, clientes(nome), aparelhos(marca, modelo)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  return {
    clientes: clientes.count ?? 0,
    aparelhos: aparelhos.count ?? 0,
    recebido: recebido.count ?? 0,
    emAnalise: emAnalise.count ?? 0,
    aguardandoPeca: aguardandoPeca.count ?? 0,
    pronto: pronto.count ?? 0,
    entregue: entregue.count ?? 0,
    recentes: recentes.data ?? [],
  };
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${tone ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: carregar });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumo em tempo real da assistência técnica."
        action={
          <Button asChild className="h-10">
            <Link to="/os/novo">
              <Plus className="mr-1.5 size-4" /> Nova OS
            </Link>
          </Button>
        }
      />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Clientes" value={data.clientes} />
            <Stat label="Aparelhos" value={data.aparelhos} />
            <Stat label="Recebidos" value={data.recebido} />
            <Stat label="Em análise" value={data.emAnalise} />
            <Stat label="Aguardando peça" value={data.aguardandoPeca} tone="text-warning-foreground" />
            <Stat label="Prontos" value={data.pronto} tone="text-success" />
            <Stat label="Entregues" value={data.entregue} tone="text-primary" />
            <Card className="shadow-card">
              <CardContent className="flex h-full flex-col justify-center gap-2 p-4">
                <Link to="/clientes/novo" className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Users className="size-4" /> Novo cliente
                </Link>
                <Link to="/aparelhos/novo" className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Smartphone className="size-4" /> Novo aparelho
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Ordens de serviço recentes</h2>
              <Link to="/os" className="text-sm font-medium text-primary">
                Ver todas
              </Link>
            </div>

            {data.recentes.length === 0 ? (
              <EmptyState
                title="Nenhuma ordem de serviço ainda"
                description="Cadastre um cliente e um aparelho para abrir a primeira OS."
              />
            ) : (
              <div className="space-y-2">
                {data.recentes.map((os) => (
                  <Link
                    key={os.id}
                    to="/os/$id"
                    params={{ id: os.id }}
                    className="block rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          OS #{os.numero} · {os.clientes?.nome ?? "Cliente"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[os.aparelhos?.marca, os.aparelhos?.modelo].filter(Boolean).join(" ") ||
                            "Sem aparelho"}{" "}
                          · {formatDate(os.data_entrada)}
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

          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="size-4" />
            Todos os dados exibidos vêm do banco de dados do sistema.
          </div>
        </>
      )}
    </div>
  );
}
