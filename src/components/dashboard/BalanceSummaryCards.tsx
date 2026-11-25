import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL, primeiroNome } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/constants/chart-colors";
import { NumeroAnimado } from "@/components/shared/NumeroAnimado";
import { Odometro } from "@/components/shared/Odometro";
import { CORES_CATEGORIA, type CorCategoria } from "@/lib/categorias/cores";
import { sparkline } from "@/lib/graficos";
import { cn } from "@/lib/utils";
import type { GastoPorPessoa, ResumoMensal } from "@/lib/queries/transactions";

// Cor de cada pessoa: slots da paleta categorica na ordem de entrada no
// household (estavel entre meses); "sem autor" fica no cinza neutro.
const CORES_PESSOA: CorCategoria[] = ["azul", "laranja", "agua", "amarelo", "magenta", "violeta"];

interface Props extends ResumoMensal {
  gastosPorPessoa?: GastoPorPessoa[];
  /** Saldo do mes anterior, pra comparacao no card herói. */
  saldoAnterior: number;
  /** Saldo acumulado dia a dia no mes (mini-linha). */
  saldoDiario: number[];
  /** "novembro", "outubro". */
  mes: string;
  mesAnterior: string;
}

function GastosPorPessoa({ pessoas, total }: { pessoas: GastoPorPessoa[]; total: number }) {
  const comCor = pessoas.map((p, i) => ({
    ...p,
    cor: CORES_CATEGORIA[p.userId ? CORES_PESSOA[i % CORES_PESSOA.length] : "cinza"],
  }));
  const comGasto = comCor.filter((p) => p.total > 0);

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {total > 0 && (
        <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {comGasto.map((p) => (
            <span
              key={p.userId ?? "sem-autor"}
              className="h-full rounded-full bg-(--cor-claro) dark:bg-(--cor-escuro)"
              style={
                {
                  width: `${(p.total / total) * 100}%`,
                  "--cor-claro": p.cor.light,
                  "--cor-escuro": p.cor.dark,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        {comCor.map((p) => (
          <li key={p.userId ?? "sem-autor"} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 rounded-full bg-(--cor-claro) dark:bg-(--cor-escuro)"
              style={{ "--cor-claro": p.cor.light, "--cor-escuro": p.cor.dark } as React.CSSProperties}
            />
            <span className="text-muted-foreground">{p.userId ? primeiroNome(p.nome) : p.nome}</span>
            <span className="font-medium tabular-nums">{formatCurrencyBRL(p.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const formatoPercentual = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "always",
});

function corStatus(positivo: boolean): React.CSSProperties {
  const cor = positivo ? STATUS_COLORS.good : STATUS_COLORS.critical;
  return { "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties;
}

interface HeroProps {
  saldo: number;
  saldoAnterior: number;
  saldoDiario: number[];
  mes: string;
  mesAnterior: string;
}

/** Card herói: saldo em odômetro, comparação com o mês anterior e a linha do mês ao fundo. */
function SaldoHero({ saldo, saldoAnterior, saldoDiario, mes, mesAnterior }: HeroProps) {
  const variacao = saldo - saldoAnterior;
  const subiu = variacao >= 0;
  const percentual = saldoAnterior !== 0 ? variacao / Math.abs(saldoAnterior) : null;
  const linha = sparkline(saldoDiario, 300, 80);

  return (
    <Card size="sm" className="justify-between sm:col-span-2 lg:col-span-6">
      {/* Luz da paleta no canto + a linha do saldo dia a dia, ao fundo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_220px_at_100%_0%,var(--ambient-1),transparent_70%)]"
      />
      {linha && (
        <svg
          aria-hidden
          viewBox="0 0 300 80"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full text-primary"
        >
          <defs>
            <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={linha.area} fill="url(#hero-area)" className="animate-in fade-in duration-1000" />
          <path
            d={linha.linha}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.65"
            strokeWidth="1.5"
            pathLength={1}
            className="linha-desenhada"
          />
        </svg>
      )}

      <CardHeader className="relative flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Saldo de {mes}
        </CardTitle>
        <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-2 text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25),0_8px_20px_-10px_color-mix(in_oklch,var(--primary)_80%,transparent)] transition-transform duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6">
          <Wallet className="size-4.5" aria-hidden />
        </span>
      </CardHeader>
      <CardContent className="relative flex flex-col gap-2.5">
        <Odometro
          valor={saldo}
          className={cn(
            "text-4xl font-semibold tracking-tight xl:text-5xl",
            saldo < 0 && "text-destructive",
          )}
          classeMoeda="text-muted-foreground"
        />
        {percentual !== null && (
          <p className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="inline-flex h-6 items-center gap-1 rounded-full bg-(--cor-claro)/12 px-2.5 font-semibold text-foreground dark:bg-(--cor-escuro)/15 [&_svg]:text-(--cor-claro) dark:[&_svg]:text-(--cor-escuro)"
              style={corStatus(subiu)}
            >
              {subiu ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
              {formatoPercentual.format(percentual)}
            </span>
            <span className="text-muted-foreground">
              {subiu ? "+" : "−"}
              {formatCurrencyBRL(Math.abs(variacao))} vs {mesAnterior}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function BalanceSummaryCards({
  receitas,
  despesas,
  saldo,
  gastosPorPessoa = [],
  saldoAnterior,
  saldoDiario,
  mes,
  mesAnterior,
}: Props) {
  // So vale mostrar a divisao quando a casa tem mais de uma pessoa.
  const mostrarPorPessoa = gastosPorPessoa.length > 1;

  return (
    <div className="stagger-in grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
      <SaldoHero
        saldo={saldo}
        saldoAnterior={saldoAnterior}
        saldoDiario={saldoDiario}
        mes={mes}
        mesAnterior={mesAnterior}
      />

      <Card size="sm" className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do mês</CardTitle>
          <span className="flex size-9 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover/card:-rotate-6 group-hover/card:scale-110 bg-[#008300]/10 text-[#008300] dark:bg-[#008300]/15">
            <TrendingUp className="size-4.5" aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <NumeroAnimado valor={receitas} className="block text-2xl font-semibold tracking-tight tabular-nums" />
        </CardContent>
      </Card>

      <Card size="sm" className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do mês</CardTitle>
          <span className="flex size-9 items-center justify-center rounded-xl transition-transform duration-300 ease-out group-hover/card:-rotate-6 group-hover/card:scale-110 bg-primary/10 text-primary">
            <TrendingDown className="size-4.5" aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <NumeroAnimado valor={despesas} className="block text-2xl font-semibold tracking-tight tabular-nums" />
          {mostrarPorPessoa && <GastosPorPessoa pessoas={gastosPorPessoa} total={despesas} />}
        </CardContent>
      </Card>
    </div>
  );
}
