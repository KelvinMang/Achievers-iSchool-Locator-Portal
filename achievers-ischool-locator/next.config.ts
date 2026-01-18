// achievers-ischool-locator/next.config.ts
import type { NextConfig } from "next";

const repo = "Achievers-iSchool-Locator-Portal";
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },

  // GitHub Pages subpath
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",

  // Important for Pages routing (creates /schools/index.html)
  trailingSlash: true,
};

export default nextConfig;

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

