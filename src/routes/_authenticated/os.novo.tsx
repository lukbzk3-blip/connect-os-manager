import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/format";

type Search = { cliente?: string };

export const Route = createFileRoute("/_authenticated/os/novo")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search['cliente'] === "string" ? { cliente: search['cliente'] as string } : {},
  head: () => ({
    meta: [
      { title: "Nova ordem de serviço — CONNECT SISTEMAS" },
      { name: "description", content: "Abra uma nova ordem de serviço para um cliente." },
      { property: "og:title", content: "Nova ordem de serviço — CONNECT SISTEMAS" },
      { property: "og:description", content: "Abra uma nova ordem de serviço para um cliente." },
    ],
  }),
  component: NovaOS,
});

function NovaOS() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cliente_id: search.cliente ?? "",
    aparelho_id: "",
    previsao_entrega: "",
    defeito_relatado: "",
    diagnostico: "",
    observacoes: "",
    valor_pecas: "0",
    valor_mao_obra: "0",
    desconto: "0",
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const { data: clientes } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome").order("nome").limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: aparelhos } = useQuery({
    queryKey: ["aparelhos-cliente", form.cliente_id],
    enabled: !!form.cliente_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aparelhos")
        .select("id, marca, modelo")
        .eq("cliente_id", form.cliente_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const num = (v: string) => Number(v.replace(",", ".")) || 0;
  const total = num(form.valor_pecas) + num(form.valor_mao_obra) - num(form.desconto);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error("Selecione o cliente.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: form.cliente_id,
        aparelho_id: form.aparelho_id || null,
        previsao_entrega: form.previsao_entrega || null,
        defeito_relatado: form.defeito_relatado || null,
        diagnostico: form.diagnostico || null,
        observacoes: form.observacoes || null,
        valor_pecas: num(form.valor_pecas),
        valor_mao_obra: num(form.valor_mao_obra),
        desconto: num(form.desconto),
        valor_total: total,
        tecnico_id: user?.id ?? null,
        tecnico_nome: profile?.nome ?? null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(`Erro ao abrir OS: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["ordens"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("Ordem de serviço criada.");
    navigate({ to: "/os/$id", params: { id: data.id } });
  }

  return (
    <div>
      <PageHeader title="Nova ordem de serviço" description="Registre a entrada do aparelho." />
      <form onSubmit={salvar} className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div>
              <Label>Cliente *</Label>
              <Select
                value={form.cliente_id}
                onValueChange={(v) => setForm((p) => ({ ...p, cliente_id: v, aparelho_id: "" }))}
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {(clientes ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Aparelho</Label>
              <Select
                value={form.aparelho_id}
                onValueChange={(v) => set("aparelho_id", v)}
                disabled={!form.cliente_id}
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Selecione o aparelho" />
                </SelectTrigger>
                <SelectContent>
                  {(aparelhos ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.marca} {a.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="defeito">Defeito relatado</Label>
              <Textarea
                id="defeito"
                rows={3}
                className="mt-1.5"
                value={form.defeito_relatado}
                onChange={(e) => set("defeito_relatado", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="diag">Diagnóstico inicial</Label>
              <Textarea
                id="diag"
                rows={2}
                className="mt-1.5"
                value={form.diagnostico}
                onChange={(e) => set("diagnostico", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="prev">Previsão de entrega</Label>
              <Input
                id="prev"
                type="date"
                className="mt-1.5 h-11"
                value={form.previsao_entrega}
                onChange={(e) => set("previsao_entrega", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                rows={2}
                className="mt-1.5"
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="pecas">Valor peças (R$)</Label>
              <Input id="pecas" inputMode="decimal" className="mt-1.5 h-11" value={form.valor_pecas} onChange={(e) => set("valor_pecas", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="mo">Mão de obra (R$)</Label>
              <Input id="mo" inputMode="decimal" className="mt-1.5 h-11" value={form.valor_mao_obra} onChange={(e) => set("valor_mao_obra", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="desc">Desconto (R$)</Label>
              <Input id="desc" inputMode="decimal" className="mt-1.5 h-11" value={form.desconto} onChange={(e) => set("desconto", e.target.value)} />
            </div>
            <div className="sm:col-span-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{formatBRL(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="h-11 w-full sm:w-auto">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Abrir OS
        </Button>
      </form>
    </div>
  );
}
