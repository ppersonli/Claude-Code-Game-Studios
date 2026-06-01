#!/usr/bin/env python3
"""Batch generate missing assets via raw CDP websocket."""
import json, requests, websocket, base64, time, os, subprocess, sys

CDP_URL = "http://127.0.0.1:9223"
ASSETS_DIR = os.path.expanduser("~/Desktop/cc-games/public/assets")

IMAGES = [
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

CHECK_JS = """(() => {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
        const s = img.src || '';
        const a = img.alt || '';
        if ((s.includes('blob:') || a.includes('AI') || a.includes('生成')) && 
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
})()"""

def gen_one(ws, prompt, filename):
    """Generate one image."""
    # Navigate to new conversation
    ws.send(json.dumps({"id": 1, "method": "Page.navigate", "params": {"url": "https://gemini.google.com/app"}}))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == 1:
            break
    time.sleep(3)
    
    # Type prompt
    escaped = json.dumps(prompt)
    type_js = f'(() => {{ const e = document.querySelector(\'div[contenteditable="true"]\'); if(!e) return "no editor"; e.focus(); e.textContent = {escaped}; e.dispatchEvent(new Event("input",{{bubbles:true}})); return "typed"; }})()'
    ws.send(json.dumps({"id": 2, "method": "Runtime.evaluate", "params": {"expression": type_js}}))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == 2:
            break
    time.sleep(1)
    
    # Send
    send_js = '(() => { const b = document.querySelector(\'button[aria-label="\u53d1\u9001"\') || document.querySelector(\'button[aria-label="Send"]\'); if(b){b.click();return "sent";} return "no btn"; })()'
    ws.send(json.dumps({"id": 3, "method": "Runtime.evaluate", "params": {"expression": send_js}}))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == 3:
            break
    
    # Wait for image
    start = time.time()
    while time.time() - start < 90:
        ws.send(json.dumps({"id": 4, "method": "Runtime.evaluate", "params": {"expression": CHECK_JS}}))
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == 4:
                du = r.get('result', {}).get('result', {}).get('value')
                break
        if du:
            _, d = du.split(',', 1)
            b = base64.b64decode(d)
            png = os.path.join(ASSETS_DIR, filename.replace('.webp', '.png'))
            webp = os.path.join(ASSETS_DIR, filename)
            with open(png, 'wb') as f:
                f.write(b)
            subprocess.run(['cwebp', '-q', '80', png, '-o', webp], capture_output=True)
            os.remove(png)
            return os.path.getsize(webp)
        time.sleep(2)
    return 0

# Main
pages = requests.get(f"{CDP_URL}/json/list").json()
gemini_ws = None
for p in pages:
    if 'gemini.google.com' in p.get('url', ''):
        gemini_ws = p['webSocketDebuggerUrl']
        break

if not gemini_ws:
    print("ERROR: No Gemini tab")
    sys.exit(1)

ws = websocket.create_connection(gemini_ws, timeout=30, suppress_origin=True)
print(f"Connected! Generating {len(IMAGES)} images...")

ok = 0
for i, (fn, pr) in enumerate(IMAGES, 1):
    print(f"[{i}/{len(IMAGES)}] {fn}...", end=" ", flush=True)
    try:
        sz = gen_one(ws, pr, fn)
        if sz > 5000:
            print(f"OK ({sz}B)")
            ok += 1
        else:
            print(f"FAIL ({sz}B)")
    except Exception as e:
        print(f"ERR: {e}")
    time.sleep(1)

ws.close()
print(f"\nDone: {ok}/{len(IMAGES)} success")
