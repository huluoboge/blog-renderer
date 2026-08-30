"use strict";

/**
 * 博客主题 CSS —— 与主页（huluoboge.github.io styles.css）同设计语言。
 * 变量体系、字体、强调色均与主页一致；支持暗色主题 html[data-theme="dark"]。
 */
const THEME_CSS = `
/* ===== 设计变量（与主页 styles.css 一致）===== */
:root {
  --ink: #111111;
  --text: #333333;
  --muted: #666666;
  --faint: #8a8a8a;
  --line: #d7d7d7;
  --soft: #f5f5f5;
  --blue: #004099;
  --serif: "Times New Roman", "Noto Serif CJK SC", "Source Han Serif SC", SimSun, serif;
  --sans: Arial, "Noto Sans CJK SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif;
  --code-bg: #f7f7f7;
  --bg-color: #ffffff;
  --text-color: #333333;
}

[data-theme="dark"] {
  --ink: #e6e6e6;
  --text: #cccccc;
  --muted: #9a9a9a;
  --faint: #7a7a7a;
  --line: #3a3a3a;
  --soft: #242424;
  --blue: #6a9fd8;
  --code-bg: #1e1e1e;
  --bg-color: #161616;
  --text-color: #cccccc;
}

/* ===== 基础排版 ===== */
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg-color);
  color: var(--text);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.68;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s ease, color 0.3s ease;
}
.container { max-width: 860px; margin: 0 auto; padding: 0 28px; }
a { color: var(--blue); text-decoration: none; }
a:hover { color: #001f55; text-decoration: underline; }
[data-theme="dark"] a:hover { color: #9cc0e8; }

/* ===== 导航（顶部细线，与主页侧栏同语言）===== */
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26px 0 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 40px;
}
nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 26px;
}
nav a {
  color: var(--text);
  font-size: 13px;
  letter-spacing: .03em;
  padding: 3px 0;
}
nav a:hover { color: var(--blue); text-decoration: none; }
nav a.active {
  color: var(--blue);
  font-weight: bold;
  border-bottom: 2px solid var(--blue);
}
.theme-switch {
  background: none;
  border: 1px solid var(--line);
  color: var(--muted);
  padding: 5px 12px;
  font-size: 12px;
  font-family: var(--sans);
  cursor: pointer;
}
.theme-switch:hover { border-color: var(--blue); color: var(--blue); }

/* ===== 正文标题（衬线）===== */
main h1 { color: var(--ink); font: bold 30px/1.25 var(--serif); margin: 0 0 22px; }
main h2 { color: var(--ink); font: bold 24px/1.25 var(--serif); margin: 38px 0 14px; padding-top: 10px; border-top: 1px solid var(--line); }
main h3 { color: var(--ink); font: bold 19px/1.3 var(--serif); margin: 28px 0 10px; }
main h4 { color: var(--ink); font-size: 15px; margin: 22px 0 8px; }
main p { margin: 0 0 13px; }
main ul, main ol { margin: 0 0 13px; padding-left: 22px; }
main li { margin-bottom: 4px; }
main blockquote {
  margin: 0 0 20px;
  padding: 10px 16px;
  border-left: 3px solid var(--blue);
  background: var(--soft);
  color: var(--muted);
}
main hr { border: 0; border-top: 1px solid var(--line); margin: 30px 0; }
main img { display: block; max-width: 100%; height: auto; margin: 18px auto; border: 1px solid var(--line); background: var(--soft); }
main .image-caption { margin-top: 6px; color: var(--muted); font-size: 12px; font-style: italic; text-align: center; }

/* ===== 表格（与主页 report-body 一致）===== */
main table { width: 100%; margin: 16px 0 24px; border-collapse: collapse; font-size: 13px; }
main th, main td { padding: 7px 10px; border: 1px solid var(--line); vertical-align: top; text-align: left; }
main th { background: var(--soft); color: var(--ink); font-weight: bold; }
main tbody tr:nth-child(even) { background: var(--soft); }

/* ===== 代码 ===== */
main code { padding: 1px 5px; background: var(--soft); font-family: Consolas, "Courier New", monospace; font-size: .92em; }
main pre { overflow-x: auto; padding: 13px 15px; background: var(--code-bg); border: 1px solid var(--line); margin: 0 0 18px; }
main pre code { padding: 0; background: transparent; }
pre code.hljs { padding: 0; background: transparent; font-size: .9em; }

/* ===== 公式 ===== */
.katex { font-size: 1.05em; }
.katex-display { margin: 18px 0; overflow-x: auto; overflow-y: hidden; padding: 4px 0; }
.math-block { text-align: center; margin: 18px 0; overflow-x: auto; }
.math-inline { display: inline; }

/* ===== mermaid ===== */
.mermaid { background: var(--soft); padding: 14px; margin: 16px 0; border: 1px solid var(--line); overflow: auto; text-align: center; }

/* ===== 文章列表（索引页）===== */
.article-list { margin-top: 6px; }
.article-item { padding: 20px 0; border-bottom: 1px solid var(--line); }
.article-item:first-child { border-top: 1px solid var(--ink); }
.article-item h3 { margin: 0 0 5px; }
.article-item h3 a { color: var(--ink); font: bold 19px/1.3 var(--serif); }
.article-item h3 a:hover { color: var(--blue); text-decoration: none; }
.article-meta { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
.article-item p { margin: 0; color: var(--muted); font-size: 13px; }
.article-item-with-image { display: grid; grid-template-columns: 140px 1fr; gap: 20px; align-items: start; }
.article-thumbnail { width: 100%; height: 90px; object-fit: cover; border: 1px solid var(--line); }

/* ===== 返回按钮 ===== */
.back-button {
  display: inline-block;
  margin: 0 0 24px;
  color: var(--muted);
  font-size: 12px;
}
.back-button:hover { color: var(--blue); text-decoration: none; }

/* ===== markdown 嵌入 ===== */
.markdown-embed { margin: 18px 0; border: 1px solid var(--line); border-left: 3px solid var(--blue); padding: 12px 16px; background: var(--soft); }

/* ===== 移动端 ===== */
.hamburger { display: none; background: none; border: 1px solid var(--line); color: var(--text); padding: 6px 10px; font-size: 15px; cursor: pointer; }

@media (max-width: 768px) {
  .container { padding: 0 18px; }
  nav { flex-wrap: wrap; gap: 8px; padding: 18px 0 14px; }
  nav ul { flex-wrap: wrap; gap: 14px; }
  .nav-menu { display: flex; flex-wrap: wrap; }
  .hamburger { display: block; }
  .nav-menu.active { display: flex; }
  main h1 { font-size: 25px; }
  main h2 { font-size: 21px; }
  .article-item-with-image { grid-template-columns: 1fr; }
  .article-thumbnail { height: auto; }
  table { display: block; overflow-x: auto; white-space: nowrap; }
  .katex-display { font-size: .95em; }
}

@media (max-width: 480px) {
  body { font-size: 14px; }
  .katex { font-size: .95em; }
  .katex-display { font-size: .88em; }
}
`;

module.exports = { THEME_CSS };
