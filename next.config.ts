import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: ["@distube/ytdl-core"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;