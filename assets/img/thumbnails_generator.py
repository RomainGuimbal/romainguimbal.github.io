#!/usr/bin/env python3
"""
Image Thumbnail Generator
Duplicates images from source folder to destination folder as thumbnails.
- Keeps PNG files as PNG format
- Enables progressive JPEG for other formats
- Maintains aspect ratio
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageOps
import argparse


#######################################################################################################################
#                                                                                                                     #
#    Execute with this command :                                                                                      #
#    python ./assets/img/thumbnails_generator.py ./assets/img ./assets/img/thumbnails --size  512 512 --quality 80    #
#                                                                                                                     #
#######################################################################################################################


def create_thumbnail(source_path, dest_path, size=(200, 200), quality=85):
    """
    Create a thumbnail from source image and save to destination.
    
    Args:
        source_path (Path): Path to source image
        dest_path (Path): Path to save thumbnail
        size (tuple): Maximum dimensions for thumbnail (width, height)
        quality (int): JPEG quality (1-100)
    """
    try:
        with Image.open(source_path) as img:
            # Convert RGBA to RGB for JPEG compatibility (except PNG)
            original_format = img.format
            
            # Create thumbnail maintaining aspect ratio
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Determine output format
            if source_path.suffix.lower() == '.png':
                # Keep PNG as PNG
                img.save(dest_path, format='PNG', optimize=True)
                print(f"✓ PNG thumbnail: {dest_path.name}")
            else:
                # Convert to RGB if necessary for JPEG
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background for transparency
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save as progressive JPEG
                dest_path = dest_path.with_suffix('.jpg')
                img.save(dest_path, format='JPEG', quality=quality, 
                        optimize=True, progressive=True)
                print(f"✓ JPEG thumbnail: {dest_path.name}")
                
    except Exception as e:
        print(f"✗ Failed to process {source_path.name}: {str(e)}")
        return False
    
    return True

def process_images(source_dir, dest_dir, size=(200, 200), quality=85):
    """
    Process all images in source directory and create thumbnails in destination.
    
    Args:
        source_dir (Path): Source directory containing images
        dest_dir (Path): Destination directory for thumbnails
        size (tuple): Maximum thumbnail dimensions
        quality (int): JPEG quality
    """
    # Supported image extensions
    supported_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    
    # Create destination directory if it doesn't exist
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all image files
    image_files = []
    for ext in supported_extensions:
        image_files.extend(source_dir.glob(f'*{ext}'))
        image_files.extend(source_dir.glob(f'*{ext.upper()}'))
    
    if not image_files:
        print(f"No supported image files found in {source_dir}")
        return
    
    print(f"Found {len(image_files)} image(s) to process")
    print(f"Thumbnail size: {size[0]}x{size[1]}")
    print(f"JPEG quality: {quality}")
    print("-" * 50)
    
    successful = 0
    failed = 0
    
    for img_path in sorted(image_files):
        # Create destination path with "thumbnail_" prefix
        if img_path.suffix.lower() == '.png':
            dest_path = dest_dir / f"thumbnail_{img_path.name}"
        else:
            # Change extension to .jpg for non-PNG files
            dest_path = dest_dir / f"thumbnail_{img_path.stem}.jpg"
        
        if create_thumbnail(img_path, dest_path, size, quality):
            successful += 1
        else:
            failed += 1
    
    print("-" * 50)
    print(f"Processing complete: {successful} successful, {failed} failed")

def main():
    parser = argparse.ArgumentParser(description='Generate thumbnails from images in a folder')
    parser.add_argument('source', help='Source directory containing images')
    parser.add_argument('destination', help='Destination directory for thumbnails')
    parser.add_argument('--size', type=int, nargs=2, default=[200, 200],
                       help='Thumbnail max dimensions (width height), default: 200 200')
    parser.add_argument('--quality', type=int, default=85,
                       help='JPEG quality (1-100), default: 85')
    
    args = parser.parse_args()
    
    # Convert to Path objects
    source_dir = Path(args.source)
    dest_dir = Path(args.destination)
    
    # Validate source directory
    if not source_dir.exists():
        print(f"Error: Source directory '{source_dir}' does not exist")
        sys.exit(1)
    
    if not source_dir.is_dir():
        print(f"Error: '{source_dir}' is not a directory")
        sys.exit(1)
    
    # Validate arguments
    if args.quality < 1 or args.quality > 100:
        print("Error: Quality must be between 1 and 100")
        sys.exit(1)
    
    if args.size[0] <= 0 or args.size[1] <= 0:
        print("Error: Size dimensions must be positive")
        sys.exit(1)
    
    print(f"Source: {source_dir}")
    print(f"Destination: {dest_dir}")
    
    # Process images
    process_images(source_dir, dest_dir, tuple(args.size), args.quality)

if __name__ == "__main__":
    main()