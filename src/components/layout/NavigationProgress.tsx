"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "nav-progress:start";
/** So mostra a barra se a navegacao demorar mais que isso -- evita piscar em trocas instantaneas (cache). */
const SHOW_DELAY_MS = 120;
/** Rede de seguranca: se a rota nunca mudar (ex.: link pra mesma URL), some sozinha. */
const MAX_DURATION_MS = 15_000;

/** Pra navegacoes programaticas (router.push), que nao passam por clique num <a>. */
export function startNavigationProgress() {
  window.dispatchEvent(new Event(START_EVENT));
}

function isInternalNavigation(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return false;
  }
  const anchor = (e.target as Element | null)?.closest("a");
  if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }
  const url = new URL(anchor.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname + url.search !== window.location.pathname + window.location.search;
}

/**
 * Barra fina no topo durante a troca de rota. A pagina atual continua na tela
 * ate a nova estar pronta (sem esqueleto/cards vazios piscando).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!running.current) return;
    running.current = false;
    clearTimers();
    setProgress(100);
    timers.current.push(
      setTimeout(() => setVisible(false), 250),
      setTimeout(() => setProgress(0), 500),
    );
  }, [clearTimers]);

  useEffect(() => {
    function start() {
      if (running.current) return;
      running.current = true;
      clearTimers();
      setProgress(0);
      timers.current.push(
        setTimeout(() => {
          setVisible(true);
          setProgress(15);
          // Avanca cada vez mais devagar, sem nunca chegar a 100 sozinha.
          tick.current = setInterval(() => setProgress((p) => p + (90 - p) * 0.08), 200);
        }, SHOW_DELAY_MS),
        setTimeout(finish, MAX_DURATION_MS),
      );
    }

    function onClick(e: MouseEvent) {
      if (isInternalNavigation(e)) start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
  }, [clearTimers, finish]);

  // Rota nova renderizada = navegacao concluida.
  useEffect(() => {
    finish();
  }, [pathname, searchParams, finish]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
