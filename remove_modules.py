import re

path = "/Volumes/AI_Agent/github/xunyi/教师web端.html"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Remove sidebar items
text = re.sub(r"\s*<div class=\"sidebar-item\" data-page=\"monitor\" onclick=\"switchPage\(this\)\">\s*<span class=\"icon\">&#128065;</span><span>监课巡课</span>\s*</div>", "", text)
text = re.sub(r"\s*<div class=\"sidebar-item\" data-page=\"aireport\" onclick=\"switchPage\(this\)\">\s*<span class=\"icon\">&#128221;</span><span>AI报告与作业</span>\s*</div>", "", text)

# 2. Remove the content pages
text = re.sub(r"\s*<!-- ===== 5\. 监课巡课 ===== -->\s*<div id=\"page-monitor\" class=\"page\">.*?</div>\s*(?=<!-- ===== 6\. AI报告与作业 ===== -->)", "", text, flags=re.DOTALL)
text = re.sub(r"\s*<!-- ===== 6\. AI报告与作业 ===== -->\s*<div id=\"page-aireport\" class=\"page\">.*?</div>\s*(?=<!-- ===== 7\. 个人中心 ===== -->)", "", text, flags=re.DOTALL)

# 3. Remove the CSS blocks
text = re.sub(r"\s*/\* ===== 监课巡课 ===== \*/.*?(?=/\* ===== AI报告 ===== \*/)", "", text, flags=re.DOTALL)
text = re.sub(r"\s*/\* ===== AI报告 ===== \*/.*?(?=/\* ===== 个人中心 ===== \*/)", "", text, flags=re.DOTALL)

# 4. Remove JS function
text = re.sub(r"\s*function showAIEdit\(\)\s*\{[^\}]+\}", "", text)

# 5. Remove html comments at bottom
text = re.sub(r"\s*- 监课巡课\(文字沟通/紧急调配\)\s+OK \(page-monitor, stealth entry \+ text-only note \+ dispatch\)", "", text)
text = re.sub(r"\s*- AI报告与作业\(点评/作业推送\)\s+OK \(page-aireport, AI edit \+ homework table\)", "", text)
text = re.sub(r"\s*- 标准化作业推送\(P0\)\s+OK \(info bar note \+ homework management table\)", "", text)

# Write back
with open(path, "w", encoding="utf-8") as f:
    f.write(text)
