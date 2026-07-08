import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppConnectPanel } from "@/components/settings/WhatsAppConnectPanel";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { verifySession } from "@/lib/auth/dal";

export default async function WhatsAppSettingsPage() {
  await verifySession();

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader title="WhatsApp" backHref="/" backLabel="← Voltar ao dashboard" />

      <Card>
        <CardHeader>
          <CardTitle>Conectar seu WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Pareie seu proprio WhatsApp (como o WhatsApp Web) pra registrar gastos mandando mensagem pra voce mesmo,
            no chat &quot;Mensagens para voce mesmo&quot;.
          </p>
          <WhatsAppConnectPanel />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
