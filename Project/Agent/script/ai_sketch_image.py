import cv2
import numpy as np
import sys, os, threading, random, time
from playsound import playsound

# ==========================================
# 1. 用户调整区 (修改这里即可)
# ==========================================

# --- 画笔大小设置 ---
OUTLINE_BRUSH_SIZE = 3        # 轮廓画笔粗细 (建议 3-6)
FILL_BRUSH_SIZE    = 8        # 填充画笔基础粗细 (建议 6-12)

# --- 绘制速度设置 (数值越大越快) ---
OUTLINE_SPEED      = 3       # 轮廓绘制速度
FILL_SPEED         = 6       # 填充绘制速度

# --- 【新增】填充笔触长度设置 (控制线条长短) ---
# 脚本会自动根据区域大小选择长度，你可以在这里修改基准值
# 数值越大：线条越长，风格越狂野，填充速度越快
# 数值越小：线条越短，风格越细腻，也就是“排线”更密
STROKE_LEN_TINY    = 10       # 极小区域 (如眼睛反光) 的线条长度
STROKE_LEN_SMALL   = 30       # 小区域 (如手指) 的线条长度
STROKE_LEN_MED     = 60       # 中等区域 (如脸部) 的线条长度
STROKE_LEN_LARGE   = 90       # 大区域 (如背景、衣服) 的线条长度

# --- 视觉风格设置 ---
PENCIL_OPACITY_OUTLINE = 0.9  
PENCIL_OPACITY_FILL    = 0.65 
MAX_IMG_DIM            = 1000  

# --- 资源路径 ---
HAND_ASSET_PATH = r"script\\hand_pencil.png"
AUDIO_FILE      = r"script\\draw_audio.mp3"
DEFAULT_IMG_PATH = r"script\\defaultImage.png"

# ==========================================
# 2. 内部配置 (一般无需修改)
# ==========================================
# 轮廓检测阈值
CANNY_LOW, CANNY_HIGH = 50, 150
MIN_OUTLINE_LEN = 30 

# 区域分割参数 (控制填充时的分块大小)
TARGET_CHUNK_PIXELS_MIN = 800    
TARGET_CHUNK_PIXELS_MAX = 10000   

# 手部动画平滑度
HAND_SMOOTH_FACTOR = 0.4      
HAND_SCALE = 0.5
ORIGINAL_PENCIL_TIP_OFFSET = (175, 602) # 手部素材笔尖相对于左上角的坐标

# ==========================================
# 3. 绘图核心函数
# ==========================================

def paint_pencil_stroke_enhanced(canvas, origin, p1, p2, thickness, opacity):
    """
    绘制单条笔触，带有噪点纹理，模拟铅笔效果
    """
    margin = thickness + 5
    x_min = min(p1[0], p2[0]) - margin
    x_max = max(p1[0], p2[0]) + margin
    y_min = min(p1[1], p2[1]) - margin
    y_max = max(p1[1], p2[1]) + margin
    
    h, w = canvas.shape[:2]
    x_min, x_max = int(max(0, x_min)), int(min(w, x_max))
    y_min, y_max = int(max(0, y_min)), int(min(h, y_max))
    
    if x_max <= x_min or y_max <= y_min: return

    # 创建局部遮罩
    roi_w, roi_h = x_max - x_min, y_max - y_min
    local_mask = np.zeros((roi_h, roi_w), dtype=np.uint8)
    local_p1 = (int(p1[0] - x_min), int(p1[1] - y_min))
    local_p2 = (int(p2[0] - x_min), int(p2[1] - y_min))
    
    if local_p1 == local_p2:
        local_p2 = (local_p1[0] + 1, local_p1[1])

    cv2.line(local_mask, local_p1, local_p2, 255, thickness=thickness, lineType=cv2.LINE_AA)
    
    # 获取ROI区域
    src_roi = origin[y_min:y_max, x_min:x_max]
    dst_roi = canvas[y_min:y_max, x_min:x_max]
    
    mask_indices = local_mask > 0
    if not np.any(mask_indices): return

    # 颜色混合与噪点
    bg = dst_roi[mask_indices].astype(float)
    fg = src_roi[mask_indices].astype(float)
    
    # 添加高斯噪点模拟纸张纹理
    noise = np.random.normal(0, 4, fg.shape).astype(float)
    fg = np.clip(fg + noise, 0, 255)

    # 随机化不透明度
    actual_opacity = opacity * np.random.uniform(0.85, 1.0)
    
    blended = bg * (1.0 - actual_opacity) + fg * actual_opacity
    blended = np.clip(blended, 0, 255).astype(np.uint8)
    dst_roi[mask_indices] = blended

def paint_pencil_stroke_progressive(canvas, origin, p1, p2, thickness, opacity, progress=1.0):
    """
    渐进式绘制，用于动画过程
    """
    if progress <= 0: return
    if progress < 1.0:
        actual_p2 = (
            int(p1[0] + (p2[0] - p1[0]) * progress),
            int(p1[1] + (p2[1] - p1[1]) * progress)
        )
    else:
        actual_p2 = p2
    paint_pencil_stroke_enhanced(canvas, origin, p1, actual_p2, thickness, opacity)

# ==========================================
# 4. 手部动画代理与工具
# ==========================================

class HandAgent:
    def __init__(self, start_pos):
        self.curr_x, self.curr_y = float(start_pos[0]), float(start_pos[1])
        
    def update(self, target_pos, factor=HAND_SMOOTH_FACTOR):
        tx, ty = target_pos
        self.curr_x += (tx - self.curr_x) * factor
        self.curr_y += (ty - self.curr_y) * factor
        return (int(self.curr_x), int(self.curr_y))

def load_hand(path, scale):
    if not os.path.exists(path): return None, None, (0, 0)
    rgba = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if rgba is None: return None, None, (0, 0)
    new_w, new_h = int(rgba.shape[1] * scale), int(rgba.shape[0] * scale)
    rgba = cv2.resize(rgba, (new_w, new_h))
    offset = (int(ORIGINAL_PENCIL_TIP_OFFSET[0] * scale), int(ORIGINAL_PENCIL_TIP_OFFSET[1] * scale))
    return rgba[:, :, :3], rgba[:, :, 3], offset

def overlay_hand(canvas, h_bgr, h_mask, pos, offset):
    if h_bgr is None: return canvas
    bh, bw = canvas.shape[:2]
    hh, hw = h_bgr.shape[:2]
    x, y = int(pos[0]), int(pos[1])
    ox, oy = offset
    
    # 1. 计算手部图片在画布上的“理论”左上角坐标 (允许为负数)
    start_x = x - ox
    start_y = y - oy
    
    # 2. 计算画布上的实际叠加区域 (ROI)
    # 左上角：取 0 和 理论起点的最大值 (防止负索引)
    x1 = max(0, start_x)
    y1 = max(0, start_y)
    
    # 右下角：取 画布边界 和 (理论起点 + 素材宽高) 的最小值
    # 修复点：原代码使用的是 clamped x1 + hw，导致当 start_x 为负数时，
    # 索取的区域超出了手部素材的实际像素范围
    x2 = min(bw, start_x + hw)
    y2 = min(bh, start_y + hh)
    
    # 3. 如果区域无效 (宽度或高度 <= 0)，直接返回
    if x2 <= x1 or y2 <= y1: return canvas
    
    # 4. 计算对应在手部素材图片上的裁剪区域
    # 偏移量 = 画布实际起始点 - 理论起始点
    h_x1 = x1 - start_x
    h_y1 = y1 - start_y
    h_x2 = h_x1 + (x2 - x1)
    h_y2 = h_y1 + (y2 - y1)
    
    # 5. 执行叠加
    res = canvas.copy()
    
    # 提取画布区域
    roi = res[y1:y2, x1:x2].astype(np.float32)
    
    # 提取手部区域
    hand = h_bgr[h_y1:h_y2, h_x1:h_x2].astype(np.float32)
    mask = (h_mask[h_y1:h_y2, h_x1:h_x2].astype(np.float32) / 255.0)
    mask = cv2.merge([mask, mask, mask])
    
    # 融合 (增加 try-except 以防万一，虽然逻辑已修复)
    try:
        blended = hand * mask + roi * (1 - mask)
        res[y1:y2, x1:x2] = blended.astype(np.uint8)
    except ValueError:
        # 如果极少数情况下仍出现尺寸 1 像素的误差，直接返回原图不报错
        return canvas
        
    return res

# ==========================================
# 5. 图像分析与路径生成算法
# ==========================================

def generate_outlines(origin_bgr):
    """生成轮廓路径"""
    gray = cv2.cvtColor(origin_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    edges = cv2.Canny(blurred, CANNY_LOW, CANNY_HIGH)
    dilated_edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2)))
    
    cnts, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    paths = []
    for c in cnts:
        if cv2.arcLength(c, True) < MIN_OUTLINE_LEN: continue
        epsilon = 0.002 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, epsilon, True)
        paths.append(approx.reshape(-1, 2).astype(np.int32))
    
    # 按位置排序
    if paths:
        centers = [np.mean(p, axis=0) for p in paths]
        centers = np.array(centers)
        score = centers[:, 1] * 10 + centers[:, 0]
        order = np.argsort(score)
        paths = [paths[i] for i in order]
        
    return paths, dilated_edges

def get_all_regions(edges):
    """获取所有闭合区域"""
    inverted_edges = cv2.bitwise_not(edges)
    num_labels, labels = cv2.connectedComponents(inverted_edges, connectivity=8)
    regions = []
    for label_id in range(1, num_labels):
        mask = (labels == label_id).astype(np.uint8) * 255
        if cv2.countNonZero(mask) < 10: continue 
        regions.append(mask)
    return regions

def subdivide_region_adaptive(mask):
    """使用 K-Means 将大区域分割成小块"""
    points = cv2.findNonZero(mask)
    if points is None: return []
    points = points.reshape(-1, 2).astype(np.float32)
    
    n_points = len(points)
    if n_points == 0: return []
    
    if n_points < 500: target_pixels = TARGET_CHUNK_PIXELS_MIN
    elif n_points < 2000: target_pixels = (TARGET_CHUNK_PIXELS_MIN + TARGET_CHUNK_PIXELS_MAX) // 2
    else: target_pixels = TARGET_CHUNK_PIXELS_MAX
    
    if n_points <= target_pixels:
        return [points.astype(np.int32)]
        
    K = int(max(2, n_points / target_pixels))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    ret, label, center = cv2.kmeans(points, K, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    
    chunks = [[] for _ in range(K)]
    label = label.flatten()
    points_int = points.astype(np.int32)
    for i in range(K):
        chunks[i] = points_int[label == i]
        
    return chunks

def sort_items_tl_br(items, is_chunk=False):
    """从左上到右下排序"""
    if not items: return []
    centers = []
    for item in items:
        if is_chunk:
            if len(item) > 0: centers.append(np.mean(item, axis=0))
            else: centers.append([0, 0])
        else:
            M = cv2.moments(item)
            if M["m00"] != 0:
                cX = int(M["m10"] / M["m00"])
                cY = int(M["m01"] / M["m00"])
                centers.append([cX, cY])
            else:
                x, y, w, h = cv2.boundingRect(item)
                centers.append([x + w/2, y + h/2])
    centers = np.array(centers)
    if len(centers) == 0: return items
    scores = centers[:, 1] * 5000 + centers[:, 0]
    indices = np.argsort(scores)
    return [items[i] for i in indices]

def generate_human_like_strokes(chunk_points):
    """生成双向交叉的填充笔触 (已关联全局长度变量)"""
    if len(chunk_points) == 0: return [], [], []
    
    area = len(chunk_points)
    x_min, y_min = chunk_points.min(axis=0)
    x_max, y_max = chunk_points.max(axis=0)
    width = x_max - x_min
    height = y_max - y_min
    
    # === 这里关联了全局变量 ===
    if area < 200:
        stroke_len_base = STROKE_LEN_TINY
        density = 2
    elif area < 1000:
        stroke_len_base = STROKE_LEN_SMALL
        density = 4
    elif area < 5000:
        stroke_len_base = STROKE_LEN_MED
        density = 8
    else:
        stroke_len_base = STROKE_LEN_LARGE
        density = 15
    # ========================
    
    # 确定交叉填充的角度
    if width > height * 1.5:  
        angle_1, angle_2 = 0, 90
    elif height > width * 1.5:  
        angle_1, angle_2 = 90, 0
    else:  
        angle_1, angle_2 = 45, 135
        
    # 筛选点
    sort_keys = chunk_points[:, 1] * 100 + chunk_points[:, 0]
    sorted_points = chunk_points[np.argsort(sort_keys)]
    
    actual_density = int(density * 1.2) 
    if actual_density < 1: actual_density = 1
    
    selected_points = sorted_points[::actual_density]
    count = len(selected_points)
    
    # 限制单层最大笔触数
    max_strokes_per_layer = 40 
    if count > max_strokes_per_layer:
        indices = np.linspace(0, count-1, max_strokes_per_layer, dtype=int)
        selected_points = selected_points[indices]
        count = len(selected_points)
    
    paths = []
    thicknesses = []
    opacities = []
    jitter_rad = np.radians(25) 
    
    layers = [angle_1, angle_2]
    
    for layer_idx, base_angle_deg in enumerate(layers):
        base_rad = np.radians(base_angle_deg)
        prev_angle = base_rad
        
        for i in range(count):
            point = selected_points[i]
            
            center_x, center_y = point[0], point[1]
            if layer_idx == 1:
                center_x += np.random.uniform(-3, 3)
                center_y += np.random.uniform(-3, 3)
            
            if i > 0 and np.random.random() < 0.7:
                angle = prev_angle + np.random.uniform(-jitter_rad/3, jitter_rad/3)
            else:
                angle = np.random.uniform(base_rad - jitter_rad, base_rad + jitter_rad)
            prev_angle = angle
            
            # 使用全局配置的基础长度，并加入随机变化
            # 大区域稍微增加一点长度波动
            len_mult = 1.0 if area <= 5000 else 1.2
            length = np.random.uniform(stroke_len_base * 0.6 * len_mult, stroke_len_base * 1.2 * len_mult)
                
            dx = length * np.cos(angle) / 2
            dy = length * np.sin(angle) / 2
            
            p1 = (int(center_x - dx), int(center_y - dy))
            p2 = (int(center_x + dx), int(center_y + dy))
            
            paths.append(np.array([p1, p2], dtype=np.int32))
            
            t_base = FILL_BRUSH_SIZE
            t_var = np.random.choice([t_base-1, t_base, t_base, t_base+1])
            thicknesses.append(max(1, t_var))
            
            opacities.append(np.random.uniform(0.6, 0.85))
            
    return paths, thicknesses, opacities


def generate_sequence(origin_bgr):
    """生成绘制序列"""
    seq = []
    
    print("1. 轮廓提取...")
    outlines, dilated_edges = generate_outlines(origin_bgr)
    if outlines:
        seq.append({
            "type": "outline",
            "paths": outlines, 
            "thickness": OUTLINE_BRUSH_SIZE, # 使用全局配置
            "opacity": PENCIL_OPACITY_OUTLINE
        })
    
    print("2. 区域分割与排序...")
    all_regions = get_all_regions(dilated_edges)
    sorted_regions = sort_items_tl_br(all_regions, is_chunk=False)
    print(f"   共 {len(sorted_regions)} 个区域。")
    
    print("3. 生成笔触...")
    for i, mask in enumerate(sorted_regions):
        chunks = subdivide_region_adaptive(mask)
        sorted_chunks = sort_items_tl_br(chunks, is_chunk=True)
        
        if sorted_chunks:
            seq.append({"type": "fill_region_start", "region_id": i})
            for chunk_points in sorted_chunks:
                chunk_paths, thicknesses, opacities = generate_human_like_strokes(chunk_points)
                if chunk_paths:
                    seq.append({
                        "type": "fill_chunk",
                        "paths": chunk_paths,
                        "thicknesses": thicknesses,
                        "opacities": opacities,
                        "thickness": FILL_BRUSH_SIZE, # 备用值
                        "opacity": PENCIL_OPACITY_FILL
                    })

    return seq

def generate_repair_paths(canvas, origin):
    """生成修补路径（填补漏掉的白点）"""
    print("正在检查漏涂像素...")
    diff = cv2.absdiff(canvas, origin)
    gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray_diff, 15, 255, cv2.THRESH_BINARY)
    
    missed_points = cv2.findNonZero(thresh)
    if missed_points is None: return []
    missed_points = missed_points.reshape(-1, 2)
    
    if len(missed_points) == 0: return []
    print(f"发现 {len(missed_points)} 个像素需要修补。")

    keys = missed_points[:, 1] * 5000 + missed_points[:, 0]
    missed_points = missed_points[np.argsort(keys)]
    
    paths = []
    step = 2 
    for i in range(0, len(missed_points), step):
        p = missed_points[i]
        angle = np.random.uniform(0, np.pi * 2)
        length = np.random.uniform(3, 8)
        dx = int(length * np.cos(angle) / 2)
        dy = int(length * np.sin(angle) / 2)
        p1 = (p[0] - dx, p[1] - dy)
        p2 = (p[0] + dx, p[1] + dy)
        paths.append(np.array([p1, p2], dtype=np.int32))
        
    return paths

# ==========================================
# 6. 主程序入口
# ==========================================
def main():
    img_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_IMG_PATH
    if not os.path.exists(img_path):
        print(f"找不到图片: {img_path}")
        return
        
    origin = cv2.imread(img_path)
    h, w = origin.shape[:2]
    
    # 缩放过大的图片
    scale_ratio = 1.0
    if max(h, w) > MAX_IMG_DIM:
        scale_ratio = MAX_IMG_DIM / max(h, w)
        origin = cv2.resize(origin, (0, 0), fx=scale_ratio, fy=scale_ratio)
    h, w = origin.shape[:2]
    
    # 初始化画布（白纸+噪点）
    canvas = np.ones((h, w, 3), dtype=np.uint8) * 255
    noise = np.random.randint(-5, 5, (h, w, 3), dtype=np.int16)
    canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 准备数据
    seq = generate_sequence(origin)
    h_bgr, h_mask, offset = load_hand(HAND_ASSET_PATH, HAND_SCALE)
    hand_agent = HandAgent((w/2, h/2))
    
    win_name = "AI Drawing"
    cv2.namedWindow(win_name, cv2.WINDOW_AUTOSIZE)
    
    # 音频线程
    is_playing = [True]
    if os.path.exists(AUDIO_FILE):
        def play_audio():
            while is_playing[0]:
                try: playsound(AUDIO_FILE)
                except: break
                time.sleep(0.1)
        threading.Thread(target=play_audio, daemon=True).start()
    
    global_step = 0

    # 绘制执行函数
    def execute_paths_progressive(stage, skip_frames, is_filling):
        nonlocal global_step
        paths = stage["paths"]
        has_individual_params = "thicknesses" in stage and "opacities" in stage
        
        for idx, path in enumerate(paths):
            if len(path) < 2: continue
            
            # 获取当前笔触的参数
            if has_individual_params:
                thickness = stage["thicknesses"][idx]
                opacity = stage["opacities"][idx]
            else:
                thickness = stage["thickness"]
                opacity = stage["opacity"]
            
            start_pt = tuple(path[0])
            
            # 移动手到起始点
            dist = np.linalg.norm(np.array([hand_agent.curr_x, hand_agent.curr_y]) - start_pt)
            if is_filling and dist < 60:
                hand_agent.curr_x, hand_agent.curr_y = start_pt[0], start_pt[1]
            else:
                steps = int(dist / 30) + 1
                for _ in range(steps):
                    hand_agent.update(start_pt, factor=0.3)
                    global_step += 1
                    if global_step % 5 == 0:
                        view = overlay_hand(canvas, h_bgr, h_mask, (hand_agent.curr_x, hand_agent.curr_y), offset)
                        cv2.imshow(win_name, view)
                        cv2.waitKey(1)
            
            # 开始绘制线条
            for i in range(len(path) - 1):
                p1, p2 = tuple(path[i]), tuple(path[i+1])
                segment_dist = np.linalg.norm(np.array(p2) - np.array(p1))
                steps = max(1, int(segment_dist / 5))
                
                for step in range(steps):
                    progress = (step + 1) / steps
                    paint_pencil_stroke_progressive(canvas, origin, p1, p2, thickness, opacity, progress)
                    
                    # 更新手的位置
                    current_x = p1[0] + (p2[0] - p1[0]) * progress
                    current_y = p1[1] + (p2[1] - p1[1]) * progress
                    hand_agent.curr_x, hand_agent.curr_y = current_x, current_y
                    
                    global_step += 1
                    # 关键：根据全局配置的速度跳过帧渲染
                    if global_step % skip_frames == 0:
                        view = overlay_hand(canvas, h_bgr, h_mask, (hand_agent.curr_x, hand_agent.curr_y), offset)
                        cv2.imshow(win_name, view)
                        if cv2.waitKey(1) == 27: return False
        return True

    # === 阶段 1: 主要绘制 ===
    print(f"开始绘制...")
    for idx, stage in enumerate(seq):
        if stage["type"] == "fill_region_start": continue
        
        # 根据类型决定速度
        is_fill_stage = (stage["type"] == "fill_chunk")
        current_speed = FILL_SPEED if is_fill_stage else OUTLINE_SPEED
        
        if not execute_paths_progressive(stage, current_speed, is_fill_stage):
            is_playing[0] = False
            return

    # === 阶段 2: 查漏补缺 ===
    for repair_round in range(2):
        repair_paths = generate_repair_paths(canvas, origin)
        if not repair_paths: break
            
        print(f"修补轮次 {repair_round+1}...")
        repair_stage = {
            "paths": repair_paths,
            "thickness": max(1, FILL_BRUSH_SIZE - 2),
            "opacity": 0.9
        }
        # 修补时速度稍快
        if not execute_paths_progressive(repair_stage, skip_frames=FILL_SPEED + 10, is_filling=True):
            is_playing[0] = False
            return

    is_playing[0] = False
    print("绘制完成")
    cv2.imshow(win_name, canvas)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
