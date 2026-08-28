import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatDate, onlyDigits } from "@/lib/format";
import {
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABEL,
  OS_STATUS,
  OS_STATUS_LABEL,
  type FormaPagamento,
  type OsStatus,
} from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/os/$id")({
  head: () => ({
    meta: [
      { title: "Ordem de serviço — CONNECT SISTEMAS" },
      { name: "description", content: "Detalhes, status e valores da ordem de serviço." },
      { property: "og:title", content: "Ordem de serviço — CONNECT SISTEMAS" },
      { property: "og:description", content: "Detalhes, status e valores da ordem de serviço." },
    ],
  }),
  component: OsDetalhe,
});

function Linha({ label, value }: { label: string; value?: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-words">{value}</span>
    </div>
  );
}

function OsDetalhe() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [servico, setServico] = useState<string | null>(null);

  const { data: os, isLoading } = useQuery({
    queryKey: ["os", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "*, clientes(id, nome, telefone, whatsapp), aparelhos(marca, modelo, imei, cor, defeito_relatado)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function atualizar(patch: Record<string, string | number | null>, msg: string) {
    const { error } = await supabase.from("ordens_servico").update(patch).eq("id", id);
    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["os", id] });
    queryClient.invalidateQueries({ queryKey: ["ordens"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success(msg);
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!os) return <EmptyState title="Ordem de serviço não encontrada" />;

  const zap = onlyDigits(os.clientes?.whatsapp || os.clientes?.telefone || "");
  const mensagem = encodeURIComponent(
    `Olá ${os.clientes?.nome ?? ""}! Atualização da sua OS #${os.numero} na CONNECT ASSISTÊNCIA TÉCNICA: ${
      OS_STATUS_LABEL[os.status as OsStatus]
    }.`,
  );

  return (
    <div>
      <Link to="/os" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Ordens de serviço
      </Link>

      <PageHeader
        title={`OS #${os.numero}`}
        description={`Entrada em ${formatDate(os.data_entrada)}`}
        action={<StatusBadge status={os.status as OsStatus} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-sm font-semibold">Cliente e aparelho</h2>
            <Linha label="Cliente" value={os.clientes?.nome} />
            <Linha label="Telefone" value={os.clientes?.telefone} />
            <Linha
              label="Aparelho"
              value={[os.aparelhos?.marca, os.aparelhos?.modelo].filter(Boolean).join(" ") || null}
            />
            <Linha label="IMEI" value={os.aparelhos?.imei} />
            <Linha label="Cor" value={os.aparelhos?.cor} />
            <Linha label="Técnico" value={os.tecnico_nome} />
            <Linha label="Previsão" value={os.previsao_entrega ? formatDate(os.previsao_entrega) : null} />
            <div className="mt-3 flex gap-2">
              {os.clientes?.id ? (
                <Button asChild variant="outline" className="h-10 flex-1">
                  <Link to="/clientes/$id" params={{ id: os.clientes.id }}>
                    Ver cliente
                  </Link>
                </Button>
              ) : null}
              {zap ? (
                <Button asChild variant="outline" className="h-10 flex-1">
                  <a href={`https://wa.me/55${zap}?text=${mensagem}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-1.5 size-4" /> Avisar
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-sm font-semibold">Atendimento</h2>
            <div className="mb-3">
              <Label>Status</Label>
              <Select value={os.status} onValueChange={(v) => atualizar({ status: v }, "Status atualizado.")}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OS_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {OS_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-3">
              <Label>Forma de pagamento</Label>
              <Select
                value={os.forma_pagamento ?? ""}
                onValueChange={(v) => atualizar({ forma_pagamento: v }, "Pagamento atualizado.")}
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue placeholder="Não informado" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMA_PAGAMENTO_LABEL[f as FormaPagamento]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Linha label="Peças" value={formatBRL(os.valor_pecas)} />
            <Linha label="Mão de obra" value={formatBRL(os.valor_mao_obra)} />
            <Linha label="Desconto" value={formatBRL(os.desconto)} />
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{formatBRL(os.valor_total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 shadow-card">
        <CardContent className="pt-6">
          <h2 className="mb-2 text-sm font-semibold">Laudo técnico</h2>
          <Linha label="Defeito relatado" value={os.defeito_relatado ?? os.aparelhos?.defeito_relatado} />
          <Linha label="Diagnóstico" value={os.diagnostico} />
          <Label htmlFor="servico" className="mt-3 block">
            Serviço realizado
          </Label>
          <Textarea
            id="servico"
            rows={3}
            className="mt-1.5"
            value={servico ?? os.servico_realizado ?? ""}
            onChange={(e) => setServico(e.target.value)}
          />
          <Button
            className="mt-3 h-11 w-full sm:w-auto"
            onClick={() => atualizar({ servico_realizado: servico ?? "" }, "Laudo salvo.")}
            disabled={servico === null}
          >
            Salvar laudo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
