"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribeNoop = () => () => {};
const getSnapshotCliente = () => true;
const getSnapshotServidor = () => false;

/**
 * resolvedTheme do next-themes e sempre undefined no SSR e no primeiro
 * render do cliente (antes de hidratar) -- usar esse valor direto pra
 * escolher uma cor renderizada da hydration mismatch toda vez que o tema
 * resolvido for "dark", ja que o servidor sempre renderiza como se fosse
 * "light". useSyncExternalStore com um snapshot diferente pro servidor e
 * pro cliente e o jeito oficial do React de sinalizar "so depois de
 * montado", sem cair no anti-padrao de setState dentro de useEffect.
 */
export function useTema(): "light" | "dark" {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeNoop, getSnapshotCliente, getSnapshotServidor);

  return mounted && resolvedTheme === "dark" ? "dark" : "light";
}
