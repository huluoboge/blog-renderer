"use strict";

/**
 * 文章发现：查找子目录中的 index.md，解析 front-matter，跳过草稿。
 * 原博客 render.js discoverArticles 的模块化版本。
 */

const path = require("path");
const fs = require("fs-extra");
const frontMatter = require("front-matter");

/**
 * 发现文件夹下的文章（子目录中的 index.md）
 * @param {string} folderPath 要扫描的文件夹
 * @param {object} [fsApi]    文件系统接口（可注入以便测试）
 * @returns {Promise<Array<{path: string, folder: string, slug: string, attributes: object}>>}
 */
async function discoverArticles(folderPath, fsApi = fs) {
  const articles = [];

  if (!(await fsApi.pathExists(folderPath))) {
    return articles;
  }

  const items = await fsApi.readdir(folderPath);

  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    let stat;
    try {
      stat = await fsApi.stat(itemPath);
    } catch {
      continue; // 无法 stat（如权限问题）则跳过
    }

    if (!stat.isDirectory()) {
      continue; // 只处理子目录
    }

    const indexPath = path.join(itemPath, "index.md");
    if (!(await fsApi.pathExists(indexPath))) {
      continue;
    }

    try {
      const content = await fsApi.readFile(indexPath, "utf8");
      const parsed = frontMatter(content);
      const attributes = parsed.attributes;

      // 草稿跳过（draft: true）
      if (attributes.draft === true) {
        continue;
      }

      articles.push({
        path: indexPath,
        folder: itemPath,
        slug: item,
        attributes,
      });
    } catch {
      // 解析失败的文章跳过
    }
  }

  return articles;
}

module.exports = { discoverArticles };
