import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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

export type OrcamentoFormValues = {
  id?: string;
  cliente_id: string;
  aparelho_id: string;
  os_id: string;
  defeito: string;
  diagnostico: string;
  servicos: string;
  pecas: string;
  valor_servicos: string;
  valor_pecas: string;
  desconto: string;
  prazo: string;
  validade: string;
};

export const emptyOrcamento: OrcamentoFormValues = {
  cliente_id: "",
  aparelho_id: "",
  os_id: "",
  defeito: "",
  diagnostico: "",
  servicos: "",
  pecas: "",
  valor_servicos: "0",
  valor_pecas: "0",
  desconto: "0",
  prazo: "",
  validade: "",
};

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export function OrcamentoForm({ initial }: { initial: OrcamentoFormValues }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<OrcamentoFormValues>(initial);

  const set = (k: keyof OrcamentoFormValues, v: string) => setForm((p) => ({ ...p, [k]: v }));

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

  const { data: ordens } = useQuery({
    queryKey: ["os-cliente", form.cliente_id],
    enabled: !!form.cliente_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero")
        .eq("cliente_id", form.cliente_id)
        .order("numero", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const valorFinal = num(form.valor_servicos) + num(form.valor_pecas) - num(form.desconto);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error("Selecione o cliente.");
      return;
    }
    setSaving(true);
    const payload = {
      cliente_id: form.cliente_id,
      aparelho_id: form.aparelho_id || null,
      os_id: form.os_id || null,
      defeito: form.defeito || null,
      diagnostico: form.diagnostico || null,
      servicos: form.servicos || null,
      pecas: form.pecas || null,
      valor_servicos: num(form.valor_servicos),
      valor_pecas: num(form.valor_pecas),
      desconto: num(form.desconto),
      valor_final: valorFinal,
      prazo: form.prazo || null,
      validade: form.validade || null,
    };

    if (form.id) {
      const { error } = await supabase.from("orcamentos").update(payload).eq("id", form.id);
      setSaving(false);
      if (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["orcamento", form.id] });
      toast.success("Orçamento atualizado.");
      navigate({ to: "/orcamentos/$id", params: { id: form.id } });
      return;
    }

    const { data, error } = await supabase.from("orcamentos").insert(payload).select("id").single();
    setSaving(false);
    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
    toast.success("Orçamento criado.");
    navigate({ to: "/orcamentos/$id", params: { id: data.id } });
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <Card className="shadow-card">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Select
              value={form.cliente_id}
              onValueChange={(v) => setForm((p) => ({ ...p, cliente_id: v, aparelho_id: "", os_id: "" }))}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Aparelho</Label>
              <Select
                value={form.aparelho_id}
                onValueChange={(v) => set("aparelho_id", v)}
                disabled={!form.cliente_id}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {aparelhos?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.marca} {a.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Ordem de serviço vinculada</Label>
              <Select value={form.os_id} onValueChange={(v) => set("os_id", v)} disabled={!form.cliente_id}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {ordens?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      OS #{o.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defeito">Defeito relatado</Label>
            <Textarea id="defeito" value={form.defeito} onChange={(e) => set("defeito", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diagnostico">Diagnóstico técnico</Label>
            <Textarea
              id="diagnostico"
              value={form.diagnostico}
              onChange={(e) => set("diagnostico", e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="servicos">Serviços</Label>
              <Textarea id="servicos" value={form.servicos} onChange={(e) => set("servicos", e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pecas">Peças</Label>
              <Textarea id="pecas" value={form.pecas} onChange={(e) => set("pecas", e.target.value)} rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor_servicos">Mão de obra (R$)</Label>
              <Input
                id="valor_servicos"
                inputMode="decimal"
                value={form.valor_servicos}
                onChange={(e) => set("valor_servicos", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor_pecas">Peças (R$)</Label>
              <Input
                id="valor_pecas"
                inputMode="decimal"
                value={form.valor_pecas}
                onChange={(e) => set("valor_pecas", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                inputMode="decimal"
                value={form.desconto}
                onChange={(e) => set("desconto", e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prazo">Prazo estimado</Label>
              <Input
                id="prazo"
                value={form.prazo}
                onChange={(e) => set("prazo", e.target.value)}
                placeholder="Ex.: 3 dias úteis"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validade">Validade do orçamento</Label>
              <Input
                id="validade"
                type="date"
                value={form.validade}
                onChange={(e) => set("validade", e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
            <span className="text-sm font-medium">Valor final</span>
            <span className="text-lg font-bold text-primary">{formatBRL(valorFinal)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="h-11 flex-1">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {form.id ? "Salvar alterações" : "Criar orçamento"}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => navigate({ to: "/orcamentos" })}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
