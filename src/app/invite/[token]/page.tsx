import { getOptionalSession } from "@/lib/auth/dal";
import { getInviteByToken, isInviteRedeemable } from "@/lib/household/invites";
import { SignupForm } from "@/components/auth/SignupForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getOptionalSession();

  if (session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
        <Card>
          <CardHeader>
            <CardTitle>Voce ja esta em um household</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Saia da sua conta atual antes de aceitar um novo convite.
          </CardContent>
        </Card>
      </main>
    );
  }

  const invite = await getInviteByToken(token);

  if (!invite || !isInviteRedeemable(invite)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
        <Card>
          <CardHeader>
            <CardTitle>Convite invalido</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esse link de convite expirou ou ja foi utilizado. Peca um novo convite pra quem te chamou.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupForm inviteToken={invite.token} householdName={invite.household.name} />
        </CardContent>
      </Card>
    </main>
  );
}
