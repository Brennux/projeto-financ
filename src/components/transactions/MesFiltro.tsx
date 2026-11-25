"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startNavigationProgress } from "@/components/layout/NavigationProgress";

const TODOS = "todos";

interface Props {
  /** "yyyy-MM" selecionado, ou null pra todos os meses. */
  mes: string | null;
  opcoes: { valor: string; rotulo: string }[];
}

/**
 * Filtro de mes na URL (?mes=yyyy-MM) -- e filtrado no servidor, entao nao
 * fica limitado as ultimas N transacoes carregadas.
 */
export function MesFiltro({ mes, opcoes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selecionar(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === TODOS) params.delete("mes");
    else params.set("mes", valor);
    startNavigationProgress();
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <Select value={mes ?? TODOS} onValueChange={(v) => v && selecionar(v)}>
      <SelectTrigger className="w-48 rounded-full">
        <CalendarDays className="size-4 text-muted-foreground" />
        <SelectValue>
          {(valor: string) =>
            valor === TODOS ? "Todos os meses" : (opcoes.find((o) => o.valor === valor)?.rotulo ?? valor)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>Todos os meses</SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
