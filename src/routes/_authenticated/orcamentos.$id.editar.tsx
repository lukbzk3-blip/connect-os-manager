import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { OrcamentoForm, emptyOrcamento } from "@/components/OrcamentoForm";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/orcamentos/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar orçamento — CONNECT SISTEMAS" },
      { name: "description", content: "Atualize serviços, peças, prazo e valores do orçamento." },
      { property: "og:title", content: "Editar orçamento — CONNECT SISTEMAS" },
      { property: "og:description", content: "Atualize serviços, peças, prazo e valores do orçamento." },
    ],
  }),
  component: EditarOrcamento,
});

function EditarOrcamento() {
  const { id } = Route.useParams();

  const { data: orc, isLoading } = useQuery({
    queryKey: ["orcamento", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!orc) return <EmptyState title="Orçamento não encontrado" />;

  return (
    <div>
      <PageHeader title="Editar orçamento" description="Ajuste os dados e salve as alterações." />
      <OrcamentoForm
        initial={{
          ...emptyOrcamento,
          id: orc.id,
          cliente_id: orc.cliente_id,
          aparelho_id: orc.aparelho_id ?? "",
          os_id: orc.os_id ?? "",
          defeito: orc.defeito ?? "",
          diagnostico: orc.diagnostico ?? "",
          servicos: orc.servicos ?? "",
          pecas: orc.pecas ?? "",
          valor_servicos: String(orc.valor_servicos ?? 0),
          valor_pecas: String(orc.valor_pecas ?? 0),
          desconto: String(orc.desconto ?? 0),
          prazo: orc.prazo ?? "",
          validade: orc.validade ?? "",
        }}
      />
    </div>
  );
}
