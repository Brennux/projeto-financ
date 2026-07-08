import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import type { WhatsAppStatus } from "@/lib/whatsapp/types";

const RECONNECTABLE: WhatsAppStatus[] = ["disconnected", "logged_out"];

export async function POST() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const existing = await prisma.whatsAppAccount.findUnique({ where: { userId: session.userId } });

  if (!existing) {
    const created = await prisma.whatsAppAccount.create({
      data: { userId: session.userId, status: "pending" },
    });
    return NextResponse.json({ status: created.status });
  }

  if (RECONNECTABLE.includes(existing.status as WhatsAppStatus)) {
    const updated = await prisma.whatsAppAccount.update({
      where: { userId: session.userId },
      data: { status: "pending", qr: null },
    });
    return NextResponse.json({ status: updated.status });
  }

  // ja esta pending/connecting/qr_ready/connected -- um duplo clique nao
  // deve resetar um pareamento em andamento.
  return NextResponse.json({ status: existing.status });
}
