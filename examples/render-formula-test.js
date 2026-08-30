"use strict";

/**
 * 渲染综合公式测试页（examples/formula-test.md → examples/formula-test.html）。
 * 用法: npm run test:formula
 *
 * 使用 exportFullPage 而非 renderMarkdown：前者输出完整 HTML 页面
 * （含 KaTeX CSS、github-light 主题排版、Prism 代码高亮），
 * 渲染效果与 VSCode markdown-preview-enhanced 插件一致
 * （crossnote 即 MPE 的底层引擎，默认 previewTheme 同为 github-light）。
 */

const path = require("path");
const fs = require("fs-extra");
const { exportFullPage } = require("../src/core/renderer");
const { analyzeMath, hasNoLeaks } = require("../src/core/math");

(async () => {
  const mdPath = path.join(__dirname, "formula-test.md");
  const htmlPath = path.join(__dirname, "formula-test.html");
  const md = await fs.readFile(mdPath, "utf8");
  const { html } = await exportFullPage({ filePath: mdPath, content: md });
  await fs.writeFile(htmlPath, html);

  const analysis = analyzeMath(html);
  const clean = hasNoLeaks(analysis.leaks);
  console.log(`公式总数: ${analysis.katexTotal}`);
  console.log(`块级公式: ${analysis.katexDisplay}`);
  console.log(`泄漏: ${JSON.stringify(analysis.leaks)}`);
  console.log(`零泄漏: ${clean ? "✓" : "✗ 存在泄漏!"}`);
  console.log(`已生成: ${htmlPath}`);
  process.exit(clean ? 0 : 1);
})();
