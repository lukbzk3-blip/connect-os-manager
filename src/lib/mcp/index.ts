import { auth, defineMcp } from "@lovable.dev/mcp-js";

import listarClientes from "./tools/listar-clientes";
import criarCliente from "./tools/criar-cliente";
import listarOrdensServico from "./tools/listar-ordens-servico";
import detalharOrdemServico from "./tools/detalhar-ordem-servico";
import estoqueBaixo from "./tools/estoque-baixo";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "connect-assistencia-72",
  title: "Connect Assistência (72)",
  version: "0.1.0",
  instructions:
    "Ferramentas da assistência técnica CONNECT: consultar e cadastrar clientes, acompanhar ordens de serviço e verificar peças com estoque baixo. Os dados são sempre os do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listarClientes, criarCliente, listarOrdensServico, detalharOrdemServico, estoqueBaixo],
});
