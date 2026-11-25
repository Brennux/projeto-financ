/**
 * Paletas de cor do app. As cores em si ficam no CSS (globals.css,
 * :root[data-paleta="..."]); aqui so o que a interface precisa pra listar e
 * mostrar a amostra de cada uma. A escolha e por aparelho (localStorage) e
 * aplicada em <html data-paleta> antes da primeira pintura -- ver
 * SCRIPT_PALETA.
 */
export const PALETAS = [
  { id: "lavanda", nome: "Lavanda", descricao: "Lilás, a identidade original", fundo: "#0b0a12", destaque: "#b8a7ff" },
  { id: "champanhe", nome: "Champanhe", descricao: "Grafite com dourado suave", fundo: "#0d0d0e", destaque: "#e0c48f" },
  { id: "oceano", nome: "Oceano", descricao: "Azul-marinho e azul-céu", fundo: "#070e1b", destaque: "#7ec8ff" },
  { id: "salvia", nome: "Sálvia", descricao: "Verde-acinzentado e areia", fundo: "#0b0f0d", destaque: "#b4d6bd" },
] as const;

export type PaletaId = (typeof PALETAS)[number]["id"];

export const PALETA_PADRAO: PaletaId = "lavanda";
export const CHAVE_PALETA = "paleta";
export const EVENTO_PALETA = "paleta-mudou";

/**
 * Roda no <head>, antes do React: aplica a paleta salva sem "piscar" a
 * padrao primeiro. try/catch: localStorage pode estar bloqueado.
 */
export const SCRIPT_PALETA = `(function(){try{var p=localStorage.getItem("${CHAVE_PALETA}");if(p&&p!=="${PALETA_PADRAO}")document.documentElement.dataset.paleta=p;}catch(e){}})();`;

export function aplicarPaleta(id: PaletaId): void {
  const raiz = document.documentElement;
  if (id === PALETA_PADRAO) delete raiz.dataset.paleta;
  else raiz.dataset.paleta = id;
  try {
    localStorage.setItem(CHAVE_PALETA, id);
  } catch {
    // Sem localStorage (aba anonima, bloqueio): vale so ate recarregar.
  }
  window.dispatchEvent(new Event(EVENTO_PALETA));
}

export function paletaAtual(): PaletaId {
  const id = document.documentElement.dataset.paleta;
  return PALETAS.some((p) => p.id === id) ? (id as PaletaId) : PALETA_PADRAO;
}
