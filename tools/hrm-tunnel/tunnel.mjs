#!/usr/bin/env node
// Keeps the CREHER HRM reachable from creher.com while this Mac is on.
//
// The HRM server runs on this Mac. This script opens a Cloudflare quick tunnel to
// it and announces the tunnel's address to the site (the `hrm-register` function),
// whose proxy then forwards creher.com/api/* through the tunnel. The address
// changes every time the tunnel restarts, hence the announcement.
//
// launchd keeps this script running. If the tunnel stops answering, the script
// exits and launchd starts a fresh one.
//
// Settings live outside the repository, in
//   ~/Library/Application Support/CREHER/hrm/config.json
//   { "cloudflared": "/path/to/cloudflared", "origin": "http://127.0.0.1:3001",
//     "registerUrl": "https://…/.netlify/functions/hrm-register", "secret": "…" }
import { spawn } from "node:child_process";
import { readFile, stat, truncate } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const APP_DIR =
  process.env.CREHER_HRM_DIR ||
  path.join(homedir(), "Library", "Application Support", "CREHER", "hrm");
const config = JSON.parse(await readFile(path.join(APP_DIR, "config.json"), "utf8"));

const URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
const STARTUP_TIMEOUT_MS = 90_000;
const ANNOUNCE_EVERY_MS = 15 * 60_000;
const CHECK_EVERY_MS = 60_000;
const MAX_FAILED_CHECKS = 5;
const MAX_LOG_BYTES = 5 * 1024 * 1024;

const log = (message) => console.log(`${new Date().toISOString()} ${message}`);

// A sleeping Mac takes the HRM offline, so keep it awake while it is plugged in
// (`-s`), for as long as this script runs (`-w`). On battery it sleeps as usual.
spawn("/usr/bin/caffeinate", ["-s", "-w", String(process.pid)], { stdio: "ignore" });

const tunnel = spawn(config.cloudflared, ["tunnel", "--no-autoupdate", "--url", config.origin], {
  stdio: ["ignore", "ignore", "pipe"],
});

let publicUrl = null;
let announced = false;

const announce = async () => {
  if (!publicUrl) return;
  try {
    const response = await fetch(config.registerUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${config.secret}`, "content-type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`the site answered ${response.status}`);
    if (!announced) log("address announced to creher.com");
    announced = true;
  } catch (error) {
    announced = false;
    log(`could not announce the address yet: ${error.message}`);
  }
};

// cloudflared prints the address it was given among its start-up messages.
let recentOutput = "";
tunnel.stderr.on("data", (chunk) => {
  recentOutput = (recentOutput + chunk).slice(-4000);
  const match = recentOutput.match(URL_PATTERN);
  if (match && match[0] !== publicUrl) {
    publicUrl = match[0];
    log(`tunnel open: ${publicUrl}`);
    announce();
  }
});

tunnel.on("exit", (code, signal) => {
  log(`cloudflared stopped (${signal || code}); launchd will start a new tunnel`);
  process.exit(1);
});
process.on("SIGTERM", () => {
  tunnel.kill("SIGTERM");
  process.exit(0);
});

const answers = async (url, headers = {}) => {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    return response.ok;
  } catch {
    return false;
  }
};

let failedChecks = 0;
const check = async () => {
  if (!publicUrl) return;
  // If the HRM server itself is down, a new tunnel would not help.
  if (!(await answers(`${config.origin}/api/health`))) return;
  if (await answers(`${publicUrl}/api/health`, { "x-hrm-gateway": config.secret })) {
    failedChecks = 0;
    if (!announced) await announce();
    return;
  }
  failedChecks += 1;
  if (failedChecks >= MAX_FAILED_CHECKS) {
    log(`the tunnel missed ${failedChecks} checks in a row; replacing it`);
    tunnel.kill("SIGTERM");
  }
};

// The two services write their logs next to the settings; keep them small.
const trimLogs = async () => {
  for (const name of ["backend.log", "tunnel.log"]) {
    const file = path.join(APP_DIR, name);
    const size = await stat(file).then((info) => info.size, () => 0);
    if (size > MAX_LOG_BYTES) await truncate(file, 0).catch(() => {});
  }
};

setTimeout(() => {
  if (!publicUrl) {
    log("no tunnel address after 90 s (no internet?); trying again");
    tunnel.kill("SIGTERM");
  }
}, STARTUP_TIMEOUT_MS);
setInterval(check, CHECK_EVERY_MS);
setInterval(announce, ANNOUNCE_EVERY_MS);
setInterval(trimLogs, 60 * 60_000);
