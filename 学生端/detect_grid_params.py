"""
检测每张棋盘图片的网格参数，并更新到题库数据中
"""
import json
from pathlib import Path
from PIL import Image
import numpy as np

BASE = Path(__file__).parent / 'AI棋力测评'
JSON = BASE / 'data' / 'questions.json'
JS = BASE / 'data' / 'questions.js'

def find_grid_params(path):
    img = Image.open(path)
    arr = np.array(img)
    gray = np.mean(arr, axis=2).astype(np.uint8)

    col_dark = np.sum(gray < 140, axis=0)
    row_dark = np.sum(gray < 140, axis=1)

    def peaks(arr, min_dist):
        th = np.mean(arr) + np.std(arr) * 2
        p = []
        for i in range(1, len(arr) - 1):
            if arr[i] > th and arr[i] >= arr[i-1] and arr[i] >= arr[i+1]:
                if not p or i - p[-1] >= min_dist:
                    p.append(i)
        return p

    # 尝试不同 min_dist 找最佳网格
    best = None
    for min_dist in [20, 25, 30, 35, 40, 50, 60]:
        col_peaks = peaks(col_dark, min_dist)
        row_peaks = peaks(row_dark, min_dist)
        if len(col_peaks) >= 2 and len(row_peaks) >= 2 and len(col_peaks) == len(row_peaks):
            # 选择峰值数量最多且合理（5~25）的一组
            if 5 <= len(col_peaks) <= 25:
                if best is None or len(col_peaks) > len(best['col_peaks']):
                    best = {
                        'col_peaks': col_peaks,
                        'row_peaks': row_peaks,
                        'min_dist': min_dist,
                    }

    if best is None:
        return None

    col_peaks = best['col_peaks']
    row_peaks = best['row_peaks']
    size = len(col_peaks)
    x0, x1 = col_peaks[0], col_peaks[-1]
    y0, y1 = row_peaks[0], row_peaks[-1]
    cell_x = (x1 - x0) / (size - 1)
    cell_y = (y1 - y0) / (size - 1)

    return {
        'imageWidth': gray.shape[1],
        'imageHeight': gray.shape[0],
        'gridSize': size,
        'x0': int(round(x0)),
        'y0': int(round(y0)),
        'x1': int(round(x1)),
        'y1': int(round(y1)),
        'cellX': round(cell_x, 2),
        'cellY': round(cell_y, 2),
    }


with open(JSON, 'r', encoding='utf-8') as f:
    questions = json.load(f)

success = 0
fail = 0
for q in questions:
    if not q.get('boardImage'):
        q['gridParams'] = None
        continue
    path = BASE / q['boardImage']
    try:
        params = find_grid_params(path)
        if params:
            q['gridParams'] = params
            success += 1
        else:
            q['gridParams'] = None
            fail += 1
    except Exception as e:
        print(f"Error {q['id']}: {e}")
        q['gridParams'] = None
        fail += 1

JSON.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding='utf-8')
JS.write_text('window.QUESTIONS = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';', encoding='utf-8')
print(f'网格参数检测完成：成功 {success}，失败 {fail}')

# 统计 gridSize
sizes = {}
for q in questions:
    if q.get('gridParams'):
        s = q['gridParams']['gridSize']
        sizes[s] = sizes.get(s, 0) + 1
print('检测到的棋盘大小分布：', sizes)
