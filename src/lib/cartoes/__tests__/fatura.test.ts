import { describe, expect, it } from "vitest";
import {
  dividirEmParcelas,
  gerarParcelas,
  mesDaFatura,
  periodoDaFatura,
  statusDaFatura,
  vencimentoDaFatura,
} from "../fatura";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const ymd = (data: Date) => data.toISOString().slice(0, 10);

// Fecha dia 3, vence dia 10 (vencimento no mesmo mes do fechamento).
const NUBANK = { diaFechamento: 3, diaVencimento: 10 };
// Fecha dia 25, vence dia 5 (vencimento no mes seguinte ao fechamento).
const ITAU = { diaFechamento: 25, diaVencimento: 5 };

describe("mesDaFatura", () => {
  it("compra antes do fechamento cai na fatura deste mes", () => {
    expect(ymd(mesDaFatura(d("2026-11-02"), NUBANK))).toBe("2026-11-01");
  });

  it("compra no dia do fechamento ja vai pra proxima fatura", () => {
    expect(ymd(mesDaFatura(d("2026-11-03"), NUBANK))).toBe("2026-12-01");
    expect(ymd(mesDaFatura(d("2026-11-20"), NUBANK))).toBe("2026-12-01");
  });

  it("vencimento no mes seguinte ao fechamento", () => {
    // Fecha 25/11, vence 5/12.
    expect(ymd(mesDaFatura(d("2026-11-20"), ITAU))).toBe("2026-12-01");
    // Depois do fechamento de 25/11: fecha 25/12, vence 5/1.
    expect(ymd(mesDaFatura(d("2026-11-26"), ITAU))).toBe("2027-01-01");
  });

  it("vira o ano", () => {
    expect(ymd(mesDaFatura(d("2026-12-15"), NUBANK))).toBe("2027-01-01");
  });

  it("fechamento no dia 31 em fevereiro usa o ultimo dia do mes", () => {
    const cartao = { diaFechamento: 31, diaVencimento: 10 };
    expect(ymd(mesDaFatura(d("2027-02-27"), cartao))).toBe("2027-03-01");
    expect(ymd(mesDaFatura(d("2027-02-28"), cartao))).toBe("2027-04-01");
  });
});

describe("periodoDaFatura", () => {
  it("vai do fechamento anterior ate a vespera do fechamento", () => {
    const p = periodoDaFatura(d("2026-12-01"), NUBANK);
    expect(ymd(p.inicio)).toBe("2026-11-03");
    expect(ymd(p.fim)).toBe("2026-12-02");
    expect(ymd(p.fechamento)).toBe("2026-12-03");
    expect(ymd(p.vencimento)).toBe("2026-12-10");
  });
});

describe("dividirEmParcelas", () => {
  it("divisao exata", () => {
    expect(dividirEmParcelas(1200, 10)).toEqual(Array(10).fill(120));
  });

  it("sobra de centavos vai pra 1a parcela e o total fecha", () => {
    const parcelas = dividirEmParcelas(100, 3);
    expect(parcelas).toEqual([33.34, 33.33, 33.33]);
    expect(Math.round(parcelas.reduce((a, b) => a + b, 0) * 100)).toBe(10000);
  });
});

describe("gerarParcelas", () => {
  it("no cartao: uma parcela por fatura, na data de vencimento", () => {
    const parcelas = gerarParcelas(1200, 3, d("2026-11-20"), NUBANK);
    expect(parcelas.map((p) => ymd(p.data))).toEqual(["2026-12-10", "2027-01-10", "2027-02-10"]);
    expect(parcelas.map((p) => p.numero)).toEqual([1, 2, 3]);
  });

  it("sem cartao: mesmo dia, um mes depois do outro", () => {
    const parcelas = gerarParcelas(300, 3, d("2026-01-31"), null);
    expect(parcelas.map((p) => ymd(p.data))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
  });

  it("compra a vista no cartao: uma parcela, no vencimento", () => {
    const [unica] = gerarParcelas(58.9, 1, d("2026-11-02"), NUBANK);
    expect(ymd(unica.data)).toBe("2026-11-10");
    expect(unica.valor).toBe(58.9);
  });
});

describe("statusDaFatura", () => {
  const mes = d("2026-12-01");
  it("aberta, fechada, vencida e paga", () => {
    expect(statusDaFatura(mes, NUBANK, false, d("2026-11-25"))).toBe("aberta");
    expect(statusDaFatura(mes, NUBANK, false, d("2026-12-05"))).toBe("fechada");
    expect(statusDaFatura(mes, NUBANK, false, d("2026-12-10"))).toBe("fechada");
    expect(statusDaFatura(mes, NUBANK, false, d("2026-12-11"))).toBe("vencida");
    expect(statusDaFatura(mes, NUBANK, true, d("2026-12-11"))).toBe("paga");
  });

  it("vencimento da fatura", () => {
    expect(ymd(vencimentoDaFatura(mes, ITAU))).toBe("2026-12-05");
  });
});
