// achievers-ischool-locator/next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "Achievers-iSchool-Locator-Portal";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isProd ? `/${repo}` : "",
};

export default nextConfig;


// import type { NextConfig } from "next";

// const isProd = process.env.NODE_ENV === "production";
// const repo = "Achievers-iSchool-Locator-Portal";

// const nextConfig: NextConfig = {
//   output: "export",
//   images: { unoptimized: true },

//   ...(isProd
//     ? {
//         basePath: `/${repo}`,
//         assetPrefix: `/${repo}/`,
//       }
//     : {}),
// };

// export default nextConfig;

