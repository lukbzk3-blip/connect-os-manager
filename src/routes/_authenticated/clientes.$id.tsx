import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatBRL, formatDate, onlyDigits } from "@/lib/format";
import type { OsStatus } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do cliente — CONNECT SISTEMAS" },
      { name: "description", content: "Histórico completo do cliente: aparelhos, ordens de serviço e pagamentos." },
      { property: "og:title", content: "Detalhes do cliente — CONNECT SISTEMAS" },
      { property: "og:description", content: "Histórico completo do cliente na CONNECT ASSISTÊNCIA TÉCNICA." },
    ],
  }),
  component: ClienteDetalhe,
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

function ClienteDetalhe() {
  const { id } = Route.useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
      const [cliente, aparelhos, ordens] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", id).maybeSingle(),
        supabase.from("aparelhos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
        supabase
          .from("ordens_servico")
          .select("id, numero, status, valor_total, data_entrada, servico_realizado, aparelhos(marca, modelo)")
          .eq("cliente_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (cliente.error) throw cliente.error;
      return {
        cliente: cliente.data,
        aparelhos: aparelhos.data ?? [],
        ordens: ordens.data ?? [],
      };
    },
  });

  async function excluir() {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      toast.error(`Não foi possível excluir: ${error.message}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
    toast.success("Cliente excluído.");
    navigate({ to: "/clientes" });
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!data?.cliente) return <EmptyState title="Cliente não encontrado" />;

  const c = data.cliente;
  const zap = onlyDigits(c.whatsapp || c.telefone || "");
  const endereco = [c.endereco, c.numero, c.complemento, c.bairro, c.cidade, c.estado]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Link to="/clientes" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <PageHeader
        title={c.nome}
        description={`Cliente desde ${formatDate(c.created_at)}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" className="h-10">
              <Link to="/clientes/$id/editar" params={{ id }}>
                <Pencil className="mr-1.5 size-4" /> Editar
              </Link>
            </Button>
            {isAdmin ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Os aparelhos vinculados também serão removidos. Ordens de serviço existentes impedem a
                      exclusão.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-sm font-semibold">Dados do cliente</h2>
            <Linha label="CPF/CNPJ" value={c.cpf_cnpj} />
            <Linha label="Telefone" value={c.telefone} />
            <Linha label="WhatsApp" value={c.whatsapp} />
            <Linha label="E-mail" value={c.email} />
            <Linha label="CEP" value={c.cep} />
            <Linha label="Endereço" value={endereco} />
            <Linha label="Observações" value={c.observacoes} />
            {zap ? (
              <Button asChild variant="outline" className="mt-3 h-10 w-full">
                <a href={`https://wa.me/55${zap}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1.5 size-4" /> Falar no WhatsApp
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Aparelhos ({data.aparelhos.length})</h2>
              <Button asChild size="sm" variant="ghost">
                <Link to="/aparelhos/novo" search={{ cliente: id }}>
                  <Plus className="mr-1 size-4" /> Adicionar
                </Link>
              </Button>
            </div>
            {data.aparelhos.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nenhum aparelho cadastrado.</p>
            ) : (
              <ul className="divide-y">
                {data.aparelhos.map((a) => (
                  <li key={a.id} className="py-2">
                    <p className="text-sm font-medium">
                      {a.marca} {a.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[a.cor, a.imei && `IMEI ${a.imei}`, formatDate(a.data_entrada)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.defeito_relatado ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">Defeito: {a.defeito_relatado}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Histórico de atendimentos</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/os/novo" search={{ cliente: id }}>
              <Plus className="mr-1 size-4" /> Nova OS
            </Link>
          </Button>
        </div>
        {data.ordens.length === 0 ? (
          <EmptyState title="Nenhuma ordem de serviço" description="Este cliente ainda não possui atendimentos." />
        ) : (
          <div className="space-y-2">
            {data.ordens.map((os) => (
              <Link
                key={os.id}
                to="/os/$id"
                params={{ id: os.id }}
                className="block rounded-xl border bg-card p-3 shadow-card transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">OS #{os.numero}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[os.aparelhos?.marca, os.aparelhos?.modelo].filter(Boolean).join(" ") || "Sem aparelho"} ·{" "}
                      {formatDate(os.data_entrada)}
                    </p>
                    {os.servico_realizado ? (
                      <p className="truncate text-xs text-muted-foreground">{os.servico_realizado}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={os.status as OsStatus} />
                    <span className="text-xs font-medium">{formatBRL(os.valor_total)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
