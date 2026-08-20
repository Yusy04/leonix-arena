import type { NextConfig } from "next";

// GitHub Pages build: `GITHUB_PAGES=true npm run build` produces a static
// export under ./out with the repo basePath. Local dev/build/start are
// unaffected (this branch is only taken in CI / when the flag is set).
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "leonix-arena";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
      basePath: `/${repo}`,
      env: { NEXT_PUBLIC_BASE_PATH: `/${repo}` },
    }
  : {};

export default nextConfig;
