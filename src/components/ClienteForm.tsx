import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { maskCep, maskCpfCnpj, maskPhone } from "@/lib/format";
import { ESTADOS_BR } from "@/lib/constants";

export type ClienteValues = {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
};

export const clienteVazio: ClienteValues = {
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
};

export function ClienteForm({ clienteId, initial }: { clienteId?: string; initial?: ClienteValues }) {
  const [values, setValues] = useState<ClienteValues>(initial ?? clienteVazio);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const set = (k: keyof ClienteValues, v: string) => setValues((p) => ({ ...p, [k]: v }));

  async function buscarCep(cep: string) {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const json = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (json.erro) return;
      setValues((p) => ({
        ...p,
        endereco: json.logradouro || p.endereco,
        bairro: json.bairro || p.bairro,
        cidade: json.localidade || p.cidade,
        estado: json.uf || p.estado,
      }));
    } catch {
      /* busca de CEP é opcional */
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!values.nome.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    setSaving(true);
    const payload = {
      ...values,
      cpf_cnpj: values.cpf_cnpj || null,
      email: values.email || null,
    };

    if (clienteId) {
      const { error } = await supabase.from("clientes").update(payload).eq("id", clienteId);
      setSaving(false);
      if (error) return toast.error(`Erro ao salvar: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["cliente", clienteId] });
      toast.success("Cliente atualizado.");
      navigate({ to: "/clientes/$id", params: { id: clienteId } });
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("clientes")
        .insert({ ...payload, created_by: userData.user?.id ?? null })
        .select("id")
        .single();
      setSaving(false);
      if (error) return toast.error(`Erro ao cadastrar: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente cadastrado.");
      navigate({ to: "/clientes/$id", params: { id: data.id } });
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <Card className="shadow-card">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" value={values.nome} onChange={(e) => set("nome", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF / CNPJ</Label>
            <Input
              id="cpf"
              inputMode="numeric"
              value={values.cpf_cnpj}
              onChange={(e) => set("cpf_cnpj", maskCpfCnpj(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tel">Telefone</Label>
            <Input
              id="tel"
              inputMode="tel"
              value={values.telefone}
              onChange={(e) => set("telefone", maskPhone(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zap">WhatsApp</Label>
            <Input
              id="zap"
              inputMode="tel"
              value={values.whatsapp}
              onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              inputMode="numeric"
              value={values.cep}
              onChange={(e) => {
                const v = maskCep(e.target.value);
                set("cep", v);
                void buscarCep(v);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">Endereço</Label>
            <Input id="end" value={values.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="num">Número</Label>
            <Input id="num" value={values.numero} onChange={(e) => set("numero", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comp">Complemento</Label>
            <Input id="comp" value={values.complemento} onChange={(e) => set("complemento", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" value={values.bairro} onChange={(e) => set("bairro", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={values.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf">Estado</Label>
            <select
              id="uf"
              value={values.estado}
              onChange={(e) => set("estado", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              rows={3}
              value={values.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" className="h-11 flex-1" disabled={saving}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {clienteId ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
