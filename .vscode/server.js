/**
 * Portfolio Editor Server
 * Run: node editor/server.js
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
const IMAGES_DIR = path.join(ROOT, "assets", "projects");

// Thumbnail dimensions — adjust to match your design
const THUMB_WIDTH = 600;
const THUMB_HEIGHT = 400;

// ─── Ensure images folder exists ─────────────────────────────────────────────
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// Serve editor.html at /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "editor.html"));
});

// Serve static assets from the project root (so the editor can preview index.html styles etc.)
app.use(express.static(ROOT));

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
    await sharp(req.file.buffer)
      .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover" })
      .toFile(path.join(IMAGES_DIR, thumbName));

    // Full-size (capped at 1600px wide, preserving ratio)
    await sharp(req.file.buffer)
      .resize(1600, undefined, { fit: "inside", withoutEnlargement: true })
      .toFile(path.join(IMAGES_DIR, fullName));

    res.json({
      thumb: `assets/projects/${thumbName}`,
      full: `assets/projects/${fullName}`,
    });
  } catch (err) {
    console.error("Image processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Read current projects from index.html ───────────────────────────────────
app.get("/projects", (req, res) => {
  try {
    const html = fs.readFileSync(INDEX_PATH, "utf8");

    // Extract the JSON blob injected between the editor markers.
    // If none exists yet, return an empty array.
    const match = html.match(
      /<!--EDITOR-DATA-START-->([\s\S]*?)<!--EDITOR-DATA-END-->/
    );
    if (!match) return res.json([]);

    const projects = JSON.parse(match[1].trim());
    res.json(projects);
  } catch (err) {
    console.error("Error reading projects:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Apply changes → rewrite index.html ──────────────────────────────────────
app.post("/apply", (req, res) => {
  try {
    const projects = req.body; // array of project objects
    if (!Array.isArray(projects))
      return res.status(400).json({ error: "Expected an array of projects" });

    let html = fs.readFileSync(INDEX_PATH, "utf8");
    const dataBlock = `<!--EDITOR-DATA-START-->\n${JSON.stringify(
      projects,
      null,
      2
    )}\n<!--EDITOR-DATA-END-->`;

    // ── 1. Update the data marker ──────────────────────────────────────────
    if (html.includes("<!--EDITOR-DATA-START-->")) {
      html = html.replace(
        /<!--EDITOR-DATA-START-->[\s\S]*?<!--EDITOR-DATA-END-->/,
        dataBlock
      );
    } else {
      // First run: append before </body>
      html = html.replace("</body>", `${dataBlock}\n</body>`);
    }

    // ── 2. Regenerate the project cards in the DOM ─────────────────────────
    //    Replace everything between <!--PROJECTS-START--> and <!--PROJECTS-END-->
    //    with freshly rendered HTML.
    //    Add those comments around your project list in index.html once.
    const cardsHtml = projects.map(renderCard).join("\n");
    const projectsBlock = `<!--PROJECTS-START-->\n${cardsHtml}\n<!--PROJECTS-END-->`;

    if (html.includes("<!--PROJECTS-START-->")) {
      html = html.replace(
        /<!--PROJECTS-START-->[\s\S]*?<!--PROJECTS-END-->/,
        projectsBlock
      );
    }

    fs.writeFileSync(INDEX_PATH, html, "utf8");
    res.json({ ok: true });
  } catch (err) {
    console.error("Error applying changes:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Card renderer ────────────────────────────────────────────────────────────
// TODO: Replace this function body with your actual card HTML structure.
function renderCard(project) {
  return `
  <article class="grid-item">
    <a href="${project.link}" target="_blank" rel="noopener">
      <img
        src="${project.thumb}"
        alt="${escapeHtml(project.title)}"
        width="${THUMB_WIDTH}"
        height="${THUMB_HEIGHT}"
        loading="lazy"
      />
    </a>
    <div class="grid-item__body">
      <h3 class="grid-item__title">
        <a href="${project.link}" target="_blank" rel="noopener">${escapeHtml(
    project.title
  )}</a>
      </h3>
      <p class="grid-item__description">${escapeHtml(
        project.description
      )}</p>
      ${
        project.tags && project.tags.length
          ? `<ul class="grid-item__tags">${project.tags
              .map((t) => `<li>${escapeHtml(t)}</li>`)
              .join("")}</ul>`
          : ""
      }
    </div>
  </article>`.trim();
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Portfolio editor running at http://localhost:${PORT}\n`);
});
