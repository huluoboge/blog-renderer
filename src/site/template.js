"use strict";

/**
 * 页面模板（纯函数）：生成完整 HTML 页面。
 *
 * 与原博客 render.js 的 generateHTML 保持视觉一致（同一套 CSS），
 * 并补全了原模板缺失的脚本：
 *   - toggleTheme / toggleMenu（原博客只有按钮没有函数，主题切换实际不可用）
 *   - highlight.js 代码高亮
 *   - mermaid 图表初始化
 */

const { THEME_CSS } = require("./theme");

/** HTML 转义（用于 title 等文本插入，防 XSS） */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 用外部模板渲染完整页面（渲染器只提供内容，外壳由站点模板决定）。
 * 模板中可用的占位符：
 *   {{TITLE}}    页面标题（自动 HTML 转义）
 *   {{CONTENT}}  渲染后的正文 HTML（原样插入）
 *   {{BASE_PATH}}站点部署前缀（如 /blog）
 * @param {string} templateHtml 外部模板全文
 * @param {object} vars         { title, content, basePath }
 * @returns {string}
 */
function renderWithTemplate(templateHtml, { title = "", content = "", basePath = "" } = {}) {
  // 注意：必须用函数 replacer，不能用字符串替换！
  // 字符串替换串中 $' $` $& $1 等是特殊模式——正文含 "$'"（如 Python 的 r'$\tau$'）会被截断破坏。
  return templateHtml
    .replace(/\{\{\s*TITLE\s*\}\}/g, () => escapeHtml(title))
    .replace(/\{\{\s*CONTENT\s*\}\}/g, () => content)
    .replace(/\{\{\s*BASE_PATH\s*\}\}/g, () => basePath);
}

/**
 * 生成完整 HTML 页面
 * @param {object} opts
 * @param {string} opts.title        页面标题
 * @param {string} opts.content      页面主体 HTML（已渲染好的文章/索引内容）
 * @param {string} [opts.currentPath] 当前页面路径，用于导航激活态
 * @param {Array}  [opts.navItems]    导航配置
 * @param {string} [opts.themeCss]    主题 CSS（默认用内置原博客主题）
 * @param {string} [opts.staticPrefix] 静态资源前缀，默认 "/static"（basePath 存在时自动加前缀）
 * @param {string} [opts.basePath]    站点部署前缀（如 "/blog"），导航链接与静态资源会带上
 */
function generateHTML({
  title,
  content,
  currentPath = "",
  navItems = [],
  themeCss = THEME_CSS,
  staticPrefix,
  basePath = "",
}) {
  const { generateNav } = require("./nav");
  const navHtml = generateNav(navItems, currentPath, basePath);
  const effectiveStaticPrefix =
    staticPrefix || (basePath ? `${basePath}/static` : "/static");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${effectiveStaticPrefix}/css/highlight.min.css">
    <script src="${effectiveStaticPrefix}/js/mermaid.min.js"></script>
    <script src="${effectiveStaticPrefix}/js/highlight.min.js"></script>
    <link rel="stylesheet" href="${effectiveStaticPrefix}/css/katex.min.css">
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // 代码高亮
        document.querySelectorAll('pre code').forEach(function(block) {
          if (window.hljs) hljs.highlightElement(block);
        });
        // Mermaid 图表
        if (window.mermaid && document.querySelector('.mermaid')) {
          mermaid.initialize({ startOnLoad: true });
          mermaid.run();
        }
      });
      // 主题切换
      function toggleTheme() {
        var html = document.documentElement;
        var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      }
      // 移动端菜单
      function toggleMenu() {
        document.querySelector('.nav-menu').classList.toggle('active');
      }
      // 恢复上次主题
      (function() {
        var saved = localStorage.getItem('theme');
        if (saved) document.documentElement.setAttribute('data-theme', saved);
      })();
    </script>
    <style>
      ${themeCss}
    </style>
</head>
<body>
  <div class="container">
    <nav>
      <button class="hamburger" onclick="toggleMenu()">☰</button>
      <ul class="nav-menu">
        ${navHtml}
      </ul>
      <button class="theme-switch" onclick="toggleTheme()"> 切换主题</button>
    </nav>
    <main>
      ${content}
    </main>
  </div>
</body>
</html>`;
}

module.exports = { generateHTML, escapeHtml, renderWithTemplate };
