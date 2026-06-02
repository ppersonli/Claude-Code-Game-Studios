#!/usr/bin/env python3
"""
Gemini Image Generation MCP Server
通过 Chrome CDP 控制 Gemini 生成图片
"""
import json
import sys
import os
import time
import base64
import subprocess
import requests
import websocket
import traceback
from typing import Optional

# MCP 协议消息
def send_response(msg_id, result):
    """发送 MCP JSON-RPC 响应"""
    resp = {
        "jsonrpc": "2.0",
        "id": msg_id,
        "result": result
    }
    print(json.dumps(resp), flush=True)

def send_error(msg_id, code, message, data=None):
    """发送 MCP JSON-RPC 错误"""
    error = {"code": code, "message": message}
    if data:
        error["data"] = data
    resp = {
        "jsonrpc": "2.0",
        "id": msg_id,
        "error": error
    }
    print(json.dumps(resp), flush=True)

def send_notification(method, params):
    """发送 MCP 通知"""
    notif = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params
    }
    print(json.dumps(notif), flush=True)

# === CDP / Gemini 核心逻辑 ===

CDP_URL = os.environ.get("CDP_URL", "http://127.0.0.1:9223")
DEFAULT_OUTPUT_DIR = os.environ.get("OUTPUT_DIR", os.path.expanduser("~/Desktop/cc-games/public/assets"))
DEFAULT_TIMEOUT = int(os.environ.get("DEFAULT_TIMEOUT", "90"))

class GeminiCDP:
    """Chrome DevTools Protocol 控制 Gemini"""
    
    def __init__(self):
        self.ws = None
        self.session_id = None
        self.msg_id = 0
        self.target_id = None
    
    def connect(self) -> bool:
        """连接到 Chrome 浏览器并创建新标签页"""
        try:
            # 获取浏览器 WS 地址
            version = requests.get(f"{CDP_URL}/json/version", timeout=5).json()
            browser_ws = version['webSocketDebuggerUrl']
            
            # 连接到浏览器
            self.ws = websocket.create_connection(
                browser_ws, timeout=30, suppress_origin=True
            )
            
            # 创建新标签页
            result = self._send_browser_cmd("Target.createTarget", {"url": "about:blank"})
            self.target_id = result['result']['targetId']
            
            # 附加到标签页
            result = self._send_browser_cmd("Target.attachToTarget", {
                "targetId": self.target_id,
                "flatten": True
            })
            self.session_id = result['result']['sessionId']
            
            return True
        except Exception as e:
            self._log(f"Connect error: {e}")
            return False
    
    def disconnect(self):
        """断开连接并关闭标签页"""
        try:
            if self.target_id and self.ws:
                self._send_browser_cmd("Target.closeTarget", {"targetId": self.target_id})
        except:
            pass
        try:
            if self.ws:
                self.ws.close()
        except:
            pass
        self.ws = None
        self.session_id = None
        self.target_id = None
    
    def navigate(self, url: str):
        """导航到 URL"""
        self._send_session_cmd("Page.navigate", {"url": url})
        time.sleep(6)  # Gemini 需要 6-10 秒加载
    
    def evaluate(self, expr: str) -> any:
        """在标签页中执行 JavaScript"""
        self.msg_id += 1
        mid = self.msg_id
        cmd = {
            "id": mid,
            "method": "Runtime.evaluate",
            "params": {"expression": expr},
            "sessionId": self.session_id
        }
        self.ws.send(json.dumps(cmd))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == mid:
                result = r.get('result', {}).get('result', {})
                if result.get('subtype') == 'error':
                    return None
                return result.get('value')
    
    def generate_image(self, prompt: str, timeout: int = 90) -> Optional[str]:
        """生成图片并返回 base64 数据"""
        # 导航到 Gemini
        self.navigate("https://gemini.google.com/app")
        
        # 记录当前已有的 blob URLs（排除旧图）
        old_blobs_js = """(() => {
            const blobs = new Set();
            document.querySelectorAll('img').forEach(img => {
                if (img.src && img.src.startsWith('blob:')) blobs.add(img.src);
            });
            return JSON.stringify([...blobs]);
        })()"""
        old_blobs = set(json.loads(self.evaluate(old_blobs_js) or "[]"))
        
        # 输入 prompt
        escaped = json.dumps(prompt)
        type_js = f"""(() => {{
            const e = document.querySelector('div[contenteditable="true"]');
            if (!e) return 'no_editor';
            e.focus();
            e.textContent = {escaped};
            e.dispatchEvent(new Event('input', {{bubbles: true}}));
            return 'typed';
        }})()"""
        
        result = self.evaluate(type_js)
        if result != 'typed':
            self._log(f"Type failed: {result}")
            return None
        
        time.sleep(1)
        
        # 点击发送
        send_js = """(() => {
            const b = document.querySelector('button[aria-label="发送"]') ||
                      document.querySelector('button[aria-label="Send"]');
            if (b) { b.click(); return 'sent'; }
            return 'no_btn';
        })()"""
        
        result = self.evaluate(send_js)
        if result != 'sent':
            self._log(f"Send failed: {result}")
            return None
        
        # 等待生成图片
        check_js = """(() => {
            const imgs = document.querySelectorAll('img');
            for (const img of imgs) {
                const s = img.src || '';
                const a = img.alt || '';
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
        
        start = time.time()
        while time.time() - start < timeout:
            data_url = self.evaluate(check_js)
            if data_url and ',' in data_url:
                _, b64_data = data_url.split(',', 1)
                return b64_data
            time.sleep(3)
        
        return None
    
    def _send_browser_cmd(self, method, params=None):
        """发送浏览器级 CDP 命令"""
        self.msg_id += 1
        mid = self.msg_id
        cmd = {"id": mid, "method": method}
        if params:
            cmd["params"] = params
        self.ws.send(json.dumps(cmd))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == mid:
                return r
    
    def _send_session_cmd(self, method, params=None):
        """发送会话级 CDP 命令"""
        self.msg_id += 1
        mid = self.msg_id
        cmd = {
            "id": mid,
            "method": method,
            "sessionId": self.session_id
        }
        if params:
            cmd["params"] = params
        self.ws.send(json.dumps(cmd))
        while True:
            r = json.loads(self.ws.recv())
            if r.get('id') == mid:
                return r
    
    def _log(self, msg: str):
        """发送日志通知"""
        send_notification("notifications/message", {"level": "info", "data": msg})


# === MCP 工具实现 ===

def tool_generate_image(prompt: str, output_path: str, timeout: int = 90, aspect_ratio: str = "1:1") -> dict:
    """
    生成单张图片
    """
    # 确保 prompt 以 [GENERATE IMAGE] 开头
    if not prompt.startswith("[GENERATE"):
        prompt = f"[GENERATE IMAGE] {prompt}"
    
    # 添加宽高比
    if aspect_ratio and "aspect ratio" not in prompt.lower():
        prompt += f" aspect ratio {aspect_ratio}, 1K resolution"
    
    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    
    cdp = GeminiCDP()
    try:
        if not cdp.connect():
            return {"success": False, "error": "无法连接到 Chrome。请确保 Chrome 已启动并使用 --remote-debugging-port=9223"}
        
        b64_data = cdp.generate_image(prompt, timeout)
        if not b64_data:
            return {"success": False, "error": "图片生成超时或失败"}
        
        # 保存为 PNG
        img_bytes = base64.b64decode(b64_data)
        png_path = output_path
        
        # 如果目标是 webp，先保存 png 再转换
        if output_path.endswith('.webp'):
            png_path = output_path.replace('.webp', '.png')
        
        with open(png_path, 'wb') as f:
            f.write(img_bytes)
        
        # 转换为 webp（如果可用）
        if output_path.endswith('.webp'):
            result = subprocess.run(
                ['cwebp', '-q', '80', png_path, '-o', output_path],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                os.remove(png_path)
            else:
                # cwebp 不可用，保留 png
                output_path = png_path
        
        size = os.path.getsize(output_path)
        return {
            "success": True,
            "path": output_path,
            "size_bytes": size,
            "prompt_used": prompt
        }
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}
    finally:
        cdp.disconnect()


def tool_batch_generate(images: list, timeout: int = 90, delay: int = 15) -> dict:
    """
    批量生成多张图片
    images: [{"filename": "name.webp", "prompt": "...", "aspect_ratio": "1:1"}]
    """
    results = []
    total = len(images)
    
    for i, img_info in enumerate(images):
        filename = img_info.get("filename", f"image_{i}.png")
        prompt = img_info.get("prompt", "")
        aspect_ratio = img_info.get("aspect_ratio", "1:1")
        output_path = os.path.join(DEFAULT_OUTPUT_DIR, filename)
        
        send_notification("notifications/message", {
            "level": "info",
            "data": f"[{i+1}/{total}] 正在生成: {filename}"
        })
        
        result = tool_generate_image(prompt, output_path, timeout, aspect_ratio)
        results.append({
            "filename": filename,
            "success": result.get("success", False),
            "path": result.get("path", ""),
            "error": result.get("error", "")
        })
        
        # 批次间延迟（最后一张不需要）
        if i < total - 1:
            time.sleep(delay)
    
    success_count = sum(1 for r in results if r["success"])
    return {
        "total": total,
        "success": success_count,
        "failed": total - success_count,
        "results": results
    }


def tool_check_chrome() -> dict:
    """检查 Chrome 是否可用"""
    try:
        version = requests.get(f"{CDP_URL}/json/version", timeout=5).json()
        tabs = requests.get(f"{CDP_URL}/json/list", timeout=5).json()
        
        gemini_tabs = [t for t in tabs if 'gemini' in t.get('url', '').lower()]
        
        return {
            "connected": True,
            "browser": version.get("Browser", "unknown"),
            "webSocketDebuggerUrl": version.get("webSocketDebuggerUrl", ""),
            "total_tabs": len(tabs),
            "gemini_tabs": len(gemini_tabs),
            "cdp_url": CDP_URL
        }
    except requests.exceptions.ConnectionError:
        return {
            "connected": False,
            "error": f"无法连接到 {CDP_URL}。请确保 Chrome 已启动：\n"
                     f"/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9223"
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}


def tool_list_generated(directory: str = "") -> dict:
    """列出已生成的图片文件"""
    target_dir = directory or DEFAULT_OUTPUT_DIR
    if not os.path.exists(target_dir):
        return {"exists": False, "directory": target_dir, "files": []}
    
    files = []
    for f in sorted(os.listdir(target_dir)):
        if f.endswith(('.png', '.webp', '.jpg', '.jpeg')):
            path = os.path.join(target_dir, f)
            files.append({
                "name": f,
                "path": path,
                "size_bytes": os.path.getsize(path),
                "modified": time.ctime(os.path.getmtime(path))
            })
    
    return {
        "exists": True,
        "directory": target_dir,
        "count": len(files),
        "files": files
    }


# === MCP Server 主循环 ===

TOOLS = {
    "generate_image": {
        "name": "generate_image",
        "description": "使用 Gemini AI 生成单张图片。需要提供英文 prompt。支持指定输出路径和宽高比。"
                       "图片会通过 Chrome CDP 在 Gemini 中生成。"
                       "前提: Chrome 需以 --remote-debugging-port=9223 启动并已登录 Google 账号。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "图片生成的英文提示词。会自动添加 [GENERATE IMAGE] 前缀。"
                                   "建议使用详细描述，包含风格、颜色、背景等。"
                                   "例如: 'A cute kawaii bubble tea icon, pastel colors, WHITE BACKGROUND'"
                },
                "output_path": {
                    "type": "string",
                    "description": "输出文件的完整路径。支持 .png 和 .webp 格式。"
                                   "例如: /Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba.webp"
                },
                "timeout": {
                    "type": "integer",
                    "description": "生成超时时间（秒），默认 90",
                    "default": 90
                },
                "aspect_ratio": {
                    "type": "string",
                    "description": "图片宽高比，如 '1:1', '16:9', '9:16'。默认 '1:1'",
                    "default": "1:1"
                }
            },
            "required": ["prompt", "output_path"]
        }
    },
    "batch_generate": {
        "name": "batch_generate",
        "description": "批量生成多张图片。每张图使用独立的 prompt，自动创建新的 Gemini 会话。"
                       "批次间有 15 秒延迟以避免被检测为机器人。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "images": {
                    "type": "array",
                    "description": "图片列表，每个元素包含 filename, prompt, aspect_ratio",
                    "items": {
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string", "description": "输出文件名（不含路径）"},
                            "prompt": {"type": "string", "description": "英文提示词"},
                            "aspect_ratio": {"type": "string", "default": "1:1"}
                        },
                        "required": ["filename", "prompt"]
                    }
                },
                "timeout": {"type": "integer", "default": 90},
                "delay": {"type": "integer", "description": "批次间延迟秒数", "default": 15}
            },
            "required": ["images"]
        }
    },
    "check_chrome": {
        "name": "check_chrome",
        "description": "检查 Chrome CDP 是否可用，以及 Gemini 标签页状态。"
                       "用于在生成图片前诊断连接问题。",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    "list_generated": {
        "name": "list_generated",
        "description": "列出指定目录下已生成的图片文件，显示文件名、大小和修改时间。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "directory": {
                    "type": "string",
                    "description": "要扫描的目录路径。默认扫描项目 assets 目录。",
                    "default": ""
                }
            },
            "required": []
        }
    }
}


def handle_request(line: str):
    """处理单条 JSON-RPC 请求"""
    try:
        msg = json.loads(line)
    except json.JSONDecodeError:
        return
    
    method = msg.get("method", "")
    msg_id = msg.get("id")
    params = msg.get("params", {})
    
    # MCP 初始化握手
    if method == "initialize":
        send_response(msg_id, {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "serverInfo": {
                "name": "gemini-image-gen",
                "version": "1.0.0"
            }
        })
        return
    
    if method == "initialized":
        # 无需回复
        return
    
    if method == "tools/list":
        send_response(msg_id, {
            "tools": list(TOOLS.values())
        })
        return
    
    if method == "tools/call":
        tool_name = params.get("name", "")
        tool_args = params.get("arguments", {})
        
        if tool_name == "generate_image":
            result = tool_generate_image(
                prompt=tool_args.get("prompt", ""),
                output_path=tool_args.get("output_path", ""),
                timeout=tool_args.get("timeout", DEFAULT_TIMEOUT),
                aspect_ratio=tool_args.get("aspect_ratio", "1:1")
            )
            content = [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]
            send_response(msg_id, {"content": content, "isError": not result.get("success")})
            return
        
        if tool_name == "batch_generate":
            result = tool_batch_generate(
                images=tool_args.get("images", []),
                timeout=tool_args.get("timeout", DEFAULT_TIMEOUT),
                delay=tool_args.get("delay", 15)
            )
            content = [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]
            send_response(msg_id, {"content": content, "isError": result.get("success", 0) == 0})
            return
        
        if tool_name == "check_chrome":
            result = tool_check_chrome()
            content = [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]
            send_response(msg_id, {"content": content})
            return
        
        if tool_name == "list_generated":
            result = tool_list_generated(tool_args.get("directory", ""))
            content = [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]
            send_response(msg_id, {"content": content})
            return
        
        send_error(msg_id, -32601, f"Unknown tool: {tool_name}")
        return
    
    # 其他未知方法
    if msg_id is not None:
        send_error(msg_id, -32601, f"Method not found: {method}")


def main():
    """MCP Server 主循环 (stdio)"""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            handle_request(line)
        except Exception as e:
            # 发送错误日志
            send_notification("notifications/message", {
                "level": "error",
                "data": f"Unhandled error: {e}\n{traceback.format_exc()}"
            })


if __name__ == "__main__":
    main()
