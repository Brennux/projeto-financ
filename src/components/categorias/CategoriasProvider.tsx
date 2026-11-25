"use client";

import { createContext, useContext, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { corDaCategoria, type CorTema } from "@/lib/categorias/cores";
import { iconeDaCategoria } from "@/lib/categorias/icones";
import type { CategoriaInfo } from "@/lib/categorias/types";
import type { Tipo } from "@/lib/parser/types";

const CategoriasContext = createContext<CategoriaInfo[]>([]);

/**
 * Categorias do household disponiveis pra qualquer Client Component da area
 * logada (cor, icone, lista pros selects). Vem do layout (app) -- um
 * router.refresh() depois de editar categorias ja atualiza tudo.
 */
export function CategoriasProvider({
  categorias,
  children,
}: {
  categorias: CategoriaInfo[];
  children: React.ReactNode;
}) {
  return <CategoriasContext value={categorias}>{children}</CategoriasContext>;
}

export interface CategoriasApi {
  lista: CategoriaInfo[];
  doTipo: (tipo: Tipo) => CategoriaInfo[];
  /** Cor (claro/escuro) pelo nome -- cinza se a categoria nao existir mais. */
  cor: (nome: string) => CorTema;
  icone: (nome: string) => LucideIcon;
}

export function useCategorias(): CategoriasApi {
  const lista = useContext(CategoriasContext);
  return useMemo(() => {
    const porNome = new Map(lista.map((c) => [c.nome, c]));
    return {
      lista,
      doTipo: (tipo) => lista.filter((c) => c.tipos.includes(tipo)),
      cor: (nome) => corDaCategoria(porNome.get(nome)?.cor ?? "cinza"),
      icone: (nome) => iconeDaCategoria(porNome.get(nome)?.icone ?? "outros"),
    };
  }, [lista]);
}
