// Private endpoint used by the owner's Mac to collect what `submit` stored.
//   GET /.netlify/functions/inbox              -> { ids: [...] }
//   GET /.netlify/functions/inbox?id=ID        -> the stored entry (JSON)
//   GET /.netlify/functions/inbox?id=ID&file=1 -> the CV bytes
// Every request needs "Authorization: Bearer <CREHER_INBOX_TOKEN>".
import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const ID_PATTERN = /^\d{8}T\d{6}Z-[0-9a-f]{8}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const digest = (value) => createHash("sha256").update(value).digest();

const authorized = (req) => {
  const expected = process.env.CREHER_INBOX_TOKEN || "";
  const header = req.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (expected.length < 32 || !given) return false;
  // Hashing first gives both buffers the same length, as timingSafeEqual requires.
  return timingSafeEqual(digest(expected), digest(given));
};

export default async (req) => {
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });
  if (!authorized(req)) return json(401, { error: "unauthorized" });

  const store = getStore({ name: "submissions", consistency: "strong" });
  const params = new URL(req.url).searchParams;
  const id = params.get("id");

  if (!id) {
    const { blobs } = await store.list({ prefix: "entry/" });
    return json(200, { ids: blobs.map((blob) => blob.key.slice("entry/".length)).sort() });
  }
  if (!ID_PATTERN.test(id)) return json(400, { error: "bad_id" });

  if (params.get("file") === "1") {
    const bytes = await store.get(`file/${id}`, { type: "arrayBuffer" });
    if (!bytes) return json(404, { error: "not_found" });
    return new Response(bytes, {
      headers: { "content-type": "application/octet-stream", "cache-control": "no-store" },
    });
  }

  const entry = await store.get(`entry/${id}`, { type: "json" });
  if (!entry) return json(404, { error: "not_found" });
  return json(200, entry);
};
