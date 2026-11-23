#!/usr/bin/env node
/* ============================================================
   build-clients.js

   Scans assets/img/client logos/ and writes the list of logos to
   assets/data/clients.js, which the About page reads at runtime.

   Usage:
     node scripts/build-clients.js          one shot
     node scripts/build-clients.js --watch  rebuild on every change

   The output is a plain script (not JSON) so the page also works
   when opened straight from disk, where fetch() of a local file
   is blocked.
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LOGOS_DIR = path.join(ROOT, "assets", "img", "client logos");
const OUT_FILE = path.join(ROOT, "assets", "data", "clients.js");

const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".jfif",
  ".svg",
  ".webp",
  ".avif",
  ".gif",
];

/* "logo Guimbal blanc.svg" -> "Logo Guimbal Blanc" */
function displayName(file) {
  return path
    .parse(file)
    .name.replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
}

/* Files named "logo X" and "logo-x" sort under X, not all under L */
function sortKey(name) {
  return name.replace(/^logo\s+/i, "").trim();
}

function readLogos() {
  if (!fs.existsSync(LOGOS_DIR)) {
    throw new Error("logo folder not found: " + LOGOS_DIR);
  }

  return fs
    .readdirSync(LOGOS_DIR)
    .filter(function (file) {
      return IMAGE_EXTENSIONS.indexOf(path.extname(file).toLowerCase()) !== -1;
    })
    .map(function (file) {
      return {
        src: encodeURI("assets/img/client logos/" + file),
        name: displayName(file),
      };
    })
    .sort(function (a, b) {
      return sortKey(a.name).localeCompare(sortKey(b.name), "en", {
        numeric: true,
        sensitivity: "base",
      });
    });
}

function build() {
  const logos = readLogos();

  const body = [
    "/* ============================================================",
    "   GENERATED FILE - do not edit by hand.",
    "   Source: assets/img/client logos/",
    "   Rebuild: node scripts/build-clients.js",
    "   ============================================================ */",
    "",
    "window.CLIENT_LOGOS = " + JSON.stringify(logos, null, 2) + ";",
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const previous = fs.existsSync(OUT_FILE)
    ? fs.readFileSync(OUT_FILE, "utf8")
    : null;
  if (previous === body) {
    console.log("clients: up to date (" + logos.length + " logos)");
    return;
  }

  fs.writeFileSync(OUT_FILE, body);
  console.log(
    "clients: wrote " +
      path.relative(ROOT, OUT_FILE).replace(/\\/g, "/") +
      " (" +
      logos.length +
      " logos)",
  );
}

function watch() {
  build();
  console.log("clients: watching " + path.relative(ROOT, LOGOS_DIR));
  let pending = null;
  fs.watch(LOGOS_DIR, function () {
    clearTimeout(pending);
    pending = setTimeout(function () {
      try {
        build();
      } catch (error) {
        console.error("clients: " + error.message);
      }
    }, 150);
  });
}

try {
  if (process.argv.includes("--watch")) {
    watch();
  } else {
    build();
  }
} catch (error) {
  console.error("clients: " + error.message);
  process.exit(1);
}
