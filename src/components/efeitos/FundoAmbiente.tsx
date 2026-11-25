/**
 * Fundo vivo atras de todas as telas: duas luzes difusas na cor da paleta
 * que derivam devagar + granulado fino. Visual todo no CSS (.fundo-ambiente).
 */
export function FundoAmbiente() {
  return (
    <div className="fundo-ambiente" aria-hidden>
      <div className="fundo-ambiente__luz fundo-ambiente__luz--a" />
      <div className="fundo-ambiente__luz fundo-ambiente__luz--b" />
    </div>
  );
}
