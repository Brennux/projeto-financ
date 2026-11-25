"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/** Botao redondo do cabecalho -- mesmo visual do seletor de paleta. */
export const CLASSE_BOTAO_REDONDO =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground shadow-field backdrop-blur-md transition-[border-color,background-color,transform] duration-200 hover:border-[color-mix(in_oklch,var(--border),var(--ring)_40%)] hover:bg-card active:scale-95 data-popup-open:border-ring data-popup-open:bg-card dark:bg-background/50";

const assinarNada = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // O tema real so e conhecido no cliente: ate la, botao reservando o espaco.
  const montado = useSyncExternalStore(assinarNada, () => true, () => false);

  if (!montado) {
    return <span aria-hidden className={CLASSE_BOTAO_REDONDO} />;
  }

  return (
    <button
      type="button"
      aria-label={resolvedTheme === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
      title={resolvedTheme === "dark" ? "Modo claro" : "Modo escuro"}
      className={CLASSE_BOTAO_REDONDO}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* key troca o elemento -> o icone novo entra girando */}
      <span
        key={resolvedTheme}
        className="flex animate-in spin-in-90 zoom-in-50 fade-in-0 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        {resolvedTheme === "dark" ? <Sun className="size-[1.1rem]" /> : <Moon className="size-[1.1rem]" />}
      </span>
    </button>
  );
}
