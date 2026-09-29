import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppConnectPanel } from "@/components/settings/WhatsAppConnectPanel";
import { WhatsAppLinkPanel } from "@/components/settings/WhatsAppLinkPanel";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { verifySession } from "@/lib/auth/dal";
import { getMyLinkStatus } from "@/app/actions/whatsapp";

const DISPLAY_NUMBER = process.env.WHATSAPP_DISPLAY_NUMBER ?? "(número não configurado)";

export default async function WhatsAppSettingsPage() {
  await verifySession();
  const linkStatus = await getMyLinkStatus();

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader title="WhatsApp" backHref="/" backLabel="← Voltar ao dashboard" />

      <Card>
        <CardHeader>
          <CardTitle>Bot do WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Manda os gastos pro número de WhatsApp: {DISPLAY_NUMBER}.
          </p>
          <WhatsAppConnectPanel />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vincular meu número</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Pra eu saber que os gastos que você manda são seus, gere um código aqui e mande pelo WhatsApp pro número{" "}
            {DISPLAY_NUMBER}.
          </p>
          <WhatsAppLinkPanel initialStatus={linkStatus} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
