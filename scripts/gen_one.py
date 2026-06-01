#!/usr/bin/env python3
"""Generate one image via raw CDP websocket."""
import json, requests, websocket, base64, time, os, subprocess, sys

CDP_URL = "http://127.0.0.1:9223"
ASSETS_DIR = os.path.expanduser("~/Desktop/cc-games/public/assets")

filename = sys.argv[1] if len(sys.argv) > 1 else "achievement_first_perfect.webp"
prompt = sys.argv[2] if len(sys.argv) > 2 else "[GENERATE IMAGE] A cute kawaii achievement badge icon showing a rainbow diamond shining with sparkles, kawaii style, cute cartoon, vibrant colorful iridescent colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"

# Get tabs
pages = requests.get(f"{CDP_URL}/json/list").json()
gemini_ws = None
for p in pages:
    if 'gemini.google.com' in p.get('url', ''):
        gemini_ws = p['webSocketDebuggerUrl']
        break

if not gemini_ws:
    print("ERROR: No Gemini tab")
    sys.exit(1)

ws = websocket.create_connection(gemini_ws, timeout=30)
print(f"Connected to Gemini")

msg_id = [0]
def cdp_eval(expr):
    msg_id[0] += 1
    ws.send(json.dumps({"id": msg_id[0], "method": "Runtime.evaluate", "params": {"expression": expr}}))
    while True:
        r = json.loads(ws.recv())
        if r.get('id') == msg_id[0]:
            return r.get('result', {}).get('result', {}).get('value')

# Navigate to new conversation
ws.send(json.dumps({"id": 0, "method": "Page.navigate", "params": {"url": "https://gemini.google.com/app"}}))
ws.recv()
time.sleep(3)

# Type prompt
escaped_prompt = json.dumps(prompt)
typed = cdp_eval(f'(() => {{ const e = document.querySelector(\'div[contenteditable="true"]\'); if(!e) return "no editor"; e.focus(); e.textContent = {escaped_prompt}; e.dispatchEvent(new Event("input",{{bubbles:true}})); return "typed"; }})()')
print(f"Type: {typed}")
time.sleep(1)

# Send
sent = cdp_eval('(() => { const b = document.querySelector(\'button[aria-label="\u53d1\u9001"\') || document.querySelector(\'button[aria-label="Send"]\'); if(b){b.click();return "sent";} return "no btn"; })()')
print(f"Send: {sent}")

# Wait for image
print("Waiting for image...", flush=True)
start = time.time()
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

while time.time() - start < 90:
    du = cdp_eval(CHECK_JS)
    if du:
        _, d = du.split(',', 1)
        b = base64.b64decode(d)
        png_path = os.path.join(ASSETS_DIR, filename.replace('.webp', '.png'))
        webp_path = os.path.join(ASSETS_DIR, filename)
        with open(png_path, 'wb') as f:
            f.write(b)
        subprocess.run(['cwebp', '-q', '80', png_path, '-o', webp_path], capture_output=True)
        os.remove(png_path)
        size = os.path.getsize(webp_path)
        print(f"OK: {webp_path} ({size} bytes)")
        ws.close()
        sys.exit(0)
    print(f"  {int(time.time()-start)}s...", flush=True)
    time.sleep(2)

print("TIMEOUT: No image generated")
ws.close()
sys.exit(1)
