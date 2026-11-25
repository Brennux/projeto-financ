"use client";

import { useSyncExternalStore } from "react";
import { formatCurrencyBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const assinarNada = () => () => {};

interface Props {
  valor: number;
  className?: string;
  /** Classe do "R$" (fica menor e mais apagado que o numero). */
  classeMoeda?: string;
}

/**
 * Valor em reais com digitos que rolam como num contador mecanico: cada
 * digito e uma coluna 0-9 deslizando ate o numero certo, um depois do outro.
 * Na troca de valor (ex.: outro mes) rola do digito antigo pro novo.
 * Leitores de tela recebem so o texto final.
 */
export function Odometro({ valor, className, classeMoeda }: Props) {
  // false no servidor e na hidratacao -> colunas comecam no 0 e rolam ate o valor.
  const montado = useSyncExternalStore(assinarNada, () => true, () => false);
  const texto = formatCurrencyBRL(valor);
  const [, prefixo = "", numero = texto] = texto.match(/^(-?\s*R\$\s?)(.*)$/) ?? [];
  const caracteres = numero.split("");

  return (
    <span className={cn("inline-flex items-start leading-none", className)}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden className={cn("mt-[0.12em] mr-[0.12em] text-[0.45em] font-medium", classeMoeda)}>
        {prefixo.trim()}
      </span>
      <span aria-hidden className="inline-flex tabular-nums">
        {caracteres.map((ch, i) => {
          // Chave pela posicao a partir da direita: centavos continuam sendo
          // centavos quando o numero ganha uma casa de milhar.
          const chave = caracteres.length - i;
          if (ch < "0" || ch > "9") {
            return (
              <span key={chave} className="inline-block h-[1em] leading-[1em] whitespace-pre">
                {ch}
              </span>
            );
          }
          const digito = montado ? Number(ch) : 0;
          return (
            <span key={chave} className="inline-block h-[1em] overflow-hidden">
              <span
                className="block transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translateY(-${digito}em)`, transitionDelay: `${150 + i * 70}ms` }}
              >
                {DIGITOS.map((n) => (
                  <span key={n} className="block h-[1em] leading-[1em]">
                    {n}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
