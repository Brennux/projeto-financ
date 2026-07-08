"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      <span className="min-w-32 text-center text-sm tabular-nums">
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
        className="h-7 rounded-[min(var(--radius-md),12px)] border border-input bg-background px-2 text-sm text-muted-foreground"
      />
    </div>
  );
}
