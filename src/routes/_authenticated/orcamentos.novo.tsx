import { createFileRoute } from "@tanstack/react-router";

import { OrcamentoForm, emptyOrcamento } from "@/components/OrcamentoForm";
import { PageHeader } from "@/components/PageHeader";

type Search = { cliente?: string; os?: string };

export const Route = createFileRoute("/_authenticated/orcamentos/novo")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(typeof search['cliente'] === "string" ? { cliente: search['cliente'] } : {}),
    ...(typeof search['os'] === "string" ? { os: search['os'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Novo orçamento — CONNECT SISTEMAS" },
      { name: "description", content: "Monte um orçamento de reparo com serviços, peças e prazo." },
      { property: "og:title", content: "Novo orçamento — CONNECT SISTEMAS" },
      { property: "og:description", content: "Monte um orçamento de reparo com serviços, peças e prazo." },
    ],
  }),
  component: NovoOrcamento,
});

function NovoOrcamento() {
  const search = Route.useSearch();
  return (
    <div>
      <PageHeader title="Novo orçamento" description="Informe serviços, peças e valores estimados." />
      <OrcamentoForm
        initial={{
          ...emptyOrcamento,
          cliente_id: search.cliente ?? "",
          os_id: search.os ?? "",
        }}
      />
    </div>
  );
}
