import type { NextConfig } from "next";

// Aplicatia e aproape integral autentificata si dinamica (sesiune, baza de date),
// asa ca NU folosim "cacheComponents" / "partialPrefetching" (ar impune <Suspense>
// in jurul fiecarui acces la sesiune). Randarea ramane dinamica, clasica.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
