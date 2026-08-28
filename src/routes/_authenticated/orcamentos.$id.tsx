import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ClipboardList, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { OrcamentoStatusBadge } from "@/components/OrcamentoStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatDate, onlyDigits } from "@/lib/format";
import {
  ORCAMENTO_STATUS,
  ORCAMENTO_STATUS_LABEL,
  type OrcamentoStatus,
} from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/orcamentos/$id")({
  head: () => ({
    meta: [
      { title: "Orçamento — CONNECT SISTEMAS" },
      { name: "description", content: "Detalhes do orçamento, valores, prazo e aprovação do cliente." },
      { property: "og:title", content: "Orçamento — CONNECT SISTEMAS" },
      { property: "og:description", content: "Detalhes do orçamento, valores, prazo e aprovação do cliente." },
    ],
  }),
  component: OrcamentoDetalhe,
});

function Linha({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-words">{value}</span>
    </div>
  );
}

function OrcamentoDetalhe() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [gerando, setGerando] = useState(false);

  const { data: orc, isLoading } = useQuery({
    queryKey: ["orcamento", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select(
          "*, clientes(id, nome, telefone, whatsapp), aparelhos(marca, modelo, imei), ordens_servico(id, numero)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["orcamento", id] });
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  }

  async function mudarStatus(status: OrcamentoStatus) {
    const { error } = await supabase.from("orcamentos").update({ status }).eq("id", id);
    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`);
      return;
    }
    invalidar();
    toast.success(`Orçamento ${ORCAMENTO_STATUS_LABEL[status].toLowerCase()}.`);
  }

  async function excluir() {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) {
      toast.error(`Erro ao excluir: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
    toast.success("Orçamento excluído.");
    navigate({ to: "/orcamentos" });
  }

  async function gerarOS() {
    if (!orc) return;
    setGerando(true);
    const { data: nova, error } = await supabase
      .from("ordens_servico")
      .insert({
        cliente_id: orc.cliente_id,
        aparelho_id: orc.aparelho_id,
        defeito_relatado: orc.defeito,
        diagnostico: orc.diagnostico,
        valor_pecas: orc.valor_pecas,
        valor_mao_obra: orc.valor_servicos,
        desconto: orc.desconto,
        valor_total: orc.valor_final,
        status: "aprovado" as const,
      })
      .select("id, numero")
      .single();
    if (error || !nova) {
      setGerando(false);
      toast.error(`Erro ao gerar OS: ${error?.message ?? ""}`);
      return;
    }
    const { error: linkError } = await supabase
      .from("orcamentos")
      .update({ os_id: nova.id, status: "aprovado" as const })
      .eq("id", id);
    setGerando(false);
    if (linkError) {
      toast.error(`OS criada, mas não foi possível vincular: ${linkError.message}`);
    } else {
      toast.success(`OS #${nova.numero} criada a partir do orçamento.`);
    }
    invalidar();
    queryClient.invalidateQueries({ queryKey: ["ordens"] });
    navigate({ to: "/os/$id", params: { id: nova.id } });
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!orc) return <EmptyState title="Orçamento não encontrado" />;

  const status = orc.status as OrcamentoStatus;
  const zap = onlyDigits(orc.clientes?.whatsapp || orc.clientes?.telefone || "");
  const mensagem = encodeURIComponent(
    `Olá ${orc.clientes?.nome ?? ""}! Segue o orçamento do seu aparelho na CONNECT ASSISTÊNCIA TÉCNICA: ${formatBRL(
      orc.valor_final,
    )}${orc.prazo ? ` · prazo ${orc.prazo}` : ""}. Podemos aprovar?`,
  );

  return (
    <div>
      <Link to="/orcamentos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Orçamentos
      </Link>

      <PageHeader
        title={orc.clientes?.nome ?? "Orçamento"}
        description={`Criado em ${formatDate(orc.created_at)}`}
        action={<OrcamentoStatusBadge status={status} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-sm font-semibold">Cliente e aparelho</h2>
            <Linha label="Cliente" value={orc.clientes?.nome} />
            <Linha label="Telefone" value={orc.clientes?.telefone} />
            <Linha
              label="Aparelho"
              value={[orc.aparelhos?.marca, orc.aparelhos?.modelo].filter(Boolean).join(" ") || null}
            />
            <Linha label="IMEI" value={orc.aparelhos?.imei} />
            <Linha label="Defeito" value={orc.defeito} />
            <Linha label="Diagnóstico" value={orc.diagnostico} />
            <Linha label="Serviços" value={orc.servicos} />
            <Linha label="Peças" value={orc.pecas} />
            <Linha label="Prazo" value={orc.prazo} />
            <Linha label="Validade" value={orc.validade ? formatDate(orc.validade) : null} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <h2 className="mb-2 text-sm font-semibold">Valores</h2>
              <Linha label="Mão de obra" value={formatBRL(orc.valor_servicos)} />
              <Linha label="Peças" value={formatBRL(orc.valor_pecas)} />
              <Linha label="Desconto" value={formatBRL(orc.desconto)} />
              <div className="mt-2 flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
                <span className="text-sm font-medium">Valor final</span>
                <span className="text-lg font-bold text-primary">{formatBRL(orc.valor_final)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="space-y-3 pt-6">
              <div className="space-y-1.5">
                <Label>Status do orçamento</Label>
                <Select value={status} onValueChange={(v) => mudarStatus(v as OrcamentoStatus)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORCAMENTO_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORCAMENTO_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {orc.ordens_servico ? (
                <Button asChild variant="outline" className="h-11 w-full">
                  <Link to="/os/$id" params={{ id: orc.ordens_servico.id }}>
                    <ClipboardList className="mr-2 size-4" /> Ver OS #{orc.ordens_servico.numero}
                  </Link>
                </Button>
              ) : (
                <Button onClick={gerarOS} disabled={gerando} className="h-11 w-full">
                  <ClipboardList className="mr-2 size-4" /> Gerar OS a partir do orçamento
                </Button>
              )}

              {zap ? (
                <Button asChild variant="outline" className="h-11 w-full">
                  <a href={`https://wa.me/55${zap}?text=${mensagem}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 size-4" /> Enviar por WhatsApp
                  </a>
                </Button>
              ) : null}

              <div className="flex gap-2">
                <Button asChild variant="outline" className="h-11 flex-1">
                  <Link to="/orcamentos/$id/editar" params={{ id }}>
                    <Pencil className="mr-2 size-4" /> Editar
                  </Link>
                </Button>
                {isAdmin ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="h-11 text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
