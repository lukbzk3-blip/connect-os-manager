import { createFileRoute } from "@tanstack/react-router";

import { ClienteForm } from "@/components/ClienteForm";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/clientes/novo")({
  head: () => ({
    meta: [
      { title: "Novo cliente — CONNECT SISTEMAS" },
      { name: "description", content: "Cadastre um novo cliente da assistência técnica." },
      { property: "og:title", content: "Novo cliente — CONNECT SISTEMAS" },
      { property: "og:description", content: "Cadastre um novo cliente da assistência técnica." },
    ],
  }),
  component: () => (
    <div>
      <PageHeader title="Novo cliente" description="Preencha os dados do cliente." />
      <ClienteForm />
    </div>
  ),
});
