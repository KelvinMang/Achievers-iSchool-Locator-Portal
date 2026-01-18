// achievers-ischool-locator/next.config.ts
import type { NextConfig } from "next";

const repo = "Achievers-iSchool-Locator-Portal";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },

  // IMPORTANT for GitHub Pages routes like /schools/
  trailingSlash: true,

  // Keep basePath OFF if you want to use BASE_PATH in code everywhere
  // basePath: `/${repo}`,        // <-- DO NOT enable if you hardcode BASE_PATH
  // assetPrefix: `/${repo}/`,    // <-- DO NOT enable if you hardcode BASE_PATH
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

