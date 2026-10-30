"use strict";

/**
 * 浏览器端重型资源（mermaid / highlight）的检测与按需加载。
 *
 * 构建期：正文没有流程图/代码块时，页面不应同步下载 ~3MB mermaid。
 * 运行时：有对应 DOM 再动态插入 <script>。
 */

/**
 * @param {string} html 已渲染的正文或整页 HTML
 * @returns {{ mermaid: boolean, highlight: boolean }}
 */
function detectClientAssets(html) {
  const text = String(html || "");
  return {
    mermaid: /\bclass\s*=\s*["']?mermaid\b/i.test(text),
    highlight: /<pre\b[\s\S]*?<code\b/i.test(text),
  };
}

/** 去掉 head 里同步引入的 mermaid / highlight（无论模板是否写死）。 */
function stripSyncHeavyScripts(pageHtml) {
  return String(pageHtml || "")
    .replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*mermaid\.min\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi, "")
    .replace(/<script\b[^>]*\bsrc\s*=\s*["'][^"']*highlight\.min\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi, "");
}

/**
 * 生成按需加载脚本。路径用绝对站点路径（如 /blog/static/js/...）。
 * @param {string} staticPrefix 例如 "/blog/static" 或 "/static"
 */
function buildOnDemandLoaderScript(staticPrefix = "/static") {
  const prefix = String(staticPrefix || "/static").replace(/\/$/, "");
  const highlightSrc = `${prefix}/js/highlight.min.js`;
  const mermaidSrc = `${prefix}/js/mermaid.min.js`;
  return `<script data-blog-asset-loader="1">
(function () {
  function staticUrl(abs) {
    if (typeof window.__blogStaticUrl === "function") return window.__blogStaticUrl(abs);
    return abs;
  }
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = staticUrl(src);
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector("pre code")) {
      loadScript(${JSON.stringify(highlightSrc)}).then(function () {
        document.querySelectorAll("pre code").forEach(function (block) {
          if (window.hljs) hljs.highlightElement(block);
        });
      });
    }
    if (document.querySelector(".mermaid")) {
      loadScript(${JSON.stringify(mermaidSrc)}).then(function () {
        mermaid.initialize({ startOnLoad: false });
        mermaid.run();
      });
    }
  });
})();
</script>`;
}

/**
 * 确保整页：无同步大脚本；有按需 loader（已有则不重复插入）。
 * @param {string} pageHtml
 * @param {{ staticPrefix?: string }} [opts]
 */
function ensureLazyClientAssets(pageHtml, { staticPrefix = "/static" } = {}) {
  let html = stripSyncHeavyScripts(pageHtml);
  if (/data-blog-asset-loader\s*=\s*["']?1["']?/.test(html)) {
    return html;
  }
  const loader = buildOnDemandLoaderScript(staticPrefix);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${loader}\n</body>`);
  }
  return html + "\n" + loader;
}

module.exports = {
  detectClientAssets,
  stripSyncHeavyScripts,
  buildOnDemandLoaderScript,
  ensureLazyClientAssets,
};
