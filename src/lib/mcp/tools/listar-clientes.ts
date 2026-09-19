import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_clientes",
  title: "Listar clientes",
  description: "Lista ou busca clientes da assistência técnica por nome, telefone ou documento.",
  inputSchema: {
    busca: z.string().trim().min(1).optional().describe("Texto para buscar no nome, telefone ou CPF/CNPJ."),
    limite: z.number().int().min(1).max(50).default(20).describe("Quantidade máxima de clientes."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ busca, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("clientes")
      .select("id, nome, telefone, whatsapp, email, cpf_cnpj, cidade, ativo")
      .order("nome")
      .limit(limite ?? 20);
    if (busca) query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,cpf_cnpj.ilike.%${busca}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const clientes = (data ?? []).map((c) => ({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      whatsapp: c.whatsapp,
      email: c.email,
      cpf_cnpj: c.cpf_cnpj,
      cidade: c.cidade,
      ativo: c.ativo,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(clientes, null, 2) }],
      structuredContent: { clientes },
    };
  },
});
