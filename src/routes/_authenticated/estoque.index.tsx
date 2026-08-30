import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/estoque/")({
  head: () => ({
    meta: [
      { title: "Estoque — CONNECT SISTEMAS" },
      { name: "description", content: "Controle de peças, acessórios e movimentações de estoque." },
      { property: "og:title", content: "Estoque — CONNECT SISTEMAS" },
      { property: "og:description", content: "Controle de peças, acessórios e movimentações de estoque." },
    ],
  }),
  component: EstoquePage,
});

type MovTipo = "entrada" | "saida" | "ajuste";

function EstoquePage() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [apenasBaixo, setApenasBaixo] = useState(false);
  const [produtoMov, setProdutoMov] = useState<{ id: string; nome: string } | null>(null);
  const [tipo, setTipo] = useState<MovTipo>("entrada");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, categoria, marca, codigo, quantidade, estoque_minimo, custo, preco_venda, localizacao")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const movimentar = useMutation({
    mutationFn: async () => {
      if (!produtoMov) return;
      const qtd = Number(quantidade.replace(",", "."));
      if (!Number.isFinite(qtd) || qtd <= 0) throw new Error("Informe uma quantidade válida.");
      const { error } = await supabase.from("movimentacoes_estoque").insert({
        produto_id: produtoMov.id,
        tipo,
        quantidade: qtd,
        observacao: observacao.trim() || null,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação registrada");
      setProdutoMov(null);
      setQuantidade("1");
      setObservacao("");
      qc.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const termo = busca.trim().toLowerCase();
  const lista = (data ?? []).filter((p) => {
    const okTermo = termo
      ? [p.nome, p.categoria, p.marca, p.codigo].some((v) => (v ?? "").toLowerCase().includes(termo))
      : true;
    const okBaixo = apenasBaixo ? Number(p.quantidade) <= Number(p.estoque_minimo) : true;
    return okTermo && okBaixo;
  });

  const baixos = (data ?? []).filter((p) => Number(p.quantidade) <= Number(p.estoque_minimo)).length;

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Peças e acessórios disponíveis."
        action={
          <Button asChild className="h-10">
            <Link to="/estoque/novo">
              <Plus className="mr-1.5 size-4" /> Novo produto
            </Link>
          </Button>
        }
      />

      {baixos > 0 ? (
        <button
          onClick={() => setApenasBaixo((v) => !v)}
          className="mb-3 flex w-full items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-left text-sm"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning-foreground" />
          <span className="min-w-0 flex-1">
            {baixos} {baixos === 1 ? "produto" : "produtos"} no estoque mínimo
          </span>
          <span className="shrink-0 text-xs font-medium underline">
            {apenasBaixo ? "ver todos" : "filtrar"}
          </span>
        </button>
      ) : null}

      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, código, marca..."
          className="h-11 pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState title="Nenhum produto" description="Cadastre peças e acessórios para controlar o estoque." />
      ) : (
        <div className="space-y-2">
          {lista.map((p) => {
            const baixo = Number(p.quantidade) <= Number(p.estoque_minimo);
            return (
              <div key={p.id} className="rounded-xl border bg-card p-3 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.nome}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[p.marca, p.categoria, p.codigo].filter(Boolean).join(" · ") || "Sem categoria"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Venda {formatBRL(p.preco_venda)} · Custo {formatBRL(p.custo)}
                      {p.localizacao ? ` · ${p.localizacao}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-lg font-bold ${baixo ? "text-destructive" : ""}`}>
                      {Number(p.quantidade)}
                    </p>
                    <p className="text-xs text-muted-foreground">mín. {Number(p.estoque_minimo)}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    className="h-9 flex-1"
                    onClick={() => {
                      setProdutoMov({ id: p.id, nome: p.nome });
                      setTipo("entrada");
                    }}
                  >
                    Movimentar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!produtoMov} onOpenChange={(o) => !o && setProdutoMov(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar estoque</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{produtoMov?.nome}</p>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as MovTipo)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (define o saldo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-11 w-full"
              disabled={movimentar.isPending}
              onClick={() => movimentar.mutate()}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
