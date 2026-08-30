"use strict";

/**
 * Markdown 链接与嵌入处理（在原博客 render.js 基础上模块化重构）：
 *
 * 1. 嵌入语法 ![](path.md)：读取目标文件内容，递归处理后内联替换（支持循环引用检测）
 * 2. 链接语法 [text](path.md)：改写为 [text](path.html)，支持 file:// 绝对路径转相对路径
 *
 * 与渲染引擎无关的纯文本处理，可独立测试。
 */

const path = require("path");

const EMBED_RE = /!\[([^\]]*)\]\(([^)]+\.md)\)/g;
const LINK_RE = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

/**
 * 处理 content 中的 .md 嵌入与链接。
 *
 * @param {string} content      markdown 原文
 * @param {string} mdFileDir    当前文件所在目录（用于解析相对路径）
 * @param {object} fsApi        文件系统接口 { pathExists, readFile }（可注入以便测试）
 * @returns {Promise<{content: string, filesToProcess: string[]}>}
 */
async function processLinksAndEmbeds(content, mdFileDir, fsApi) {
  const processedFiles = new Set(); // 已内联的文件（防循环）
  const filesToProcess = new Set(); // 所有被引用的 .md 文件（需要单独渲染）

  async function processRecursively(text, currentDir) {
    const embedMatches = [];
    text.replace(EMBED_RE, (match, altText, embedPath, offset) => {
      embedMatches.push({ match, altText, embedPath, offset, isEmbed: true });
      return match;
    });

    const linkMatches = [];
    text.replace(LINK_RE, (match, text_, linkPath, offset) => {
      linkMatches.push({ match, text: text_, linkPath, offset, isEmbed: false });
      return match;
    });

    const allMatches = [...embedMatches, ...linkMatches].sort(
      (a, b) => a.offset - b.offset
    );

    let result = text;
    let offsetAdjustment = 0;

    for (const m of allMatches) {
      const rawPath = m.isEmbed ? m.embedPath : m.linkPath;
      // file:// 前缀是绝对路径：去掉前缀直接用；否则按相对当前目录解析
      const resolvedPath = rawPath.startsWith("file://")
        ? rawPath.replace("file://", "")
        : path.resolve(currentDir, rawPath);

      if (!(await fsApi.pathExists(resolvedPath))) {
        continue; // 文件不存在：保留原样
      }

      // 嵌入内容循环引用检测
      if (m.isEmbed && processedFiles.has(resolvedPath)) {
        continue;
      }
      if (m.isEmbed) {
        processedFiles.add(resolvedPath);
      }
      filesToProcess.add(resolvedPath);

      let replacement;
      if (m.isEmbed) {
        const embedContent = await fsApi.readFile(resolvedPath, "utf8");
        replacement = await processRecursively(
          embedContent,
          path.dirname(resolvedPath)
        );
      } else {
        const htmlPath = rawPath.startsWith("file://")
          ? path
              .relative(currentDir, rawPath.replace("file://", ""))
              .replace(/\.md$/, ".html")
          : rawPath.replace(/\.md$/, ".html");
        replacement = `<a href="${htmlPath}">${m.text}</a>`;
      }

      const currentOffset = result.indexOf(m.match, offsetAdjustment);
      if (currentOffset !== -1) {
        result =
          result.slice(0, currentOffset) +
          replacement +
          result.slice(currentOffset + m.match.length);
        offsetAdjustment += replacement.length - m.match.length;
      }
    }

    return result;
  }

  const processedContent = await processRecursively(content, mdFileDir);
  return {
    content: processedContent,
    filesToProcess: Array.from(filesToProcess),
  };
}

module.exports = { processLinksAndEmbeds, EMBED_RE, LINK_RE };
