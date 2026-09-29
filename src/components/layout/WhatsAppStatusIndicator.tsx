"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { STATUS_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { useTema } from "@/hooks/use-tema";
import type { WhatsAppStatus } from "@/lib/whatsapp/types";

const POLL_INTERVAL_MS = 15_000;

function nivelParaStatus(status: WhatsAppStatus | null): keyof typeof STATUS_COLORS | null {
  if (!status) return null;
  if (status === "connected") return "good";
  if (status === "disconnected" || status === "logged_out") return "critical";
  return "warning"; // pending, connecting, qr_ready -- pareamento em andamento
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
 * Bolinha de status sobre o icone do WhatsApp no header -- reaproveita o
 * mesmo esquema good/warning/critical do BudgetGaugeCard (STATUS_COLORS) em
 * vez de inventar uma paleta paralela so pra isso.
 */
export function WhatsAppStatusIndicator() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [carregado, setCarregado] = useState(false);
  const tema = useTema();

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

  return (
    <span className="relative flex items-center justify-center">
      <MessageCircle className="size-[1.1rem]" />
      {nivel && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-background"
          style={{ backgroundColor: corPorTema(STATUS_COLORS[nivel], tema) }}
        />
      )}
    </span>
  );
}
