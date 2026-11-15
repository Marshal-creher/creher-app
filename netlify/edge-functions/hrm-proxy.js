// Forwards the HRM's API calls (/api/*, /uploads/*) from creher.com to the HRM
// server, which runs on the owner's Mac behind a tunnel. The tunnel's current
// address is announced by the Mac through the `hrm-register` function.
//
// The server only accepts tunnel traffic that carries HRM_GATEWAY_SECRET, so the
// tunnel address is useless to anyone who finds it: requests must come from here.
import { getStore } from "@netlify/blobs";

const TUNNEL_PATTERN = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;
const ADDRESS_TTL_MS = 30_000;
const REQUEST_HEADERS = ["authorization", "content-type", "accept", "accept-language", "range"];
const RESPONSE_HEADERS = ["content-type", "content-disposition", "content-range", "accept-ranges"];
// What Cloudflare answers when the tunnel is closed (Mac off or asleep).
const TUNNEL_DOWN = [502, 503, 530];

let address = { url: null, readAt: 0 };

const currentAddress = async () => {
  if (address.url && Date.now() - address.readAt < ADDRESS_TTL_MS) return address.url;
  const entry = await getStore("hrm").get("tunnel", { type: "json" });
  const url = entry && TUNNEL_PATTERN.test(entry.url) ? entry.url : null;
  address = { url, readAt: Date.now() };
  return url;
};

// Same shape as the HRM server's own errors, so the login page shows the message.
const offline = () =>
  new Response(
    JSON.stringify({
      error: "Le serveur CREHER HRM est hors ligne : le Mac qui l'héberge est éteint ou en veille.",
      data: null,
    }),
    {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    }
  );

export default async (request, context) => {
  const base = await currentAddress();
  if (!base) return offline();

  const { pathname, search } = new URL(request.url);
  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-hrm-gateway", Netlify.env.get("HRM_GATEWAY_SECRET") ?? "");
  // Lets the server limit login attempts per visitor instead of per proxy.
  headers.set("x-hrm-client-ip", context.ip);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream;
  try {
    upstream = await fetch(`${base}${pathname}${search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    address.readAt = 0; // the address may have just changed: read it again next time
    return offline();
  }

  if (TUNNEL_DOWN.includes(upstream.status) && !upstream.headers.get("content-type")?.includes("json")) {
    address.readAt = 0;
    return offline();
  }

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};

export const config = { path: ["/api/*", "/uploads/*"] };
