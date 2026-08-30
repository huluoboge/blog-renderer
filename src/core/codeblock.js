"use strict";

/**
 * 代码块修复：crossnote 引擎输出 Prism 风格的代码块
 * （<pre data-role="codeBlock" data-info="lang" class="language-lang">），
 * 原博客统一改成 highlight.js 风格（class="hljs language-xxx"），
 * 与本博客静态资源 static/js/highlight.min.js 配合使用。
 */

const DATA_ROLE_RE =
  /<pre data-role="codeBlock" data-info="(.*?)" class="language-(.*?)"><code>/gi;
const DATA_ROLE_NO_LANG_RE =
  /<pre data-role="codeBlock" data-info=" class="language-"><code>/gi;
const PLAIN_LANG_RE = /<pre><code class="language-(.*?)">/gi;
const PLAIN_CODE_RE = /<pre>\s*<code(?!.*hljs)(?!.*class="[^"]*hljs[^"]*")/g;
const PRE_LEVEL_RE =
  /<pre data-role="codeBlock" data-info="(.*?)" class="language-(.*?)">/gi;

/** 语言规范化：language-text 或空视为无语言；多 token（如 "javascript js"）取第一个 */
function normalizeLang(lang) {
  const first = String(lang || "").split(/\s+/)[0];
  const l = (first || "").toLowerCase().trim();
  if (!l || l === "text" || l === "plain") return null;
  return l;
}

/** 把 crossnote/Prism 输出的代码块改写为 hljs 格式 */
function fixCodeBlocks(html) {
  let out = html;

  // 1. data-role="codeBlock" 且带语言：<pre data-role data-info class="language-x"><code>
  out = out.replace(DATA_ROLE_RE, (_, __, lang) => {
    const normalizedLang = normalizeLang(lang);
    return normalizedLang
      ? `<pre><code class="hljs language-${normalizedLang}">`
      : '<pre><code class="hljs">';
  });

  // 2. data-role="codeBlock" 且无语言
  out = out.replace(DATA_ROLE_NO_LANG_RE, '<pre><code class="hljs">');

  // 3. 普通 <pre><code class="language-x"> 但缺 hljs
  out = out.replace(PLAIN_LANG_RE, (_, lang) => {
    const normalizedLang = normalizeLang(lang);
    return normalizedLang
      ? `<pre><code class="hljs language-${normalizedLang}">`
      : '<pre><code class="hljs">';
  });

  // 4. 无语言 <pre><code> 补 hljs
  out = out.replace(PLAIN_CODE_RE, '<pre><code class="hljs"');

  // 5. 语言信息写在 pre 标签上（data-info 与 class 不配对时兜底）
  out = out.replace(PRE_LEVEL_RE, (_, __, lang) => {
    const normalizedLang = normalizeLang(lang);
    return normalizedLang
      ? `<pre><code class="hljs language-${normalizedLang}">`
      : '<pre><code class="hljs">';
  });

  return out;
}

module.exports = { fixCodeBlocks, normalizeLang };
