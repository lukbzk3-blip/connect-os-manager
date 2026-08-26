export const OS_STATUS = [
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

export type OsStatus = (typeof OS_STATUS)[number];

export const OS_STATUS_LABEL: Record<OsStatus, string> = {
  recebido: "Recebido",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  em_manutencao: "Em manutenção",
  aguardando_peca: "Aguardando peça",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const OS_STATUS_CLASS: Record<OsStatus, string> = {
  recebido: "bg-secondary text-secondary-foreground",
  em_analise: "bg-info/15 text-info",
  aguardando_aprovacao: "bg-warning/20 text-warning-foreground",
  aprovado: "bg-accent text-accent-foreground",
  em_manutencao: "bg-info/15 text-info",
  aguardando_peca: "bg-warning/20 text-warning-foreground",
  pronto: "bg-success/15 text-success",
  entregue: "bg-primary/15 text-primary",
  cancelado: "bg-destructive/12 text-destructive",
};

export const FORMAS_PAGAMENTO = ["dinheiro", "pix", "debito", "credito", "transferencia"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferência",
};

export const ORCAMENTO_STATUS = ["aguardando_aprovacao", "aprovado", "recusado"] as const;
export type OrcamentoStatus = (typeof ORCAMENTO_STATUS)[number];

export const ORCAMENTO_STATUS_LABEL: Record<OrcamentoStatus, string> = {
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

export const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;
