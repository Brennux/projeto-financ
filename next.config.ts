import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Reaproveita por 30s paginas dinamicas ja visitadas no cache do
    // navegador -- ir e voltar entre rotas fica instantaneo. Mutacoes ja
    // chamam router.refresh(), que limpa esse cache.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
