/**
 * Caminho SVG suave (Catmull-Rom -> Bezier) passando por todos os pontos --
 * a curva das mini-linhas, sem "pontas" entre um ponto e outro.
 */
export function caminhoSuave(pontos: [number, number][]): string {
  if (pontos.length === 0) return "";
  if (pontos.length === 1) return `M${pontos[0][0]},${pontos[0][1]}`;
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M${r(pontos[0][0])},${r(pontos[0][1])}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] ?? pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${r(c1x)},${r(c1y)} ${r(c2x)},${r(c2y)} ${r(p2[0])},${r(p2[1])}`;
  }
  return d;
}

/**
 * Mini-linha (sparkline) normalizada numa caixa largura x altura. Devolve a
 * linha e a area fechada embaixo dela.
 */
export function sparkline(valores: number[], largura: number, altura: number, folga = 6) {
  if (valores.length < 2) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;
  const pontos = valores.map(
    (v, i) =>
      [(i * largura) / (valores.length - 1), altura - folga - ((v - min) / faixa) * (altura - folga * 2)] as [
        number,
        number,
      ],
  );
  const linha = caminhoSuave(pontos);
  return { linha, area: `${linha} L${largura},${altura} L0,${altura} Z` };
}
