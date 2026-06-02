#!/usr/bin/env python3
"""
Batch generate bubble-tea-lab game assets via Gemini CDP.
Uses existing gen_browser_cdp.py pattern with fresh tabs per image.
"""
import json, requests, websocket, base64, time, os, subprocess, sys

CDP_URL = "http://127.0.0.1:9223"
ASSETS_DIR = os.path.expanduser("~/Desktop/cc-games/public/assets/bubble-tea-lab")
DELAY = 15  # seconds between images
TIMEOUT = 90  # seconds per image

# Ensure output dirs exist
for sub in ["customers", "moods", "ingredients", "effects", "backgrounds", "decorations", "achievements", "cups"]:
    os.makedirs(os.path.join(ASSETS_DIR, sub), exist_ok=True)

# ============ IMAGE LIST ============
# Using GREEN SCREEN background for easier background removal
GREEN_BG = "solid bright green screen background #00FF00, chroma key"

IMAGES = [
    # --- Moods/Emojis (4) - Green screen ---
    ("moods/mood_happy.webp",
     f"[GENERATE IMAGE] A cute kawaii happy emoji face icon, big smile, sparkling eyes, heart cheeks, bright cheerful, kawaii style, simple clean design, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("moods/mood_neutral.webp",
     f"[GENERATE IMAGE] A cute kawaii neutral calm emoji face icon, waiting patiently, slight smile, simple design, kawaii style, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("moods/mood_worried.webp",
     f"[GENERATE IMAGE] A cute kawaii worried anxious emoji face icon, slightly frowning, sweat drop, nervous expression, kawaii style, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("moods/mood_angry.webp",
     f"[GENERATE IMAGE] A cute kawaii angry frustrated emoji face icon, furrowed brows, steam puffs, red cheeks, pouting, kawaii style, red tones, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    # --- Seasonal Ingredients (7) - Green screen ---
    ("ingredients/sakura_jelly.webp",
     f"[GENERATE IMAGE] A cute kawaii food icon of pink sakura cherry blossom jelly cube, translucent glossy, flower petals inside, food illustration, kawaii style, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("ingredients/sakura_syrup.webp",
     f"[GENERATE IMAGE] A cute kawaii food icon of pink sakura cherry blossom syrup bottle, liquid inside, cute label with sakura design, kawaii style, food illustration, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("ingredients/eyeball_jelly.webp",
     f"[GENERATE IMAGE] A cute kawaii cartoon eyeball jelly dessert, red iris, white jelly base, halloween themed, cute spooky not scary, kawaii horror style, food illustration, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("ingredients/spider_web_coconut.webp",
     f"[GENERATE IMAGE] A cute kawaii food icon of white coconut jelly cube with black spider web pattern on top, halloween themed, cute spooky style, food illustration, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("ingredients/gingerbread.webp",
     f"[GENERATE IMAGE] A cute kawaii food icon of gingerbread man cookie, christmas themed, white icing decoration, warm brown colors, festive cute style, food illustration, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("ingredients/marshmallow.webp",
     f"[GENERATE IMAGE] A cute kawaii food icon of fluffy soft marshmallow, pink and white swirl, squishy and bouncy looking, christmas theme, kawaii style, food illustration, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("ingredients/mint.webp",
     f"[GENERATE IMAGE] A cute kawaii food icon of fresh green mint leaves with candy cane, green and white striped, refreshing cool, christmas mint flavor, kawaii style, food illustration, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    # --- Combo Effects (7) - Green screen ---
    ("effects/spark_particles.webp",
     f"[GENERATE IMAGE] Bright yellow and orange spark particle effects, glowing fire sparks, various sizes scattered, mobile game VFX visual effect, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("effects/rainbow_ring.webp",
     f"[GENERATE IMAGE] Glowing rainbow colored ring effect, semi-transparent gradient circle, magical aura, mobile game VFX, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("effects/star_particles.webp",
     f"[GENERATE IMAGE] Golden and white star particle effects, various sizes scattered, twinkling sparkles, mobile game VFX visual effect, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("effects/gold_explosion.webp",
     f"[GENERATE IMAGE] Golden explosion burst effect, radiating light rays, dramatic impact, orange and gold colors, mobile game VFX, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("effects/cup_jump.webp",
     f"[GENERATE IMAGE] Golden light burst celebration effect, radiating glow upward, achievement success visual, mobile game VFX, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("effects/content_splash.webp",
     f"[GENERATE IMAGE] Colorful liquid splash droplets effect, dynamic motion splatter, rainbow colors, mobile game VFX, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    ("effects/overflow.webp",
     f"[GENERATE IMAGE] Bubbles and foam overflow fizzy effect, white and pastel colored bubbles rising, carbonated drink overflow, mobile game VFX, {GREEN_BG}. aspect ratio 1:1, 1K resolution"),

    # --- Customers (already generated) ---
    ("customers/customer_office_worker.webp",
     "[GENERATE IMAGE] A cute kawaii chibi office worker character portrait, wearing dark blue business suit, small tie, holding tiny briefcase, short black hair, big sparkly eyes, gentle smile, kawaii style, super deformed chibi, pastel colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),

    ("customers/customer_student.webp",
     "[GENERATE IMAGE] A cute kawaii chibi high school student character portrait, wearing white school uniform with blue ribbon, backpack straps visible, cheerful bright expression, twin ponytails brown hair, big sparkly eyes, kawaii style, super deformed chibi, pastel colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),

    ("customers/customer_blogger.webp",
     "[GENERATE IMAGE] A cute kawaii chibi social media influencer character portrait, holding smartphone taking selfie, fashionable trendy outfit, cat ear headphones, pink dyed hair, winking expression, kawaii style, super deformed chibi, vibrant colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),

    ("customers/customer_demon.webp",
     "[GENERATE IMAGE] A cute kawaii chibi mischievous little demon character portrait, small red horns, playful tongue out expression, purple and red color scheme, tiny bat wings, cute not scary, kawaii style, super deformed chibi, vibrant colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),

    ("customers/customer_vip.webp",
     "[GENERATE IMAGE] A cute kawaii chibi VIP rich customer character portrait, wearing golden crown, sunglasses, gold chain necklace, confident elegant smile, luxury designer clothes, kawaii style, super deformed chibi, gold and purple colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),

    ("customers/customer_mystery.webp",
     "[GENERATE IMAGE] A cute kawaii chibi mysterious hooded character portrait, wearing dark cloak with hood, glowing purple eyes, question mark symbol floating above head, magical sparkles aura, kawaii style, super deformed chibi, purple and dark blue colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),

    ("customers/customer_grandpa.webp",
     "[GENERATE IMAGE] A cute kawaii chibi old grandma character portrait, wearing traditional Chinese-style clothes, gray hair in bun, kind warm smile, reading glasses, holding a small cat, kawaii style, super deformed chibi, warm pastel colors, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution"),
]

def get_browser_ws():
    version = requests.get(f"{CDP_URL}/json/version", timeout=5).json()
    return version['webSocketDebuggerUrl']

class CDP:
    def __init__(self):
        self.ws = None
        self.session_id = None
        self.target_id = None
        self.msg_id = 0

    def connect(self):
        browser_ws = get_browser_ws()
        self.ws = websocket.create_connection(browser_ws, timeout=30, suppress_origin=True)
        r = self._browser_cmd("Target.createTarget", {"url": "about:blank"})
        self.target_id = r['result']['targetId']
        r = self._browser_cmd("Target.attachToTarget", {"targetId": self.target_id, "flatten": True})
        self.session_id = r['result']['sessionId']

    def disconnect(self):
        try:
            if self.target_id:
                self._browser_cmd("Target.closeTarget", {"targetId": self.target_id})
        except: pass
        try:
            if self.ws: self.ws.close()
        except: pass

    def eval(self, expr):
        self.msg_id += 1
        mid = self.msg_id
        self.ws.send(json.dumps({
            "id": mid, "method": "Runtime.evaluate",
            "params": {"expression": expr}, "sessionId": self.session_id
        }))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == mid:
                res = r.get('result', {}).get('result', {})
                if res.get('subtype') == 'error': return None
                return res.get('value')

    def navigate(self, url):
        self.msg_id += 1
        mid = self.msg_id
        self.ws.send(json.dumps({
            "id": mid, "method": "Page.navigate",
            "params": {"url": url}, "sessionId": self.session_id
        }))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == mid: return r

    def _browser_cmd(self, method, params=None):
        self.msg_id += 1
        mid = self.msg_id
        cmd = {"id": mid, "method": method}
        if params: cmd["params"] = params
        self.ws.send(json.dumps(cmd))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == mid: return r


CHECK_JS = """(() => {
    const imgs = document.querySelectorAll('img');
    for (const img of imgs) {
        const s = img.src || '';
        if (s.startsWith('blob:') && img.naturalWidth > 200 && img.naturalHeight > 200) {
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


def generate_one(cdp, filename, prompt):
    """Generate one image using existing CDP session."""
    out_path = os.path.join(ASSETS_DIR, filename)

    # Skip if already exists
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        print(f"  SKIP (exists)")
        return True

    # Navigate to new Gemini conversation
    cdp.navigate("https://gemini.google.com/app")
    time.sleep(6)

    # Type prompt
    escaped = json.dumps(prompt)
    type_js = f"""(() => {{
        const e = document.querySelector('div[contenteditable="true"]');
        if (!e) return 'no_editor';
        e.focus();
        e.textContent = {escaped};
        e.dispatchEvent(new Event('input', {{bubbles: true}}));
        return 'typed';
    }})()"""
    r = cdp.eval(type_js)
    if r != 'typed':
        print(f"  FAIL type: {r}")
        return False
    time.sleep(1)

    # Send
    send_js = """(() => {
        const b = document.querySelector('button[aria-label="发送"]') ||
                  document.querySelector('button[aria-label="Send"]');
        if (b) { b.click(); return 'sent'; }
        return 'no_btn';
    })()"""
    r = cdp.eval(send_js)
    if r != 'sent':
        print(f"  FAIL send: {r}")
        return False

    # Wait for image
    start = time.time()
    while time.time() - start < TIMEOUT:
        du = cdp.eval(CHECK_JS)
        if du and ',' in du:
            _, b64 = du.split(',', 1)
            img_bytes = base64.b64decode(b64)
            png_path = out_path.replace('.webp', '.png')
            with open(png_path, 'wb') as f:
                f.write(img_bytes)
            # Convert to webp
            result = subprocess.run(
                ['cwebp', '-q', '80', png_path, '-o', out_path],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                os.remove(png_path)
            else:
                # cwebp not available, keep png
                os.rename(png_path, out_path.replace('.webp', '.png'))
                out_path = out_path.replace('.webp', '.png')
            sz = os.path.getsize(out_path)
            print(f"  OK: {sz}B")
            return True
        time.sleep(3)
    
    print(f"  TIMEOUT")
    return False


def main():
    # Filter by category if specified
    category = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    images = IMAGES
    if category == "customers":
        images = [i for i in IMAGES if i[0].startswith("customers/")]
    elif category == "moods":
        images = [i for i in IMAGES if i[0].startswith("moods/")]
    elif category == "ingredients":
        images = [i for i in IMAGES if i[0].startswith("ingredients/")]
    elif category == "effects":
        images = [i for i in IMAGES if i[0].startswith("effects/")]
    elif category == "all_icons":
        images = [i for i in IMAGES if not i[0].startswith("customers/")]

    print(f"Generating {len(images)} images...")
    
    cdp = CDP()
    try:
        cdp.connect()
        print(f"Connected to browser")
    except Exception as e:
        print(f"FAIL connect: {e}")
        sys.exit(1)

    ok = 0
    for i, (filename, prompt) in enumerate(images):
        print(f"[{i+1}/{len(images)}] {filename}", flush=True)
        if generate_one(cdp, filename, prompt):
            ok += 1
        if i < len(images) - 1:
            time.sleep(DELAY)

    cdp.disconnect()
    print(f"\nDone: {ok}/{len(images)} success")


if __name__ == "__main__":
    main()
