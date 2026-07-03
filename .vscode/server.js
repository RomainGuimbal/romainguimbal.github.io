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
const { spawn } = require("child_process");

const app = express();
const PORT = 3000;

// ─── Paths (relative to project root) ────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "index.html");
const IMAGES_DIR = path.join(ROOT, "assets", "img");
const VIDEO_DIR = path.join(ROOT, "assets", "video");

// Thumbnail dimensions — width is fixed at 512 and height is capped at 768
const THUMB_WIDTH = 512;
const THUMB_MAX_HEIGHT = 768;

// ─── Ensure images folder exists ─────────────────────────────────────────────
fs.mkdirSync(IMAGES_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

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

// ─── Video upload (save original + generate thumbnail from first frame)
app.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file received" });

    const ext = path.extname(req.file.originalname) || ".mp4";
    const basename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullName = `${basename}${ext}`;
    const thumbName = `${basename}-thumb.jpg`;

    const fullPath = path.join(VIDEO_DIR, fullName);
    fs.writeFileSync(fullPath, req.file.buffer);

    // Ensure thumbnails directory exists
    fs.mkdirSync(path.join(IMAGES_DIR, "thumbnails"), { recursive: true });
    const thumbPath = path.join(IMAGES_DIR, "thumbnails", thumbName);

    // Generate thumbnail from first frame
    await generateThumbnailFromVideo(fullPath, thumbPath);

    res.json({
      thumb: `assets/img/thumbnails/${thumbName}`,
      full: `assets/video/${fullName}`,
    });
  } catch (err) {
    console.error("Video processing error:", err);
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

async function generateThumbnailFromVideo(sourceVideoPath, outputPath) {
  // Extract first frame into a temporary file, then use sharp to resize it
  const tmpFrame = outputPath + ".frame.jpg";

  // Resolve ffmpeg binary: prefer ffmpeg-static if available, else fall back to system 'ffmpeg'
  let ffmpegBin = "ffmpeg";
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    ffmpegBin = require("ffmpeg-static");
  } catch (e) {
    console.warn("ffmpeg-static not found, falling back to system ffmpeg. Install ffmpeg-static for bundled ffmpeg.");
  }

  await new Promise((resolve, reject) => {
    const args = ["-y", "-i", sourceVideoPath, "-frames:v", "1", tmpFrame];
    const proc = spawn(ffmpegBin, args);

    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(tmpFrame)) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${stderr}`));
    });
  });

  // Use the same image resizing logic as for photos
  await generateThumbnailFile(tmpFrame, outputPath);

  // remove temporary frame file
  try {
    fs.unlinkSync(tmpFrame);
  } catch (e) {
    // ignore
  }
}

function getProjectMediaPath(project) {
  if (!project?.full) return null;

  const normalized = String(project.full).replace(/\\/g, "/").replace(/^\/+/, "");
  // accept assets/img/ and assets/video/ (and other assets/*)
  if (!normalized.startsWith("assets/")) return null;

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
      const sourcePath = getProjectMediaPath(project);
      if (!sourcePath) continue;

      const srcExt = path.extname(sourcePath).toLowerCase();
      const basename = path.basename(sourcePath, srcExt);

      // For video sources, always emit a .jpg thumbnail
      const isVideo = (project.mediaType === "video") || [".mp4", ".mov", ".webm", ".mkv"].includes(srcExt);
      const thumbExt = isVideo ? ".jpg" : (srcExt || ".jpg");
      const thumbName = `${basename}-thumb${thumbExt}`;
      const thumbPath = path.join(IMAGES_DIR, "thumbnails", thumbName);

      if (isVideo) {
        try {
          await generateThumbnailFromVideo(sourcePath, thumbPath);
          project.thumb = `assets/img/thumbnails/${thumbName}`;
          count += 1;
        } catch (e) {
          console.error("Failed to generate video thumbnail for", sourcePath, e.message);
        }
      } else {
        await generateThumbnailFile(sourcePath, thumbPath);
        project.thumb = `assets/img/thumbnails/${thumbName}`;
        count += 1;
      }
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

  const tagsClass = String(project.tags || "").replace(/,/g, " ");
  const figcaption = `<figcaption data-i18n-html="html.fig.${escapeHtml(project.title)}">
    ${parts.join("<br />")}
    </figcaption>`;

  // Video item
  if (project.mediaType === "video") {
    const aspectRatio = project.aspectRatio || "16/9";
    return `
  <article class="grid-item ${tagsClass}">
    <a class="media-wrap video-container" style="aspect-ratio: ${escapeHtml(aspectRatio)}">
      <video
        preload="none"
        data-src="${escapeHtml(project.full)}"
        data-type="video/mp4"
      ></video>
      <div class="video-thumbnail loading"></div>
      <button class="play-pause-btn" id="playPauseBtn">
        <div class="play-icon"></div>
      </button>
    </a>
    ${figcaption}
  </article>`.trim();
  }

  // Image item (default)
  return `
  <article class="grid-item ${tagsClass}">
    <a class="media-wrap image-item" href="${escapeHtml(project.full)}">
      <img
        src="${escapeHtml(project.thumb)}"
        alt="${escapeHtml(project.title)}"
      />
    </a>
    ${figcaption}
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
