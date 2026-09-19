import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "estoque_baixo",
  title: "Peças com estoque baixo",
  description: "Lista as peças e produtos cuja quantidade está no limite mínimo ou abaixo dele.",
  inputSchema: { limite: z.number().int().min(1).max(100).default(30) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, marca, categoria, quantidade, estoque_minimo, preco_venda")
      .order("quantidade")
      .limit(limite ?? 30);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const produtos = (data ?? [])
      .filter((p) => p.quantidade <= p.estoque_minimo)
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        marca: p.marca,
        categoria: p.categoria,
        quantidade: p.quantidade,
        estoque_minimo: p.estoque_minimo,
        preco_venda: p.preco_venda,
      }));
    return {
      content: [{ type: "text", text: JSON.stringify(produtos, null, 2) }],
      structuredContent: { produtos },
    };
  },
});
