import os
from PIL import Image

# Configuration
SOURCE_DIR = 'images/photography'
THUMB_DIR = os.path.join(SOURCE_DIR, 'thumbnails')
MAX_SIZE = (800, 800)  # Max width/height for thumbnails (good for 2-column spans)
QUALITY = 85

def generate_thumbnails():
    # Create thumbnails directory if it doesn't exist
    if not os.path.exists(THUMB_DIR):
        os.makedirs(THUMB_DIR)
        print(f"Created directory: {THUMB_DIR}")

    # Process each file
    files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Found {len(files)} value images in {SOURCE_DIR}")

    for filename in files:
        source_path = os.path.join(SOURCE_DIR, filename)
        thumb_path = os.path.join(THUMB_DIR, filename)

        try:
            with Image.open(source_path) as img:
                # Convert to RGB (in case of PNG with transparency, though we are saving as JPEG usually)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                # Resize using Lanczos for high quality downsampling
                img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

                # Save
                img.save(thumb_path, 'JPEG', quality=QUALITY)
                print(f"Generated thumbnail: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

if __name__ == '__main__':
    print("Starting thumbnail generation...")
    generate_thumbnails()
    print("Thumbnail generation complete.")
