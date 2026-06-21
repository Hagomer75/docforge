/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-lib, jszip and xlsx are pure-JS but heavy; keep them out of the
  // client bundle and let the Node serverless runtime require them directly.
  serverExternalPackages: ["pdf-lib", "jszip", "xlsx", "qrcode", "@pdf-lib/fontkit", "arabic-reshaper"],
  // Bundle the Amiri font files with the API routes that render PDFs.
  outputFileTracingIncludes: {
    "/api/generate": ["./lib/fonts/**"],
    "/api/preview": ["./lib/fonts/**"],
  },
};

export default nextConfig;
