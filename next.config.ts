import type { NextConfig } from "next";

// Photos de la soirée: stockage public du projet Supabase (voir src/data/party.ts).
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/party-photos/**" }]
      : [],
  },
  async redirects() {
    // L'Univers 03 a changé de nom: l'ancienne adresse reste valable.
    return [{ source: "/les-betises", destination: "/et-puis-il-y-a-laura", permanent: true }];
  },
};

export default nextConfig;
