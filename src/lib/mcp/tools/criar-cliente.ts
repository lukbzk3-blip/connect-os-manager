import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "criar_cliente",
  title: "Cadastrar cliente",
  description: "Cadastra um novo cliente na assistência técnica.",
  inputSchema: {
    nome: z.string().trim().min(2).describe("Nome completo do cliente."),
    telefone: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    cpf_cnpj: z.string().trim().optional(),
    cidade: z.string().trim().optional(),
    observacoes: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("clientes")
      .insert({ ...input, created_by: ctx.getUserId() ?? null })
      .select("id, nome, telefone, whatsapp, email")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const cliente = data
      ? { id: data.id, nome: data.nome, telefone: data.telefone, whatsapp: data.whatsapp, email: data.email }
      : null;
    return {
      content: [{ type: "text", text: `Cliente cadastrado: ${cliente?.nome ?? input.nome}` }],
      structuredContent: { cliente },
    };
  },
});
