"use strict";

/**
 * 渲染核心：封装 crossnote（markdown-preview-enhanced 的底层引擎，
 * mume 的继任者），提供 Markdown → HTML 的渲染能力。
 *
 * - getNotebook：Notebook 初始化 + 缓存（Notebook.init 较重，按 notebookPath+config 缓存）
 * - renderMarkdown：渲染 markdown 内容，返回 { html, yamlConfig }，html 已做代码块修复
 * - exportFullPage：基于引擎的 HTML 模板生成完整页面（CDN 或离线模式）
 */

const path = require("path");
const fs = require("fs-extra");
const { Notebook } = require("crossnote");
const { resolveConfig } = require("./config");
const { fixCodeBlocks } = require("./codeblock");

const notebookCache = new Map();

/** 清空 notebook 缓存（测试用） */
function clearNotebookCache() {
  notebookCache.clear();
}

/**
 * 获取（并缓存）crossnote notebook。
 * @param {string} notebookPath 笔记本根目录
 * @param {object} config       引擎配置（会与默认配置合并）
 */
async function getNotebook(notebookPath, config = {}) {
  const resolved = resolveConfig(config);
  const key = `${notebookPath}|${JSON.stringify(resolved)}`;
  if (!notebookCache.has(key)) {
    const dir = notebookPath || path.dirname(process.cwd());
    await fs.ensureDir(dir);
    const notebook = await Notebook.init({
      notebookPath: dir,
      config: resolved,
    });
    notebookCache.set(key, notebook);
  }
  return notebookCache.get(key);
}

/**
 * 渲染 markdown 内容。
 * @param {object} opts
 * @param {string} opts.filePath      引擎使用的文件路径（决定相对资源解析）
 * @param {string} opts.content       markdown 原文
 * @param {string} [opts.notebookPath] 笔记本根目录，默认取 filePath 所在目录
 * @param {object} [opts.config]      引擎配置覆盖
 * @param {object} [opts.parseOptions] parseMD 额外选项
 * @returns {Promise<{html: string, yamlConfig: object}>}
 */
async function renderMarkdown({
  filePath,
  content,
  notebookPath,
  config = {},
  parseOptions = {},
}) {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    throw new Error("renderMarkdown: filePath 不能为空");
  }
  if (!path.isAbsolute(filePath)) {
    throw new Error(
      `renderMarkdown: filePath 必须是绝对路径（收到: ${filePath}）`
    );
  }
  const nbPath = notebookPath || path.dirname(filePath);
  const notebook = await getNotebook(nbPath, config);
  const engine = notebook.getNoteMarkdownEngine(filePath);
  const result = await engine.parseMD(content, {
    useRelativeFilePath: true,
    hideFrontMatter: true,
    isForPreview: false,
    runAllCodeChunks: false,
    ...parseOptions,
  });
  // crossnote 恒返回对象；防御性兜底
  /* istanbul ignore next */
  const yamlConfig = result.yamlConfig || {};
  return {
    html: fixCodeBlocks(result.html),
    yamlConfig,
  };
}

/**
 * 用引擎模板生成完整 HTML 页面（含 KaTeX CSS、Mermaid 脚本等）。
 * 对齐 crossnote htmlExport 行为：front-matter 中 html.offline / html.embed_local_images
 * / html.embed_svg 可覆盖调用参数。
 * @param {object} opts 见 renderMarkdown，另加 offline/embedLocalImages/embedSVG
 */
async function exportFullPage({
  filePath,
  content,
  notebookPath,
  config = {},
  parseOptions = {},
  offline = false,
  embedLocalImages = false,
  embedSVG = true,
}) {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    throw new Error("exportFullPage: filePath 不能为空");
  }
  if (!path.isAbsolute(filePath)) {
    throw new Error(
      `exportFullPage: filePath 必须是绝对路径（收到: ${filePath}）`
    );
  }
  const nbPath = notebookPath || path.dirname(filePath);
  const notebook = await getNotebook(nbPath, config);
  const engine = notebook.getNoteMarkdownEngine(filePath);
  const result = await engine.parseMD(content, {
    useRelativeFilePath: true,
    hideFrontMatter: true,
    isForPreview: false,
    runAllCodeChunks: false,
    ...parseOptions,
  });
  const bodyHtml = fixCodeBlocks(result.html);
  // crossnote 恒返回对象；防御性兜底
  /* istanbul ignore next */
  const yamlConfig = result.yamlConfig || {};

  const htmlConfig =
    yamlConfig.html && typeof yamlConfig.html === "object"
      ? yamlConfig.html
      : {};
  const effectiveOffline =
    "offline" in htmlConfig ? Boolean(htmlConfig.offline) : offline;

  const pageHtml = await engine.generateHTMLTemplateForExport(
    bodyHtml,
    yamlConfig,
    {
      isForPrint: false,
      isForPrince: false,
      offline: effectiveOffline,
      embedLocalImages: Boolean(
        htmlConfig.embed_local_images ?? embedLocalImages
      ),
      embedSVG: htmlConfig.embed_svg !== false && embedSVG,
    }
  );
  return { html: pageHtml, bodyHtml, yamlConfig };
}

module.exports = {
  getNotebook,
  renderMarkdown,
  exportFullPage,
  clearNotebookCache,
  notebookCache,
};
