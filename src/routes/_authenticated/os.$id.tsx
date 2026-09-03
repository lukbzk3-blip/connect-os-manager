import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Ban, FileText, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatDate, formatDateTime, onlyDigits } from "@/lib/format";
import { escapeHtml, imprimirDocumento, linha } from "@/lib/pdf";
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
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [servico, setServico] = useState<string | null>(null);
  const [cancelarAberto, setCancelarAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  const { data: os, isLoading } = useQuery({
    queryKey: ["os", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "*, clientes(id, nome, telefone, whatsapp, email, cpf_cnpj, endereco, numero, complemento, bairro, cidade, estado), aparelhos(marca, modelo, imei, numero_serie, cor, acessorios, defeito_relatado)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: pecas } = useQuery({
    queryKey: ["os-pecas", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os_pecas")
        .select("id, descricao, quantidade, valor_unitario")
        .eq("os_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("chave, valor");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.chave] = row.valor ?? "";
      return map;
    },
  });

  // Registros que impedem a exclusão física (histórico deve ser preservado).
  const { data: vinculos } = useQuery({
    queryKey: ["os-vinculos", id],
    queryFn: async () => {
      const head = { count: "exact" as const, head: true };
      const [lanc, mov, orc] = await Promise.all([
        supabase.from("lancamentos").select("id", head).eq("os_id", id),
        supabase.from("movimentacoes_estoque").select("id", head).eq("os_id", id),
        supabase.from("orcamentos").select("id", head).eq("os_id", id),
      ]);
      return {
        lancamentos: lanc.count ?? 0,
        movimentacoes: mov.count ?? 0,
        orcamentos: orc.count ?? 0,
      };
    },
  });

  async function atualizar(patch: TablesUpdate<"ordens_servico">, msg: string) {
    const { error } = await supabase.from("ordens_servico").update(patch).eq("id", id);
    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`);
      return false;
    }
    queryClient.invalidateQueries({ queryKey: ["os", id] });
    queryClient.invalidateQueries({ queryKey: ["ordens"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success(msg);
    return true;
  }

  async function cancelarOs() {
    if (!motivo.trim()) {
      toast.error("Informe o motivo do cancelamento.");
      return;
    }
    const ok = await atualizar(
      { status: "cancelado", motivo_cancelamento: motivo.trim() },
      "Ordem de serviço cancelada. O histórico foi preservado.",
    );
    if (ok) {
      setCancelarAberto(false);
      setMotivo("");
    }
  }

  async function excluirOs() {
    const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
    if (error) {
      toast.error(`Não foi possível excluir: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["ordens"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    toast.success("Ordem de serviço excluída.");
    navigate({ to: "/os" });
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!os) return <EmptyState title="Ordem de serviço não encontrada" />;

  const cliente = os.clientes;
  const aparelho = os.aparelhos;
  const listaPecas = pecas ?? [];
  const zap = onlyDigits(cliente?.whatsapp || cliente?.telefone || "");
  const mensagem = encodeURIComponent(
    `Olá ${cliente?.nome ?? ""}! Atualização da sua OS #${os.numero} na CONNECT ASSISTÊNCIA TÉCNICA: ${
      OS_STATUS_LABEL[os.status as OsStatus]
    }.`,
  );

  const totalVinculos =
    (vinculos?.lancamentos ?? 0) + (vinculos?.movimentacoes ?? 0) + (vinculos?.orcamentos ?? 0);
  const podeExcluir = isAdmin && totalVinculos === 0 && listaPecas.length === 0;
  const cancelada = os.status === "cancelado";

  const enderecoCliente = [
    cliente?.endereco,
    cliente?.numero,
    cliente?.complemento,
    cliente?.bairro,
    cliente?.cidade,
    cliente?.estado,
  ]
    .filter(Boolean)
    .join(", ");

  function gerarPdf() {
    if (!os) return;
    const empresaNome = config?.["empresa_nome"] || "CONNECT ASSISTÊNCIA TÉCNICA";
    const empresaContato = [config?.["empresa_telefone"], config?.["empresa_email"]]
      .filter(Boolean)
      .join(" · ");
    const garantia = config?.["garantia_dias"];
    const termos = config?.["termos_os"];

    const linhasPecas = listaPecas
      .map(
        (p) => `<tr>
          <td>${escapeHtml(p.descricao)}</td>
          <td class="num">${Number(p.quantidade)}</td>
          <td class="num">${escapeHtml(formatBRL(p.valor_unitario))}</td>
          <td class="num">${escapeHtml(formatBRL(Number(p.quantidade) * Number(p.valor_unitario)))}</td>
        </tr>`,
      )
      .join("");

    const corpo = `
      <div class="doc-header">
        <div>
          <div class="brand">${escapeHtml(empresaNome)}
            <small>CONNECT SISTEMAS${empresaContato ? ` · ${escapeHtml(empresaContato)}` : ""}</small>
            ${config?.["empresa_endereco"] ? `<small>${escapeHtml(config["empresa_endereco"])}</small>` : ""}
            ${config?.["empresa_cnpj"] ? `<small>CNPJ ${escapeHtml(config["empresa_cnpj"])}</small>` : ""}
          </div>
        </div>
        <div class="doc-title">
          <h2>Ordem de Serviço #${os.numero}</h2>
          <span>Abertura: ${escapeHtml(formatDate(os.data_entrada))}</span><br />
          <span>Status: ${escapeHtml(OS_STATUS_LABEL[os.status as OsStatus])}</span>
        </div>
      </div>

      <section>
        <h3>Cliente</h3>
        <div class="grid">
          ${linha("Nome", cliente?.nome)}
          ${linha("CPF/CNPJ", cliente?.cpf_cnpj)}
          ${linha("Telefone", cliente?.telefone || cliente?.whatsapp)}
          ${linha("E-mail", cliente?.email)}
          ${linha("Endereço", enderecoCliente || null)}
        </div>
      </section>

      <section>
        <h3>Aparelho</h3>
        <div class="grid">
          ${linha("Marca", aparelho?.marca)}
          ${linha("Modelo", aparelho?.modelo)}
          ${linha("IMEI", aparelho?.imei)}
          ${linha("Nº de série", aparelho?.numero_serie)}
          ${linha("Cor", aparelho?.cor)}
          ${linha("Acessórios", aparelho?.acessorios)}
        </div>
      </section>

      <section>
        <h3>Atendimento</h3>
        ${linha("Defeito relatado", os.defeito_relatado || aparelho?.defeito_relatado)}
        ${linha("Diagnóstico", os.diagnostico)}
        ${linha("Serviço realizado", os.servico_realizado)}
        ${linha("Técnico", os.tecnico_nome)}
        ${linha("Previsão de entrega", os.previsao_entrega ? formatDate(os.previsao_entrega) : null)}
        ${linha("Observações", os.observacoes)}
        ${linha("Motivo do cancelamento", os.motivo_cancelamento)}
      </section>

      ${
        listaPecas.length
          ? `<section>
              <h3>Peças e produtos utilizados</h3>
              <table>
                <thead><tr><th>Descrição</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead>
                <tbody>${linhasPecas}</tbody>
              </table>
            </section>`
          : ""
      }

      <section>
        <h3>Valores</h3>
        <div class="totais">
          <div class="row"><span>Peças</span><span>${escapeHtml(formatBRL(os.valor_pecas))}</span></div>
          <div class="row"><span>Mão de obra</span><span>${escapeHtml(formatBRL(os.valor_mao_obra))}</span></div>
          ${
            Number(os.desconto) > 0
              ? `<div class="row"><span>Desconto</span><span>- ${escapeHtml(formatBRL(os.desconto))}</span></div>`
              : ""
          }
          <div class="row total-final"><span>Total</span><span>${escapeHtml(formatBRL(os.valor_total))}</span></div>
          ${
            os.forma_pagamento
              ? `<div class="row"><span>Forma de pagamento</span><span>${escapeHtml(
                  FORMA_PAGAMENTO_LABEL[os.forma_pagamento as FormaPagamento],
                )}</span></div>`
              : ""
          }
          ${garantia ? `<div class="row"><span>Garantia</span><span>${escapeHtml(garantia)} dias</span></div>` : ""}
        </div>
      </section>

      ${termos ? `<section><h3>Termos</h3><div class="block">${escapeHtml(termos)}</div></section>` : ""}

      <div class="assinaturas">
        <div class="assinatura">Assinatura do cliente</div>
        <div class="assinatura">Assinatura do responsável técnico</div>
      </div>

      <footer>Documento gerado em ${escapeHtml(formatDateTime(new Date()))} por ${escapeHtml(
        empresaNome,
      )} — CONNECT SISTEMAS</footer>
    `;

    imprimirDocumento(`OS ${os.numero} — ${cliente?.nome ?? ""}`, corpo);
  }

  return (
    <div>
      <Link to="/os" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Ordens de serviço
      </Link>

      <PageHeader
        title={`OS #${os.numero}`}
        description={`Entrada em ${formatDate(os.data_entrada)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={os.status as OsStatus} />
            <Button variant="outline" className="h-10" onClick={gerarPdf}>
              <FileText className="mr-1.5 size-4" /> Gerar PDF
            </Button>
            {!cancelada ? (
              <Button variant="outline" className="h-10 text-destructive" onClick={() => setCancelarAberto(true)}>
                <Ban className="mr-1.5 size-4" /> Cancelar OS
              </Button>
            ) : null}
            {podeExcluir ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="h-10 text-destructive">
                    <Trash2 className="mr-1.5 size-4" /> Excluir OS
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir a OS #{os.numero}?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2 text-left">
                        <p>
                          Cliente: <strong>{cliente?.nome}</strong>
                        </p>
                        <p>
                          Esta OS não possui peças, lançamentos financeiros, movimentações de estoque nem
                          orçamentos vinculados. Ela será <strong>excluída definitivamente</strong>. Se preferir
                          manter o histórico, use “Cancelar OS”.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluirOs}>Excluir definitivamente</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        }
      />

      {cancelada ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">Ordem de serviço cancelada</p>
          <p className="text-muted-foreground">
            {os.motivo_cancelamento ? `Motivo: ${os.motivo_cancelamento}. ` : ""}
            {os.cancelado_em ? `Em ${formatDateTime(os.cancelado_em)}.` : ""}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-sm font-semibold">Cliente e aparelho</h2>
            <Linha label="Cliente" value={cliente?.nome} />
            <Linha label="Telefone" value={cliente?.telefone} />
            <Linha label="E-mail" value={cliente?.email} />
            <Linha
              label="Aparelho"
              value={[aparelho?.marca, aparelho?.modelo].filter(Boolean).join(" ") || null}
            />
            <Linha label="IMEI" value={aparelho?.imei} />
            <Linha label="Cor" value={aparelho?.cor} />
            <Linha label="Técnico" value={os.tecnico_nome} />
            <Linha label="Previsão" value={os.previsao_entrega ? formatDate(os.previsao_entrega) : null} />
            <div className="mt-3 flex gap-2">
              {cliente?.id ? (
                <Button asChild variant="outline" className="h-10 flex-1">
                  <Link to="/clientes/$id" params={{ id: cliente.id }}>
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
              <Select value={os.status} onValueChange={(v) => atualizar({ status: v as OsStatus }, "Status atualizado.")}>
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
                onValueChange={(v) => atualizar({ forma_pagamento: v as FormaPagamento }, "Pagamento atualizado.")}
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
          <Linha label="Defeito relatado" value={os.defeito_relatado ?? aparelho?.defeito_relatado} />
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

      <Dialog open={cancelarAberto} onOpenChange={setCancelarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar a OS #{os.numero}?</DialogTitle>
            <DialogDescription>
              Cliente: {cliente?.nome ?? "—"}. A OS deixa de ser tratada como ativa, mas todo o histórico,
              incluindo peças e lançamentos, continua preservado.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="motivo">Motivo do cancelamento *</Label>
            <Textarea
              id="motivo"
              rows={3}
              className="mt-1.5"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: OS aberta por engano / cliente desistiu do reparo"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11" onClick={() => setCancelarAberto(false)}>
              Voltar
            </Button>
            <Button className="h-11" onClick={cancelarOs}>
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
