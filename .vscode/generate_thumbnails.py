"""
Unified thumbnail generator for images and videos.

Paths are resolved relative to the repository root (parent of .vscode/).
  Images : assets/img/          -> assets/img/thumbnails/thumbnail_{name}.jpg/png
  Videos : assets/video/        -> assets/img/thumbnails/thumbnail_{name}.jpg

Requirements:
  pip install Pillow             (for images)
  ffmpeg on PATH                 (for videos)

Usage:
  python .vscode/generate_thumbnails.py              # both images and videos
  python .vscode/generate_thumbnails.py --images     # images only
  python .vscode/generate_thumbnails.py --videos     # videos only
  python .vscode/generate_thumbnails.py --size 512 512 --quality 80
"""

import argparse
import subprocess
import sys
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────

ROOT      = Path(__file__).parent.parent
IMG_DIR   = ROOT / 'assets' / 'img'
VIDEO_DIR = ROOT / 'assets' / 'video'
THUMB_DIR = ROOT / 'assets' / 'img' / 'thumbnails'

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}

# ── Image thumbnails ───────────────────────────────────────────────────────────

def create_image_thumbnail(source_path: Path, dest_path: Path, size: tuple, quality: int) -> bool:
    try:
        from PIL import Image
    except ImportError:
        print("ERROR: Pillow not installed. Run: pip install Pillow")
        sys.exit(1)

    try:
        with Image.open(source_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)

            if source_path.suffix.lower() == '.png':
                img.save(dest_path, format='PNG', optimize=True)
                print(f"  gen   {source_path.name} -> {dest_path.name}")
            else:
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

                dest_path = dest_path.with_suffix('.jpg')
                img.save(dest_path, format='JPEG', quality=quality, optimize=True, progressive=True)
                print(f"  gen   {source_path.name} -> {dest_path.name}")
    except Exception as e:
        print(f"  FAIL  {source_path.name}: {e}")
        return False
    return True


def process_images(size: tuple, quality: int):
    print(f"\n[Images]  {IMG_DIR}  ->  {THUMB_DIR}")
    print(f"  size={size[0]}x{size[1]}  quality={quality}")
    print("-" * 56)

    # Source images are directly in IMG_DIR (not in the thumbnails subfolder)
    image_files = [
        p for p in IMG_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]

    if not image_files:
        print("  No images found.")
        return

    ok = fail = skip = 0
    for src in sorted(image_files):
        suffix = '.png' if src.suffix.lower() == '.png' else '.jpg'
        dest = THUMB_DIR / f"thumbnail_{src.stem}{suffix}"

        if dest.exists():
            print(f"  skip  {src.name}")
            skip += 1
            continue

        if create_image_thumbnail(src, dest, size, quality):
            ok += 1
        else:
            fail += 1

    print("-" * 56)
    print(f"  Done: {ok} generated, {skip} skipped, {fail} failed")

# ── Video thumbnails ───────────────────────────────────────────────────────────

def ffmpeg_available() -> bool:
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


def extract_first_frame(video_path: Path, output_path: Path) -> bool:
    result = subprocess.run(
        ['ffmpeg', '-y', '-i', str(video_path), '-vframes', '1', '-q:v', '2', str(output_path)],
        capture_output=True,
    )
    return result.returncode == 0


def process_videos():
    print(f"\n[Videos]  {VIDEO_DIR}  ->  {THUMB_DIR}")
    print("-" * 56)

    if not ffmpeg_available():
        print("  ERROR: ffmpeg not found on PATH. Install it and try again.")
        return

    videos = [p for p in VIDEO_DIR.iterdir() if p.suffix.lower() in VIDEO_EXTENSIONS]

    if not videos:
        print("  No video files found.")
        return

    ok = fail = skip = 0
    for video in sorted(videos):
        dest = THUMB_DIR / f"thumbnail_{video.stem}.jpg"

        if dest.exists():
            print(f"  skip  {video.name}")
            skip += 1
            continue

        print(f"  gen   {video.name} -> {dest.name} ...", end=' ', flush=True)
        if extract_first_frame(video, dest):
            print("OK")
            ok += 1
        else:
            print("FAILED")
            fail += 1

    print("-" * 56)
    print(f"  Done: {ok} generated, {skip} skipped, {fail} failed")

# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Generate image and video thumbnails.')
    parser.add_argument('--images', action='store_true', help='Process images only')
    parser.add_argument('--videos', action='store_true', help='Process videos only')
    parser.add_argument('--size', type=int, nargs=2, default=[512, 512],
                        metavar=('W', 'H'), help='Max thumbnail dimensions (default: 512 512)')
    parser.add_argument('--quality', type=int, default=85,
                        help='JPEG quality 1-100 (default: 85)')
    args = parser.parse_args()

    if args.quality < 1 or args.quality > 100:
        print("Error: --quality must be between 1 and 100")
        sys.exit(1)

    THUMB_DIR.mkdir(parents=True, exist_ok=True)

    run_both = not args.images and not args.videos
    if args.images or run_both:
        process_images(tuple(args.size), args.quality)
    if args.videos or run_both:
        process_videos()


if __name__ == '__main__':
    main()
