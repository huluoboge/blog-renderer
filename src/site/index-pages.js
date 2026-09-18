"use strict";

/**
 * 索引页/首页生成：纯函数部分（HTML 构建逻辑）。
 *
 * 文章继续保留在原有路径，分类通过 front matter 的 categories 字段维护。
 * 这样不会破坏文章内部的相对链接，同时可以生成稳定的分类页和检索入口。
 */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCategories(raw) {
  if (Array.isArray(raw)) {
    return raw.map((value) => String(value).trim()).filter(Boolean);
  }
  if (raw === undefined || raw === null || raw === "") return [];
  return [String(raw).trim()].filter(Boolean);
}

function slugifyCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryNameFromSlug(slug) {
  const names = {
    "state-estimation": "SLAM / 状态估计",
    reconstruction: "三维重建",
    "neural-rendering": "NeRF / 3DGS",
    "local-features": "局部特征与匹配",
    geometry: "多视图几何",
    "image-processing": "图像处理与评价",
    engineering: "工具与工程",
    uncategorized: "未分类",
  };
  return names[slug] || slug;
}

function getArticleCategories(article) {
  return normalizeCategories(article.categories ?? article.category);
}

function categoryData(article) {
  const categories = getArticleCategories(article);
  return categories.length > 0 ? categories.map(slugifyCategory) : ["uncategorized"];
}

function sortArticles(articles) {
  return [...articles].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });
}

/**
 * 将配置中的分类与文章元数据合并，保证新增分类不需要修改渲染器。
 * 配置格式：[{ slug, name, description }]
 */
function buildCategoryDefinitions(allArticles, configuredCategories = []) {
  const definitions = new Map();

  for (const item of Array.isArray(configuredCategories) ? configuredCategories : []) {
    const slug = item && typeof item === "object" ? item.slug : item;
    if (!slug) continue;
    const normalizedSlug = slugifyCategory(slug);
    definitions.set(normalizedSlug, {
      slug: normalizedSlug,
      name:
        item && typeof item === "object" && item.name
          ? String(item.name)
          : categoryNameFromSlug(normalizedSlug),
      description:
        item && typeof item === "object" && item.description
          ? String(item.description)
          : "",
    });
  }

  for (const article of allArticles) {
    for (const category of categoryData(article)) {
      if (!definitions.has(category)) {
        definitions.set(category, {
          slug: category,
          name: categoryNameFromSlug(category),
          description: "",
        });
      }
    }
  }

  return [...definitions.values()];
}

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

function articleSearchText(article) {
  return [
    article.title,
    article.excerpt,
    ...normalizeCategories(article.tags),
    ...getArticleCategories(article),
    ...getArticleCategories(article).map((category) =>
      categoryNameFromSlug(slugifyCategory(category))
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildCategoryLabels(article, categoryLinkPrefix = "") {
  const categories = getArticleCategories(article);
  if (categories.length === 0) return "";
  return categories
    .map((category) => {
      const slug = slugifyCategory(category);
      return `<a href="${categoryLinkPrefix}${slug}/index.html">${escapeHtml(
        categoryNameFromSlug(slug)
      )}</a>`;
    })
    .join(", ");
}

function buildArticleListHTML(
  articles,
  { linkPrefix = "", categoryLinkPrefix = "" } = {}
) {
  return sortArticles(articles)
    .map((article) => {
      const hasImage = article.image && String(article.image).trim() !== "";
      const tags = normalizeCategories(article.tags);
      const categories = getArticleCategories(article);
      const metaParts = [];
      if (article.date) metaParts.push(`发布于: ${formatDate(article.date)}`);
      if (tags.length > 0) metaParts.push(`标签: ${escapeHtml(tags.join(", "))}`);
      if (categories.length > 0) {
        metaParts.push(`分类: ${buildCategoryLabels(article, categoryLinkPrefix)}`);
      }
      const search = escapeHtml(articleSearchText(article));
      const dataCategories = escapeHtml(categoryData(article).join(" "));
      const className = hasImage ? "article-item article-item-with-image" : "article-item";

      return `
      <div class="${className}" data-article-item data-search="${search}" data-category="${dataCategories}">
          ${
            hasImage
              ? `
          <div class="article-thumbnail-container">
              <img src="${escapeHtml(article.image)}" alt="${escapeHtml(
                  article.title
                )}" class="article-thumbnail">
          </div>
          `
              : ""
          }
          <div class="article-content">
              <h3><a href="${linkPrefix}${article.slug}/index.html">${escapeHtml(
        article.title
      )}</a></h3>
              <div class="article-meta">${metaParts.join(" | ")}</div>
              ${article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : ""}
          </div>
      </div>
    `;
    })
    .join("\n");
}

/**
 * 生成最新文章列表 HTML（按日期降序取前 N 篇）
 * @param {Array} allArticles 全部文章（含 date/folder/slug/title）
 * @param {number} count 取多少篇
 */
function buildLatestArticlesHTML(allArticles, count = 3) {
  const sorted = allArticles
    .filter((article) => article.date && article.folder === "articles")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count);

  return sorted
    .map((article) => {
      const articlePath = `articles/${article.slug}/index.html`;
      return `<li><a href="${articlePath}">${escapeHtml(article.title)}</a> - ${new Date(
        article.date
      ).toLocaleDateString("zh-CN")}</li>`;
    })
    .join("\n");
}

/**
 * 生成全部文章列表 HTML（完整列表，与分类索引页同款 article-item 卡片）。
 * @param {Array} allArticles 全部文章
 * @param {object} options 链接前缀配置
 */
function buildAllArticlesHTML(allArticles, options = {}) {
  const articles = allArticles.filter((article) => article.folder === "articles");
  return buildArticleListHTML(articles, {
    linkPrefix: options.linkPrefix ?? "articles/",
    categoryLinkPrefix: options.categoryLinkPrefix ?? "categories/",
  });
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
      return `<li><a href="${projectPath}">${escapeHtml(project.title)}</a> - ${escapeHtml(
        project.excerpt || "开源项目"
      )}</li>`;
    })
    .join("\n");
}

function buildCategoryOverviewHTML(allArticles, categories, { linkPrefix = "" } = {}) {
  const articles = allArticles.filter((article) => article.folder === "articles");
  const cards = categories
    .map((category) => {
      const count = articles.filter((article) =>
        categoryData(article).includes(category.slug)
      ).length;
      if (count === 0) return "";
      return `
      <a class="category-card" href="${linkPrefix}${category.slug}/index.html">
        <span class="category-card-name">${escapeHtml(category.name)}</span>
        <span class="category-card-count">${count} 篇</span>
        ${
          category.description
            ? `<span class="category-card-description">${escapeHtml(
                category.description
              )}</span>`
            : ""
        }
      </a>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<div class="category-grid">${cards}</div>`;
}

function buildArticleDiscoveryHTML(allArticles, categories) {
  const articles = allArticles.filter((article) => article.folder === "articles");
  const categoryOptions = categories
    .filter((category) =>
      articles.some((article) => categoryData(article).includes(category.slug))
    )
    .map(
      (category) =>
        `<option value="${escapeHtml(category.slug)}">${escapeHtml(
          category.name
        )}</option>`
    )
    .join("");
  const list = buildArticleListHTML(articles, {
    linkPrefix: "articles/",
    categoryLinkPrefix: "categories/",
  });

  return `
  <section class="article-discovery" data-article-discovery>
    <div class="discovery-toolbar">
      <label class="discovery-search">
        <span>搜索文章</span>
        <input type="search" data-article-search placeholder="标题、摘要、标签" autocomplete="off">
      </label>
      <label class="discovery-filter">
        <span>分类</span>
        <select data-article-category>
          <option value="">全部分类</option>
          ${categoryOptions}
        </select>
      </label>
      <span class="discovery-count" data-article-count>${articles.length} 篇文章</span>
    </div>
    <div class="discovery-categories">
      <div class="discovery-section-label">按分类浏览</div>
      ${buildCategoryOverviewHTML(allArticles, categories, {
        linkPrefix: "categories/",
      })}
    </div>
    <div class="article-list" data-article-list>${list}</div>
    <p class="discovery-empty" data-article-empty hidden>没有匹配的文章。</p>
  </section>
  <script>
    (function () {
      var root = document.querySelector('[data-article-discovery]');
      if (!root) return;
      var input = root.querySelector('[data-article-search]');
      var select = root.querySelector('[data-article-category]');
      var count = root.querySelector('[data-article-count]');
      var empty = root.querySelector('[data-article-empty]');
      var items = Array.prototype.slice.call(root.querySelectorAll('[data-article-item]'));
      function update() {
        var query = (input.value || '').trim().toLowerCase();
        var category = select.value;
        var visible = 0;
        items.forEach(function (item) {
          var matchesQuery = !query || (item.getAttribute('data-search') || '').indexOf(query) !== -1;
          var categories = (item.getAttribute('data-category') || '').split(' ');
          var matchesCategory = !category || categories.indexOf(category) !== -1;
          var show = matchesQuery && matchesCategory;
          item.hidden = !show;
          if (show) visible += 1;
        });
        count.textContent = visible + ' 篇文章';
        empty.hidden = visible !== 0;
      }
      input.addEventListener('input', update);
      select.addEventListener('change', update);
    })();
  </script>`;
}

/**
 * 替换主页占位符（最新文章、文章导航、开源项目）
 * @param {string} mainContent 首页 main 内容
 * @param {Array} allArticles 全部文章
 * @param {object} homepageCfg 主页配置
 */
function buildHomepageContent(mainContent, allArticles, homepageCfg = {}, categories = []) {
  let updatedContent = mainContent;
  const count = homepageCfg.latest_articles_count ?? 3;

  if (mainContent.includes('<div id="latest-articles-placeholder"></div>')) {
    updatedContent = updatedContent.replace(
      '<div id="latest-articles-placeholder"></div>',
      `<ul>${buildLatestArticlesHTML(allArticles, count)}</ul>`
    );
  }

  if (mainContent.includes('<div id="all-articles-placeholder"></div>')) {
    updatedContent = updatedContent.replace(
      '<div id="all-articles-placeholder"></div>',
      `<div class="article-list">${buildAllArticlesHTML(allArticles)}</div>`
    );
  }

  if (mainContent.includes('<div id="article-discovery-placeholder"></div>')) {
    const resolvedCategories =
      categories.length > 0
        ? categories
        : buildCategoryDefinitions(allArticles, homepageCfg.categories || []);
    updatedContent = updatedContent.replace(
      '<div id="article-discovery-placeholder"></div>',
      buildArticleDiscoveryHTML(allArticles, resolvedCategories)
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
 * 生成分类详情页内容。
 * 分类页位于 categories/<slug>/，文章位于 articles/<slug>/。
 */
function buildCategoryIndexContent(category, articles) {
  return `
    <a class="back-button" href="../index.html">← 返回文章分类</a>
    <h1>${escapeHtml(category.name)}</h1>
    ${
      category.description
        ? `<p class="category-description">${escapeHtml(category.description)}</p>`
        : ""
    }
    <div class="article-list">${buildArticleListHTML(articles, {
      linkPrefix: "../../articles/",
      categoryLinkPrefix: "../",
    })}</div>
  `;
}

/**
 * 生成普通分类索引页内容
 * @param {Array} articles 该分类的文章
 * @param {object} navItem 导航项 { name }
 */
function buildIndexContent(articles, navItem) {
  return `
      <h1>${escapeHtml(navItem.name)}</h1>
      <div class="article-list">
          ${buildArticleListHTML(articles, { linkPrefix: "" })}
      </div>
    `;
}

module.exports = {
  extractMainContent,
  buildLatestArticlesHTML,
  buildAllArticlesHTML,
  buildProjectsHTML,
  buildHomepageContent,
  buildArticleDiscoveryHTML,
  buildCategoryDefinitions,
  buildCategoryOverviewHTML,
  buildCategoryIndexContent,
  buildArticleListHTML,
  getArticleCategories,
  normalizeCategories,
  slugifyCategory,
  buildIndexContent,
  formatDate,
};
