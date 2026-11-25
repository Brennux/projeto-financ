import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getCategorias } from "@/lib/categorias/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategoriasManager } from "@/components/categorias/CategoriasManager";

export default async function CategoriesSettingsPage() {
  const session = await verifySession();
  const [categorias, contagem] = await Promise.all([
    getCategorias(session.householdId),
    prisma.transaction.groupBy({
      by: ["categoria"],
      where: { householdId: session.householdId },
      _count: { _all: true },
    }),
  ]);
  const uso = Object.fromEntries(contagem.map((c) => [c.categoria, c._count._all]));

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Categorias"
        description="Crie categorias do seu jeito e ensine o bot a reconhecer cada uma pelas palavras-chave."
        backHref="/"
        backLabel="← Voltar ao dashboard"
      />

      <Card>
        <CardContent>
          <CategoriasManager categorias={categorias} uso={uso} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
