"""
把棋力测评题库.xlsx 转成 demo 用的 JSON
每级 100 题，输出到 data/questions.json
"""
import json
import pandas as pd
from pathlib import Path

SRC = Path(__file__).parent / '棋力测评题库.xlsx'
OUT = Path(__file__).parent / 'AI棋力测评' / 'data' / 'questions.json'
OUT_JS = Path(__file__).parent / 'AI棋力测评' / 'data' / 'questions.js'

LEVELS = ['20级', '15级', '12级', '10级', '7级', '5级']

all_data = []
for level in LEVELS:
    df = pd.read_excel(SRC, sheet_name=level)
    for _, row in df.iterrows():
        # 清理 NaN
        def clean(v):
            if pd.isna(v):
                return None
            return str(v).strip()

        options_raw = clean(row.get('选项'))
        options = []
        if options_raw:
            # 选项格式常见为 "A. xxx\nB. yyy"
            for line in options_raw.split('\n'):
                line = line.strip()
                if line and len(line) > 2 and line[1] in ['.', '、', ' ']:
                    options.append({
                        'key': line[0].upper(),
                        'text': line[2:].strip()
                    })

        q = {
            'id': f"{level}-{int(row['题号'])}",
            'level': level,
            'type': clean(row.get('题型')),
            'tag': clean(row.get('标签')),
            'question': clean(row.get('题目')),
            'board': clean(row.get('棋盘图')),
            'initialStones': clean(row.get('初始局面')),  # 新增：初始黑白子坐标，格式 "黑:A1,B2;白:C3"
            'options': options,
            'answer': clean(row.get('正确答案')),
            'boardSize': int(row['路数']) if not pd.isna(row.get('路数')) else 9,
            'note': clean(row.get('备注')),
            'audio': clean(row.get('朗读音频')),
        }
        all_data.append(q)

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(all_data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'已导出 {len(all_data)} 道题目到 {OUT}')

# 同时导出可直接被 <script src> 加载的 JS 文件（兼容 file:// 协议）
OUT_JS.write_text('window.QUESTIONS = ' + json.dumps(all_data, ensure_ascii=False, indent=2) + ';', encoding='utf-8')
print(f'已导出 JS 版本到 {OUT_JS}')

# 统计
counts = {}
for q in all_data:
    counts[q['level']] = counts.get(q['level'], 0) + 1
print('各级题目数：', counts)

# 题型统计
type_counts = {}
for q in all_data:
    t = q['type'] or '未知'
    type_counts[t] = type_counts.get(t, 0) + 1
print('题型分布：', type_counts)
