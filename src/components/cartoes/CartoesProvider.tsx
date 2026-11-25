"use client";

import { createContext, useContext } from "react";
import type { CartaoInfo } from "@/lib/cartoes/server";

const CartoesContext = createContext<CartaoInfo[]>([]);

/** Cartoes ativos do household, pra qualquer Client Component da area logada (formularios, listas). */
export function CartoesProvider({ cartoes, children }: { cartoes: CartaoInfo[]; children: React.ReactNode }) {
  return <CartoesContext value={cartoes}>{children}</CartoesContext>;
}

export function useCartoes(): CartaoInfo[] {
  return useContext(CartoesContext);
}
