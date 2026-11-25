import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/dal";
import { buscarNoSistema } from "@/lib/busca/server";

const TAMANHO_MAXIMO_TERMO = 80;

/** Busca global do cabecalho: GET /api/busca?q=termo */
export async function GET(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const termo = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, TAMANHO_MAXIMO_TERMO);

  try {
    return NextResponse.json(await buscarNoSistema(session.householdId, termo));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}
