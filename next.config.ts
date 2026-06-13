import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverExternalPackages: ["leaflet", "@turf/turf", "rbush", "leaflet-geosearch"],
  },
};

export default nextConfig;

