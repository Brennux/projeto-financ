"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CornerDownLeft,
  CreditCard,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Moon,
  Palette,
  PiggyBank,
  Plus,
  Receipt,
  Repeat,
  Search,
  SearchX,
  Sun,
  Tags,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { useCartoes } from "@/components/cartoes/CartoesProvider";
import { startNavigationProgress } from "@/components/layout/NavigationProgress";
import { corDaCategoria } from "@/lib/categorias/cores";
import { casaTexto, trechoDestacado } from "@/lib/busca/correspondencia";
import type { ResultadoBusca } from "@/lib/busca/server";
import type { CorTema } from "@/lib/categorias/cores";
import { formatCurrencyBRL, formatDatePtBr, primeiroNome } from "@/lib/format";
import { aplicarPaleta, PALETAS } from "@/lib/paletas";
import { cn } from "@/lib/utils";

const ESPERA_DIGITACAO_MS = 180;
const ID_LISTA = "busca-global-lista";

interface Atalho {
  titulo: string;
  /** Sinonimos que tambem acham esse atalho ("lancamentos" acha Transacoes). */
  termos: string;
  icone: LucideIcon;
  href?: string;
  executar?: () => void;
}

const PAGINAS: Atalho[] = [
  { titulo: "Dashboard", termos: "inicio painel resumo saldo graficos", icone: LayoutGrid, href: "/" },
  { titulo: "Transações", termos: "lancamentos gastos despesas receitas extrato", icone: Receipt, href: "/transactions" },
  { titulo: "Cartões", termos: "cartao credito fatura parcelas limite", icone: CreditCard, href: "/cards" },
  { titulo: "Orçamentos", termos: "limites orcamento meta", icone: PiggyBank, href: "/settings/budgets" },
  { titulo: "Categorias", termos: "categoria palavras-chave", icone: Tags, href: "/settings/categories" },
  { titulo: "Recorrentes", termos: "fixos mensais assinaturas aluguel salario", icone: Repeat, href: "/settings/recurring" },
  { titulo: "WhatsApp", termos: "bot qr code vincular numero celular", icone: MessageCircle, href: "/settings/whatsapp" },
  { titulo: "Casa", termos: "household convite membros pessoas", icone: Users, href: "/settings/household" },
];

interface Item {
  chave: string;
  grupo: string;
  titulo: string;
  subtitulo?: string;
  /** Valor a direita (ja formatado) e se e receita (verde). */
  valor?: { texto: string; receita: boolean };
  icone: LucideIcon;
  /** Cor da categoria (fundo do icone); sem cor = neutro. */
  cor?: CorTema;
  destacar?: boolean;
  href?: string;
  executar?: () => void;
}

function Destaque({ texto, termo }: { texto: string; termo: string }) {
  const trecho = trechoDestacado(texto, termo);
  if (!trecho) return <>{texto}</>;
  return (
    <>
      {trecho.antes}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">{trecho.meio}</mark>
      {trecho.depois}
    </>
  );
}

/**
 * Busca de todo o sistema no cabecalho: transacoes (por descricao,
 * categoria, pessoa, valor ou data), pessoas, categorias, recorrentes,
 * orcamentos, paginas e acoes rapidas. Ctrl+K (Cmd+K) abre de qualquer tela.
 */
export function BuscaGlobal() {
  const router = useRouter();
  const categorias = useCategorias();
  const cartoes = useCartoes();
  const { resolvedTheme, setTheme } = useTheme();
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [resultado, setResultado] = useState<{ termo: string; dados: ResultadoBusca } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const termoLimpo = termo.trim();

  // Ctrl+K / Cmd+K de qualquer tela.
  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        campo.current?.focus();
        campo.current?.select();
        setAberto(true);
      }
    }
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  // Clique fora fecha.
  useEffect(() => {
    if (!aberto) return;
    function aoClicar(e: PointerEvent) {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("pointerdown", aoClicar);
    return () => document.removeEventListener("pointerdown", aoClicar);
  }, [aberto]);

  // Busca no servidor depois que a pessoa para de digitar; cancela a anterior.
  useEffect(() => {
    if (!termoLimpo) return;
    const controle = new AbortController();
    const espera = setTimeout(async () => {
      setCarregando(true);
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(termoLimpo)}`, { signal: controle.signal });
        if (res.ok) setResultado({ termo: termoLimpo, dados: await res.json() });
      } catch {
        // Cancelada (a pessoa continuou digitando) ou sem rede: mantem o que ja havia.
      } finally {
        if (!controle.signal.aborted) setCarregando(false);
      }
    }, ESPERA_DIGITACAO_MS);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [termoLimpo]);

  const itens = useMemo<Item[]>(() => {
    const acoes: Atalho[] = [
      { titulo: "Nova transação", termos: "adicionar lancar gasto despesa receita", icone: Plus, href: "/transactions?nova=1" },
      { titulo: "Novo lançamento recorrente", termos: "adicionar fixo mensal assinatura", icone: Plus, href: "/settings/recurring?novo=1" },
      {
        titulo: resolvedTheme === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro",
        termos: "tema claro escuro dark light noturno",
        icone: resolvedTheme === "dark" ? Sun : Moon,
        executar: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      ...PALETAS.map((p) => ({
        titulo: `Paleta ${p.nome}`,
        termos: `cor cores tema paleta ${p.descricao}`,
        icone: Palette,
        executar: () => aplicarPaleta(p.id),
      })),
    ];

    const lista: Item[] = [];
    const atalhoParaItem = (grupo: string) => (a: Atalho, i: number) => ({
      chave: `${grupo}-${i}-${a.titulo}`,
      grupo,
      titulo: a.titulo,
      icone: a.icone,
      href: a.href,
      executar: a.executar,
    });

    if (!termoLimpo) {
      lista.push(...acoes.slice(0, 2).map(atalhoParaItem("Ações rápidas")));
      lista.push(...PAGINAS.map(atalhoParaItem("Ir para")));
      return lista;
    }

    const dados = resultado?.dados;
    if (dados) {
      lista.push(
        ...dados.transacoes.map((t) => ({
          chave: `t-${t.id}`,
          grupo: "Transações",
          titulo: t.descricao || t.categoria,
          subtitulo: [t.categoria, t.autor && primeiroNome(t.autor), formatDatePtBr(new Date(t.data))]
            .filter(Boolean)
            .join(" · "),
          valor: { texto: `${t.tipo === "despesa" ? "−" : "+"}${formatCurrencyBRL(t.valor)}`, receita: t.tipo === "receita" },
          icone: categorias.icone(t.categoria),
          cor: categorias.cor(t.categoria),
          destacar: true,
          href: `/transactions?q=${encodeURIComponent(termoLimpo)}`,
        })),
      );
      if (dados.totalTransacoes > dados.transacoes.length) {
        lista.push({
          chave: "t-todas",
          grupo: "Transações",
          titulo: `Ver todas as ${dados.totalTransacoes} transações`,
          icone: ArrowRight,
          href: `/transactions?q=${encodeURIComponent(termoLimpo)}`,
        });
      }
      lista.push(
        ...dados.pessoas.map((p) => ({
          chave: `p-${p.id}`,
          grupo: "Pessoas",
          titulo: p.nome,
          subtitulo: `Ver lançamentos de ${primeiroNome(p.nome)}`,
          icone: User,
          destacar: true,
          href: `/transactions?pessoa=${p.id}`,
        })),
        ...dados.categorias.map((c) => ({
          chave: `c-${c.id}`,
          grupo: "Categorias",
          titulo: c.nome,
          subtitulo: "Ver lançamentos da categoria",
          icone: categorias.icone(c.nome),
          cor: categorias.cor(c.nome),
          destacar: true,
          href: `/transactions?categoria=${encodeURIComponent(c.nome)}`,
        })),
        ...dados.recorrentes.map((r) => ({
          chave: `r-${r.id}`,
          grupo: "Recorrentes",
          titulo: r.descricao,
          subtitulo: `${r.categoria} · todo dia ${r.diaDoMes}`,
          valor: { texto: `${r.tipo === "despesa" ? "−" : "+"}${formatCurrencyBRL(r.valor)}`, receita: r.tipo === "receita" },
          icone: Repeat,
          cor: categorias.cor(r.categoria),
          destacar: true,
          href: "/settings/recurring",
        })),
        ...dados.orcamentos.map((o) => ({
          chave: `o-${o.id}`,
          grupo: "Orçamentos",
          titulo: `Orçamento de ${o.categoria}`,
          subtitulo: `Limite de ${formatCurrencyBRL(o.limite)} por mês`,
          icone: PiggyBank,
          cor: categorias.cor(o.categoria),
          href: "/settings/budgets",
        })),
      );
    }

    // Cartoes ja estao no cliente (contexto): "nubank" ou "fatura" acham na hora.
    lista.push(
      ...cartoes
        .filter((c) => casaTexto([c.nome, "cartao credito fatura"], termoLimpo))
        .map((c) => ({
          chave: `cartao-${c.id}`,
          grupo: "Cartões",
          titulo: c.nome,
          subtitulo: `Ver faturas · fecha dia ${c.diaFechamento}, vence dia ${c.diaVencimento}`,
          icone: CreditCard,
          cor: corDaCategoria(c.cor),
          destacar: true,
          href: `/cards/${c.id}`,
        })),
    );

    lista.push(
      ...[...acoes, ...PAGINAS]
        .filter((a) => casaTexto([a.titulo, a.termos], termoLimpo))
        .slice(0, 5)
        .map(atalhoParaItem("Ir para e ações")),
    );

    lista.push({
      chave: "buscar-transacoes",
      grupo: "",
      titulo: `Buscar “${termoLimpo}” em todas as transações`,
      icone: Search,
      href: `/transactions?q=${encodeURIComponent(termoLimpo)}`,
    });
    return lista;
  }, [termoLimpo, resultado, categorias, cartoes, resolvedTheme, setTheme]);

  const indiceAtivo = Math.min(ativo, Math.max(itens.length - 1, 0));
  const semResultados = Boolean(termoLimpo) && !carregando && resultado?.termo === termoLimpo && itens.length === 1;

  // Mantem o item ativo visivel ao navegar com as setas.
  useEffect(() => {
    if (aberto) document.getElementById(`busca-item-${indiceAtivo}`)?.scrollIntoView({ block: "nearest" });
  }, [indiceAtivo, aberto]);

  function executar(item: Item) {
    setAberto(false);
    campo.current?.blur();
    if (item.executar) {
      item.executar();
      return;
    }
    if (item.href) {
      setTermo("");
      startNavigationProgress();
      router.push(item.href);
    }
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo((indiceAtivo + 1) % Math.max(itens.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((indiceAtivo - 1 + itens.length) % Math.max(itens.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = itens[indiceAtivo];
      if (item) executar(item);
    } else if (e.key === "Escape") {
      if (aberto) {
        e.preventDefault();
        setAberto(false);
      } else {
        campo.current?.blur();
      }
    }
  }

  return (
    <div ref={caixa} className="group/busca relative min-w-0 flex-1 sm:max-w-80">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/busca:text-primary" />
      <input
        ref={campo}
        type="search"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={ID_LISTA}
        aria-autocomplete="list"
        aria-activedescendant={aberto && itens[indiceAtivo] ? `busca-item-${indiceAtivo}` : undefined}
        aria-label="Buscar em todo o sistema"
        aria-keyshortcuts="Control+K Meta+K"
        autoComplete="off"
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAtivo(0);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        placeholder="Buscar transações…"
        className="h-10 w-full rounded-full border border-border/70 bg-card/60 pr-3 pl-10 text-sm shadow-field backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-300 ease-out outline-none placeholder:text-muted-foreground/80 hover:border-[color-mix(in_oklch,var(--border),var(--ring)_40%)] focus-visible:border-ring focus-visible:bg-card focus-visible:shadow-none focus-visible:ring-4 focus-visible:ring-ring/15 sm:pr-16 dark:bg-background/50 [&::-webkit-search-cancel-button]:hidden"
      />
      {carregando ? (
        <Loader2
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
        />
      ) : (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 hidden h-6 -translate-y-1/2 items-center rounded-md border border-border/70 bg-muted/70 px-1.5 font-sans text-[11px] font-medium text-muted-foreground transition-opacity group-focus-within/busca:opacity-0 sm:flex"
        >
          Ctrl K
        </kbd>
      )}

      {aberto && (
        <div className="fixed inset-x-3 top-17 z-50 animate-in overflow-hidden rounded-2xl bg-popover/95 text-popover-foreground shadow-pop ring-1 ring-foreground/10 backdrop-blur-xl backdrop-saturate-150 duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] fade-in-0 zoom-in-95 slide-in-from-top-1 sm:absolute sm:inset-x-auto sm:top-[calc(100%+8px)] sm:right-0 sm:w-[min(28rem,calc(100vw-2rem))]">
          {semResultados && (
            <div className="flex flex-col items-center gap-1 px-4 pt-6 pb-2 text-center">
              <SearchX className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Nada encontrado para “{termoLimpo}”</p>
              <p className="text-xs text-muted-foreground">Tente outra palavra, um valor (ex.: 58,90) ou uma data (ex.: 22/11).</p>
            </div>
          )}

          <ul id={ID_LISTA} role="listbox" aria-label="Resultados da busca" className="max-h-[min(70vh,30rem)] overflow-y-auto p-1.5">
            {itens.map((item, i) => {
              const novoGrupo = i === 0 || item.grupo !== itens[i - 1].grupo;
              const Icone = item.icone;
              const selecionado = i === indiceAtivo;
              return (
                <li key={item.chave} role="presentation">
                  {novoGrupo && item.grupo && (
                    <p
                      role="presentation"
                      className="px-2.5 pt-2.5 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
                    >
                      {item.grupo}
                    </p>
                  )}
                  {novoGrupo && !item.grupo && i > 0 && <div role="presentation" className="mx-2 my-1.5 h-px bg-border" />}
                  <div
                    id={`busca-item-${i}`}
                    role="option"
                    aria-selected={selecionado}
                    onPointerMove={() => setAtivo(i)}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => executar(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-150",
                      selecionado && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        item.cor
                          ? "bg-(--cor-claro)/14 text-(--cor-claro) dark:bg-(--cor-escuro)/20 dark:text-(--cor-escuro)"
                          : "bg-muted text-muted-foreground",
                      )}
                      style={
                        item.cor
                          ? ({ "--cor-claro": item.cor.light, "--cor-escuro": item.cor.dark } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <Icone className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {item.destacar ? <Destaque texto={item.titulo} termo={termoLimpo} /> : item.titulo}
                      </span>
                      {item.subtitulo && <span className="truncate text-xs text-muted-foreground">{item.subtitulo}</span>}
                    </span>
                    {item.valor && (
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          item.valor.receita && "text-[#008300] dark:text-[#0ca30c]",
                        )}
                      >
                        {item.valor.texto}
                      </span>
                    )}
                    {selecionado && <CornerDownLeft aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-4 border-t border-border/70 bg-muted/40 px-3.5 py-2 text-[11px] text-muted-foreground sm:flex">
            <span>
              <kbd className="font-sans font-semibold">↑ ↓</kbd> navegar
            </span>
            <span>
              <kbd className="font-sans font-semibold">Enter</kbd> abrir
            </span>
            <span>
              <kbd className="font-sans font-semibold">Esc</kbd> fechar
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
