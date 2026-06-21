/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-lib, jszip and xlsx are pure-JS but heavy; keep them out of the
  // client bundle and let the Node serverless runtime require them directly.
  serverExternalPackages: ["pdf-lib", "jszip", "xlsx", "qrcode"],
};

export default nextConfig;
