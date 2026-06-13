import { lookup } from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 3;

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)
  );
}

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) return isPrivateIpv6(ip);
  return true;
}

export async function assertPublicHttpUrl(rawUrl: unknown): Promise<URL> {
  if (typeof rawUrl !== "string" || rawUrl.length > 2048) {
    throw new Error("Invalid URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Invalid protocol");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URL credentials are not allowed");
  }

  const hostname = parsed.hostname.toLowerCase();
  const normalizedHostname = hostname.replace(/^\[|\]$/g, "");
  if (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname === "0.0.0.0" ||
    normalizedHostname === "::" ||
    normalizedHostname === "::1"
  ) {
    throw new Error("Fetching internal networks is prohibited");
  }

  if (net.isIP(normalizedHostname)) {
    if (isPrivateIp(normalizedHostname)) {
      throw new Error("Fetching internal networks is prohibited");
    }
    return parsed;
  }

  let addresses;
  try {
    addresses = await lookup(normalizedHostname, { all: true, verbatim: true });
  } catch {
    throw new Error("Unable to resolve URL host");
  }

  if (!addresses.length || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Fetching internal networks is prohibited");
  }

  return parsed;
}

export async function fetchPublicHttpUrl(url: URL, init: RequestInit = {}) {
  let current = url;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(current.toString(), {
      ...init,
      redirect: "manual",
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) return response;

    current = await assertPublicHttpUrl(new URL(location, current).toString());
  }

  throw new Error("Too many redirects");
}
