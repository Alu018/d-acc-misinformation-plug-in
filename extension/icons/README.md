# Extension Icons

This directory should contain the following icon files for the Chrome extension:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Creating Icons

You can create these icons using any image editing software. The icons should represent the extension's purpose (detecting misinformation).

### Quick Setup with ImageMagick

If you have ImageMagick installed, you can create placeholder icons with:

```bash
# Create a simple red shield icon placeholder
convert -size 128x128 xc:transparent -fill "#f44336" -draw "circle 64,64 64,20" -draw "path 'M 40,40 L 64,100 L 88,40 Z'" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

Or use an online icon generator or design tool to create custom icons.

### Temporary Placeholder

For development, you can use simple colored squares:

```bash
convert -size 128x128 xc:"#f44336" -pointsize 72 -fill white -gravity center -annotate +0+0 "!" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```
