"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mostra so os itens (`[data-fit-item]`) que cabem INTEIROS na altura
 * disponivel, sem barra de rolagem e sem item cortado pela metade. Os que
 * nao cabem ficam com visibility:hidden -- continuam ocupando espaco, entao
 * esconder nao muda o layout e nao entra em loop com o ResizeObserver.
 *
 * Quando a altura nao e limitada (mobile, onde o card cresce com o
 * conteudo), tudo cabe e nada e escondido.
 */
export function FitToHeight({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    function ajustar() {
      if (!container) return;
      const limite = container.getBoundingClientRect().bottom + 0.5;
      container.querySelectorAll<HTMLElement>("[data-fit-item]").forEach((item) => {
        item.style.visibility = item.getBoundingClientRect().bottom <= limite ? "" : "hidden";
      });
    }

    ajustar();
    const observer = new ResizeObserver(ajustar);
    observer.observe(container);
    return () => observer.disconnect();
  });

  return (
    <div ref={ref} className={cn("h-full overflow-hidden", className)}>
      {children}
    </div>
  );
}
