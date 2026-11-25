"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { STATUS_COLORS } from "@/lib/constants/chart-colors";
import { cn } from "@/lib/utils";
import type { WhatsAppStatus } from "@/lib/whatsapp/types";

const POLL_INTERVAL_MS = 15_000;

type Nivel = keyof typeof STATUS_COLORS;

function nivelParaStatus(status: WhatsAppStatus | null): Nivel | null {
  if (!status) return null;
  if (status === "connected") return "good";
  if (status === "disconnected" || status === "logged_out") return "critical";
  return "warning"; // pending, connecting, qr_ready -- pareamento em andamento
}

function rotuloDoStatus(status: WhatsAppStatus | null): string {
  switch (status) {
    case "connected":
      return "Bot conectado";
    case "disconnected":
      return "Bot reconectando";
    case "logged_out":
      return "Bot desconectado";
    case "pending":
    case "connecting":
    case "qr_ready":
      return "Conectando bot";
    default:
      return "WhatsApp";
  }
}

async function fetchStatus(): Promise<WhatsAppStatus | null> {
  try {
    const res = await fetch("/api/whatsapp/status");
    if (!res.ok) return null;
    const json: { status: WhatsAppStatus | null } = await res.json();
    return json.status;
  } catch {
    return null;
  }
}

/**
 * Pilula de status do bot no cabecalho ("Bot conectado" com a bolinha
 * pulsando). Leva pra tela do WhatsApp. Reaproveita o esquema
 * good/warning/critical (STATUS_COLORS) do resto do app.
 */
export function WhatsAppStatusIndicator() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ignore = false;

    function atualizar() {
      fetchStatus().then((s) => {
        if (ignore) return;
        setStatus(s);
        setCarregado(true);
      });
    }

    atualizar();
    const interval = setInterval(atualizar, POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, []);

  // Enquanto nao carrega a primeira vez, nao mostra bolinha nenhuma -- melhor
  // que arriscar mostrar vermelho por um instante e depois trocar pra verde.
  const nivel = carregado ? nivelParaStatus(status) : null;
  const rotulo = carregado ? rotuloDoStatus(status) : "WhatsApp";
  const cor = nivel ? STATUS_COLORS[nivel] : null;

  return (
    <Link
      href="/settings/whatsapp"
      title={`${rotulo}. Abrir configurações do WhatsApp`}
      aria-label={`${rotulo}. Abrir configurações do WhatsApp`}
      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 text-sm text-muted-foreground shadow-field backdrop-blur-md transition-[border-color,background-color,color] duration-200 hover:border-[color-mix(in_oklch,var(--border),var(--ring)_40%)] hover:bg-card hover:text-foreground dark:bg-background/50"
      style={cor ? ({ "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties) : undefined}
    >
      {nivel ? (
        <span aria-hidden className="relative flex size-2.5 items-center justify-center">
          {nivel === "good" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-(--cor-claro) opacity-50 [animation-duration:2.2s] dark:bg-(--cor-escuro)" />
          )}
          <span
            className={cn(
              "relative size-2.5 rounded-full bg-(--cor-claro) dark:bg-(--cor-escuro)",
              nivel === "warning" && "animate-pulse",
            )}
          />
        </span>
      ) : (
        <MessageCircle aria-hidden className="size-4" />
      )}
      <span className="hidden whitespace-nowrap lg:inline">{rotulo}</span>
    </Link>
  );
}
