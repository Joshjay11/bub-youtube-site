import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The writer routes load .md prompt sources at runtime via fs.readFileSync
  // in src/lib/prompts/compose-writer-system-prompt.ts. Next.js's static
  // tracer can't follow dynamic path strings, so we explicitly include the
  // prompts directory in the serverless bundle for every API route under
  // /api/ai/**. Keep this glob in sync with that module's read paths.
  outputFileTracingIncludes: {
    '/api/ai/**': ['./src/lib/prompts/**/*'],
  },
};

export default nextConfig;
