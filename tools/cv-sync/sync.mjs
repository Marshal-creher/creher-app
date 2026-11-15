#!/usr/bin/env node
// Downloads new website submissions (candidate applications with their CV and
// recruiter requests) from the CREHER site's private inbox to this Mac, then
// deletes the online copy: once a submission is here, this Mac holds the only one.
// A LaunchAgent runs it every few minutes; it is safe to run by hand at any time.
//
// Settings live outside the repository, in
//   ~/Library/Application Support/CREHER/cv-sync/config.json
//   { "baseUrl": "https://…", "token": "…", "outDir": "/Users/…/CREHER-Candidatures" }
// next to state.json, which remembers what has already been downloaded.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const APP_DIR =
  process.env.CREHER_SYNC_DIR ||
  path.join(homedir(), "Library", "Application Support", "CREHER", "cv-sync");
const STATE_PATH = path.join(APP_DIR, "state.json");
const ID_PATTERN = /^\d{8}T\d{6}Z-[0-9a-f]{8}$/;
const TIMEOUT_MS = 60_000;
const SEPARATOR = ";"; // what Excel expects with French regional settings
const BOM = "﻿"; // makes Excel read the file as UTF-8, so accents survive

const CANDIDATE_HEADER = [
  "Date", "Prénom", "Nom", "Email", "Téléphone", "Poste souhaité",
  "Télétravail", "Mobilité", "Révision de CV demandée", "Fichier CV", "Langue",
];
const RECRUITER_HEADER = [
  "Date", "Prénom", "Nom", "Email", "Téléphone", "Entreprise",
  "Taille", "Secteur", "Services demandés", "Besoin", "Langue",
];
const SERVICE_LABELS = {
  "admin-outsourcing": "Externalisation de la Gestion Administrative",
  mediation: "Médiation et Gestion des Conflits",
  "labor-law": "Formation en Droit du Travail Marocain",
  compliance: "Conformité aux Réglementations",
  "hr-digital": "Digitalisation des Processus RH",
  "security-audit": "Audit de Sécurité RH",
  "accident-delegation": "Délégation des Accidents de Travail",
  "safety-training": "Formation à la Sécurité au Travail",
  "social-compliance": "Formation à la Conformité Sociale",
  recruitment: "Solutions de Recrutement",
  other: "Autres Services",
};

const log = (message) => console.log(`${new Date().toISOString()} ${message}`);

const readJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
};

const exists = (file) => stat(file).then(() => true, () => false);

// Local date and time as "2026-11-16 10:15".
const localStamp = (iso) => new Date(iso).toLocaleString("sv-SE").slice(0, 16);

const yesNo = (value) => (value ? "Oui" : "Non");

// Everything below comes from strangers filling a public form, so it is never
// used as a path, a formula or a script without being neutralised first.
const safeName = (value, max) =>
  String(value ?? "")
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, max)
    .trim();

// A leading space stops Excel from running a cell that starts with = + - or @
// as a formula, and keeps phone numbers such as "+212…" readable.
const cell = (value) => {
  let text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  text = text.replace(/\r?\n/g, " / ");
  if (/^[=+\-@\t]/.test(text)) text = ` ${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

// Writes are flushed to disk (`flush: true`) because the online copy is deleted
// right after: the data must really be on this Mac by then, not in a buffer.
const appendRow = async (file, header, row) => {
  const headerLine = (await exists(file)) ? "" : `${BOM}${header.map(cell).join(SEPARATOR)}\r\n`;
  const line = `${headerLine}${row.map(cell).join(SEPARATOR)}\r\n`;
  await appendFile(file, line, { encoding: "utf8", flush: true });
};

const freePath = async (dir, base, ext) => {
  for (let n = 1; ; n += 1) {
    const candidate = path.join(dir, `${base}${n === 1 ? "" : ` (${n})`}.${ext}`);
    if (!(await exists(candidate))) return candidate;
  }
};

// Marks the file as downloaded from the internet, as a browser would, so that
// macOS and Word open it with their usual caution.
const quarantine = (file) => {
  const flag = `0081;${Math.floor(Date.now() / 1000).toString(16)};CREHER;`;
  return run("/usr/bin/xattr", ["-w", "com.apple.quarantine", flag, file]).catch(() => {});
};

// The text is passed as arguments, never pasted into the AppleScript source.
// CREHER_SYNC_QUIET=1 skips the notification (used when testing).
const notify = (title, body) => {
  if (process.env.CREHER_SYNC_QUIET) return Promise.resolve();
  const script = [
    "on run argv",
    "display notification (item 2 of argv) with title (item 1 of argv)",
    "end run",
  ];
  const args = [...script.flatMap((line) => ["-e", line]), title, body];
  return run("/usr/bin/osascript", args).catch(() => {});
};

const config = await readJson(path.join(APP_DIR, "config.json"));
const state = await readJson(STATE_PATH, { done: [] });
const done = new Set(state.done);

const request = async (query, method = "GET") => {
  const response = await fetch(`${config.baseUrl}/.netlify/functions/inbox${query}`, {
    method,
    headers: { authorization: `Bearer ${config.token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`the inbox answered ${response.status}`);
  return response;
};

const saveState = async () => {
  const temporary = `${STATE_PATH}.tmp`;
  const content = JSON.stringify({ done: [...done].sort() }, null, 1);
  await writeFile(temporary, content, { flush: true });
  await rename(temporary, STATE_PATH);
};

// Called only for submissions already saved here. Failing is not fatal: the id
// stays in `done`, so the next run finds it still online and asks again.
const removeOnline = async (id) => {
  try {
    await request(`?id=${id}`, "DELETE");
    log(`deleted the online copy of ${id}`);
  } catch (error) {
    log(`could not delete the online copy of ${id} yet: ${error.message}`);
  }
};

const saveCandidate = async (entry) => {
  const f = entry.fields;
  const when = localStamp(entry.received_at);
  let cvName = "";

  if (entry.file) {
    const response = await request(`?id=${entry.id}&file=1`);
    const bytes = Buffer.from(await response.arrayBuffer());
    // A damaged download must never count as saved, or the only good copy
    // (the online one) would be deleted.
    const intact = entry.file.sha256
      ? createHash("sha256").update(bytes).digest("hex") === entry.file.sha256
      : bytes.length === entry.file.size;
    if (!intact) throw new Error(`the CV of ${entry.id} arrived damaged; it stays online`);
    const cvDir = path.join(config.outDir, "CV");
    await mkdir(cvDir, { recursive: true });
    const ext = ["pdf", "doc", "docx"].includes(entry.file.ext) ? entry.file.ext : "bin";
    const person = `${safeName(f.nom, 40).toUpperCase()} ${safeName(f.prenom, 40)}`.trim();
    const base = [when.slice(0, 10), person, safeName(f.desired_position, 50)]
      .filter(Boolean)
      .join(" - ");
    const target = await freePath(cvDir, base, ext);
    await writeFile(target, bytes, { flag: "wx", flush: true });
    await quarantine(target);
    cvName = path.basename(target);
  }

  await appendRow(path.join(config.outDir, "Candidatures.csv"), CANDIDATE_HEADER, [
    when, f.prenom, f.nom, f.email, f.telephone, f.desired_position,
    yesNo(f.open_to_remote), yesNo(f.open_to_relocation), yesNo(f.cv_review), cvName, entry.lang,
  ]);
  return `Candidature : ${f.prenom} ${f.nom} — ${f.desired_position}`;
};

const saveRecruiter = async (entry) => {
  const f = entry.fields;
  const services = (f.services || []).map((id) => SERVICE_LABELS[id] || id);
  await appendRow(path.join(config.outDir, "Demandes recruteurs.csv"), RECRUITER_HEADER, [
    localStamp(entry.received_at), f.prenom, f.nom, f.email, f.telephone, f.company_name,
    f.company_size, f.industry, services, f.needs, entry.lang,
  ]);
  return `Demande recruteur : ${f.prenom} ${f.nom} — ${f.company_name}`;
};

const main = async () => {
  const { ids } = await (await request("")).json();
  const online = ids.filter((id) => ID_PATTERN.test(id));

  // Finish what an interrupted run left behind: saved here but still online.
  for (const id of online.filter((id) => done.has(id))) await removeOnline(id);

  const fresh = online.filter((id) => !done.has(id));
  if (fresh.length === 0) return;

  await mkdir(config.outDir, { recursive: true });
  const summaries = [];
  for (const id of fresh) {
    const entry = await (await request(`?id=${id}`)).json();
    if (entry.id !== id) throw new Error(`entry ${id} came back with another id`);
    summaries.push(
      entry.kind === "recruiter" ? await saveRecruiter(entry) : await saveCandidate(entry)
    );
    done.add(id);
    await saveState();
    log(`saved ${id} (${entry.kind})`);
    await removeOnline(id);
  }

  if (summaries.length === 1) await notify("CREHER — nouvelle demande", summaries[0]);
  else await notify("CREHER", `${summaries.length} nouvelles demandes reçues sur le site`);
};

try {
  await main();
} catch (error) {
  // Being offline or asleep is normal for a laptop: try again on the next run.
  const offline = error.name === "TimeoutError" || error.cause?.code !== undefined;
  if (!offline) {
    log(`error: ${error.message}`);
    process.exitCode = 1;
  }
}
