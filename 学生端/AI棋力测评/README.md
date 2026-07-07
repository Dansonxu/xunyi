# 围棋棋力自适应测评 Demo

这是一个基于 HTML + JavaScript 的自适应出题 Demo，使用 `棋力测评题库.xlsx` 中的 600 道题目。

## 目录结构

```
AI棋力测评/
├── index.html          # 测评页面（主入口）
├── data/
│   ├── questions.json  # 题库 JSON 格式
│   └── questions.js    # 题库 JS 格式（直接供 index.html 引用，兼容 file://）
├── images/             # 从 Excel 提取的棋盘图片
├── convert_questions.py # Excel → JSON/JS 转换脚本（位于上级目录）
├── extract_board_images.py # 提取 Excel 嵌入式图片脚本（位于上级目录）
└── detect_grid_params.py   # 检测图片网格参数脚本（位于上级目录）
```

## 如何运行

### 方式一：直接打开文件
由于 `index.html` 引用了同目录下的 `data/questions.js`，可直接用浏览器打开：

```
双击打开 AI棋力测评/index.html
```

### 方式二：本地服务器（推荐）

```bash
cd "/Volumes/AI_Agent/github/xunyi/学生端/AI棋力测评"
python3 -m http.server 8123
```

然后在浏览器访问：http://localhost:8123

## 功能说明

1. **自适应出题**
   - 默认从 12级 开始
   - 连续答对 **3** 题 → 升一级（减少偶然蒙对导致的跳级）
   - 连续答错 2 题 → 降一级
   - 至少做 12 题后，若满足收敛条件则提前结束

2. **题目类型**
   - **选择题**：直接点击 A/B/C/D 选项作答
   - **实操题**：在初始局面的基础上点击棋盘落子作答

3. **棋盘展示**
   - 自动提取 Excel 中嵌入的棋盘图片，共 495 张
   - 自动检测每张图片的网格参数（路数、交叉点坐标）
   - 实操题直接以**原题棋盘图作为可点击棋盘背景**，原题棋子位置一目了然
   - 用户在原题棋盘上点击落子作答
   - 提交后标出正确答案位置
   - 若图片未能识别网格，会 fallback 显示原图 + 空白可点击棋盘
   - 若提供 `初始局面` 列（格式：`黑:A1,B2;白:C3,D4`），会在可点击棋盘上还原初始棋子
   - 纯文字题不显示棋盘

4. **判题逻辑**
   - 选择题：对比选项字母
   - 实操题：对比用户落子坐标与答案第一步坐标是否一致

5. **结果页**
   - 展示推荐棋力等级
   - 各级别正确率统计
   - 完整答题轨迹

## 如何更新题库

如果 Excel 题库有更新，依次运行：

```bash
cd "/Volumes/AI_Agent/github/xunyi/学生端"
python3 convert_questions.py
python3 extract_board_images.py
python3 detect_grid_params.py
```

脚本会重新生成 `data/questions.json`、`data/questions.js`、`images/` 目录和网格参数。

## 数据来源

- 原始文件：`/Volumes/AI_Agent/github/xunyi/学生端/棋力测评题库.xlsx`
- 共 6 个等级：20级、15级、12级、10级、7级、5级
- 每级 100 题，总计 600 题
