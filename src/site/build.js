"use strict";

/**
 * 站点构建编排：单篇文章渲染 + 全站批量构建。
 * 原博客 render.js processMarkdownFile / renderAll 的模块化版本，
 * 渲染引擎从 mume 替换为 crossnote（公式支持一致，见 compare-report.txt）。
 */

const path = require("path");
const fs = require("fs-extra");
const frontMatter = require("front-matter");

const renderer = require("../core/renderer");
const { processLinksAndEmbeds } = require("../core/links");
const { generateHTML, renderWithTemplate } = require("./template");
const { loadConfig } = require("./config");
const { discoverArticles } = require("./discover");
const {
  extractMainContent,
  buildHomepageContent,
  buildIndexContent,
  buildCategoryDefinitions,
  buildCategoryOverviewHTML,
  buildCategoryIndexContent,
  getArticleCategories,
  slugifyCategory,
} = require("./index-pages");

/**
 * 计算页面相对站点根目录的路径（用于导航激活态）
 * @param {string} outputPath 输出文件绝对路径
 * @param {string} cwd        站点根目录
 */
function relativePagePath(outputPath, cwd) {
  const relativePath =
    "/" +
    path.relative(cwd, path.dirname(outputPath)).replace(/\\/g, "/");
  return relativePath === "/." ? "/" : relativePath;
}

/**
 * 渲染完整页面：配置了外部模板（templateFile）时用外部模板（渲染器只提供内容），
 * 否则用内置站点模板。
 * @param {object} ctx  { templateHtml, basePath, navItems, currentPath }
 * @param {object} vars { title, content, currentPath }
 */
function renderPage(ctx, { title, content, currentPath }) {
  if (ctx.templateHtml) {
    return renderWithTemplate(ctx.templateHtml, {
      title,
      content,
      basePath: ctx.basePath || "",
    });
  }
  return generateHTML({
    title,
    content,
    currentPath,
    navItems: ctx.navItems,
    basePath: ctx.basePath || "",
  });
}

/**
 * 渲染单个 markdown 文件为 HTML 并写入磁盘。
 * @param {string} filePath  md 文件绝对路径
 * @param {object} ctx       { cwd, navItems, engineConfig }
 * @returns {Promise<object|null>} 文章 meta（title/date/tags/excerpt/image）
 */
async function processMarkdownFile(filePath, ctx) {
  const { cwd, navItems, engineConfig, basePath = "" } = ctx;
  console.log(`处理文件: ${filePath}`);

  const mdFileDir = path.dirname(filePath);
  const content = await fs.readFile(filePath, "utf8");

  // 解析 Front Matter
  const parsed = frontMatter(content);
  const body = parsed.body;
  const attributes = parsed.attributes;

  let title = path.basename(filePath, ".md");
  if (attributes.title) title = attributes.title;

  // 处理 markdown 链接和嵌入 - 在渲染之前处理
  const { content: processedBody, filesToProcess } =
    await processLinksAndEmbeds(body, mdFileDir, fs);

  // 处理所有被引用的文件（递归，避免重复处理当前文件）
  for (const referencedFile of filesToProcess) {
    if (referencedFile !== filePath) {
      try {
        await processMarkdownFile(referencedFile, ctx);
      } catch (error) {
        console.warn(`处理被引用文件失败: ${referencedFile}`, error);
      }
    }
  }

  // 渲染 Markdown（crossnote 引擎，公式支持与原 mume 一致）
  const { html: renderedHtml } = await renderer.renderMarkdown({
    filePath,
    content: processedBody,
    config: engineConfig,
  });
  let htmlContent = renderedHtml;

  // 处理相对路径，图片和文档的格式（file:// 绝对路径 → 相对路径）
  htmlContent = htmlContent.replace(/file:\/\/\/[^"]*\.(jpg|png|gif|svg|html)/g, (absolutePath) => {
    const fileSystemPath = absolutePath.replace("file://", "");
    return path.relative(mdFileDir, fileSystemPath);
  });
  htmlContent = htmlContent.replace(/""/g, '"');

  // 返回按钮（文章页面显示返回链接：分类列表存在则返回分类，否则返回博客首页）
  const folderName = path.dirname(filePath).split(path.sep).pop();
  const parentFolder = path
    .dirname(filePath)
    .split(path.sep)
    .slice(-2, -1)[0];
  const parentNavItem = navItems.find(
    (item) => item.folder === parentFolder && !item.isHome
  );
  const isArticlePage = folderName !== "." && Boolean(parentNavItem);
  const isRootLevel = path.dirname(filePath) === cwd;
  // 首页源文件（<home>/home/index.md）是主页内容，不加返回按钮
  const isHomeSource = parentFolder === "home" && folderName === "home";

  let finalContent = htmlContent;
  if (isArticlePage && !isHomeSource) {
    const backButton = `<a href="../index.html" class="back-button">← 返回${
      parentNavItem.name
    }</a>`;
    finalContent = backButton + htmlContent;
  } else if (folderName !== "." && !isRootLevel && !isHomeSource) {
    // 无分类导航时，返回博客首页（文章位于 /blog/<folder>/<slug>/，向上两级）
    const backButton = `<a href="../../index.html" class="back-button">← 返回博客首页</a>`;
    finalContent = backButton + htmlContent;
  } else {
    // 站点根级文件或首页源文件，不加返回按钮
    /* istanbul ignore next */
    finalContent = htmlContent;
  }

  const outputPath = path.join(
    ctx.outputDir || cwd,
    path.relative(cwd, filePath).replace(/\.md$/, ".html")
  );

  // 修复导航栏激活状态：计算相对于站点根目录的路径（基于源文件位置）
  const normalizedPath = relativePagePath(filePath, cwd);

  const fullHTML = renderPage(ctx, {
    title,
    content: finalContent,
    currentPath: normalizedPath,
  });
  await fs.outputFile(outputPath, fullHTML);
  console.log(`生成成功: ${outputPath}`);

  return {
    title,
    date: attributes.date,
    tags: attributes.tags,
    categories: attributes.categories ?? attributes.category,
    excerpt: attributes.excerpt,
    image: attributes.image,
  };
}

/**
 * 生成分类索引页或主页。
 * @param {string} folder      导航项文件夹名
 * @param {Array}  articles    该分类文章列表（含 meta + slug/file/folder/articlePath）
 * @param {Array}  allArticles 全部文章
 * @param {object} ctx         { cwd, navItems, config, engineConfig }
 */
async function generateIndexPage(folder, articles, allArticles, ctx) {
  const { cwd, navItems, config, engineConfig, basePath = "" } = ctx;
  const navItem = navItems.find((item) => item.folder === folder);

  if (navItem.isHome) {
    // 首页独立生成：直接渲染 <folder>/home/index.md（约定 home/home/index.md），
    // 不依赖文章清单。文件不存在则跳过。
    const homeMdPath = path.join(cwd, folder, "home", "index.md");
    if (!(await fs.pathExists(homeMdPath))) {
      console.log("首页源文件不存在，跳过主页生成");
      return;
    }
    await processMarkdownFile(homeMdPath, ctx);

    // 读取生成的 HTML 内容（注意输出目录可能不同于源目录）
    const homeHtmlPath = path.join(
      ctx.outputDir || cwd,
      folder,
      "home",
      "index.html"
    );
    const indexContent = await fs.readFile(homeHtmlPath, "utf8");

    // 提取 main 标签内的内容
    const mainContent = extractMainContent(indexContent);
    if (mainContent) {
      // 修复相对路径链接
      let updated = mainContent.replace(/file:\/\/\/\//g, "./");
      updated = updated.replace(/file:\/\//g, "./");

      // 替换主页占位符（最近文章、全部文章、开源项目）
      const content = buildHomepageContent(
        updated,
        allArticles,
        config.homepage || {},
        buildCategoryDefinitions(allArticles, config.categories || [])
      );

      const outputPath = path.join(ctx.outputDir || cwd, folder, "index.html");
      const html = renderPage(ctx, {
        title: navItem.name,
        content,
        currentPath: "/",
      });

      await fs.outputFile(outputPath, html);
      console.log(`生成主页: ${outputPath}`);

      // 同时复制到根目录作为主页
      await fs.copy(outputPath, path.join(ctx.outputDir || cwd, "index.html"));
      console.log("复制主页到根目录");
    }
  } else {
    // 其他分类的正常索引页面
    const content = buildIndexContent(articles, navItem);

    const outputPath = path.join(ctx.outputDir || cwd, folder, "index.html");
    const html = renderPage(ctx, {
      title: navItem.name,
      content,
      currentPath: `/${folder}/`,
    });

    await fs.outputFile(outputPath, html);
    console.log(`生成索引: ${outputPath}`);
  }
}

/**
 * 生成分类总览页与分类详情页。
 * 文章路径保持在 articles/<slug>/，分类页单独放在 categories/<category>/。
 */
async function generateCategoryPages(allArticles, ctx) {
  const { outputDir, config } = ctx;
  const articles = allArticles.filter((article) => article.folder === "articles");
  const categories = buildCategoryDefinitions(
    articles,
    config.categories || []
  ).filter((category) =>
    articles.some((article) => {
      const rawCategories = getArticleCategories(article);
      const articleCategories =
        rawCategories.length > 0 ? rawCategories : ["uncategorized"];
      return articleCategories.map(slugifyCategory).includes(category.slug);
    })
  );

  if (categories.length === 0) return;

  const categoriesDir = path.join(outputDir, "categories");
  await fs.ensureDir(categoriesDir);

  const overviewContent = `
    <h1>文章分类</h1>
    <p class="category-description">按主题浏览文章，具体文章仍保留原有链接地址。</p>
    ${buildCategoryOverviewHTML(articles, categories, { linkPrefix: "" })}
  `;
  await fs.outputFile(
    path.join(categoriesDir, "index.html"),
    renderPage(ctx, {
      title: "文章分类",
      content: overviewContent,
      currentPath: "/categories/",
    })
  );

  for (const category of categories) {
    const categoryArticles = articles.filter((article) => {
      const articleCategories = getArticleCategories(article);
      const normalized =
        articleCategories.length > 0
          ? articleCategories
          : ["uncategorized"];
      return normalized.map(slugifyCategory).includes(category.slug);
    });
    if (categoryArticles.length === 0) continue;

    const categoryDir = path.join(categoriesDir, category.slug);
    await fs.ensureDir(categoryDir);
    await fs.outputFile(
      path.join(categoryDir, "index.html"),
      renderPage(ctx, {
        title: category.name,
        content: buildCategoryIndexContent(category, categoryArticles),
        currentPath: `/categories/${category.slug}/`,
      })
    );
  }
}

/**
 * 复制静态资源到输出目录
 * @param {string} cwd        站点根目录
 * @param {string} outputDir  输出目录
 */
async function copyStaticAssets(cwd, outputDir) {
  console.log("复制静态资源...");
  const staticSource = path.join(cwd, "static");
  const staticDest = path.join(outputDir, "static");

  if (staticSource === staticDest) {
    console.log("静态资源已存在，跳过复制");
    return;
  }

  if (await fs.pathExists(staticSource)) {
    await fs.copy(staticSource, staticDest);
    console.log("静态资源复制完成");
  } else {
    console.log("静态资源目录不存在，跳过复制");
  }
}

/**
 * 全站构建
 * @param {object} [options]
 * @param {string} [options.cwd]        站点根目录（默认 process.cwd()）
 * @param {string} [options.outputDir]  输出目录（默认 = cwd，原地构建）
 * @param {string} [options.configPath] config.yml 路径（默认 cwd/config.yml）
 * @param {object} [options.engineConfig] 渲染引擎配置覆盖
 */
async function renderAll(options = {}) {
  const cwd = options.cwd || process.cwd();
  const outputDir = options.outputDir || cwd;
  const configPath = options.configPath || path.join(cwd, "config.yml");

  console.log("开始使用 crossnote 生成博客...");
  // 站点根目录必须存在
  if (!(await fs.pathExists(cwd))) {
    throw new Error(`站点根目录不存在: ${cwd}`);
  }
  try {
    // 加载配置文件
    const { config, navItems } = await loadConfig(configPath);
    const engineConfig = options.engineConfig || {};
    // 站点部署前缀（如 "/blog"），作用于导航链接与静态资源路径
    const basePath = config.basePath || "";
    // 外部页面模板：若配置了 templateFile，渲染器只提供内容，外壳由该模板决定
    let templateHtml = null;
    if (config.templateFile) {
      const templatePath = path.resolve(cwd, config.templateFile);
      if (await fs.pathExists(templatePath)) {
        templateHtml = await fs.readFile(templatePath, "utf8");
        console.log(`使用外部页面模板: ${templatePath}`);
      } else {
        console.warn(`templateFile 不存在，回退内置模板: ${templatePath}`);
      }
    }

    // 复制静态资源
    await copyStaticAssets(cwd, outputDir);

    const allArticles = [];
    const ctx = { cwd, outputDir, navItems, config, engineConfig, basePath, templateHtml };

    // 第一步：自动发现文章。扫描站点根下所有一级目录（约定：articles/ 存文章），
    // 渲染每个子目录的 index.md；front-matter 标 draft: true 的跳过。
    // 简单约定：不配置，不额外扫描，不分类页。
    const scanDirs = ["articles"];
    for (const folder of scanDirs) {
      const folderPath = path.join(cwd, folder);
      const discovered = await discoverArticles(folderPath);
      console.log(`收集文件夹 ${folder}: 找到 ${discovered.length} 篇文章`);

      for (const articleInfo of discovered) {
        try {
          const meta = await processMarkdownFile(articleInfo.path, ctx);
          allArticles.push({
            ...meta,
            slug: articleInfo.slug,
            file: "index.md",
            folder,
            articlePath: articleInfo.path,
            articleFolder: articleInfo.folder,
          });
          console.log(`收集文章: ${articleInfo.slug}`);
        } catch (error) {
          console.error(`处理文章 ${articleInfo.slug} 失败:`, error);
        }
      }
    }

    console.log("所有文章收集完成，共", allArticles.length, "篇文章");

    // 分类页独立生成，不改变文章原有 URL 和目录结构。
    await generateCategoryPages(allArticles, ctx);

    // 第二步：生成所有页面
    for (const navItem of navItems) {
      const folderPath = navItem.folder;
      const articles = allArticles.filter(
        (article) => article.folder === folderPath
      );
      console.log(
        `生成文件夹 ${folderPath} 的页面: ${articles.length} 篇文章`
      );

      // 首页（isHome）独立生成，不受文章数影响；普通分类需有文章才生成
      if (navItem.isHome || articles.length > 0) {
        await generateIndexPage(folderPath, articles, allArticles, ctx);
      }
    }

    console.log("博客生成完成！");
    return allArticles;
  } catch (error) {
    console.error("渲染过程中发生错误:", error);
    throw error;
  }
}

module.exports = {
  renderAll,
  processMarkdownFile,
  generateIndexPage,
  generateCategoryPages,
  copyStaticAssets,
  relativePagePath,
  renderPage,
};
