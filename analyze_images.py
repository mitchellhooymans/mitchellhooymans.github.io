import os
from PIL import Image

SOURCE_DIR = 'images/photography'

def analyze_images():
    print("Analyzing image dimensions...")
    files = [f for f in os.listdir(SOURCE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    # Store results (filename, width, height, ratio, orientation)
    results = []

    for filename in files:
        path = os.path.join(SOURCE_DIR, filename)
        try:
            with Image.open(path) as img:
                w, h = img.size
                ratio = w / h
                
                if ratio > 1.8:
                    orientation = "Panorama"
                elif ratio > 1.2:
                    orientation = "Landscape"
                elif ratio < 0.85:
                    orientation = "Portrait"
                else:
                    orientation = "Square"
                
                results.append({
                    "name": filename,
                    "w": w,
                    "h": h,
                    "ratio": ratio,
                    "type": orientation
                })
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    # Sort by type for easier grouped output
    results.sort(key=lambda x: x['type'])

    print(f"\n{'FILENAME':<30} {'DIMENSIONS':<15} {'RATIO':<8} {'TYPE'}")
    print("-" * 70)
    for r in results:
        print(f"{r['name']:<30} {r['w']}x{r['h']:<9} {r['ratio']:.2f}     {r['type']}")

    # Also suggest HTML classes
    print("\n--- SUGGESTED HTML GENERATION (Copy-Paste) ---")
    
    # Group by logic: 
    # Portraits -> span-1, add vertical-class
    # Panoramas -> span-3 or span-2 (if fitting 2 cols)
    # Landscapes -> span-2
    # Squares -> span-1
    
    print("Use this data to build the grid.")

if __name__ == '__main__':
    analyze_images()
