import { Wifi } from "lucide-react";
import { corDaCategoria } from "@/lib/categorias/cores";
import { cn } from "@/lib/utils";

interface Props {
  nome: string;
  cor: string;
  /** Texto pequeno do canto de baixo (ex.: "fecha 03 · vence 10"). */
  rodape?: string;
  /** Valor em destaque no meio do cartao (ex.: fatura atual). */
  destaque?: React.ReactNode;
  rotuloDestaque?: string;
  arquivado?: boolean;
  className?: string;
}

/**
 * Cartao de credito desenhado: proporcao de cartao real (85,6 x 54 mm),
 * degrade na cor escolhida, chip, simbolo de aproximacao e um brilho
 * diagonal. So visual -- quem usa decide se e link ou nao.
 */
export function CartaoVisual({ nome, cor, rodape, destaque, rotuloDestaque, arquivado, className }: Props) {
  const tom = corDaCategoria(cor);
  return (
    <div
      className={cn(
        "relative isolate flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-pop ring-1 ring-white/10 select-none",
        arquivado && "opacity-60 grayscale",
        className,
      )}
      style={{
        background: `radial-gradient(120% 140% at 100% 0%, color-mix(in oklch, ${tom.light} 85%, white) 0%, transparent 55%), linear-gradient(135deg, ${tom.light} 0%, color-mix(in oklch, ${tom.light}, black 45%) 100%)`,
      }}
    >
      {/* Brilho diagonal e textura de linhas finas: aspecto de cartao fisico. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-1/4 -top-1/2 h-full rotate-12 bg-linear-to-b from-white/25 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(115deg,white_0_1px,transparent_1px_7px)]"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="truncate text-lg font-semibold tracking-tight drop-shadow-sm">{nome}</span>
        <Wifi aria-hidden className="size-5 shrink-0 rotate-90 opacity-80" />
      </div>

      <div className="relative flex flex-col gap-3">
        {/* Chip */}
        <span
          aria-hidden
          className="h-7 w-10 rounded-md bg-linear-to-br from-[#f3dc9b] via-[#d4b25c] to-[#a8873c] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)] [background-image:linear-gradient(90deg,transparent_45%,rgb(0_0_0/0.15)_45%,rgb(0_0_0/0.15)_55%,transparent_55%),linear-gradient(0deg,transparent_45%,rgb(0_0_0/0.15)_45%,rgb(0_0_0/0.15)_55%,transparent_55%),linear-gradient(135deg,#f3dc9b,#d4b25c,#a8873c)]"
        />
        {destaque !== undefined && (
          <div className="flex flex-col">
            {rotuloDestaque && (
              <span className="text-[11px] font-medium tracking-[0.14em] text-white/75 uppercase">{rotuloDestaque}</span>
            )}
            <span className="text-2xl font-semibold tracking-tight tabular-nums drop-shadow-sm">{destaque}</span>
          </div>
        )}
      </div>

      <div className="relative flex items-end justify-between gap-3 text-xs text-white/80">
        <span className="truncate">{rodape}</span>
        {/* Dois circulos sobrepostos, sem marca nenhuma. */}
        <span aria-hidden className="flex shrink-0">
          <span className="size-6 rounded-full bg-white/35" />
          <span className="-ml-2.5 size-6 rounded-full bg-white/20" />
        </span>
      </div>
    </div>
  );
}
