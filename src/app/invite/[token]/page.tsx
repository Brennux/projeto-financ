import { getOptionalSession } from "@/lib/auth/dal";
import { getInviteByToken, isInviteRedeemable } from "@/lib/household/invites";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getOptionalSession();

  if (session) {
    return (
      <AuthShell titulo="Você já está em uma casa">
        <p className="text-sm text-muted-foreground">Saia da sua conta atual antes de aceitar um novo convite.</p>
      </AuthShell>
    );
  }

  const invite = await getInviteByToken(token);

  if (!invite || !isInviteRedeemable(invite)) {
    return (
      <AuthShell titulo="Convite inválido">
        <p className="text-sm text-muted-foreground">
          Esse link de convite expirou ou já foi utilizado. Peça um novo convite pra quem te chamou.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell titulo="Criar conta" descricao={`Você foi convidado pra casa ${invite.household.name}.`}>
      <SignupForm inviteToken={invite.token} householdName={invite.household.name} />
    </AuthShell>
  );
}
