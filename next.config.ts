import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // L'Univers 03 a changé de nom: l'ancienne adresse reste valable.
    return [{ source: "/les-betises", destination: "/et-puis-il-y-a-laura", permanent: true }];
  },
};

export default nextConfig;
