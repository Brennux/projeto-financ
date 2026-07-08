"use server";

import { addDays } from "date-fns";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export async function createInvite(): Promise<{ token: string }> {
  const session = await verifySession();

  const invite = await prisma.householdInvite.create({
    data: {
      householdId: session.householdId,
      criadoPorId: session.userId,
      expiraEm: addDays(new Date(), 7),
    },
  });

  return { token: invite.token };
}
