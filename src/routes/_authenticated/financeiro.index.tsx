import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL, formatDate } from "@/lib/format";
import { FORMAS_PAGAMENTO, FORMA_PAGAMENTO_LABEL, type FormaPagamento } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  head: () => ({
    meta: [
      { title: "Financeiro — CONNECT SISTEMAS" },
      { name: "description", content: "Fluxo de caixa com entradas, saídas e saldo da assistência técnica." },
      { property: "og:title", content: "Financeiro — CONNECT SISTEMAS" },
      { property: "og:description", content: "Fluxo de caixa com entradas, saídas e saldo da assistência técnica." },
    ],
  }),
  component: FinanceiroPage,
});

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function primeiroDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function FinanceiroPage() {
  const { userId, isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [de, setDe] = useState(primeiroDiaMes());
  const [ate, setAte] = useState(hoje());
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    tipo: "entrada" as "entrada" | "saida",
    descricao: "",
    categoria: "",
    valor: "",
    forma_pagamento: "" as FormaPagamento | "",
    data: hoje(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["lancamentos", de, ate],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("id, tipo, descricao, categoria, valor, forma_pagamento, pago, data")
        .gte("data", de)
        .lte("data", ate)
        .order("data", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data;
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const valor = Number(form.valor.replace(",", "."));
      if (!form.descricao.trim()) throw new Error("Informe a descrição.");
      if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe um valor válido.");
      const { error } = await supabase.from("lancamentos").insert({
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        categoria: form.categoria.trim() || null,
        valor,
        forma_pagamento: form.forma_pagamento || null,
        data: form.data,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento registrado");
      setAberto(false);
      setForm((f) => ({ ...f, descricao: "", categoria: "", valor: "" }));
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento excluído");
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authLoading && !isAdmin) {
    return <EmptyState title="Acesso restrito" description="Somente administradores acessam o financeiro." />;
  }

  const lista = data ?? [];
  const entradas = lista.filter((l) => l.tipo === "entrada").reduce((s, l) => s + Number(l.valor), 0);
  const saidas = lista.filter((l) => l.tipo === "saida").reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Entradas, saídas e saldo do período."
        action={
          <Button className="h-10" onClick={() => setAberto(true)}>
            <Plus className="mr-1.5 size-4" /> Lançamento
          </Button>
        }
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-11" />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-11" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-card p-3 shadow-card">
          <p className="text-xs text-muted-foreground">Entradas</p>
          <p className="mt-1 truncate text-sm font-bold text-success">{formatBRL(entradas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-card">
          <p className="text-xs text-muted-foreground">Saídas</p>
          <p className="mt-1 truncate text-sm font-bold text-destructive">{formatBRL(saidas)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 shadow-card">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="mt-1 truncate text-sm font-bold">{formatBRL(entradas - saidas)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState title="Nenhum lançamento" description="Registre entradas e saídas do caixa." />
      ) : (
        <div className="space-y-2">
          {lista.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
              {l.tipo === "entrada" ? (
                <ArrowUpCircle className="size-5 shrink-0 text-success" />
              ) : (
                <ArrowDownCircle className="size-5 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.descricao}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(l.data)}
                  {l.categoria ? ` · ${l.categoria}` : ""}
                  {l.forma_pagamento ? ` · ${FORMA_PAGAMENTO_LABEL[l.forma_pagamento as FormaPagamento]}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${l.tipo === "entrada" ? "text-success" : "text-destructive"}`}
              >
                {l.tipo === "entrada" ? "+" : "-"}
                {formatBRL(l.valor)}
              </span>
              <button
                aria-label="Excluir lançamento"
                onClick={() => excluir.mutate(l.id)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as "entrada" | "saida" }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                placeholder="Ex.: Peças, Aluguel, Serviço"
                className="h-11"
              />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select
                value={form.forma_pagamento}
                onValueChange={(v) => setForm((f) => ({ ...f, forma_pagamento: v as FormaPagamento }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMA_PAGAMENTO_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="h-11 w-full" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
