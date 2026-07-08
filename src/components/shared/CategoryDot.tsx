import { TIPO_COLORS } from "@/lib/constants/chart-colors";
import type { Tipo } from "@/lib/parser";

interface Props {
  tipo: Tipo;
  children: React.ReactNode;
}

export function CategoryDot({ tipo, children }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: TIPO_COLORS[tipo].light }}
      />
      {children}
    </span>
  );
}
