import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/format";
import { OS_STATUS_LABEL, type OsStatus } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/relatorios/")({
  head: () => ({
    meta: [
      { title: "Relatórios — CONNECT SISTEMAS" },
      { name: "description", content: "Indicadores de faturamento, ordens de serviço e desempenho por período." },
      { property: "og:title", content: "Relatórios — CONNECT SISTEMAS" },
      {
        property: "og:description",
        content: "Indicadores de faturamento, ordens de serviço e desempenho por período.",
      },
    ],
  }),
  component: RelatoriosPage,
});

function primeiroDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function RelatoriosPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [de, setDe] = useState(primeiroDiaMes());
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ["relatorios", de, ate],
    enabled: isAdmin,
    queryFn: async () => {
      const [os, lanc, prod] = await Promise.all([
        supabase
          .from("ordens_servico")
          .select("id, status, valor_total, valor_pecas, valor_mao_obra, tecnico_nome, data_entrada")
          .gte("data_entrada", de)
          .lte("data_entrada", ate)
          .limit(1000),
        supabase.from("lancamentos").select("tipo, valor, categoria").gte("data", de).lte("data", ate).limit(1000),
        supabase.from("produtos").select("quantidade, custo, estoque_minimo"),
      ]);
      if (os.error) throw os.error;
      if (lanc.error) throw lanc.error;
      if (prod.error) throw prod.error;
      return { os: os.data ?? [], lanc: lanc.data ?? [], prod: prod.data ?? [] };
    },
  });

  if (!authLoading && !isAdmin) {
    return <EmptyState title="Acesso restrito" description="Somente administradores acessam os relatórios." />;
  }

  const os = data?.os ?? [];
  const porStatus = os.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const porTecnico = os.reduce<Record<string, { qtd: number; total: number }>>((acc, o) => {
    const k = o.tecnico_nome || "Sem técnico";
    const cur = acc[k] ?? { qtd: 0, total: 0 };
    acc[k] = { qtd: cur.qtd + 1, total: cur.total + Number(o.valor_total) };
    return acc;
  }, {});
  const faturamentoOs = os
    .filter((o) => o.status === "entregue" || o.status === "pronto")
    .reduce((s, o) => s + Number(o.valor_total), 0);
  const entradas = (data?.lanc ?? []).filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
  const saidas = (data?.lanc ?? []).filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);
  const valorEstoque = (data?.prod ?? []).reduce((s, p) => s + Number(p.quantidade) * Number(p.custo), 0);
  const ticket = os.length ? os.reduce((s, o) => s + Number(o.valor_total), 0) / os.length : 0;

  const cards = [
    { label: "OS no período", value: String(os.length) },
    { label: "Faturamento (OS)", value: formatBRL(faturamentoOs) },
    { label: "Ticket médio", value: formatBRL(ticket) },
    { label: "Entradas de caixa", value: formatBRL(entradas) },
    { label: "Saídas de caixa", value: formatBRL(saidas) },
    { label: "Valor em estoque", value: formatBRL(valorEstoque) },
  ];

  return (
    <div>
      <PageHeader title="Relatórios" description="Desempenho da assistência no período." />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-11" />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-11" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl border bg-card p-3 shadow-card">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 truncate text-base font-bold">{c.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-xl border bg-card p-4 shadow-card">
            <h2 className="mb-3 text-sm font-semibold">Ordens por status</h2>
            {Object.keys(porStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma OS no período.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(porStatus).map(([s, qtd]) => (
                  <li key={s} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{OS_STATUS_LABEL[s as OsStatus] ?? s}</span>
                    <span className="font-semibold">{qtd}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border bg-card p-4 shadow-card">
            <h2 className="mb-3 text-sm font-semibold">Produção por técnico</h2>
            {Object.keys(porTecnico).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma OS no período.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(porTecnico).map(([nome, v]) => (
                  <li key={nome} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      {nome} <span className="text-muted-foreground">· {v.qtd} OS</span>
                    </span>
                    <span className="shrink-0 font-semibold">{formatBRL(v.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
