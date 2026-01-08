#!/usr/bin/env python3
"""Generate PNG icons for Chrome extension using PIL."""
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Installing Pillow...")
    import subprocess
    subprocess.run(['pip3', 'install', 'Pillow'], check=True)
    from PIL import Image, ImageDraw

import os

os.makedirs('icons', exist_ok=True)

def create_icon(size):
    # Create image with gradient-like background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background (purple gradient approximation)
    margin = size // 8
    radius = size // 5
    
    # Background
    draw.rounded_rectangle(
        [0, 0, size-1, size-1],
        radius=radius,
        fill=(102, 126, 234, 255)  # #667eea
    )
    
    # Clipboard body (white)
    clip_margin = size // 5
    clip_top = size // 4
    draw.rounded_rectangle(
        [clip_margin, clip_top, size - clip_margin, size - clip_margin],
        radius=size // 16,
        fill=(255, 255, 255, 255)
    )
    
    # Clipboard top clip
    clip_width = size // 3
    clip_x = (size - clip_width) // 2
    clip_height = size // 6
    draw.rounded_rectangle(
        [clip_x, clip_top - clip_height//2, clip_x + clip_width, clip_top + clip_height//2],
        radius=size // 20,
        fill=(255, 255, 255, 255)
    )
    
    # Inner clip detail
    inner_margin = size // 20
    draw.rounded_rectangle(
        [clip_x + inner_margin, clip_top - clip_height//4, 
         clip_x + clip_width - inner_margin, clip_top + clip_height//4],
        radius=size // 32,
        fill=(102, 126, 234, 255)
    )
    
    # Lines on clipboard
    if size >= 32:
        line_start = clip_margin + size // 8
        line_end = size - clip_margin - size // 8
        line_y_start = clip_top + size // 5
        line_spacing = size // 8
        line_height = max(2, size // 20)
        
        for i in range(3):
            y = line_y_start + i * line_spacing
            width = line_end - line_start - (i * size // 12)
            draw.rounded_rectangle(
                [line_start, y, line_start + width, y + line_height],
                radius=line_height // 2,
                fill=(200, 200, 200, 255)
            )
    
    return img

# Create icons
for size in [16, 48, 128]:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png', 'PNG')
    print(f"Created icons/icon{size}.png")

print("\nDone! PNG icons created successfully.")
