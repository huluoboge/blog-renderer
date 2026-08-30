"use strict";

/**
 * 数学公式分析工具：对渲染后的 HTML 做公式统计与"泄漏检测"。
 *
 * 泄漏检测的意义：如果某段 LaTeX 没有被 KaTeX 解析（例如定界符不匹配、
 * 环境名拼错、markdown 解析器不支持某种写法），原始定界符（$$、\\(、
 * \\begin{...} 等）就会原样出现在页面文本中。原博客的公式支持质量非常高，
 * 本模块把"零泄漏"作为回归测试的硬性断言。
 *
 * 注意：代码块（<pre><code>）内的 $$ 是演示代码，不是待渲染公式，
 * 泄漏检测会先剔除代码块，避免误报。
 */

const KATEX_SPAN_RE = /<span class="katex[^>]*>[\s\S]*?<\/span>\s*<\/span>/g;
const PRE_BLOCK_RE = /<pre[\s\S]*?<\/pre>/g;
const INLINE_CODE_RE = /<code[^>]*>[\s\S]*?<\/code>/g;

/** 统计 KaTeX 渲染出的公式数量（以 x-tex annotation 为准，最可靠） */
function countKatex(html) {
  const total = (html.match(/<annotation encoding="application\/x-tex">/g) || [])
    .length;
  const display = (html.match(/katex-display/g) || []).length;
  return { total, display };
}

/** 提取所有公式源（annotation encoding="application/x-tex"），去重后返回 */
function extractAnnotations(html) {
  const anns = [
    ...html.matchAll(
      /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/g
    ),
  ].map((m) => m[1].trim());
  return new Set(anns);
}

/**
 * 泄漏检测：把已解析的 KaTeX 块整体替换为占位符，再剔除代码块与行内代码
 * （代码中的 $$ 是演示文本，不是待渲染公式），最后剥离所有标签，
 * 统计纯文本中残留的 LaTeX 定界符。返回每种定界符的残留计数。
 */
function detectLeaks(html) {
  const stripped = html
    .replace(KATEX_SPAN_RE, "MATH")
    .replace(PRE_BLOCK_RE, "CODE")
    .replace(INLINE_CODE_RE, "CODE");
  const text = stripped.replace(/<[^>]+>/g, "");
  const count = (re) => (text.match(re) || []).length;
  return {
    "$$": count(/\$\$/g),
    "\\[": count(/\\\[/g),
    "\\]": count(/\\\]/g),
    "\\(": count(/\\\(/g),
    "\\)": count(/\\\)/g),
    "\\begin{": count(/\\begin\{/g),
    "\\end{": count(/\\end\{/g),
  };
}

/** 汇总分析：公式数 + 唯一公式源 + 泄漏 */
function analyzeMath(html) {
  const { total, display } = countKatex(html);
  return {
    katexTotal: total,
    katexDisplay: display,
    uniqueFormulas: extractAnnotations(html),
    leaks: detectLeaks(html),
  };
}

/** 判断是否零泄漏 */
function hasNoLeaks(leaks) {
  return Object.values(leaks).every((n) => n === 0);
}

module.exports = {
  KATEX_SPAN_RE,
  PRE_BLOCK_RE,
  INLINE_CODE_RE,
  countKatex,
  extractAnnotations,
  detectLeaks,
  analyzeMath,
  hasNoLeaks,
};
