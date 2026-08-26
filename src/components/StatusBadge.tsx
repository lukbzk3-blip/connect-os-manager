import { OS_STATUS_CLASS, OS_STATUS_LABEL, type OsStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: OsStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        OS_STATUS_CLASS[status],
        className,
      )}
    >
      {OS_STATUS_LABEL[status]}
    </span>
  );
}
