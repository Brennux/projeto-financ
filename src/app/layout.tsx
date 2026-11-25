import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { FundoAmbiente } from "@/components/efeitos/FundoAmbiente";
import { LuzNosCards } from "@/components/efeitos/LuzNosCards";
import { SCRIPT_PALETA } from "@/lib/paletas";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "FINAC Pro",
  description: "Controle de gastos e receitas via WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {/* Aplica a paleta salva antes da primeira pintura (sem piscar a padrao). */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_PALETA }} />
      </head>
      <body>
        <FundoAmbiente />
        <LuzNosCards />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
