#!/usr/bin/env python3
"""Generate images using browser-level CDP websocket + new tab."""
import json, requests, websocket, base64, time, os, subprocess, sys

CDP_URL = "http://127.0.0.1:9223"
ASSETS_DIR = os.path.expanduser("~/Desktop/cc-games/public/assets")

# Get browser websocket URL
version = requests.get(f"{CDP_URL}/json/version").json()
browser_ws = version['webSocketDebuggerUrl']
print(f"Browser WS: {browser_ws}")

# Connect to browser
ws = websocket.create_connection(browser_ws, timeout=30, suppress_origin=True)
print("Connected to browser!")

msg_id = [0]
def send_cmd(method, params=None):
    msg_id[0] += 1
    cmd = {"id": msg_id[0], "method": method}
    if params:
        cmd["params"] = params
    ws.send(json.dumps(cmd))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == msg_id[0]:
            return r

# Create new tab
result = send_cmd("Target.createTarget", {"url": "about:blank"})
target_id = result['result']['targetId']
print(f"Created target: {target_id}")

# Attach to target
result = send_cmd("Target.attachToTarget", {"targetId": target_id, "flatten": True})
session_id = result['result']['sessionId']
print(f"Session: {session_id[:20]}...")

def cdp_eval(expr):
    """Evaluate JS in the tab."""
    cmd = {
        "id": msg_id[0] + 1,
        "method": "Runtime.evaluate",
        "params": {"expression": expr},
        "sessionId": session_id
    }
    msg_id[0] += 1
    ws.send(json.dumps(cmd))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == msg_id[0]:
            return r.get('result', {}).get('result', {}).get('value')

def cdp_navigate(url):
    """Navigate tab to URL."""
    cmd = {
        "id": msg_id[0] + 1,
        "method": "Page.navigate",
        "params": {"url": url},
        "sessionId": session_id
    }
    msg_id[0] += 1
    ws.send(json.dumps(cmd))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == msg_id[0]:
            return r

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

# Navigate to Gemini
print("Navigating to Gemini...")
cdp_navigate("https://gemini.google.com/app")
time.sleep(5)

# Check page loaded
title = cdp_eval("document.title")
print(f"Page title: {title}")

ok = 0
for i, (fn, pr) in enumerate(IMAGES, 1):
    print(f"\n[{i}/{len(IMAGES)}] {fn}", flush=True)
    
    # New conversation
    cdp_navigate("https://gemini.google.com/app")
    time.sleep(3)
    
    # Type prompt
    escaped = json.dumps(pr)
    type_js = f'(() => {{ const e = document.querySelector(\'div[contenteditable="true"]\'); if(!e) return "no editor"; e.focus(); e.textContent = {escaped}; e.dispatchEvent(new Event("input",{{bubbles:true}})); return "typed"; }})()'
    r = cdp_eval(type_js)
    print(f"  Type: {r}", flush=True)
    time.sleep(1)
    
    # Send
    send_js = '(() => { const b = document.querySelector(\'button[aria-label="\u53d1\u9001"\') || document.querySelector(\'button[aria-label="Send"]\'); if(b){b.click();return "sent";} return "no btn"; })()'
    r = cdp_eval(send_js)
    print(f"  Send: {r}", flush=True)
    
    # Wait for image
    start = time.time()
    while time.time() - start < 90:
        du = cdp_eval(CHECK_JS)
        if du:
            _, d = du.split(',', 1)
            b = base64.b64decode(d)
            png = os.path.join(ASSETS_DIR, fn.replace('.webp', '.png'))
            webp = os.path.join(ASSETS_DIR, fn)
            with open(png, 'wb') as f:
                f.write(b)
            subprocess.run(['cwebp', '-q', '80', png, '-o', webp], capture_output=True)
            os.remove(png)
            sz = os.path.getsize(webp)
            print(f"  OK: {sz}B", flush=True)
            ok += 1
            break
        elapsed = int(time.time() - start)
        if elapsed % 10 == 0:
            print(f"  waiting {elapsed}s...", flush=True)
        time.sleep(2)
    else:
        print(f"  TIMEOUT", flush=True)
    time.sleep(1)

# Close tab
send_cmd("Target.closeTarget", {"targetId": target_id})
ws.close()
print(f"\nDone: {ok}/{len(IMAGES)} success")
