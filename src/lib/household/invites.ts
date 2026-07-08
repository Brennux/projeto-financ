import prisma from "@/lib/prisma";

interface InviteRedeemabilityInput {
  expiraEm: Date;
  usadoEm: Date | null;
}

export function isInviteRedeemable(invite: InviteRedeemabilityInput, now: Date = new Date()): boolean {
  return invite.usadoEm === null && invite.expiraEm > now;
}

export async function getInviteByToken(token: string) {
  return prisma.householdInvite.findUnique({
    where: { token },
    include: { household: { select: { name: true } } },
  });
}
