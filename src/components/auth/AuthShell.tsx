import { Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  titulo: string;
  descricao?: React.ReactNode;
  children: React.ReactNode;
}

/** Moldura das telas fora do app (entrar, cadastro, convite): marca + card central. */
export function AuthShell({ titulo, descricao, children }: Props) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
      {/* Brilho extra atras do card (o fundo vivo das outras telas ja vem do layout raiz). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 size-136 -translate-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="flex w-full max-w-sm animate-in flex-col items-center gap-6 fade-in-0 slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-2 text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25),0_12px_32px_-10px_color-mix(in_oklch,var(--primary)_70%,transparent)]">
            <Wallet className="size-6" />
          </span>
          <div>
            <p className="text-xl font-semibold tracking-tight">FINAC Pro</p>
            <p className="text-sm text-muted-foreground">Suas finanças da casa, direto do WhatsApp</p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-tight">{titulo}</CardTitle>
            {descricao && <CardDescription>{descricao}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
