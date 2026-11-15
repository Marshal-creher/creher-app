// Receives the public site's forms (candidate applications with a CV, recruiter
// requests) and keeps them in Netlify Blobs until the owner's Mac collects them
// through the token-protected `inbox` function.
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

// Netlify buffers request bodies up to 6 MB, which is about 4.5 MB once a binary
// upload has been base64-encoded, so the CV limit has to stay below that.
const MAX_CV_BYTES = 4 * 1024 * 1024;
const CV_EXTENSIONS = ["pdf", "doc", "docx"];
const MIN_FILL_MS = 2000;
const SERVICES = [
  "admin-outsourcing",
  "mediation",
  "labor-law",
  "compliance",
  "hr-digital",
  "security-audit",
  "accident-delegation",
  "safety-training",
  "social-compliance",
  "recruitment",
  "other",
];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const reject = (error, status = 400) => json(status, { ok: false, error });

const clean = (value, max, multiline = false) => {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  const printable = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  return (multiline ? printable : printable.replace(/\s+/g, " ")).trim().slice(0, max);
};

const field = (form, name, max, multiline = false) => clean(form.get(name), max, multiline);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Browsers always send Origin on a cross-site POST, so this stops other websites
// from submitting through their visitors. Non-browser clients send no Origin.
const sameOrigin = (req) => {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
};

const hasCvSignature = (ext, bytes) => {
  const head = Buffer.from(bytes.subarray(0, 1024));
  if (ext === "pdf") return head.includes("%PDF");
  if (ext === "docx") return head[0] === 0x50 && head[1] === 0x4b; // ZIP container
  // Legacy Word files are OLE2 documents; some ".doc" files are really RTF.
  return (
    (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) ||
    head.subarray(0, 5).toString("latin1") === "{\\rtf"
  );
};

const buildCandidate = async (form) => {
  const fields = {
    prenom: field(form, "prenom", 80),
    nom: field(form, "nom", 80),
    email: field(form, "email", 200),
    telephone: field(form, "telephone", 40),
    desired_position: field(form, "desired_position", 150),
    open_to_remote: field(form, "open_to_remote", 5) === "yes",
    open_to_relocation: field(form, "open_to_relocation", 5) === "yes",
    cv_review: field(form, "cv_review", 5) === "yes",
  };
  if (!fields.prenom || !fields.nom || !fields.telephone || !fields.desired_position) {
    return { error: "missing_fields" };
  }
  if (!isEmail(fields.email)) return { error: "invalid_email" };

  const cv = form.get("cv");
  if (!cv || typeof cv === "string" || typeof cv.arrayBuffer !== "function" || !cv.size) {
    return { error: "cv_required" };
  }
  if (cv.size > MAX_CV_BYTES) return { error: "cv_too_large", status: 413 };

  const name = clean(String(cv.name || ""), 150);
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (!CV_EXTENSIONS.includes(ext)) return { error: "cv_invalid" };

  const buffer = await cv.arrayBuffer();
  if (!hasCvSignature(ext, new Uint8Array(buffer))) return { error: "cv_invalid" };

  return { fields, file: { buffer, info: { name, ext, size: buffer.byteLength } } };
};

const buildRecruiter = (form) => {
  const fields = {
    prenom: field(form, "prenom", 80),
    nom: field(form, "nom", 80),
    email: field(form, "email", 200),
    telephone: field(form, "telephone", 40),
    company_name: field(form, "company_name", 150),
    company_size: field(form, "company_size", 60),
    industry: field(form, "industry", 80),
    services: form.getAll("services").filter((service) => SERVICES.includes(service)),
    needs: field(form, "needs", 4000, true),
  };
  const complete =
    fields.prenom && fields.nom && fields.telephone && fields.company_name && fields.needs;
  if (!complete || fields.services.length === 0) return { error: "missing_fields" };
  if (!isEmail(fields.email)) return { error: "invalid_email" };
  return { fields, file: null };
};

export default async (req) => {
  if (req.method !== "POST") return reject("method_not_allowed", 405);
  if (!sameOrigin(req)) return reject("forbidden", 403);

  let form;
  try {
    form = await req.formData();
  } catch {
    return reject("invalid_form");
  }

  // The site only submits through JavaScript and reports how long the page has
  // been open. Scripted posts that skip the form arrive without it, or too fast.
  const elapsed = Number(field(form, "elapsed_ms", 20) || NaN);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return reject("too_fast", 429);

  const kind = field(form, "kind", 20) === "recruiter" ? "recruiter" : "candidate";
  const lang = field(form, "lang", 5) === "en" ? "en" : "fr";
  const built = kind === "recruiter" ? buildRecruiter(form) : await buildCandidate(form);
  if (built.error) return reject(built.error, built.status ?? 400);

  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const id = `${stamp}-${randomUUID().slice(0, 8)}`;

  const store = getStore({ name: "submissions", consistency: "strong" });
  // The file is written first: the inbox lists `entry/` keys, so an entry only
  // becomes visible once its CV is already stored.
  if (built.file) await store.set(`file/${id}`, built.file.buffer);
  await store.setJSON(`entry/${id}`, {
    id,
    kind,
    lang,
    received_at: now.toISOString(),
    fields: built.fields,
    file: built.file ? built.file.info : null,
  });

  return json(200, { ok: true, id });
};
