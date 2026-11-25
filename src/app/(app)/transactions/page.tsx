import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { MesFiltro } from "@/components/transactions/MesFiltro";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { verifySession } from "@/lib/auth/dal";
import { getTransacoesRecentes } from "@/lib/queries/transactions";
import { materializarRecorrencias } from "@/lib/recorrencias/server";

/** Sem filtro de mes, mostra as mais recentes ate esse limite. */
const LIMITE_SEM_MES = 500;
const LIMITE_COM_MES = 5000;
const MESES_NO_FILTRO = 12;

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function rotuloMes(data: Date): string {
  return capitalizar(format(data, "MMMM 'de' yyyy", { locale: ptBR }));
}

function lerMes(mes?: string): Date | null {
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return null;
  const data = new Date(`${mes}-01T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

interface Props {
  /**
   * q: busca (sem acento, valor, data, pessoa); mes: yyyy-MM; pessoa e
   * categoria: filtros ja aplicados ao abrir (vindos da busca global);
   * nova=1: abre o formulario de nova transacao.
   */
  searchParams: Promise<{ q?: string; mes?: string; pessoa?: string; categoria?: string; nova?: string }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const { q, mes, pessoa, categoria, nova } = await searchParams;
  const session = await verifySession();
  const dataMes = lerMes(mes);

  await materializarRecorrencias(session.householdId);
  const [transacoes, membros] = await Promise.all([
    getTransacoesRecentes(
      session.householdId,
      dataMes ? LIMITE_COM_MES : LIMITE_SEM_MES,
      dataMes ?? undefined,
      q,
    ),
    prisma.user.findMany({
      where: { householdId: session.householdId },
      select: { id: true, nome: true },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  const hoje = new Date();
  const opcoesMes = Array.from({ length: MESES_NO_FILTRO }, (_, i) => {
    const data = subMonths(hoje, i);
    return { valor: format(data, "yyyy-MM"), rotulo: rotuloMes(data) };
  });
  // Mes antigo vindo da URL (ex.: link do dashboard) tambem aparece na lista.
  if (dataMes && !opcoesMes.some((o) => o.valor === mes)) {
    opcoesMes.push({ valor: format(dataMes, "yyyy-MM"), rotulo: rotuloMes(dataMes) });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Transações"
        backHref="/"
        backLabel="← Voltar ao dashboard"
        description={
          q ? (
            <>
              Resultados para <span className="font-medium text-foreground">&quot;{q}&quot;</span> ·{" "}
              <Link href="/transactions" className="hover:underline">
                limpar busca
              </Link>
            </>
          ) : !dataMes && transacoes.length >= LIMITE_SEM_MES ? (
            `Mostrando as ${LIMITE_SEM_MES} mais recentes. Escolha um mês para ver todas as transações dele.`
          ) : undefined
        }
        actions={
          <>
            <Suspense>
              <MesFiltro mes={dataMes ? format(dataMes, "yyyy-MM") : null} opcoes={opcoesMes} />
            </Suspense>
            <TransactionFormDialog
              // key: vindo da busca ("Nova transação") com a pagina ja aberta, remonta e abre.
              key={nova === "1" ? "nova" : "padrao"}
              abertoInicial={nova === "1"}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Nova transação
                </Button>
              }
            />
          </>
        }
      />

      <Card>
        <CardContent>
          <TransactionsTable
            // key: filtros vindos da URL (busca global) reiniciam os filtros da tabela.
            key={`${pessoa ?? ""}|${categoria ?? ""}`}
            transacoes={transacoes}
            membros={membros}
            pessoaInicial={pessoa}
            categoriaInicial={categoria}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
