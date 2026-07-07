# 代理商学习考核平台（前端 HTML Demo）

这是一个纯前端 HTML Demo，无需后端服务即可运行。

## 技术栈

- **Tailwind CSS**（原子化 CSS，CDN 引入）
- **DaisyUI**（基于 Tailwind 的组件库，提供卡片、按钮、表格、徽章、表单等组件）
- **Heroicons**（SVG 图标，通过 `shared/js/heroicons-replace.js` 自动替换 Font Awesome 图标）
- **Chart.js**（统计图表）
- 原生 JavaScript + LocalStorage 模拟数据持久化

## 设计规范

- 主色：#3B82F6（科技蓝）
- 辅助色：#10B981（成长绿）
- 背景色：#F8FAFC（浅灰）
- 卡片圆角：12px，柔和阴影
- 移动端优先响应式设计

## 项目结构

```
代理学习考核平台/
├── admin/          # Web 后台管理端
├── h5/             # 移动端 H5
├── shared/         # 共享样式、数据层、图标替换脚本
└── assets/         # 静态资源
```

## 快速启动

1. 用浏览器打开 `admin/login.html`，使用演示账号登录：
   - 账号：`admin`
   - 密码：`admin123`

2. 用浏览器（建议切换为移动端视图）打开 `h5/index.html`，默认使用第一个代理商身份。

## 核心功能

### Web 后台

- 资料管理：上传 PDF / Word / 视频资料（模拟上传）
- 题库管理：单选、多选、判断题
- 考试管理：创建考试、关联资料、选题、设置规则
- 代理商管理：查看学习/考试明细
- 数据统计：学习统计、考试统计（Chart.js 图表）

### H5 移动端

- 首页：公告、学习进度、待学资料、待考考试
- 资料中心：分类筛选、资料详情、视频播放、标记完成
- 考试中心：考试列表、考试须知、答题、倒计时、交卷、成绩与解析
- 个人中心：切换代理商、学习记录、我的成绩

## 数据说明

所有数据通过 `LocalStorage` 和 `sessionStorage` 模拟持久化：

- `LocalStorage`：资料、题目、考试、学习记录、考试记录
- `sessionStorage`：当前登录用户、考试答题状态

首次打开页面时会自动注入 `shared/js/mock-data.js` 中的模拟数据。

## 文件预览说明

- PDF：使用浏览器 iframe 预览，请确保 `assets/demo-files/sample.pdf` 存在。
- 视频：使用 HTML5 `<video>` 标签播放，请确保 `assets/demo-files/sample.mp4` 存在。
- Word：纯前端无法直接预览，demo 中提供下载按钮。

> 如需重新初始化数据，可在浏览器控制台执行 `DataStore.resetAll()`。
