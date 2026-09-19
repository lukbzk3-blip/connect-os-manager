import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Wrench } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OAuthNamespace = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{
    data: { client?: { name?: string } | null; redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Pedido de autorização inválido.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  head: () => ({
    meta: [
      { title: "Autorizar aplicativo — CONNECT SISTEMAS" },
      { name: "description", content: "Autorize um aplicativo de IA a acessar o sistema da assistência técnica." },
      { property: "og:title", content: "Autorizar aplicativo — CONNECT SISTEMAS" },
      { property: "og:description", content: "Autorize um aplicativo de IA a acessar o sistema da assistência técnica." },
    ],
  }),
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-secondary p-6 text-center text-sm">
      Não foi possível carregar este pedido de autorização: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nome = details?.client?.name ?? "o aplicativo";

  async function decidir(aprovar: boolean) {
    setBusy(true);
    setErro(null);
    const { data, error } = aprovar
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setErro(error.message);
      return;
    }
    const destino = data?.redirect_url ?? data?.redirect_to;
    if (!destino) {
      setBusy(false);
      setErro("O servidor de autorização não devolveu um endereço de retorno.");
      return;
    }
    window.location.href = destino;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
          <Wrench className="size-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Conectar {nome}</h1>
      </div>

      <Card className="w-full max-w-sm shadow-card">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            {nome} poderá consultar e cadastrar informações no sistema em seu nome, com as mesmas permissões da sua
            conta. Você pode revogar o acesso a qualquer momento.
          </p>
          {erro && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </p>
          )}
          <Button className="h-11 w-full" disabled={busy} onClick={() => decidir(true)}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Permitir acesso
          </Button>
          <Button variant="outline" className="h-11 w-full" disabled={busy} onClick={() => decidir(false)}>
            Recusar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
