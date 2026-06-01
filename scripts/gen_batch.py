#!/usr/bin/env python3
"""Batch generate remaining 13 missing assets."""
from playwright.sync_api import sync_playwright
import time, base64, os, subprocess, sys

ASSETS_DIR = os.path.expanduser("~/Desktop/cc-games/public/assets")

IMAGES = [
    ("achievement_combo5.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing 5 combo flames and lightning bolts, kawaii style, cute cartoon, vibrant orange and red colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("achievement_first_perfect.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing a rainbow diamond shining with sparkles, kawaii style, cute cartoon, vibrant colorful iridescent colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("achievement_level5.webp", "[GENERATE IMAGE] A cute kawaii achievement badge icon showing a chef hat with a tea leaf emblem, kawaii style, cute cartoon, vibrant purple and white colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("badge_daily.webp", "[GENERATE IMAGE] A cute kawaii daily check-in badge icon showing a calendar with a pink checkmark, kawaii style, cute cartoon, vibrant pink and blue colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("customer_catgirl.webp", "[GENERATE IMAGE] A cute kawaii chibi cat girl character portrait with cat ears, big sparkly eyes, pink hair, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("customer_robot.webp", "[GENERATE IMAGE] A cute kawaii chibi robot character portrait with round head, glowing blue eyes, antenna, metallic silver body, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("customer_vip.webp", "[GENERATE IMAGE] A cute kawaii chibi VIP character portrait wearing cool sunglasses, gold chain, confident smile, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_cream.webp", "[GENERATE IMAGE] A cute kawaii food icon of fluffy milk cream foam topping for bubble tea, kawaii style, cute cartoon, vibrant white and cream colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_grass_jelly.webp", "[GENERATE IMAGE] A cute kawaii food icon of black grass jelly dessert cubes, kawaii style, cute cartoon, vibrant dark brown and black colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_mochi.webp", "[GENERATE IMAGE] A cute kawaii food icon of pink mochi rice cake, soft and squishy looking, kawaii style, cute cartoon, vibrant pink colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_popping_boba.webp", "[GENERATE IMAGE] A cute kawaii food icon of colorful popping boba pearls in rainbow colors, kawaii style, cute cartoon, vibrant rainbow colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_red_bean.webp", "[GENERATE IMAGE] A cute kawaii food icon of red bean paste topping for bubble tea, kawaii style, cute cartoon, vibrant red and brown colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
    ("icon_taro.webp", "[GENERATE IMAGE] A cute kawaii food icon of purple taro paste for bubble tea, kawaii style, cute cartoon, vibrant purple colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
]

def generate_image(page, prompt, filename):
    """Generate one image via Gemini."""
    # New conversation
    page.goto('https://gemini.google.com/app', wait_until='domcontentloaded', timeout=15000)
    time.sleep(3)
    
    # Type prompt
    editor = page.query_selector('div[contenteditable="true"]')
    if editor:
        editor.click()
        time.sleep(0.5)
    
    page.evaluate("""(prompt) => {
        const e = document.querySelector('div[contenteditable="true"]');
        if (!e) return false;
        e.focus();
        e.textContent = prompt;
        e.dispatchEvent(new Event('input', {bubbles: true}));
        return true;
    }""", prompt)
    time.sleep(1)
    
    # Send
    page.evaluate("""() => {
        const btn = document.querySelector('button[aria-label="发送"]') || 
                     document.querySelector('button[aria-label="Send"]');
        if (btn) btn.click();
    }""")
    
    # Wait for image
    start = time.time()
    while time.time() - start < 90:
        data_url = page.evaluate("""() => {
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
            # Save
            header, data = data_url.split(',', 1)
            img_bytes = base64.b64decode(data)
            
            png_path = os.path.join(ASSETS_DIR, filename.replace('.webp', '.png'))
            webp_path = os.path.join(ASSETS_DIR, filename)
            
            with open(png_path, 'wb') as f:
                f.write(img_bytes)
            
            subprocess.run(['cwebp', '-q', '80', png_path, '-o', webp_path], capture_output=True)
            os.remove(png_path)
            
            return os.path.getsize(webp_path)
        time.sleep(2)
    return 0

def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9223", timeout=15000)
        
        gemini_page = None
        for ctx in browser.contexts:
            for page in ctx.pages:
                if 'gemini.google.com/app' in page.url:
                    gemini_page = page
                    break
            if gemini_page:
                break
        
        if not gemini_page:
            print("ERROR: No Gemini tab")
            return
        
        success = 0
        fail = 0
        
        for i, (filename, prompt) in enumerate(IMAGES, 1):
            print(f"[{i}/{len(IMAGES)}] {filename}...", end=" ", flush=True)
            try:
                size = generate_image(gemini_page, prompt, filename)
                if size > 5000:
                    print(f"OK ({size} bytes)")
                    success += 1
                else:
                    print(f"FAIL (size={size})")
                    fail += 1
            except Exception as e:
                print(f"ERROR: {e}")
                fail += 1
            time.sleep(1)
        
        browser.close()
        print(f"\nDone: {success} success, {fail} failed")

if __name__ == "__main__":
    main()
