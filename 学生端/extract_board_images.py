"""
提取 Excel 中嵌入的棋盘图片，并按题目关联保存
"""
import json
import pandas as pd
import openpyxl
from pathlib import Path
from collections import defaultdict

SRC = Path(__file__).parent / '棋力测评题库.xlsx'
OUT_DIR = Path(__file__).parent / 'AI棋力测评' / 'images'
OUT_JSON = Path(__file__).parent / 'AI棋力测评' / 'data' / 'questions.json'
OUT_JS = Path(__file__).parent / 'AI棋力测评' / 'data' / 'questions.js'

LEVELS = ['20级', '15级', '12级', '10级', '7级', '5级']

OUT_DIR.mkdir(parents=True, exist_ok=True)

# 记录每个 (sheet, row) 对应的图片路径
image_paths = defaultdict(dict)

wb = openpyxl.load_workbook(SRC)
for level in LEVELS:
    ws = wb[level]
    seen_rows = set()
    for img in ws._images:
        anchor = img.anchor
        if hasattr(anchor, '_from'):
            row = anchor._from.row
            col = anchor._from.col
        elif hasattr(anchor, 'from_'):
            row = anchor.from_.row
            col = anchor.from_.col
        else:
            continue

        # 跳过表头行和重复行（每行只取第一张图）
        if row <= 1 or row in seen_rows:
            continue
        seen_rows.add(row)

        # 读取该行的题号
        question_no = ws.cell(row=row, column=1).value
        if not isinstance(question_no, int):
            continue

        ext = img.format.lower() if img.format else 'png'
        filename = f"{level}-{question_no}.{ext}"
        filepath = OUT_DIR / filename

        # 保存图片（使用 _data() 获取真实 PNG/JPEG 字节）
        with open(filepath, 'wb') as f:
            f.write(img._data())

        image_paths[level][question_no] = f"images/{filename}"
        print(f"提取 {level} 第{question_no}题 图片 -> {filepath}")

print(f"\n共提取 {sum(len(v) for v in image_paths.values())} 张图片")

# 更新 JSON/JS 数据，关联图片路径
with open(OUT_JSON, 'r', encoding='utf-8') as f:
    questions = json.load(f)

for q in questions:
    level = q['level']
    # 从 id 中提取题号
    question_no = int(q['id'].split('-')[-1])
    if question_no in image_paths.get(level, {}):
        q['boardImage'] = image_paths[level][question_no]
    else:
        q['boardImage'] = None

OUT_JSON.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding='utf-8')
OUT_JS.write_text('window.QUESTIONS = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';', encoding='utf-8')
print(f"\n已更新 {OUT_JSON} 和 {OUT_JS}")

# 统计
has_image = sum(1 for q in questions if q['boardImage'])
print(f"有关联图片的题目数: {has_image} / {len(questions)}")
