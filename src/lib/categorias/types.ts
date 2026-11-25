import type { Tipo } from "@/lib/parser/types";

/** Categoria como o app usa (serializavel -- vai do servidor pro cliente via props). */
export interface CategoriaInfo {
  id: string;
  nome: string;
  tipos: Tipo[];
  /** Chave de CORES_CATEGORIA. */
  cor: string;
  /** Chave de ICONES_CATEGORIA. */
  icone: string;
  palavrasChave: string[];
  sistema: boolean;
}
