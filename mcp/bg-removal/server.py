#!/usr/bin/env python3
"""
Background Removal MCP Server
AI 抠图服务 - 使用 rembg + onnxruntime 移除图片背景
"""
import json
import sys
import os
import io
import time
import traceback
import subprocess
from typing import Optional
from pathlib import Path

# MCP 协议消息
def send_response(msg_id, result):
    resp = {"jsonrpc": "2.0", "id": msg_id, "result": result}
    print(json.dumps(resp), flush=True)

def send_error(msg_id, code, message, data=None):
    error = {"code": code, "message": message}
    if data:
        error["data"] = data
    print(json.dumps({"jsonrpc": "2.0", "id": msg_id, "error": error}), flush=True)

def send_notification(method, params):
    print(json.dumps({"jsonrpc": "2.0", "method": method, "params": params}), flush=True)

# === 抠图核心逻辑 ===

# 尝试导入 rembg
REMBG_AVAILABLE = False
try:
    from rembg import remove, new_session
    from PIL import Image
    REMBG_AVAILABLE = True
except ImportError:
    pass

# 尝试导入 Pillow
PIL_AVAILABLE = False
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    pass


def ensure_dependencies() -> dict:
    """确保依赖已安装"""
    missing = []
    
    if not PIL_AVAILABLE:
        missing.append("Pillow")
    if not REMBG_AVAILABLE:
        missing.append("rembg[cpu]")
    
    if missing:
        packages = " ".join(missing)
        send_notification("notifications/message", {
            "level": "info",
            "data": f"正在安装缺失依赖: {packages}"
        })
        
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", packages],
            capture_output=True, text=True, timeout=300
        )
        
        if result.returncode != 0:
            return {
                "installed": False,
                "error": result.stderr,
                "missing": missing
            }
        
        # 重新导入
        import importlib
        try:
            importlib.invalidate_caches()
            from PIL import Image
            from rembg import remove, new_session
        except ImportError as e:
            return {"installed": False, "error": str(e)}
    
    return {"installed": True}


def remove_background(
    input_path: str,
    output_path: str,
    model: str = "u2net",
    alpha_matting: bool = False,
    post_process: bool = True
) -> dict:
    """
    移除图片背景
    
    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径（PNG，带透明通道）
        model: 模型名称 (u2net, u2net_human_seg, isnet-general-use, etc.)
        alpha_matting: 是否启用 alpha matting（更精细的边缘）
        post_process: 是否后处理优化
    
    Returns:
        处理结果字典
    """
    dep_check = ensure_dependencies()
    if not dep_check.get("installed"):
        return {"success": False, "error": f"依赖安装失败: {dep_check.get('error')}"}
    
    try:
        from rembg import remove, new_session
        from PIL import Image
        
        if not os.path.exists(input_path):
            return {"success": False, "error": f"输入文件不存在: {input_path}"}
        
        # 读取输入图片
        input_img = Image.open(input_path)
        original_size = input_img.size
        
        send_notification("notifications/message", {
            "level": "info",
            "data": f"处理中: {input_path} ({original_size[0]}x{original_size[1]})"
        })
        
        # 创建模型 session（可缓存）
        session = new_session(model)
        
        # 移除背景
        start_time = time.time()
        output_img = remove(
            input_img,
            session=session,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10,
            post_process_mask=post_process,
        )
        elapsed = time.time() - start_time
        
        # 确保输出目录存在
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # 保存为 PNG（保留透明通道）
        output_img.save(output_path, "PNG")
        
        input_size = os.path.getsize(input_path)
        output_size = os.path.getsize(output_path)
        
        return {
            "success": True,
            "input_path": input_path,
            "output_path": output_path,
            "input_size_bytes": input_size,
            "output_size_bytes": output_size,
            "dimensions": {"width": original_size[0], "height": original_size[1]},
            "model": model,
            "processing_time_seconds": round(elapsed, 2),
            "alpha_matting": alpha_matting
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


def batch_remove_background(
    files: list,
    output_dir: str = "",
    model: str = "u2net"
) -> dict:
    """
    批量移除多张图片的背景
    files: [{"input": "/path/to/input.png", "output": "/path/to/output.png"}]
    """
    dep_check = ensure_dependencies()
    if not dep_check.get("installed"):
        return {"success": False, "error": f"依赖安装失败: {dep_check.get('error')}"}
    
    from rembg import new_session
    
    results = []
    total = len(files)
    
    # 预加载模型（共享 session）
    try:
        session = new_session(model)
    except Exception as e:
        return {"success": False, "error": f"模型加载失败: {e}"}
    
    from rembg import remove
    from PIL import Image
    
    for i, file_info in enumerate(files):
        input_path = file_info.get("input", "")
        output_path = file_info.get("output", "")
        
        # 如果没有指定输出路径，自动生成
        if not output_path:
            if output_dir:
                basename = os.path.splitext(os.path.basename(input_path))[0]
                output_path = os.path.join(output_dir, f"{basename}_nobg.png")
            else:
                output_path = input_path.replace(".png", "_nobg.png").replace(".jpg", "_nobg.png").replace(".webp", "_nobg.png")
        
        send_notification("notifications/message", {
            "level": "info",
            "data": f"[{i+1}/{total}] 抠图: {os.path.basename(input_path)}"
        })
        
        try:
            if not os.path.exists(input_path):
                results.append({
                    "input": input_path,
                    "success": False,
                    "error": "文件不存在"
                })
                continue
            
            img = Image.open(input_path)
            result_img = remove(img, session=session)
            
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            result_img.save(output_path, "PNG")
            
            results.append({
                "input": input_path,
                "output": output_path,
                "success": True,
                "size_bytes": os.path.getsize(output_path)
            })
        except Exception as e:
            results.append({
                "input": input_path,
                "success": False,
                "error": str(e)
            })
    
    success_count = sum(1 for r in results if r.get("success"))
    return {
        "total": total,
        "success": success_count,
        "failed": total - success_count,
        "results": results,
        "model": model
    }


def crop_transparent(input_path: str, output_path: str = "", padding: int = 0) -> dict:
    """
    裁剪透明区域
    """
    dep_check = ensure_dependencies()
    if not dep_check.get("installed"):
        return {"success": False, "error": "Pillow 未安装"}
    
    from PIL import Image
    
    try:
        if not output_path:
            base, ext = os.path.splitext(input_path)
            output_path = f"{base}_cropped{ext}"
        
        img = Image.open(input_path)
        
        if img.mode != 'RGBA':
            return {"success": False, "error": "图片没有透明通道，无法裁剪"}
        
        # 获取边界框
        bbox = img.getbbox()
        if not bbox:
            return {"success": False, "error": "图片全透明，无法裁剪"}
        
        # 添加 padding
        if padding > 0:
            x1 = max(0, bbox[0] - padding)
            y1 = max(0, bbox[1] - padding)
            x2 = min(img.width, bbox[2] + padding)
            y2 = min(img.height, bbox[3] + padding)
            bbox = (x1, y1, x2, y2)
        
        cropped = img.crop(bbox)
        
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        cropped.save(output_path, "PNG")
        
        return {
            "success": True,
            "input_path": input_path,
            "output_path": output_path,
            "original_size": {"width": img.width, "height": img.height},
            "cropped_size": {"width": cropped.width, "height": cropped.height},
            "bbox": list(bbox),
            "size_bytes": os.path.getsize(output_path)
        }
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def convert_format(input_path: str, output_path: str, quality: int = 80) -> dict:
    """
    图片格式转换
    支持 PNG ↔ WebP ↔ JPG
    """
    dep_check = ensure_dependencies()
    if not dep_check.get("installed"):
        return {"success": False, "error": "Pillow 未安装"}
    
    from PIL import Image
    
    try:
        if not os.path.exists(input_path):
            return {"success": False, "error": f"输入文件不存在: {input_path}"}
        
        img = Image.open(input_path)
        
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        
        # 根据输出扩展名确定格式
        ext = os.path.splitext(output_path)[1].lower()
        format_map = {
            '.png': 'PNG',
            '.webp': 'WEBP',
            '.jpg': 'JPEG',
            '.jpeg': 'JPEG',
        }
        
        fmt = format_map.get(ext, 'PNG')
        
        # JPEG 不支持透明通道
        if fmt == 'JPEG' and img.mode == 'RGBA':
            # 将透明部分替换为白色背景
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif fmt == 'JPEG' and img.mode != 'RGB':
            img = img.convert('RGB')
        
        save_kwargs = {}
        if fmt in ('JPEG', 'WEBP'):
            save_kwargs['quality'] = quality
        
        img.save(output_path, fmt, **save_kwargs)
        
        return {
            "success": True,
            "input_path": input_path,
            "output_path": output_path,
            "format": fmt,
            "size_bytes": os.path.getsize(output_path),
            "dimensions": {"width": img.width, "height": img.height}
        }
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def resize_image(input_path: str, output_path: str, width: int = 0, height: int = 0, keep_aspect: bool = True) -> dict:
    """
    调整图片尺寸
    """
    dep_check = ensure_dependencies()
    if not dep_check.get("installed"):
        return {"success": False, "error": "Pillow 未安装"}
    
    from PIL import Image
    
    try:
        if not output_path:
            base, ext = os.path.splitext(input_path)
            output_path = f"{base}_{width}x{height}{ext}"
        
        img = Image.open(input_path)
        original_size = img.size
        
        if keep_aspect and width > 0 and height > 0:
            img.thumbnail((width, height), Image.LANCZOS)
        elif width > 0 and height > 0:
            img = img.resize((width, height), Image.LANCZOS)
        elif width > 0:
            ratio = width / img.width
            img = img.resize((width, int(img.height * ratio)), Image.LANCZOS)
        elif height > 0:
            ratio = height / img.height
            img = img.resize((int(img.width * ratio), height), Image.LANCZOS)
        
        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        img.save(output_path, "PNG")
        
        return {
            "success": True,
            "input_path": input_path,
            "output_path": output_path,
            "original_size": {"width": original_size[0], "height": original_size[1]},
            "new_size": {"width": img.width, "height": img.height},
            "size_bytes": os.path.getsize(output_path)
        }
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


# === MCP Server ===

TOOLS = {
    "remove_background": {
        "name": "remove_background",
        "description": "使用 AI 模型移除图片背景，输出透明 PNG。"
                       "支持多种模型: u2net (通用), u2net_human_seg (人物), isnet-general-use (高质量)。"
                       "首次运行会自动安装 rembg 和 Pillow 依赖。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "input_path": {
                    "type": "string",
                    "description": "输入图片的完整路径"
                },
                "output_path": {
                    "type": "string",
                    "description": "输出 PNG 路径（带透明通道）"
                },
                "model": {
                    "type": "string",
                    "description": "AI 模型: u2net (通用默认), u2net_human_seg (人物), isnet-general-use (高质量)",
                    "default": "u2net",
                    "enum": ["u2net", "u2net_human_seg", "isnet-general-use", "isnet-anime", "birefnet-general"]
                },
                "alpha_matting": {
                    "type": "boolean",
                    "description": "启用 alpha matting 获得更精细的边缘（适合毛发等）",
                    "default": False
                },
                "post_process": {
                    "type": "boolean",
                    "description": "后处理优化掩码",
                    "default": True
                }
            },
            "required": ["input_path", "output_path"]
        }
    },
    "batch_remove_background": {
        "name": "batch_remove_background",
        "description": "批量移除多张图片的背景。使用共享模型 session 加速处理。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "files": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "input": {"type": "string", "description": "输入路径"},
                            "output": {"type": "string", "description": "输出路径（可选）"}
                        },
                        "required": ["input"]
                    }
                },
                "output_dir": {"type": "string", "description": "默认输出目录", "default": ""},
                "model": {"type": "string", "default": "u2net"}
            },
            "required": ["files"]
        }
    },
    "crop_transparent": {
        "name": "crop_transparent",
        "description": "裁剪 PNG 图片的透明区域，只保留有内容的部分。可选添加 padding。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "input_path": {"type": "string", "description": "输入 PNG 路径"},
                "output_path": {"type": "string", "description": "输出路径（可选）", "default": ""},
                "padding": {"type": "integer", "description": "四周添加的像素 padding", "default": 0}
            },
            "required": ["input_path"]
        }
    },
    "convert_format": {
        "name": "convert_format",
        "description": "图片格式转换。支持 PNG, WebP, JPEG 互转。"
                       "JPEG 会自动将透明区域替换为白色背景。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "input_path": {"type": "string"},
                "output_path": {"type": "string", "description": "输出路径（扩展名决定格式）"},
                "quality": {"type": "integer", "description": "JPEG/WebP 质量 (1-100)", "default": 80}
            },
            "required": ["input_path", "output_path"]
        }
    },
    "resize_image": {
        "name": "resize_image",
        "description": "调整图片尺寸。支持指定宽高或等比缩放。使用 LANCZOS 高质量重采样。",
        "inputSchema": {
            "type": "object",
            "properties": {
                "input_path": {"type": "string"},
                "output_path": {"type": "string", "default": ""},
                "width": {"type": "integer", "description": "目标宽度（0表示按高度等比）", "default": 0},
                "height": {"type": "integer", "description": "目标高度（0表示按宽度等比）", "default": 0},
                "keep_aspect": {"type": "boolean", "description": "保持宽高比", "default": True}
            },
            "required": ["input_path"]
        }
    }
}


def handle_request(line: str):
    try:
        msg = json.loads(line)
    except json.JSONDecodeError:
        return
    
    method = msg.get("method", "")
    msg_id = msg.get("id")
    params = msg.get("params", {})
    
    if method == "initialize":
        send_response(msg_id, {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {
                "name": "bg-removal",
                "version": "1.0.0"
            }
        })
        return
    
    if method == "initialized":
        return
    
    if method == "tools/list":
        send_response(msg_id, {"tools": list(TOOLS.values())})
        return
    
    if method == "tools/call":
        tool_name = params.get("name", "")
        tool_args = params.get("arguments", {})
        
        tool_map = {
            "remove_background": lambda: remove_background(
                input_path=tool_args.get("input_path", ""),
                output_path=tool_args.get("output_path", ""),
                model=tool_args.get("model", "u2net"),
                alpha_matting=tool_args.get("alpha_matting", False),
                post_process=tool_args.get("post_process", True)
            ),
            "batch_remove_background": lambda: batch_remove_background(
                files=tool_args.get("files", []),
                output_dir=tool_args.get("output_dir", ""),
                model=tool_args.get("model", "u2net")
            ),
            "crop_transparent": lambda: crop_transparent(
                input_path=tool_args.get("input_path", ""),
                output_path=tool_args.get("output_path", ""),
                padding=tool_args.get("padding", 0)
            ),
            "convert_format": lambda: convert_format(
                input_path=tool_args.get("input_path", ""),
                output_path=tool_args.get("output_path", ""),
                quality=tool_args.get("quality", 80)
            ),
            "resize_image": lambda: resize_image(
                input_path=tool_args.get("input_path", ""),
                output_path=tool_args.get("output_path", ""),
                width=tool_args.get("width", 0),
                height=tool_args.get("height", 0),
                keep_aspect=tool_args.get("keep_aspect", True)
            ),
        }
        
        if tool_name in tool_map:
            result = tool_map[tool_name]()
            content = [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]
            is_error = not result.get("success", False) if isinstance(result, dict) else False
            send_response(msg_id, {"content": content, "isError": is_error})
            return
        
        send_error(msg_id, -32601, f"Unknown tool: {tool_name}")
        return
    
    if msg_id is not None:
        send_error(msg_id, -32601, f"Method not found: {method}")


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            handle_request(line)
        except Exception as e:
            send_notification("notifications/message", {
                "level": "error",
                "data": f"Unhandled: {e}\n{traceback.format_exc()}"
            })


if __name__ == "__main__":
    main()
