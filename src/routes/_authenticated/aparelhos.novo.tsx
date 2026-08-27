import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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

type Search = { cliente?: string };

export const Route = createFileRoute("/_authenticated/aparelhos/novo")({
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search['cliente'] === "string" ? { cliente: search['cliente'] as string } : {},
  head: () => ({
    meta: [
      { title: "Novo aparelho — CONNECT SISTEMAS" },
      { name: "description", content: "Registre um aparelho recebido para manutenção." },
      { property: "og:title", content: "Novo aparelho — CONNECT SISTEMAS" },
      { property: "og:description", content: "Registre um aparelho recebido para manutenção." },
    ],
  }),
  component: NovoAparelho,
});

function NovoAparelho() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cliente_id: search.cliente ?? "",
    marca: "",
    modelo: "",
    imei: "",
    numero_serie: "",
    cor: "",
    senha: "",
    estado_fisico: "",
    acessorios: "",
    defeito_relatado: "",
    observacoes: "",
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

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error("Selecione o cliente.");
      return;
    }
    if (!form.marca.trim() || !form.modelo.trim()) {
      toast.error("Informe marca e modelo.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("aparelhos").insert({
      cliente_id: form.cliente_id,
      marca: form.marca,
      modelo: form.modelo,
      imei: form.imei || null,
      numero_serie: form.numero_serie || null,
      cor: form.cor || null,
      senha: form.senha || null,
      estado_fisico: form.estado_fisico || null,
      acessorios: form.acessorios || null,
      defeito_relatado: form.defeito_relatado || null,
      observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (error) {
      toast.error(`Erro ao cadastrar: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["aparelhos"] });
    queryClient.invalidateQueries({ queryKey: ["cliente", form.cliente_id] });
    toast.success("Aparelho cadastrado.");
    navigate({ to: "/clientes/$id", params: { id: form.cliente_id } });
  }

  return (
    <div>
      <PageHeader title="Novo aparelho" description="Dados do equipamento recebido." />
      <form onSubmit={salvar} className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Cliente *</Label>
              <Select value={form.cliente_id} onValueChange={(v) => set("cliente_id", v)}>
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
              <Label htmlFor="marca">Marca *</Label>
              <Input id="marca" className="mt-1.5 h-11" value={form.marca} onChange={(e) => set("marca", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo *</Label>
              <Input id="modelo" className="mt-1.5 h-11" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="imei">IMEI</Label>
              <Input id="imei" inputMode="numeric" className="mt-1.5 h-11" value={form.imei} onChange={(e) => set("imei", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="serie">Número de série</Label>
              <Input id="serie" className="mt-1.5 h-11" value={form.numero_serie} onChange={(e) => set("numero_serie", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cor">Cor</Label>
              <Input id="cor" className="mt-1.5 h-11" value={form.cor} onChange={(e) => set("cor", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="senha">Senha / padrão</Label>
              <Input id="senha" className="mt-1.5 h-11" value={form.senha} onChange={(e) => set("senha", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="estado">Estado físico</Label>
              <Input id="estado" className="mt-1.5 h-11" value={form.estado_fisico} onChange={(e) => set("estado_fisico", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="acessorios">Acessórios</Label>
              <Input id="acessorios" className="mt-1.5 h-11" value={form.acessorios} onChange={(e) => set("acessorios", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="defeito">Defeito relatado</Label>
              <Textarea id="defeito" className="mt-1.5" rows={3} value={form.defeito_relatado} onChange={(e) => set("defeito_relatado", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea id="obs" className="mt-1.5" rows={2} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={saving} className="h-11 w-full sm:w-auto">
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Salvar aparelho
        </Button>
      </form>
    </div>
  );
}
