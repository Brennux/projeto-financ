"use client";

import { useEffect, useRef, useState } from "react";
import { toDataURL } from "qrcode";
import { Button } from "@/components/ui/button";
import type { WhatsAppStatus } from "@/lib/whatsapp/types";

interface StatusResponse {
  status: WhatsAppStatus | null;
  qr: string | null;
  phoneNumber: string | null;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

const EM_ANDAMENTO: WhatsAppStatus[] = ["pending", "connecting", "qr_ready"];

const STATUS_LABEL: Record<WhatsAppStatus, string> = {
  pending: "Preparando conexao...",
  connecting: "Conectando...",
  qr_ready: "Escaneie o QR code no WhatsApp",
  connected: "Conectado",
  disconnected: "Desconectado, tentando reconectar...",
  logged_out: "Sessao encerrada",
};

async function loadStatus(): Promise<StatusResponse | null> {
  const res = await fetch("/api/whatsapp/status");
  if (!res.ok) return null;
  return res.json();
}

export function WhatsAppConnectPanel() {
  const [data, setData] = useState<StatusResponse>({ status: null, qr: null, phoneNumber: null });
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  // Incrementado a cada tentativa manual, pra reiniciar o polling mesmo
  // quando o status retornado for igual ao que ja estava (ex.: continua
  // "pending" porque o worker ainda nao pegou a conta).
  const [pollGeneration, setPollGeneration] = useState(0);
  const lastQrRef = useRef<string | null>(null);

  // Busca o status uma vez ao montar.
  useEffect(() => {
    let ignore = false;
    loadStatus().then((json) => {
      if (!ignore && json) setData(json);
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Converte o QR (string crua do Baileys) em imagem sempre que ele mudar --
  // inclusive pra null (limpa a imagem), unificando os dois casos num unico
  // .then() pra nao chamar setState direto no corpo sincrono do efeito.
  useEffect(() => {
    const currentQr = data.qr;
    if (currentQr === lastQrRef.current) return;
    lastQrRef.current = currentQr;

    let ignore = false;
    Promise.resolve(currentQr ? toDataURL(currentQr) : null).then((url) => {
      if (!ignore) setQrImage(url);
    });

    return () => {
      ignore = true;
    };
  }, [data.qr]);

  // Enquanto o pareamento estiver em andamento, faz polling do status.
  useEffect(() => {
    if (!data.status || !EM_ANDAMENTO.includes(data.status)) return;

    let ignore = false;
    const startedAt = Date.now();

    const interval = setInterval(() => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (!ignore) setTimedOut(true);
        clearInterval(interval);
        return;
      }
      loadStatus().then((json) => {
        if (!ignore && json) setData(json);
      });
    }, POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [data.status, pollGeneration]);

  async function handleConnect() {
    setTimedOut(false);
    setPollGeneration((g) => g + 1);
    const res = await fetch("/api/whatsapp/connect", { method: "POST" });
    if (res.ok) {
      const json: { status: WhatsAppStatus } = await res.json();
      setData((prev) => ({ ...prev, status: json.status }));
    }
  }

  if (data.status === "connected") {
    return (
      <p className="text-sm">
        Conectado{data.phoneNumber ? <span className="text-muted-foreground"> ({data.phoneNumber})</span> : null}
      </p>
    );
  }

  const emAndamento = Boolean(data.status && EM_ANDAMENTO.includes(data.status));

  return (
    <div className="flex flex-col items-start gap-3">
      {data.status && <p className="text-sm text-muted-foreground">{STATUS_LABEL[data.status]}</p>}

      {qrImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrImage} alt="QR code para parear o WhatsApp" className="size-56 rounded-lg border" />
      )}

      {timedOut && <p className="text-sm text-destructive">Tempo esgotado. Tente novamente.</p>}

      {(!emAndamento || timedOut) && (
        <Button type="button" onClick={handleConnect}>
          {timedOut ? "Tentar novamente" : data.status ? "Reconectar" : "Conectar WhatsApp"}
        </Button>
      )}
    </div>
  );
}
