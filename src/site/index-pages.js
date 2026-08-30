"use strict";

/**
 * 索引页/首页生成：纯函数部分（HTML 构建逻辑），
 * 与原博客 render.js generateIndexPage 的模板一致。
 */

/**
 * 从完整 HTML 中提取 <main> 标签内的内容
 * @param {string} html 完整页面 HTML
 * @returns {string|null} main 内容，找不到返回 null
 */
function extractMainContent(html) {
  // 优先提取内容容器（外部模板常见 .blog-content），否则取 main 内部
  const contentMatch = html.match(/<div class="blog-content"[^>]*>([\s\S]*?)<\/div>\s*<\/main>/);
  if (contentMatch && contentMatch[1]) return contentMatch[1];
  const match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  return match && match[1] ? match[1] : null;
}

/**
 * 格式化日期为 YYYY-MM-DD。
 * front-matter 的 date 经 YAML 解析可能是 Date 对象（toString 长格式）或字符串。
 */
function formatDate(raw) {
  if (!raw) return "";
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return String(raw).slice(0, 10);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * 生成最新文章列表 HTML（按日期降序取前 N 篇）
 * @param {Array} allArticles 全部文章（含 date/folder/slug/title）
 * @param {number} count      取多少篇
 */
function buildLatestArticlesHTML(allArticles, count = 3) {
  const sorted = allArticles
    .filter((article) => article.date && article.folder === "articles")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count);

  return sorted
    .map((article) => {
      const articlePath = `articles/${article.slug}/index.html`;
      return `<li><a href="${articlePath}">${article.title}</a> - ${new Date(
        article.date
      ).toLocaleDateString("zh-CN")}</li>`;
    })
    .join("\n");
}

/**
 * 生成开源项目列表 HTML（按日期降序）
 * @param {Array} allArticles 全部文章
 */
function buildProjectsHTML(allArticles) {
  const projects = allArticles
    .filter((article) => article.folder === "projects")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return projects
    .map((project) => {
      const projectPath = `projects/${project.file.replace(".md", ".html")}`;
      return `<li><a href="${projectPath}">${project.title}</a> - ${
        project.excerpt || "开源项目"
      }</li>`;
    })
    .join("\n");
}

/**
 * 替换主页占位符（最新文章、开源项目）
 * @param {string} mainContent 首页 main 内容
 * @param {Array} allArticles  全部文章
 * @param {object} homepageCfg 主页配置 { latest_articles_count, show_projects }
 */
function buildHomepageContent(mainContent, allArticles, homepageCfg = {}) {
  let updatedContent = mainContent;
  const count = homepageCfg.latest_articles_count ?? 3;

  if (mainContent.includes('<div id="latest-articles-placeholder"></div>')) {
    updatedContent = updatedContent.replace(
      '<div id="latest-articles-placeholder"></div>',
      `<ul>${buildLatestArticlesHTML(allArticles, count)}</ul>`
    );
  }

  if (
    mainContent.includes('<div id="open-source-projects-placeholder"></div>') &&
    homepageCfg.show_projects !== false
  ) {
    updatedContent = updatedContent.replace(
      '<div id="open-source-projects-placeholder"></div>',
      `<ul>${buildProjectsHTML(allArticles)}</ul>`
    );
  }

  return updatedContent;
}

/**
 * 生成普通分类索引页内容
 * @param {Array} articles 该分类的文章
 * @param {object} navItem 导航项 { name }
 */
function buildIndexContent(articles, navItem) {
  const sortedArticles = [...articles].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const listHTML = sortedArticles
    .map((article) => {
      const hasImage = article.image && article.image.trim() !== "";
      return `
      <div class="article-item ${hasImage ? "article-item-with-image" : ""}">
          ${
            hasImage
              ? `
          <div class="article-thumbnail-container">
              <img src="${article.image}" alt="${article.title}" class="article-thumbnail">
          </div>
          `
              : ""
          }
          <div class="article-content">
              <h3><a href="${article.slug}/index.html">${article.title}</a></h3>
              <div class="article-meta">
                  ${article.date ? `发布于: ${formatDate(article.date)}` : ""}
                  ${article.tags ? ` | 标签: ${article.tags.join(", ")}` : ""}
              </div>
              ${article.excerpt ? `<p>${article.excerpt}</p>` : ""}
          </div>
      </div>
    `;
    })
    .join("\n");

  return `
      <h1>${navItem.name}</h1>
      <div class="article-list">
          ${listHTML}
      </div>
    `;
}

module.exports = {
  extractMainContent,
  buildLatestArticlesHTML,
  buildProjectsHTML,
  buildHomepageContent,
  buildIndexContent,
  formatDate,
};
