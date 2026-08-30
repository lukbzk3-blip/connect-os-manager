import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/estoque/novo")({
  head: () => ({
    meta: [
      { title: "Novo produto — CONNECT SISTEMAS" },
      { name: "description", content: "Cadastre peças e acessórios no estoque da assistência." },
      { property: "og:title", content: "Novo produto — CONNECT SISTEMAS" },
      { property: "og:description", content: "Cadastre peças e acessórios no estoque da assistência." },
    ],
  }),
  component: NovoProduto,
});

function num(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function NovoProduto() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    marca: "",
    codigo: "",
    quantidade: "0",
    estoque_minimo: "0",
    custo: "0",
    preco_venda: "0",
    fornecedor: "",
    localizacao: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome do produto.");
      const { error } = await supabase.from("produtos").insert({
        nome: form.nome.trim(),
        categoria: form.categoria.trim() || null,
        marca: form.marca.trim() || null,
        codigo: form.codigo.trim() || null,
        quantidade: num(form.quantidade),
        estoque_minimo: num(form.estoque_minimo),
        custo: num(form.custo),
        preco_venda: num(form.preco_venda),
        fornecedor: form.fornecedor.trim() || null,
        localizacao: form.localizacao.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto cadastrado");
      navigate({ to: "/estoque" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Novo produto" description="Cadastro de peça ou acessório." />
      <div className="space-y-3 rounded-xl border bg-card p-4 shadow-card">
        <div>
          <Label>Nome *</Label>
          <Input value={form.nome} onChange={set("nome")} className="h-11" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoria</Label>
            <Input value={form.categoria} onChange={set("categoria")} className="h-11" />
          </div>
          <div>
            <Label>Marca</Label>
            <Input value={form.marca} onChange={set("marca")} className="h-11" />
          </div>
          <div>
            <Label>Código</Label>
            <Input value={form.codigo} onChange={set("codigo")} className="h-11" />
          </div>
          <div>
            <Label>Localização</Label>
            <Input value={form.localizacao} onChange={set("localizacao")} className="h-11" />
          </div>
          <div>
            <Label>Quantidade</Label>
            <Input inputMode="decimal" value={form.quantidade} onChange={set("quantidade")} className="h-11" />
          </div>
          <div>
            <Label>Estoque mínimo</Label>
            <Input
              inputMode="decimal"
              value={form.estoque_minimo}
              onChange={set("estoque_minimo")}
              className="h-11"
            />
          </div>
          <div>
            <Label>Custo (R$)</Label>
            <Input inputMode="decimal" value={form.custo} onChange={set("custo")} className="h-11" />
          </div>
          <div>
            <Label>Preço de venda (R$)</Label>
            <Input inputMode="decimal" value={form.preco_venda} onChange={set("preco_venda")} className="h-11" />
          </div>
        </div>
        <div>
          <Label>Fornecedor</Label>
          <Input value={form.fornecedor} onChange={set("fornecedor")} className="h-11" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="h-11 flex-1" onClick={() => navigate({ to: "/estoque" })}>
            Cancelar
          </Button>
          <Button className="h-11 flex-1" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
