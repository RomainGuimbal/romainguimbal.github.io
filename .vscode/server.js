/**
 * Portfolio Editor Server
 * Run: node .vscode/server.js (TASK EXISTS)
 * Then open: http://localhost:3000
 */

const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// ─── Paths (relative to project root) ────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "index.html");
const IMAGES_DIR = path.join(ROOT, "assets", "img");

// Thumbnail dimensions — width is fixed at 512 and height is capped at 768
const THUMB_WIDTH = 512;
const THUMB_MAX_HEIGHT = 768;

// ─── Ensure images folder exists ─────────────────────────────────────────────
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// Serve editor.html at /
app.get("/", (req, res) => {
  res.sendFile("editor.html", { root: __dirname });
});

// ─── Image upload ─────────────────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file received" });

    const ext = path.extname(req.file.originalname) || ".jpg";
    const basename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const thumbName = `${basename}-thumb${ext}`;
    const fullName = `${basename}${ext}`;

    // Thumbnail
    const thumbBuffer = await sharp(req.file.buffer)
      .metadata()
      .then(async (metadata) => {
        const width = metadata.width || 0;
        const height = metadata.height || 0;
        const shouldCrop = width > 0 && height > 0 && height / width > 1.5;

        const pipeline = sharp(req.file.buffer);
        if (shouldCrop) {
          return pipeline
            .resize(THUMB_WIDTH, THUMB_MAX_HEIGHT, { fit: "cover", withoutEnlargement: true })
            .toBuffer();
        }

        return pipeline
          .resize(THUMB_WIDTH, THUMB_MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
          .toBuffer();
      });

    fs.writeFileSync(path.join(IMAGES_DIR, "thumbnails", thumbName), thumbBuffer);

    // Full-size (capped at 1600px wide, preserving ratio)
    await sharp(req.file.buffer)
      .resize(1600, undefined, { fit: "inside", withoutEnlargement: true })
      .toFile(path.join(IMAGES_DIR, fullName));

    res.json({
      thumb: `assets/img/thumbnails/${thumbName}`,
      full: `assets/img/${fullName}`,
    });
  } catch (err) {
    console.error("Image processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

async function generateThumbnailFile(sourcePath, outputPath) {
  const metadata = await sharp(sourcePath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const shouldCrop = width > 0 && height > 0 && height / width > 2;

  const pipeline = sharp(sourcePath);
  if (shouldCrop) {
    await pipeline
      .resize(THUMB_WIDTH, THUMB_MAX_HEIGHT, { fit: "cover", withoutEnlargement: true })
      .toFile(outputPath);
  } else {
    await pipeline
      .resize(THUMB_WIDTH, THUMB_MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .toFile(outputPath);
  }
}

function getProjectImagePath(project) {
  if (!project?.full) return null;

  const normalized = String(project.full).replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith("assets/img/")) return null;

  const absolutePath = path.join(ROOT, normalized);
  return fs.existsSync(absolutePath) ? absolutePath : null;
}

app.post("/regenerate-thumbnails", async (req, res) => {
  try {
    const projectsPath = path.join(ROOT, ".vscode", "projects.json");
    let projects = [];

    if (fs.existsSync(projectsPath)) {
      projects = JSON.parse(fs.readFileSync(projectsPath, "utf8"));
    }

    if (!Array.isArray(projects)) projects = [];

    fs.mkdirSync(path.join(IMAGES_DIR, "thumbnails"), { recursive: true });

    let count = 0;
    for (const project of projects) {
      const sourcePath = getProjectImagePath(project);
      if (!sourcePath) continue;

      const ext = path.extname(sourcePath) || ".jpg";
      const basename = path.basename(sourcePath, ext);
      const thumbName = `${basename}-thumb${ext}`;
      const thumbPath = path.join(IMAGES_DIR, "thumbnails", thumbName);

      await generateThumbnailFile(sourcePath, thumbPath);
      project.thumb = `assets/img/thumbnails/${thumbName}`;
      count += 1;
    }

    fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2), "utf8");
    res.json({ ok: true, count, projects });
  } catch (err) {
    console.error("Thumbnail regeneration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Read current projects from index.html ───────────────────────────────────
const PROJECTS_PATH = path.join(ROOT, ".vscode", "projects.json");

app.get("/projects", (req, res) => {
  try {
    if (!fs.existsSync(PROJECTS_PATH)) return res.json([]);
    const projects = JSON.parse(fs.readFileSync(PROJECTS_PATH, "utf8"));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Apply changes → rewrite index.html ──────────────────────────────────────
app.post("/apply", (req, res) => {
  try {
    const projects = req.body;
    if (!Array.isArray(projects))
      return res.status(400).json({ error: "Expected array" });

    // Save data to projects.json
    fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projects, null, 2), "utf8");

    // Rewrite the cards in index.html
    let html = fs.readFileSync(INDEX_PATH, "utf8");
    const cardsHtml = projects.map(renderCard).join("\n");
    const projectsBlock = `<!--PROJECTS-START-->\n${cardsHtml}\n<!--PROJECTS-END-->`;
    if (html.includes("<!--PROJECTS-START-->")) {
      html = html.replace(
        /<!--PROJECTS-START-->[\s\S]*?<!--PROJECTS-END-->/,
        projectsBlock,
      );
      fs.writeFileSync(INDEX_PATH, html, "utf8");
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Card renderer ────────────────────────────────────────────────────────────
function renderCard(project) {
  const parts = [project.description, project.year]
    .filter((value) => value != null && String(value).trim() !== "")
    .map((value) => escapeHtml(value));

  return `
  <article class="grid-item ${String(project.tags).replace(/,/g, " ")}">
    <a class="media-wrap image-item" href="${project.full}">
      <img
        src="${project.thumb}"
        alt="${escapeHtml(project.title)}"
      />
    </a>
    <figcaption data-i18n-html="html.fig.${escapeHtml(project.title)}">
    ${parts.join("<br />")}
    </figcaption>
  </article>`.trim();
}
// width="${THUMB_WIDTH}"
// height="${THUMB_HEIGHT}"
// loading="lazy"
// ${
//   project.tags && project.tags.length
//     ? `<ul class="grid-item__tags">${project.tags
//         .map((t) => `<li>${escapeHtml(t)}</li>`)
//         .join("")}</ul>`
//     : ""
// }

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Serve static assets from the project root (so the editor can preview index.html styles etc.)
app.use(express.static(ROOT));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Portfolio editor running at http://localhost:${PORT}\n`);
});
