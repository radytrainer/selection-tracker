import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin pulls in jwks-rsa -> jose, whose ESM build breaks when
  // webpack bundles it into the serverless function (ERR_REQUIRE_ESM on
  // Vercel). Keeping it external lets Node's own require resolve it at
  // runtime instead.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
