import { describe, expect, it } from "vitest";
import { avancarUmMes, dataNoMes, hojeNoApp, proximaOcorrencia } from "../datas";

const ymd = (d: Date) => d.toISOString().slice(0, 10);

describe("datas de recorrencia", () => {
  it("limita o dia ao fim do mes (31 em fevereiro)", () => {
    expect(ymd(dataNoMes(2026, 1, 31))).toBe("2026-02-28");
    expect(ymd(dataNoMes(2028, 1, 31))).toBe("2028-02-29");
  });

  it("proxima ocorrencia no mesmo mes quando o dia ainda nao passou", () => {
    expect(ymd(proximaOcorrencia(25, new Date("2026-11-22T00:00:00Z")))).toBe("2026-11-25");
  });

  it("proxima ocorrencia hoje quando o dia e hoje", () => {
    expect(ymd(proximaOcorrencia(22, new Date("2026-11-22T00:00:00Z")))).toBe("2026-11-22");
  });

  it("proxima ocorrencia no mes seguinte quando o dia ja passou (virando o ano)", () => {
    expect(ymd(proximaOcorrencia(5, new Date("2026-12-22T00:00:00Z")))).toBe("2027-01-05");
  });

  it("avanca um mes mantendo o dia original depois de um mes curto", () => {
    const fev = dataNoMes(2026, 1, 31);
    expect(ymd(avancarUmMes(fev, 31))).toBe("2026-03-31");
  });

  it("hoje no fuso do Brasil (23h de Brasilia ainda e o mesmo dia)", () => {
    // 02:00 UTC do dia 23 = 23:00 do dia 22 em Brasilia
    expect(ymd(hojeNoApp(new Date("2026-11-23T02:00:00Z")))).toBe("2026-11-22");
  });
});
