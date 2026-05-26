import type { NextConfig } from "next";
import { execSync } from "child_process";

let commitDate = "";
let commitHash = process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || "";

try {
  if (!commitHash) {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  }
  commitDate = execSync('git log -1 --format=%cd --date=short').toString().trim();
} catch (e) {
  commitDate = new Date().toISOString().split('T')[0];
  if (!commitHash) commitHash = "unknown";
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: `v${commitDate} (${commitHash})`,
  },
};

export default nextConfig;
