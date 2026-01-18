// achievers-ischool-locator/next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "Achievers-iSchool-Locator-Portal";

export default {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  images: {
    unoptimized: true,
  },
};

// const isProd = process.env.NODE_ENV === "production";
// const repo = "Achievers-iSchool-Locator-Portal";

// const nextConfig = {
//   output: "export",
//   trailingSlash: true,
//   basePath: isProd ? `/${repo}` : "",
//   assetPrefix: isProd ? `/${repo}/` : "",
//   images: { unoptimized: true },
// };

// export default nextConfig;

