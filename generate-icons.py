#!/usr/bin/env python3
"""
Generate placeholder icons for the Chrome extension.
Requires Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is not installed.")
    print("Install it with: pip install Pillow")
    exit(1)

import os

def create_icon(size, filename):
    """Create a simple shield-like icon"""
    # Create a new image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle (red)
    margin = size // 8
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill='#f44336', outline='#c62828', width=max(1, size // 32))

    # Exclamation mark
    font_size = size // 2
    text = "!"

    # Try to use a font, fallback to default if not available
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()

    # Calculate text position to center it
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size // 16

    draw.text((x, y), text, fill='white', font=font)

    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename}")

def main():
    # Create icons directory if it doesn't exist
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # Generate icons in different sizes
    sizes = {
        'icon16.png': 16,
        'icon48.png': 48,
        'icon128.png': 128
    }

    for filename, size in sizes.items():
        filepath = os.path.join(icons_dir, filename)
        create_icon(size, filepath)

    print("\nIcons generated successfully!")
    print("You can find them in the 'icons' directory.")

if __name__ == '__main__':
    main()
