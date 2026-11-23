const fs = require("fs");
const path = require("path");

const ROOT = "C:/Users/romai/Documents/Projets/15 - romainguimbal.github.io";

// [search, replacement] — single-line searches keep CRLF out of the way
const JOBS = {
  "assets/css/colors.css": [
    ["  color: #1f2937;", "  color: var(--text-color-dark);"],
    ["  background: #eee;", "  background: var(--surface-light);"],
    ["#403dff,", "var(--accent),"],
    ["rgb(160, 168, 255)", "var(--accent-light)"],
    ["  background-color: rgb(21, 25, 49);", "  background-color: var(--badge-bg);"],
    ["  background-color: rgba(55, 57, 75, 0);", "  background-color: transparent;"],
    [
      "  background-color: rgba(55, 57, 75, 0.842);",
      "  background-color: var(--badge-project-bg-hover);",
    ],
    [
      "  box-shadow: 0 0 0.5em #2925ff7e;",
      "  box-shadow: 0 0 0.5em var(--accent-glow);",
    ],
    ["  color: rgb(160, 141, 255);", "  color: var(--accent-lavender);"],
    ["  background-color: #1a2330;", "  background-color: var(--surface-sunken);"],
    ["  --project-color: #ededed;", "  --project-color: var(--project-color-default);"],
    ["  --project-color: #4d517d;", "  --project-color: var(--project-color-sword);"],
    ["  --project-color: rgb(63, 70, 105);", "  --project-color: var(--project-color-porsche);"],
    ["  --project-color: #ffaa5b;", "  --project-color: var(--project-color-agrume);"],
    ["  --project-color: rgb(128, 189, 109);", "  --project-color: var(--project-color-archi-gene);"],
    ["  --project-color: rgb(38, 156, 174);", "  --project-color: var(--project-color-surfacepsycho);"],
    ["  --project-color: #847dc9;", "  --project-color: var(--project-color-sp-logo);"],
    ["  --project-color: #533ebf;", "  --project-color: var(--project-color-verriere);"],
    ["  --project-color: #17796d;", "  --project-color: var(--project-color-foulard);"],
    ["  --project-color: #de7027;", "  --project-color: var(--project-color-robe-doree);"],
    ["  --project-color: #ffffff;", "  --project-color: var(--project-color-toiture);"],
    ["50%, white)", "50%, var(--white))"],
  ],
  "assets/css/main.css": [
    ["color-mix(in srgb, var(--page-bg-color) 93%, white)", "var(--page-dots-color)"],
    ["  box-shadow: inset 0 0 16px rgba(0, 0, 0, 0.3);", "  box-shadow: inset 0 0 16px var(--shadow-soft);"],
    ["  color: rgba(255, 255, 255, 0.5);", "  color: var(--overlay-white-half);"],
    ["  background-color: gray;", "  background-color: var(--line-color);"],
    ["  background: #ffffff00;", "  background: transparent;"],
    ["  background: #ffffff4b;", "  background: var(--overlay-white-medium);"],
    ["  background: #0a0a0a;", "  background: var(--surface-deep);"],
    ["  color: #e5e5e5;", "  color: var(--text-color-on-dark);"],
    ["  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);", "  box-shadow: 0 8px 24px var(--shadow-popover);"],
    ["  background: #1c1c1c;", "  background: var(--surface-raised);"],
    ["  border: 1.5px solid #52525b;", "  border: 1.5px solid var(--border-color);"],
    ["  border-left: 2px solid #0a0a0a;", "  border-left: 2px solid var(--surface-deep);"],
    ["  border-bottom: 2px solid #0a0a0a;", "  border-bottom: 2px solid var(--surface-deep);"],
    ["  background: #fafafa;", "  background: var(--surface-bright);"],
    ["  border-color: #fafafa;", "  border-color: var(--surface-bright);"],
  ],
  "assets/css/header.css": [
    ["  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);", "  box-shadow: 0 0 10px var(--shadow-medium);"],
    ["  background-color: black;", "  background-color: var(--black);"],
    [
      "  background: linear-gradient(170deg, #73adf7 0%, #001167 57%, #3275cc 100%);",
      "  background: linear-gradient(\n    170deg,\n    var(--metal-light) 0%,\n    var(--metal-deep) 57%,\n    var(--metal-mid) 100%\n  );",
    ],
    ["    rgb(12, 0, 31, 0) 5%,", "    transparent 5%,"],
    [
      "    rgba(12, 0, 31, 0.7) 20%,",
      "    color-mix(in srgb, var(--metal-shadow) 70%, transparent) 20%,",
    ],
    ["    rgb(9, 0, 23) 60%", "    var(--metal-shadow-deep) 60%"],
    ["  color: #ffffff;", "  color: var(--white);"],
    ["  color: rgb(49, 49, 54);", "  color: var(--text-color-on-metal);"],
    [
      "  border: 1px solid rgba(13, 21, 138, 0.7);",
      "  border: 1px solid color-mix(in srgb, var(--metalic-reflection) 70%, transparent);",
    ],
    ["  color: white;", "  color: var(--white);"],
  ],
  "assets/css/project.css": [
    ["  color: #3d251233;", "  color: var(--numero-color);"],
    [
      "  background: linear-gradient(#775e5e, #eeefea);",
      "  background: linear-gradient(var(--numero-gradient-from), var(--numero-gradient-to));",
    ],
    ["  background: rgba(0, 0, 0, 0.5);", "  background: var(--overlay-scrim);"],
    ["  background: rgba(0, 0, 0, 0.8);", "  background: var(--shadow-strong);"],
    ["  color: white;", "  color: var(--white);"],
  ],
  "assets/css/masonry.css": [
    ["  box-shadow: 0 0 1em rgba(0, 0, 0, 0.3);", "  box-shadow: 0 0 1em var(--shadow-soft);"],
    ["  background: #0000006b;", "  background: var(--overlay-dot);"],
    ["  background: #000000;", "  background: var(--black);"],
    ["  color: black;", "  color: var(--black);"],
    ["  box-shadow: 0 0 1em rgba(0, 0, 0, 0.8);", "  box-shadow: 0 0 1em var(--shadow-strong);"],
    ["  background-color: rgba(0, 0, 0, 0.709);", "  background-color: var(--overlay-caption);"],
    ["  color: rgb(227, 233, 255) !important;", "  color: var(--caption-color) !important;"],
  ],
  "assets/css/video.css": [
    ["    color: white;", "    color: var(--white);"],
    ["    background: rgba(255, 255, 255, 0.5);", "    background: var(--overlay-white-half);"],
    ["    border-left: 20px solid white;", "    border-left: 20px solid var(--white);"],
    [
      "    background: linear-gradient(to right, white 0%, white 35%, transparent 35%, transparent 65%, white 65%, white 100%);",
      "    background: linear-gradient(\n        to right,\n        var(--white) 0%,\n        var(--white) 35%,\n        transparent 35%,\n        transparent 65%,\n        var(--white) 65%,\n        var(--white) 100%\n    );",
    ],
    [
      "    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);",
      "    background: linear-gradient(\n        135deg,\n        var(--video-placeholder-1) 0%,\n        var(--video-placeholder-2) 50%,\n        var(--video-placeholder-3) 100%\n    );",
    ],
  ],
  "assets/css/chapter_scrollbar.css": [
    ["    color: rgba(255, 255, 255, 0.3);", "    color: var(--overlay-white-medium);"],
    ["    color: #ffffff;", "    color: var(--white);"],
    ["    color: rgba(255, 255, 255, 0.8);", "    color: var(--overlay-white-strong);"],
    ["    color: rgb(255, 255, 255);", "    color: var(--white);"],
    ["    background-color: rgba(255, 255, 255, 0.1);", "    background-color: var(--overlay-white-weak);"],
    ["    background-color: rgba(255, 255, 255, 0.2);", "    background-color: var(--overlay-white-soft);"],
  ],
  "assets/css/promo-banner.css": [
    [
      "    background: linear-gradient(135deg, #ff69b4, #ff1493, #ff69b4, #ff1493);",
      "    background: linear-gradient(\n        135deg,\n        var(--promo-pink),\n        var(--promo-pink-deep),\n        var(--promo-pink),\n        var(--promo-pink-deep)\n    );",
    ],
    ["    color: white;", "    color: var(--white);"],
    ["    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);", "    box-shadow: 0 2px 10px var(--shadow-subtle);"],
    ["    background-color: rgba(255, 255, 255, 0.2);", "    background-color: var(--overlay-white-soft);"],
  ],
  "assets/html/items/sp-logo.html": [
    ["rgba(0, 17, 90, 0.5)", "var(--sp-logo-glow)"],
  ],
};

let totalReplaced = 0;
const problems = [];

const GUARD = { "assets/css/colors.css": "header h1 {" };

for (const [rel, jobs] of Object.entries(JOBS)) {
  const file = path.join(ROOT, rel);
  const text = fs.readFileSync(file, "utf8");
  let head = "";
  let tail = text;
  if (GUARD[rel]) {
    const at = text.indexOf(GUARD[rel]);
    if (at < 0) {
      problems.push(`${rel}: GUARD not found -> ${GUARD[rel]}`);
      continue;
    }
    head = text.slice(0, at);
    tail = text.slice(at);
  }
  for (const [from, to] of jobs) {
    const parts = tail.split(from);
    const hits = parts.length - 1;
    if (hits === 0) {
      problems.push(`${rel}: NOT FOUND -> ${from.trim().slice(0, 70)}`);
      continue;
    }
    tail = parts.join(to);
    totalReplaced += hits;
  }
  const next = head + tail;
  if (next !== text) fs.writeFileSync(file, next, "utf8");
}

console.log(`replaced ${totalReplaced} occurrences`);
console.log(problems.length ? problems.join("\n") : "no misses");
