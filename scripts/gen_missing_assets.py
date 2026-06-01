#!/usr/bin/env python3
"""Batch generate missing Bubble Tea Lab assets via Gemini CDP.
Connects to Chrome on port 9223, generates images via Gemini, extracts via canvas, saves as webp.
"""
import base64, json, os, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ASSETS_DIR = os.path.expanduser("~/Desktop/cc-games/public/assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

# 14 images that need regeneration (currently 128x128 placeholders)
IMAGES = [
    # Achievement icons (5)
    ("achievement_100_score.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing a golden trophy with the number 100, surrounded by sparkles and stars, kawaii style, cute cartoon, vibrant golden colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("achievement_combo5.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing 5 combo flames and lightning bolts in a row, kawaii style, cute cartoon, vibrant orange and red colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("achievement_first_perfect.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing a rainbow diamond shining with sparkles, kawaii style, cute cartoon, vibrant colorful iridescent colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("achievement_level5.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing a chef hat with a tea leaf emblem, kawaii style, cute cartoon, vibrant purple and white colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("badge_daily.webp", "[GENERATE IMAGE] A cute kawaii daily check-in badge icon showing a calendar with a pink checkmark, kawaii style, cute cartoon, vibrant pink and blue colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    # Character portraits (3)
    ("customer_catgirl.webp", "[GENERATE IMAGE] A cute kawaii chibi cat girl character portrait with cat ears, big sparkly eyes, pink hair, wearing a cute outfit, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("customer_robot.webp", "[GENERATE IMAGE] A cute kawaii chibi robot character portrait with round head, glowing blue eyes, antenna, metallic silver body, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("customer_vip.webp", "[GENERATE IMAGE] A cute kawaii chibi VIP character portrait wearing cool sunglasses, gold chain, confident smile, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    # Ingredient icons (6)
    ("icon_cream.webp", "[GENERATE IMAGE] A cute kawaii food icon of fluffy milk cream foam topping for bubble tea, kawaii style, cute cartoon, vibrant white and cream colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_grass_jelly.webp", "[GENERATE IMAGE] A cute kawaii food icon of black grass jelly dessert cubes, kawaii style, cute cartoon, vibrant dark brown and black colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_mochi.webp", "[GENERATE IMAGE] A cute kawaii food icon of pink mochi rice cake, soft and squishy looking, kawaii style, cute cartoon, vibrant pink colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_popping_boba.webp", "[GENERATE IMAGE] A cute kawaii food icon of colorful popping boba pearls in rainbow colors, kawaii style, cute cartoon, vibrant rainbow colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_red_bean.webp", "[GENERATE IMAGE] A cute kawaii food icon of red bean paste topping for bubble tea, kawaii style, cute cartoon, vibrant red and brown colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_taro.webp", "[GENERATE IMAGE] A cute kawaii food icon of purple taro paste for bubble tea, kawaii style, cute cartoon, vibrant purple colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
]

def find_gemini_tab(page_list):
    """Find the Gemini tab."""
    for page in page_list:
        if 'gemini.google.com' in page.url:
            return page
    return None

def new_gemini_conversation(page):
    """Navigate to new Gemini conversation."""
    page.goto('https://gemini.google.com/app', wait_until='domcontentloaded', timeout=15000)
    time.sleep(3)

def type_prompt(page, prompt):
    """Type prompt into Gemini's contenteditable and send."""
    # Click editor to focus
    editor = page.query_selector('div[contenteditable="true"]')
    if editor:
        editor.click()
        time.sleep(0.5)
    
    # Type prompt via JS
    page.evaluate("""(prompt) => {
        const e = document.querySelector('div[contenteditable="true"]');
        if (!e) return false;
        e.focus();
        e.textContent = prompt;
        e.dispatchEvent(new Event('input', {bubbles: true}));
        return true;
    }""", prompt)
    time.sleep(1)
    
    # Click send button
    sent = page.evaluate("""() => {
        const btn = document.querySelector('button[aria-label="发送"]') || 
                     document.querySelector('button[aria-label="Send"]') ||
                     document.querySelector('button.send-button');
        if (btn) { btn.click(); return true; }
        return false;
    }""")
    return sent

def wait_for_image(page, timeout=90):
    """Wait for Gemini to generate an image and return it via canvas."""
    start = time.time()
    while time.time() - start < timeout:
        # Check for generated image
        data_url = page.evaluate("""() => {
            // Look for AI-generated image
            const imgs = document.querySelectorAll('img');
            for (const img of imgs) {
                const src = img.src || '';
                const alt = img.alt || '';
                if ((src.includes('blob:') || alt.includes('AI') || alt.includes('生成')) && 
                    img.naturalWidth > 200 && img.naturalHeight > 200) {
                    try {
                        const c = document.createElement('canvas');
                        c.width = img.naturalWidth;
                        c.height = img.naturalHeight;
                        c.getContext('2d').drawImage(img, 0, 0);
                        return c.toDataURL('image/png');
                    } catch(e) {}
                }
            }
            return null;
        }""")
        if data_url:
            return data_url
        time.sleep(2)
    return None

def save_image(data_url, output_path):
    """Save base64 data URL to file."""
    # Remove data URL prefix
    header, data = data_url.split(',', 1)
    img_bytes = base64.b64decode(data)
    
    # Save as PNG first
    png_path = output_path.replace('.webp', '.png')
    with open(png_path, 'wb') as f:
        f.write(img_bytes)
    
    # Convert to webp using cwebp
    import subprocess
    result = subprocess.run(
        ['cwebp', '-q', '80', png_path, '-o', output_path],
        capture_output=True, text=True
    )
    
    # Clean up PNG
    if os.path.exists(png_path):
        os.remove(png_path)
    
    return result.returncode == 0

def main():
    print(f"Starting batch generation of {len(IMAGES)} images...")
    print(f"Assets directory: {ASSETS_DIR}")
    
    with sync_playwright() as p:
        # Connect to Chrome CDP
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9223", timeout=30000)
        
        # Find or create Gemini tab
        pages = []
        for ctx in browser.contexts:
            pages.extend(ctx.pages)
        
        gemini_page = find_gemini_tab(pages)
        if not gemini_page:
            print("No Gemini tab found, opening new one...")
            ctx = browser.contexts[0] if browser.contexts else browser.new_context()
            gemini_page = ctx.new_page()
            gemini_page.goto('https://gemini.google.com/app', wait_until='domcontentloaded', timeout=15000)
            time.sleep(3)
        
        print(f"Using Gemini tab: {gemini_page.url}")
        
        success_count = 0
        fail_count = 0
        
        for i, (filename, prompt) in enumerate(IMAGES, 1):
            print(f"\n[{i}/{len(IMAGES)}] Generating: {filename}")
            
            try:
                # Start new conversation
                new_gemini_conversation(gemini_page)
                time.sleep(2)
                
                # Type and send prompt
                if not type_prompt(gemini_page, prompt):
                    print(f"  ❌ Failed to send prompt")
                    fail_count += 1
                    continue
                
                print(f"  ⏳ Waiting for generation...")
                
                # Wait for image
                data_url = wait_for_image(gemini_page, timeout=90)
                if not data_url:
                    print(f"  ❌ No image generated within timeout")
                    fail_count += 1
                    continue
                
                # Save image
                output_path = os.path.join(ASSETS_DIR, filename)
                if save_image(data_url, output_path):
                    # Verify file size
                    file_size = os.path.getsize(output_path)
                    if file_size > 5000:  # > 5KB
                        print(f"  ✅ Saved: {filename} ({file_size} bytes)")
                        success_count += 1
                    else:
                        print(f"  ⚠️ File too small ({file_size} bytes), may be corrupted")
                        fail_count += 1
                else:
                    print(f"  ❌ Failed to convert/save image")
                    fail_count += 1
                
                # Brief pause between generations
                time.sleep(2)
                
            except Exception as e:
                print(f"  ❌ Error: {e}")
                fail_count += 1
        
        browser.close()
    
    print(f"\n{'='*50}")
    print(f"Generation complete: {success_count} success, {fail_count} failed")
    return success_count, fail_count

if __name__ == "__main__":
    main()
