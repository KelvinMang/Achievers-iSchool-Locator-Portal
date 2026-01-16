import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "Achievers-iSchool-Locator-Portal";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },

  ...(isProd
    ? {
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
      }
    : {}),
};

export default nextConfig;

// import type { NextConfig } from "next";

// // For GitHub Pages: use repository name as basePath
// // For user/org pages (serves from root), set this to empty string or remove basePath
// const basePath = process.env.BASE_PATH || "/Achievers-iSchool-Locator-Portal";

// const nextConfig: NextConfig = {
//   output: "export",
//   basePath: basePath,
//   trailingSlash: true,
//   images: {
//     unoptimized: true,
//   },
// };

// export default nextConfig;
