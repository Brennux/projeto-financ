import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/dal";
import { getOrCreateSession } from "@/lib/whatsapp/session";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const bot = await getOrCreateSession();

  return NextResponse.json({
    status: bot.status,
    qr: bot.qr,
    phoneNumber: bot.phoneNumber,
  });
}
