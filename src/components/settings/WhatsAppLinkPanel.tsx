"use client";

import { useEffect, useState } from "react";
import { generateMyLinkCode, getMyLinkStatus, type MyLinkStatus } from "@/app/actions/whatsapp";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;

export function WhatsAppLinkPanel({ initialStatus }: { initialStatus: MyLinkStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [code, setCode] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleGenerate() {
    setPending(true);
    setTimedOut(false);
    try {
      const result = await generateMyLinkCode();
      setCode(result.code);
      setExpiraEm(result.expiraEm);
    } finally {
      setPending(false);
    }
  }

  // Enquanto tiver um codigo pendente, faz polling pra saber quando o
  // usuario mandou o codigo pelo WhatsApp e o vinculo foi confirmado.
  useEffect(() => {
    if (!code || status.linked) return;

    let ignore = false;
    const interval = setInterval(async () => {
      if (expiraEm && Date.now() > new Date(expiraEm).getTime()) {
        if (!ignore) setTimedOut(true);
        clearInterval(interval);
        return;
      }
      const json = await getMyLinkStatus();
      if (!ignore && json.linked) setStatus(json);
    }, POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [code, expiraEm, status.linked]);

  if (status.linked) {
    return (
      <p className="text-sm">
        Vinculado ao número <span className="text-muted-foreground">{status.telefone ?? "desconhecido"}</span>
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {code && !timedOut && (
        <>
          <p className="text-sm text-muted-foreground">Mande este código pelo WhatsApp pro número do bot:</p>
          <p className="text-3xl font-mono tracking-widest">{code}</p>
          <p className="text-xs text-muted-foreground">Expira em 10 minutos.</p>
        </>
      )}

      {timedOut && <p className="text-sm text-destructive">Código expirado. Gere um novo.</p>}

      {(!code || timedOut) && (
        <Button type="button" onClick={handleGenerate} disabled={pending}>
          {pending ? "Gerando..." : timedOut ? "Gerar novo código" : "Gerar código de vinculação"}
        </Button>
      )}
    </div>
  );
}
