import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  basePath: "/Achievers-iSchool-Locator-Portal",
  assetPrefix: "/Achievers-iSchool-Locator-Portal/",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
