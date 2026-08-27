import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { ClienteForm, clienteVazio, type ClienteValues } from "@/components/ClienteForm";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/clientes/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar cliente — CONNECT SISTEMAS" },
      { name: "description", content: "Atualize os dados cadastrais do cliente." },
      { property: "og:title", content: "Editar cliente — CONNECT SISTEMAS" },
      { property: "og:description", content: "Atualize os dados cadastrais do cliente." },
    ],
  }),
  component: EditarCliente,
});

function EditarCliente() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["cliente-form", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!data) return <EmptyState title="Cliente não encontrado" />;

  const initial: ClienteValues = {
    ...clienteVazio,
    nome: data.nome ?? "",
    cpf_cnpj: data.cpf_cnpj ?? "",
    telefone: data.telefone ?? "",
    whatsapp: data.whatsapp ?? "",
    email: data.email ?? "",
    cep: data.cep ?? "",
    endereco: data.endereco ?? "",
    numero: data.numero ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    cidade: data.cidade ?? "",
    estado: data.estado ?? "",
    observacoes: data.observacoes ?? "",
  };

  return (
    <div>
      <PageHeader title="Editar cliente" description={data.nome} />
      <ClienteForm clienteId={id} initial={initial} />
    </div>
  );
}
