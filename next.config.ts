import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["leaflet", "@turf/turf", "rbush", "leaflet-geosearch"],
  },
};

export default nextConfig;

