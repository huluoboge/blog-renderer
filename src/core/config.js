"use strict";

/**
 * 引擎配置：crossnote (markdown-preview-enhanced 核心引擎) 的渲染配置。
 *
 * 公式定界符与原博客 render.js 完全一致：
 *   - 行内：$...$ 和 \(...\)
 *   - 块级：$$...$$ 和 \[...\]
 * 渲染引擎：KaTeX（服务端渲染，输出带 MathML annotation 的 HTML，无 JS 依赖）。
 */

/** 默认引擎配置 */
function defaultConfig() {
  return {
    // ---- 数学公式（核心）----
    mathRenderingOption: "KaTeX",
    mathInlineDelimiters: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    mathBlockDelimiters: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    // markdown_yo 在 superpoint 文章上会泄漏 \begin{cases}，不可用；markdown-it 与 mume 一致
    markdownParser: "markdown-it",
    // ---- 其他渲染选项 ----
    enableEmojiSyntax: true,
    enableExtendedTableSyntax: true,
    enableLinkify: false,
    breakOnSingleNewLine: false,
    enableScriptExecution: false,
    previewTheme: "github-light.css",
    codeBlockTheme: "github-light.css",
    // KaTeX 选项（与 markdown-preview-enhanced 一致，可自定义 macros 等）
    katexConfig: { macros: {} },
  };
}

/** 与用户配置合并，用户配置优先 */
function resolveConfig(overrides = {}) {
  return { ...defaultConfig(), ...overrides };
}

module.exports = { defaultConfig, resolveConfig };
