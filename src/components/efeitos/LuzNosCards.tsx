"use client";

import { useEffect } from "react";

/**
 * Luz que segue o mouse nos cards (o visual fica no CSS: [data-slot=card]
 * ::before/::after). Um unico listener pra pagina toda, no maximo uma
 * atualizacao por quadro, e so pra mouse -- no toque nao faz sentido.
 */
export function LuzNosCards() {
  useEffect(() => {
    let cardAtivo: HTMLElement | null = null;
    let quadro = 0;
    let ultimo: PointerEvent | null = null;

    function apagar() {
      if (cardAtivo) delete cardAtivo.dataset.luz;
      cardAtivo = null;
    }

    function atualizar() {
      quadro = 0;
      const e = ultimo;
      if (!e) return;
      const card = (e.target as Element | null)?.closest<HTMLElement>('[data-slot="card"]') ?? null;
      if (card !== cardAtivo) {
        apagar();
        cardAtivo = card;
      }
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--luz-x", `${e.clientX - r.left}px`);
      card.style.setProperty("--luz-y", `${e.clientY - r.top}px`);
      card.dataset.luz = "";
    }

    function aoMover(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      ultimo = e;
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    }

    document.addEventListener("pointermove", aoMover, { passive: true });
    document.documentElement.addEventListener("pointerleave", apagar);
    return () => {
      document.removeEventListener("pointermove", aoMover);
      document.documentElement.removeEventListener("pointerleave", apagar);
      cancelAnimationFrame(quadro);
      apagar();
    };
  }, []);

  return null;
}
