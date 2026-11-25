"use client";

import { useSyncExternalStore } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { CLASSE_BOTAO_REDONDO } from "@/components/theme-toggle";
import { aplicarPaleta, EVENTO_PALETA, PALETA_PADRAO, PALETAS, paletaAtual } from "@/lib/paletas";
import { cn } from "@/lib/utils";

function assinar(aoMudar: () => void) {
  window.addEventListener(EVENTO_PALETA, aoMudar);
  return () => window.removeEventListener(EVENTO_PALETA, aoMudar);
}

/** Escolha da paleta de cores (e do modo claro/escuro), no cabecalho. */
export function PaletaPicker() {
  const atual = useSyncExternalStore(assinar, paletaAtual, () => PALETA_PADRAO);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label="Escolher paleta de cores"
        title="Paleta de cores"
        className={CLASSE_BOTAO_REDONDO}
      >
        <Palette className="size-[1.1rem]" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end" className="z-50">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-2xl bg-popover/90 p-2 text-popover-foreground shadow-pop ring-1 ring-foreground/10 backdrop-blur-xl backdrop-saturate-150 duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-150">
            <Popover.Title className="px-2 pt-1.5 pb-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Paleta
            </Popover.Title>
            <div className="flex flex-col gap-0.5" role="radiogroup" aria-label="Paleta de cores">
              {PALETAS.map((p) => {
                const selecionada = p.id === atual;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selecionada}
                    onClick={() => aplicarPaleta(p.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent",
                      selecionada && "bg-accent",
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-8 shrink-0 rounded-full shadow-[inset_0_0_0_1px_oklch(1_0_0/0.25)]"
                      style={{ background: `linear-gradient(135deg, ${p.fundo} 50%, ${p.destaque} 50%)` }}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{p.nome}</span>
                      <span className="truncate text-xs text-muted-foreground">{p.descricao}</span>
                    </span>
                    {selecionada && <Check className="size-4 shrink-0 animate-in text-primary zoom-in-50 fade-in-0" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1" role="radiogroup" aria-label="Modo">
              {(["light", "dark"] as const).map((modo) => {
                const ativo = resolvedTheme === modo;
                return (
                  <button
                    key={modo}
                    type="button"
                    role="radio"
                    aria-checked={ativo}
                    onClick={() => setTheme(modo)}
                    className={cn(
                      "h-8 cursor-pointer rounded-lg text-sm font-medium transition-all",
                      ativo ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {modo === "light" ? "Claro" : "Escuro"}
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
