"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startNavigationProgress } from "@/components/layout/NavigationProgress";
import { Button } from "@/components/ui/button";

interface Props {
  referenceDate: Date;
}

function capitalizarPrimeiraLetra(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function PeriodPicker({ referenceDate }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function irPara(data: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", format(data, "yyyy-MM"));
    startNavigationProgress();
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Mês anterior"
        onClick={() => irPara(subMonths(referenceDate, 1))}
      >
        <ChevronLeft className="size-3.5" />
      </Button>
      <span
        key={format(referenceDate, "yyyy-MM")}
        className="min-w-32 animate-in text-center text-sm font-medium tabular-nums fade-in-0 slide-in-from-bottom-1 duration-300"
      >
        {capitalizarPrimeiraLetra(format(referenceDate, "MMMM 'de' yyyy", { locale: ptBR }))}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Próximo mês"
        onClick={() => irPara(addMonths(referenceDate, 1))}
      >
        <ChevronRight className="size-3.5" />
      </Button>
      <input
        type="month"
        aria-label="Ir para o mês"
        value={format(referenceDate, "yyyy-MM")}
        onChange={(e) => e.target.value && irPara(new Date(`${e.target.value}-01T00:00:00`))}
        className="h-8 cursor-pointer rounded-lg border border-input bg-background/55 px-2.5 text-sm text-muted-foreground shadow-field transition-[border-color,box-shadow,color] duration-200 outline-none [color-scheme:light] hover:border-[color-mix(in_oklch,var(--input),var(--ring)_40%)] hover:text-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 dark:bg-background/45 dark:[color-scheme:dark]"
      />
    </div>
  );
}
