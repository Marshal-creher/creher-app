// The HRM server runs on the owner's Mac and is reached through a tunnel whose
// address changes whenever the tunnel restarts. The Mac calls this function to
// announce the current address; the `hrm-proxy` edge function reads it.
//   POST /.netlify/functions/hrm-register   { "url": "https://….trycloudflare.com" }
// Needs "Authorization: Bearer <HRM_GATEWAY_SECRET>".
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

// Only addresses of Cloudflare quick tunnels are accepted, so that even with the
// secret this cannot be used to point the site's /api at some other server.
const TUNNEL_PATTERN = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const digest = (value) => createHash("sha256").update(value).digest();

const authorized = (req) => {
  const expected = process.env.HRM_GATEWAY_SECRET || "";
  const header = req.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (expected.length < 32 || !given) return false;
  // Hashing first gives both buffers the same length, as timingSafeEqual requires.
  return timingSafeEqual(digest(expected), digest(given));
};

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!authorized(req)) return json(401, { error: "unauthorized" });

  let url;
  try {
    ({ url } = await req.json());
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (typeof url !== "string" || !TUNNEL_PATTERN.test(url)) return json(400, { error: "bad_url" });

  await getStore("hrm").setJSON("tunnel", { url, updated_at: new Date().toISOString() });
  return json(200, { ok: true });
};
