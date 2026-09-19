import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const STATUS = [
  "recebido",
  "em_analise",
  "aguardando_aprovacao",
  "aprovado",
  "em_manutencao",
  "aguardando_peca",
  "pronto",
  "entregue",
  "cancelado",
] as const;

export default defineTool({
  name: "listar_ordens_servico",
  title: "Listar ordens de serviço",
  description: "Lista as ordens de serviço mais recentes, opcionalmente filtradas por situação.",
  inputSchema: {
    status: z.enum(STATUS).optional().describe("Situação da ordem de serviço."),
    limite: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("ordens_servico")
      .select("numero, status, defeito_relatado, valor_total, previsao_entrega, created_at, clientes(nome)")
      .order("numero", { ascending: false })
      .limit(limite ?? 20);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const ordens = (data ?? []).map((o) => ({
      numero: o.numero,
      status: o.status,
      cliente: o.clientes?.nome ?? null,
      defeito_relatado: o.defeito_relatado,
      valor_total: o.valor_total,
      previsao_entrega: o.previsao_entrega,
      criada_em: o.created_at,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(ordens, null, 2) }],
      structuredContent: { ordens },
    };
  },
});
