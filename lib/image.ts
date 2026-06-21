// Fetch a remote image (student photo) into a data URL for embedding.
// Hardened against SSRF: only http/https, the resolved host must be a public
// IP, redirects are rejected, and the response must be a small PNG/JPEG
// (the only formats pdf-lib can embed).
import dns from "dns/promises";
import { isIP } from "net";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const TIMEOUT_MS = 6000;

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local (cloud metadata)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique-local
  if (v.startsWith("fe80")) return true; // link-local
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7)); // IPv4-mapped
  return false;
}

export async function fetchImageDataUrl(rawUrl: string): Promise<string | undefined> {
  const url = (rawUrl ?? "").trim();
  if (!url) return undefined;

  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return undefined;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;

  // Resolve the host and refuse private / loopback / metadata addresses.
  try {
    const { address } = await dns.lookup(u.hostname);
    if (isPrivateIp(address)) return undefined;
  } catch {
    return undefined;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // Follow redirects manually so every hop's resolved IP is re-validated
    // (a public URL must not be able to bounce us onto an internal address).
    let current = u;
    for (let hop = 0; hop <= 3; hop++) {
      const { address } = await dns.lookup(current.hostname);
      if (isPrivateIp(address)) return undefined;

      const res = await fetch(current.toString(), {
        signal: ctrl.signal,
        redirect: "manual",
      });

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return undefined;
        const next = new URL(loc, current);
        if (next.protocol !== "https:" && next.protocol !== "http:") return undefined;
        current = next;
        continue;
      }
      if (!res.ok) return undefined;

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const isPng = ct.startsWith("image/png");
      const isJpg = ct.startsWith("image/jpeg") || ct.startsWith("image/jpg");
      if (!isPng && !isJpg) return undefined;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0 || buf.length > MAX_BYTES) return undefined;
      const mime = isPng ? "image/png" : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    }
    return undefined; // too many redirects
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
