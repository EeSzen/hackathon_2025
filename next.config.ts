import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable to prevent Leaflet "already initialized" error in dev
};

export default nextConfig;
