import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/aparelhos/")({
  head: () => ({
    meta: [
      { title: "Aparelhos — CONNECT SISTEMAS" },
      { name: "description", content: "Aparelhos recebidos, vinculados a cada cliente." },
      { property: "og:title", content: "Aparelhos — CONNECT SISTEMAS" },
      { property: "og:description", content: "Aparelhos recebidos, vinculados a cada cliente." },
    ],
  }),
  component: AparelhosPage,
});

function AparelhosPage() {
  const [busca, setBusca] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["aparelhos", busca],
    queryFn: async () => {
      let q = supabase
        .from("aparelhos")
        .select("id, marca, modelo, imei, cor, data_entrada, cliente_id, clientes(nome)")
        .order("created_at", { ascending: false });
      const termo = busca.trim();
      if (termo) {
        const like = `%${termo}%`;
        q = q.or(`marca.ilike.${like},modelo.ilike.${like},imei.ilike.${like},numero_serie.ilike.${like}`);
      }
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Aparelhos"
        description="Busque por marca, modelo, IMEI ou número de série."
        action={
          <Button asChild className="h-10">
            <Link to="/aparelhos/novo">
              <Plus className="mr-1.5 size-4" /> Novo
            </Link>
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aparelho..."
          className="h-11 pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nenhum aparelho encontrado" description="Cadastre um aparelho para um cliente." />
      ) : (
        <div className="space-y-2">
          {data.map((a) => (
            <Link
              key={a.id}
              to="/clientes/$id"
              params={{ id: a.cliente_id }}
              className="block rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {a.marca} {a.modelo}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.clientes?.nome ?? "Cliente"} {a.imei ? `· IMEI ${a.imei}` : ""} {a.cor ? `· ${a.cor}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.data_entrada)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
