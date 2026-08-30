import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/configuracoes/")({
  head: () => ({
    meta: [
      { title: "Configurações — CONNECT SISTEMAS" },
      { name: "description", content: "Dados da empresa, garantia e mensagens padrão da assistência técnica." },
      { property: "og:title", content: "Configurações — CONNECT SISTEMAS" },
      { property: "og:description", content: "Dados da empresa, garantia e mensagens padrão da assistência técnica." },
    ],
  }),
  component: ConfiguracoesPage,
});

const CAMPOS = [
  { chave: "empresa_nome", label: "Nome da empresa", tipo: "text" as const },
  { chave: "empresa_cnpj", label: "CNPJ", tipo: "text" as const },
  { chave: "empresa_telefone", label: "Telefone / WhatsApp", tipo: "text" as const },
  { chave: "empresa_email", label: "E-mail", tipo: "text" as const },
  { chave: "empresa_endereco", label: "Endereço", tipo: "text" as const },
  { chave: "garantia_dias", label: "Garantia padrão (dias)", tipo: "text" as const },
  { chave: "mensagem_padrao", label: "Mensagem padrão (WhatsApp)", tipo: "textarea" as const },
  { chave: "termos_os", label: "Termos impressos na OS", tipo: "textarea" as const },
];

function ConfiguracoesPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [valores, setValores] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("id, chave, valor");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const row of data) map[row.chave] = row.valor ?? "";
    setValores(map);
  }, [data]);

  const salvar = useMutation({
    mutationFn: async () => {
      const existentes = new Map((data ?? []).map((r) => [r.chave, r.id]));
      for (const campo of CAMPOS) {
        const valor = valores[campo.chave] ?? "";
        const id = existentes.get(campo.chave);
        if (id) {
          const { error } = await supabase.from("configuracoes").update({ valor }).eq("id", id);
          if (error) throw error;
        } else if (valor.trim()) {
          const { error } = await supabase.from("configuracoes").insert({ chave: campo.chave, valor });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["configuracoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authLoading && !isAdmin) {
    return <EmptyState title="Acesso restrito" description="Somente administradores alteram as configurações." />;
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Dados da empresa e padrões do sistema." />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-card">
          {CAMPOS.map((c) => (
            <div key={c.chave}>
              <Label>{c.label}</Label>
              {c.tipo === "textarea" ? (
                <Textarea
                  rows={3}
                  value={valores[c.chave] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [c.chave]: e.target.value }))}
                />
              ) : (
                <Input
                  className="h-11"
                  value={valores[c.chave] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [c.chave]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <Button className="h-11 w-full" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
            Salvar configurações
          </Button>
        </div>
      )}
    </div>
  );
}
