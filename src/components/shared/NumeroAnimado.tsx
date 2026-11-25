"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatCurrencyBRL } from "@/lib/format";

interface Props {
  valor: number;
  /** Formatacao do numero exibido (padrao: moeda BRL). */
  formatar?: (valor: number) => string;
  duracaoMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Valor que "conta" ate o numero final -- de 0 na primeira vez e do valor
 * anterior quando muda (ex.: trocar o mes). O HTML do servidor ja vem com o
 * valor final (sem pulo de layout); quem pediu menos movimento ve direto.
 */
export function NumeroAnimado({ valor, formatar = formatCurrencyBRL, duracaoMs = 900, className, style }: Props) {
  const reduzirMovimento = useReducedMotion();
  const [exibido, setExibido] = useState(valor);
  const anterior = useRef(0);

  useEffect(() => {
    const de = anterior.current;
    anterior.current = valor;
    if (reduzirMovimento || de === valor) {
      const quadro = requestAnimationFrame(() => setExibido(valor));
      return () => cancelAnimationFrame(quadro);
    }

    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      setExibido(de + (valor - de) * easeOutCubic(t));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracaoMs, reduzirMovimento]);

  return (
    <span className={className} style={style}>
      {formatar(exibido)}
    </span>
  );
}
