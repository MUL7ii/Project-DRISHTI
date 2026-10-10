import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    silenceDeprecations: ["legacy-js-api", "import", "global-builtin", "mixed-decls", "if-function"],
    quietDeps: true,
  },
};

export default nextConfig;
