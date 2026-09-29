import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { getOrCreateSession } from "@/lib/whatsapp/session";
import type { WhatsAppStatus } from "@/lib/whatsapp/types";

const RECONNECTABLE: WhatsAppStatus[] = ["disconnected", "logged_out"];

export async function POST() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const bot = await getOrCreateSession();

  if (RECONNECTABLE.includes(bot.status as WhatsAppStatus)) {
    const updated = await prisma.whatsAppSession.update({
      where: { id: bot.id },
      data: { status: "pending", qr: null },
    });
    return NextResponse.json({ status: updated.status });
  }

  // ja esta pending/connecting/qr_ready/connected -- um duplo clique nao
  // deve resetar uma conexao em andamento.
  return NextResponse.json({ status: bot.status });
}
