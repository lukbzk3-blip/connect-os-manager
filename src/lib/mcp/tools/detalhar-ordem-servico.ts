import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "detalhar_ordem_servico",
  title: "Detalhar ordem de serviço",
  description: "Mostra os detalhes de uma ordem de serviço pelo número.",
  inputSchema: { numero: z.number().int().min(1).describe("Número da ordem de serviço.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ numero }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("ordens_servico")
      .select(
        "numero, status, defeito_relatado, diagnostico, servico_realizado, observacoes, valor_mao_obra, valor_pecas, desconto, valor_total, previsao_entrega, tecnico_nome, created_at, clientes(nome, telefone), aparelhos(marca, modelo, cor, imei)",
      )
      .eq("numero", numero)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`Ordem de serviço ${numero} não encontrada.`);
    const os = {
      numero: data.numero,
      status: data.status,
      cliente: data.clientes ? { nome: data.clientes.nome, telefone: data.clientes.telefone } : null,
      aparelho: data.aparelhos
        ? {
            marca: data.aparelhos.marca,
            modelo: data.aparelhos.modelo,
            cor: data.aparelhos.cor,
            imei: data.aparelhos.imei,
          }
        : null,
      defeito_relatado: data.defeito_relatado,
      diagnostico: data.diagnostico,
      servico_realizado: data.servico_realizado,
      observacoes: data.observacoes,
      valor_mao_obra: data.valor_mao_obra,
      valor_pecas: data.valor_pecas,
      desconto: data.desconto,
      valor_total: data.valor_total,
      previsao_entrega: data.previsao_entrega,
      tecnico: data.tecnico_nome,
      criada_em: data.created_at,
    };
    return { content: [{ type: "text", text: JSON.stringify(os, null, 2) }], structuredContent: { os } };
  },
});
