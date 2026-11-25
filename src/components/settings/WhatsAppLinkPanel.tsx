"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toDataURL } from "qrcode";
import { toast } from "sonner";
import {
  generateMyLinkCode,
  getMyLinkStatus,
  unlinkMyWhatsApp,
  type MyLinkStatus,
} from "@/app/actions/whatsapp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";

const POLL_INTERVAL_MS = 2000;

/**
 * Link "clique pra conversar" do WhatsApp: abre a conversa com o bot ja com
 * o codigo digitado, so falta tocar em enviar. O texto precisa ser SO o
 * codigo -- o bot compara a mensagem inteira com o codigo pendente.
 */
function linkWhatsApp(botNumber: string, code: string): string {
  return `https://wa.me/${botNumber}?text=${encodeURIComponent(code)}`;
}

interface Props {
  initialStatus: MyLinkStatus;
  /** Numero do bot so com digitos (DDI+DDD+numero), ou null se nao configurado. */
  botNumber: string | null;
}

export function WhatsAppLinkPanel({ initialStatus, botNumber }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [code, setCode] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [expiraEm, setExpiraEm] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleGenerate() {
    setPending(true);
    setTimedOut(false);
    try {
      const result = await generateMyLinkCode();
      setQrImage(
        botNumber ? await toDataURL(linkWhatsApp(botNumber, result.code), { width: 320, margin: 2 }) : null,
      );
      setCode(result.code);
      setExpiraEm(result.expiraEm);
    } catch {
      toast.error("Não foi possível gerar o código.");
    } finally {
      setPending(false);
    }
  }

  async function handleUnlink() {
    setPending(true);
    try {
      setStatus(await unlinkMyWhatsApp());
      setCode(null);
      setExpiraEm(null);
      setTimedOut(false);
      toast.success("Número desvinculado.");
    } catch {
      toast.error("Não foi possível desvincular o número.");
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Vinculado ao número <span className="text-muted-foreground">{status.telefone ?? "desconhecido"}</span>
        </p>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button type="button" variant="outline" size="sm" disabled={pending}>
                Desvincular
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular este número?</AlertDialogTitle>
              <AlertDialogDescription>
                As mensagens enviadas de {status.telefone ?? "este número"} deixam de virar lançamentos. Os
                lançamentos já feitos continuam. Você pode vincular de novo (este ou outro número) gerando um
                novo código.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={pending} onClick={handleUnlink}>
                Desvincular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {code && !timedOut && (
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          {qrImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImage}
              alt="QR code que abre o WhatsApp com o código de vinculação"
              className="size-44 shrink-0 rounded-lg border bg-white [image-rendering:pixelated]"
            />
          )}
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-muted-foreground">
              {qrImage
                ? "Aponte a câmera do celular pro QR code: o WhatsApp abre com o código já digitado, é só enviar. Ou mande o código manualmente:"
                : "Mande este código pelo WhatsApp pro número do bot:"}
            </p>
            <p className="font-mono text-3xl tracking-widest">{code}</p>
            {botNumber && (
              <a
                href={linkWhatsApp(botNumber, code)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <MessageCircle className="size-4" />
                Abrir no WhatsApp
              </a>
            )}
            <p className="text-xs text-muted-foreground">Expira em 10 minutos.</p>
          </div>
        </div>
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
