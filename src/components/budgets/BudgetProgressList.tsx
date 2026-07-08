import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { formatCurrencyBRL } from "@/lib/format";
import type { OrcamentoComGasto, StatusOrcamento } from "@/lib/queries/budgets";

const STATUS_BAR_CLASS: Record<StatusOrcamento, string> = {
  good: "bg-[#0ca30c]",
  warning: "bg-[#c98500] dark:bg-[#e0a325]",
  critical: "bg-[#d03b3b]",
};

interface Props {
  orcamentos: OrcamentoComGasto[];
  renderActions?: (orcamento: OrcamentoComGasto) => React.ReactNode;
}

export function BudgetProgressList({ orcamentos, renderActions }: Props) {
  return (
    <ul className="flex flex-col gap-4">
      {orcamentos.map((o) => (
        <li key={o.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">{o.categoria}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground tabular-nums">
                {formatCurrencyBRL(o.gasto)} / {formatCurrencyBRL(o.limite)}
              </span>
              {renderActions?.(o)}
            </div>
          </div>
          <Progress value={Math.min(o.percentual, 1) * 100}>
            <ProgressTrack>
              <ProgressIndicator className={STATUS_BAR_CLASS[o.status]} />
            </ProgressTrack>
          </Progress>
        </li>
      ))}
    </ul>
  );
}
