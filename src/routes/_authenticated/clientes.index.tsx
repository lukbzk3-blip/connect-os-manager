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

export const Route = createFileRoute("/_authenticated/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — CONNECT SISTEMAS" },
      { name: "description", content: "Cadastro e pesquisa de clientes da assistência técnica." },
      { property: "og:title", content: "Clientes — CONNECT SISTEMAS" },
      { property: "og:description", content: "Cadastro e pesquisa de clientes da assistência técnica." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["clientes", busca, mostrarInativos],
    queryFn: async () => {
      let q = supabase
        .from("clientes")
        .select("id, nome, telefone, whatsapp, cpf_cnpj, cidade, ativo, created_at")
        .order("nome");
      if (!mostrarInativos) q = q.eq("ativo", true);
      const termo = busca.trim();
      if (termo) {
        const like = `%${termo}%`;
        q = q.or(
          `nome.ilike.${like},telefone.ilike.${like},whatsapp.ilike.${like},cpf_cnpj.ilike.${like},email.ilike.${like}`,
        );
      }
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Pesquise por nome, telefone, WhatsApp ou CPF."
        action={
          <Button asChild className="h-10">
            <Link to="/clientes/novo">
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
          placeholder="Buscar cliente..."
          className="h-11 pl-9"
        />
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMostrarInativos(false)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            !mostrarInativos ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => setMostrarInativos(true)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            mostrarInativos ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
          }`}
        >
          Todos (inclui inativos)
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" description="Cadastre o primeiro cliente." />
      ) : (
        <div className="space-y-2">
          {data.map((c) => (
            <Link
              key={c.id}
              to="/clientes/$id"
              params={{ id: c.id }}
              className="block rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {c.nome}
                    {!c.ativo ? (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Inativo
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.telefone || c.whatsapp, c.cpf_cnpj, c.cidade].filter(Boolean).join(" · ") ||
                      "Sem contato cadastrado"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
