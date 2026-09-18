import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stop `next dev` appending its own block to CLAUDE.md.
  agentRules: false,
  // A stray package-lock.json in the home directory confuses root detection.
  turbopack: { root: __dirname },
  // lib/data.ts reads data/ from disk at request time; make sure the JSON
  // ships with the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./data/*.json", "./data/states/*.json", "./prompts/*.md"],
  },
};

export default nextConfig;
