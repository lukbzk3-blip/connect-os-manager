import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CONNECT SISTEMAS — Gestão para assistência técnica" },
      {
        name: "description",
        content:
          "Sistema de gestão da CONNECT ASSISTÊNCIA TÉCNICA: clientes, aparelhos, ordens de serviço, orçamentos, estoque e financeiro.",
      },
      { property: "og:title", content: "CONNECT SISTEMAS — Gestão para assistência técnica" },
      {
        property: "og:description",
        content: "Controle de clientes, aparelhos, ordens de serviço, estoque e financeiro em um só lugar.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
