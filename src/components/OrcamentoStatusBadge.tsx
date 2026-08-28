import { ORCAMENTO_STATUS_LABEL, type OrcamentoStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CLASS: Record<OrcamentoStatus, string> = {
  aguardando_aprovacao: "bg-warning/20 text-warning-foreground",
  aprovado: "bg-success/15 text-success",
  recusado: "bg-destructive/12 text-destructive",
};

export function OrcamentoStatusBadge({
  status,
  className,
}: {
  status: OrcamentoStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        CLASS[status],
        className,
      )}
    >
      {ORCAMENTO_STATUS_LABEL[status]}
    </span>
  );
}
