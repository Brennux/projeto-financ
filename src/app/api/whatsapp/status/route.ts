import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const account = await prisma.whatsAppAccount.findUnique({
    where: { userId: session.userId },
    select: { status: true, qr: true, phoneNumber: true },
  });

  return NextResponse.json({
    status: account?.status ?? null,
    qr: account?.qr ?? null,
    phoneNumber: account?.phoneNumber ?? null,
  });
}
