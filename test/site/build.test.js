/**
 * 站点构建集成测试：在临时目录创建迷你站点，执行 renderAll 完整构建，
 * 验证输出 HTML、索引页、首页、公式渲染、代码块修复、静态资源复制。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";

import { createRequire } from "module";
const require2 = createRequire(import.meta.url);
// build.js 用 CJS require 加载 renderer，测试必须用同一实例才能 spyOn
const rendererCjs = require2("../../src/core/renderer.js");

import { renderAll,
  processMarkdownFile,
  generateIndexPage,
  copyStaticAssets,
  relativePagePath, } from "../../src/site/build.js";
import { analyzeMath, hasNoLeaks } from "../../src/core/math.js";

let siteRoot;
let ctx;
let articlesDir;
let homeDir;
let projectsDir;

async function writeSite() {
  siteRoot = await fs.mkdtemp(path.join(os.tmpdir(), "blog-build-"));
  articlesDir = path.join(siteRoot, "articles");
  homeDir = path.join(siteRoot, "home");
  projectsDir = path.join(siteRoot, "projects");
  const staticDir = path.join(siteRoot, "static");

  await fs.ensureDir(articlesDir);
  await fs.ensureDir(homeDir);
  await fs.ensureDir(projectsDir);
  await fs.ensureDir(staticDir);
  await fs.ensureDir(path.join(articlesDir, "poisson"));
  await fs.ensureDir(path.join(articlesDir, "draft-post"));
  await fs.ensureDir(path.join(projectsDir, "proj-a"));

  // config.yml
  await fs.writeFile(
    path.join(siteRoot, "config.yml"),
    `site:
  title: 测试博客
navigation:
  - name: 首页
    path: /
    folder: home
    isHome: true
    type: page
  - name: 技术文章
    path: /articles/
    folder: articles
    type: articles
  - name: 开源项目
    path: /projects/
    folder: projects
    type: projects
homepage:
  latest_articles_count: 2
  show_projects: true
`
  );

  // 首页文章（含占位符）—— 与原博客一致：home/home/index.md（两层目录）
  await fs.ensureDir(path.join(homeDir, "home"));
  await fs.writeFile(
    path.join(homeDir, "home", "index.md"),
    `---
title: 首页
---
# 欢迎来到测试博客

<div id="latest-articles-placeholder"></div>
<div id="open-source-projects-placeholder"></div>
`
  );

  // 文章：含公式（equation 环境 + 行内）
  await fs.writeFile(
    path.join(articlesDir, "poisson", "index.md"),
    `---
title: 泊松重建
date: 2024-05-01
tags: [重建, 公式]
excerpt: 泊松重建的数学推导
---

# 泊松重建

指示函数满足 $\\chi_M$ 的梯度关系：

$$
\\begin{equation}
\\nabla (\\chi_M * \\tilde{F})(q_0)
= \\int_{\\partial M} \\tilde{F}_p(q_0)\\, \\mathbf{N}_{\\partial M}(p)\\, dp
\\end{equation}
$$

行内公式 $E = mc^2$ 与块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

\`\`\`cpp
int main() { return 0; }
\`\`\`
`
  );

  // 草稿文章
  await fs.writeFile(
    path.join(articlesDir, "draft-post", "index.md"),
    `---
title: 草稿文章
date: 2024-06-01
draft: true
---
未完成的内容
`
  );

  // 项目
  await fs.writeFile(
    path.join(projectsDir, "proj-a", "index.md"),
    `---
title: 项目A
date: 2024-01-01
excerpt: 一个开源项目
---
项目介绍 $a^2 + b^2 = c^2$
`
  );

  // 静态资源
  await fs.writeFile(path.join(staticDir, "placeholder.txt"), "static");

  ctx = {
    cwd: siteRoot,
    navItems: [
      { name: "首页", path: "/", folder: "home", isHome: true, type: "page" },
      { name: "技术文章", path: "/articles/", folder: "articles", type: "articles" },
      { name: "开源项目", path: "/projects/", folder: "projects", type: "projects" },
    ],
    config: {
      homepage: { latest_articles_count: 2, show_projects: true },
    },
    engineConfig: {},
  };
}

beforeEach(async () => {
  await writeSite();
});

afterEach(async () => {
  await fs.remove(siteRoot);
  vi.restoreAllMocks();
});

describe("build", () => {
  it("renderAll 构建完整站点", async () => {
    const articles = await renderAll({ cwd: siteRoot });

    // 自动发现 articles/ 下的文章（poisson），草稿 draft-post 跳过；
    // home 首页独立生成（不算文章），projects 不再收集
    expect(articles.length).toBe(1);
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);
    expect(articles.some((a) => a.slug === "draft-post")).toBe(false);

    // 输出文件存在
    const poissonHtml = path.join(articlesDir, "poisson", "index.html");
    expect(await fs.pathExists(poissonHtml)).toBe(true);
    expect(await fs.pathExists(path.join(siteRoot, "index.html"))).toBe(true);

    // 文章 HTML：公式零泄漏 + KaTeX 渲染 + 代码块修复
    const articleHtml = await fs.readFile(poissonHtml, "utf8");
    const analysis = analyzeMath(articleHtml);
    expect(hasNoLeaks(analysis.leaks)).toBe(true);
    expect(analysis.katexTotal).toBeGreaterThanOrEqual(2);
    expect(articleHtml).toContain('class="hljs language-cpp"');
    expect(articleHtml).not.toContain('data-role="codeBlock"');

    // 文章页有返回按钮（指向博客首页，无分类导航）
    expect(articleHtml).toContain("back-button");

    // 首页：占位符被替换，含最新文章与完整列表
    const homeHtml = await fs.readFile(path.join(siteRoot, "index.html"), "utf8");
    expect(homeHtml).toContain("泊松重建");
    expect(homeHtml).not.toContain("latest-articles-placeholder");
    expect(homeHtml).not.toContain("all-articles-placeholder");
    expect(homeHtml).not.toContain("open-source-projects-placeholder");
  });

  it("processMarkdownFile 单独渲染单篇文章", async () => {
    const meta = await processMarkdownFile(
      path.join(articlesDir, "poisson", "index.md"),
      ctx
    );
    expect(meta.title).toBe("泊松重建");
    // yaml 会把 ISO 日期解析为 Date 对象
    expect(new Date(meta.date).toISOString().startsWith("2024-05-01")).toBe(true);
    expect(Array.isArray(meta.tags)).toBe(true);
    expect(meta.excerpt).toBe("泊松重建的数学推导");

    const html = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    expect(html).toContain("katex");
  });

  it("processMarkdownFile 无 front-matter 时 title 用文件名", async () => {
    const filePath = path.join(articlesDir, "poisson", "index.md");
    await fs.writeFile(filePath, "# 无元数据\n\n$E=mc^2$\n");
    const meta = await processMarkdownFile(filePath, ctx);
    expect(meta.title).toBe("index"); // basename 去掉 .md
  });

  it("processMarkdownFile 将 file:// 绝对路径资源改写为相对路径", async () => {
    const filePath = path.join(articlesDir, "poisson", "index.md");
    await fs.writeFile(filePath, "# 图\n\n普通内容\n");
    // crossnote 不渲染 file:// 链接（当纯文本），此分支仅在渲染产物含 file:// 时触发；
    // 通过 mock 渲染结果注入含 file:// 的 HTML 来覆盖改写逻辑
    const spy = vi.spyOn(rendererCjs, "renderMarkdown");
    spy.mockResolvedValueOnce({
      html: '<img src="file:///static/img/a.jpg"><a href="file:///static/doc/x.html">d</a>',
      yamlConfig: {},
    });
    const meta = await processMarkdownFile(filePath, ctx);
    expect(meta.title).toBe("index"); // 无 front-matter 时用文件名
    const html = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    expect(html).not.toContain("file://");
    // 相对路径基于文章目录（articles/poisson）到 /static 的距离
    expect(html).toContain('src="../../../../static/img/a.jpg"');
    expect(html).toContain('href="../../../../static/doc/x.html"');
    spy.mockRestore();
  });

  it("processMarkdownFile 渲染图片的 file:// 路径（jpg 在文章同目录）", async () => {
    const filePath = path.join(articlesDir, "poisson", "index.md");
    await fs.writeFile(filePath, "# 图\n\n普通内容\n");
    const spy = vi.spyOn(rendererCjs, "renderMarkdown");
    spy.mockResolvedValueOnce({
      html: '<img src="file:///tmp/xxx/pic.png">',
      yamlConfig: {},
    });
    await processMarkdownFile(filePath, ctx);
    const html = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    expect(html).not.toContain("file://");
    expect(html).toContain('src="../../../xxx/pic.png"');
    spy.mockRestore();
  });

  it("generateIndexPage 非首页分类生成索引页", async () => {
    const articles = [
      {
        title: "泊松重建",
        date: "2024-05-01",
        tags: ["重建"],
        excerpt: "ex",
        slug: "poisson",
        folder: "articles",
      },
    ];
    await generateIndexPage("articles", articles, articles, ctx);
    const html = await fs.readFile(
      path.join(articlesDir, "index.html"),
      "utf8"
    );
    expect(html).toContain("<h1>技术文章</h1>");
    expect(html).toContain("泊松重建");
  });

  it("generateIndexPage 首页源文件不存在时跳过", async () => {
    await fs.remove(path.join(homeDir, "home", "index.md"));
    await generateIndexPage("home", [], [], ctx);
    expect(await fs.pathExists(path.join(homeDir, "index.html"))).toBe(false);
  });

  it("generateIndexPage 首页源文件存在时正常生成", async () => {
    await generateIndexPage("home", [], [], ctx);
    expect(await fs.pathExists(path.join(homeDir, "index.html"))).toBe(true);
    expect(await fs.pathExists(path.join(siteRoot, "index.html"))).toBe(true);
  });

  it("generateIndexPage 首页 main 提取失败时静默跳过", async () => {
    // 模拟：首页文章渲染后 HTML 不含 <main>（spy readFile 返回无 main 内容）
    const originalReadFile = fs.readFile;
    const spy = vi.spyOn(fs, "readFile");
    spy.mockImplementation(async (p, ...rest) => {
      if (String(p).endsWith(path.join("home", "home", "index.html"))) {
        return "<html><body>无 main</body></html>";
      }
      return originalReadFile(p, ...rest);
    });
    const articles = [
      {
        title: "首页",
        folder: "home",
        slug: "home",
        articlePath: path.join(homeDir, "home", "index.md"),
      },
    ];
    await generateIndexPage("home", articles, [], ctx);
    // 不抛错即可（main 为 null 时静默跳过）
    expect(await fs.pathExists(path.join(homeDir, "index.html"))).toBe(false);
  });

  it("generateIndexPage 首页成功生成主页并复制到根目录（ctx 无 outputDir）", async () => {
    // ctx 无 outputDir → 输出到 cwd（falsy 分支）
    const articles = [
      {
        title: "首页",
        folder: "home",
        slug: "home",
        articlePath: path.join(homeDir, "home", "index.md"),
      },
    ];
    await generateIndexPage("home", articles, [], ctx);
    expect(await fs.pathExists(path.join(homeDir, "index.html"))).toBe(true);
    expect(await fs.pathExists(path.join(siteRoot, "index.html"))).toBe(true);
    const homeHtml = await fs.readFile(path.join(siteRoot, "index.html"), "utf8");
    expect(homeHtml).toContain("欢迎来到测试博客");
  });

  it("copyStaticAssets 复制静态资源", async () => {
    const dest = path.join(siteRoot, "dist");
    await copyStaticAssets(siteRoot, dest);
    expect(
      await fs.pathExists(path.join(dest, "static", "placeholder.txt"))
    ).toBe(true);
    await fs.remove(dest);
  });

  it("copyStaticAssets 源与目标相同则跳过", async () => {
    // 不抛错即可
    await copyStaticAssets(siteRoot, siteRoot);
  });

  it("copyStaticAssets 源不存在时跳过", async () => {
    const dest = path.join(siteRoot, "dist");
    await fs.remove(path.join(siteRoot, "static"));
    await copyStaticAssets(siteRoot, dest);
    expect(await fs.pathExists(path.join(dest, "static"))).toBe(false);
    await fs.remove(dest);
  });

  it("relativePagePath 计算相对路径", () => {
    expect(relativePagePath("/blog/articles/a/index.html", "/blog")).toBe(
      "/articles/a"
    );
    expect(relativePagePath("/blog/index.html", "/blog")).toBe("/");
  });

  it("relativePagePath 目录等于根目录时返回 /", () => {
    // dirname(outputPath) === cwd 时 path.relative 返回 "" → "/" + "" = "/"
    expect(relativePagePath("/blog/a.md", "/blog")).toBe("/");
  });

  it("relativePagePath 处理 path.relative 返回 '.' 的情况", () => {
    // path.relative 返回 "." 时 "/" + "." = "/." → 归一化为 "/"
    const pathSpy = vi.spyOn(path, "relative").mockReturnValue(".");
    expect(relativePagePath("/blog/a.md", "/blog")).toBe("/");
    pathSpy.mockRestore();
  });

  it("processMarkdownFile 被引用文件处理失败时 warn 不中断", async () => {
    // 构造：poisson 引用 ref.md（存在），ref.md 渲染失败 → warn 不中断主流程
    const refPath = path.join(articlesDir, "poisson", "ref.md");
    await fs.writeFile(refPath, "# 被引用文件\n");
    const filePath = path.join(articlesDir, "poisson", "index.md");
    await fs.writeFile(filePath, "# 标题\n\n[引用](ref.md)\n");
    const spy = vi.spyOn(rendererCjs, "renderMarkdown");
    spy.mockRejectedValueOnce(new Error("ref 渲染失败"));
    const meta = await processMarkdownFile(filePath, ctx);
    expect(meta.title).toBe("index"); // basename 去掉 .md
  });

  it("processMarkdownFile 自引用文件不递归处理", async () => {
    const filePath = path.join(articlesDir, "poisson", "index.md");
    await fs.writeFile(filePath, "# 标题\n\n[自己](index.md)\n");
    const spy = vi.spyOn(rendererCjs, "renderMarkdown");
    const meta = await processMarkdownFile(filePath, ctx);
    expect(meta.title).toBe("index");
    // 自引用被跳过 → renderMarkdown 只调用一次（处理自身）
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("renderAll config.yml 缺失时使用默认配置", async () => {
    await fs.remove(path.join(siteRoot, "config.yml"));
    const articles = await renderAll({ cwd: siteRoot });
    // 默认配置下仍自动发现 articles/ 目录
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);
  });

  it("renderAll 默认参数使用 process.cwd() 作为站点根目录", async () => {
    // 当前目录就是站点根目录时可不传 cwd
    const cwd = process.cwd();
    process.chdir(siteRoot);
    try {
      const articles = await renderAll();
      expect(articles.some((a) => a.slug === "poisson")).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it("renderAll config 无 homepage 配置时正常生成首页", async () => {
    await fs.writeFile(
      path.join(siteRoot, "config.yml"),
      `site:
  title: 无主页配置
navigation:
  - name: 首页
    path: /
    folder: home
    isHome: true
  - name: 技术文章
    path: /articles/
    folder: articles
`
    );
    const articles = await renderAll({ cwd: siteRoot });
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);
    // 首页占位符替换走默认配置（config.homepage 为 undefined → {})
    const homeHtml = await fs.readFile(
      path.join(siteRoot, "index.html"),
      "utf8"
    );
    expect(homeHtml).toContain("泊松重建");
  });

  it("renderAll 内部错误抛出到调用方", async () => {
    // 让 copyStaticAssets 之前的步骤抛错（config.yml 读取失败不可行，改为 fs 操作失败）
    // 用一个不可写的输出目录触发错误
    const spy = vi.spyOn(fs, "copy").mockRejectedValue(new Error("copy 失败"));
    await expect(renderAll({ cwd: siteRoot })).rejects.toThrow("copy 失败");
    spy.mockRestore();
  });

  it("renderAll 指定 outputDir 构建到其他目录", async () => {
    const outDir = path.join(siteRoot, "dist-site");
    await renderAll({ cwd: siteRoot, outputDir: outDir });
    expect(
      await fs.pathExists(path.join(outDir, "index.html"))
    ).toBe(true);
    // 静态资源复制到 dist
    expect(
      await fs.pathExists(path.join(outDir, "static", "placeholder.txt"))
    ).toBe(true);
    await fs.remove(outDir);
  });

  it("renderAll 文章处理失败时记录错误不中断整体构建", async () => {
    // 让第一篇文章（poisson）渲染失败，其余文章正常构建
    const spy = vi.spyOn(rendererCjs, "renderMarkdown");
    spy.mockRejectedValueOnce(new Error("模拟渲染失败"));
    const articles = await renderAll({ cwd: siteRoot });
    expect(Array.isArray(articles)).toBe(true);
    // poisson 失败被记录跳过，返回空列表（articles/ 下仅 poisson 一篇）
    expect(articles.some((a) => a.slug === "poisson")).toBe(false);
  });

  it("renderAll 中配置缺失 navigation 时用默认", async () => {
    await fs.writeFile(path.join(siteRoot, "config.yml"), "site:\n  title: 无导航\n");
    const articles = await renderAll({ cwd: siteRoot });
    // 无 navigation 时仍自动发现 articles/ 目录
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);
  });

  it("renderAll 顶层错误抛出", async () => {
    // cwd 不存在 → loadConfig 回退默认，但 discover 返回空 → 正常完成
    // 用非法 cwd 让 fs 操作失败
    await expect(renderAll({ cwd: "/nonexistent-dir-xyz" })).rejects.toThrow();
  });

  it("renderAll 支持 basePath 子目录部署", async () => {
    await fs.writeFile(
      path.join(siteRoot, "config.yml"),
      `site:
  title: 子目录博客
basePath: /blog
navigation:
  - name: 首页
    path: /
    folder: home
    isHome: true
  - name: 技术文章
    path: /articles/
    folder: articles
`
    );
    const articles = await renderAll({ cwd: siteRoot });
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);

    // 文章页导航链接带 /blog 前缀
    const articleHtml = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    expect(articleHtml).toContain('href="/blog/index.html"');
    expect(articleHtml).toContain('href="/blog/articles/index.html"');
    // 静态资源前缀 /blog/static
    expect(articleHtml).toContain('href="/blog/static/css/katex.min.css"');
  });

  it("renderAll 支持 templateFile 外部模板（渲染器只提供内容）", async () => {
    await fs.writeFile(
      path.join(siteRoot, "config.yml"),
      `site:
  title: 外部模板博客
basePath: /blog
templateFile: custom-template.html
navigation:
  - name: 首页
    path: /
    folder: home
    isHome: true
  - name: 技术文章
    path: /articles/
    folder: articles
`
    );
    await fs.writeFile(
      path.join(siteRoot, "custom-template.html"),
      `<!DOCTYPE html><html><head><title>{{TITLE}}</title></head>
<body><aside>侧栏</aside><main>{{CONTENT}}</main><footer>{{BASE_PATH}}</footer></body></html>`
    );
    const articles = await renderAll({ cwd: siteRoot });
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);

    // 文章页用外部模板：无内置导航/主题按钮，内容由模板包裹
    const articleHtml = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    expect(articleHtml).toContain("<aside>侧栏</aside>");
    expect(articleHtml).toContain("<footer>/blog</footer>");
    expect(articleHtml).not.toContain("toggleTheme");
    expect(articleHtml).not.toContain("nav-menu");
    expect(articleHtml).toContain("泊松重建"); // 内容来自渲染器
    // 占位符全部替换
    expect(articleHtml).not.toContain("{{TITLE}}");
    expect(articleHtml).not.toContain("{{CONTENT}}");

    // 索引页同样走外部模板
    const indexHtml = await fs.readFile(
      path.join(articlesDir, "index.html"),
      "utf8"
    );
    expect(indexHtml).toContain("<aside>侧栏</aside>");
    expect(indexHtml).not.toContain("{{CONTENT}}");
  });

  it("renderAll templateFile 不存在时回退内置模板", async () => {
    await fs.writeFile(
      path.join(siteRoot, "config.yml"),
      `site:
  title: 回退测试
templateFile: missing-template.html
navigation:
  - name: 首页
    path: /
    folder: home
    isHome: true
  - name: 技术文章
    path: /articles/
    folder: articles
`
    );
    const articles = await renderAll({ cwd: siteRoot });
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);
    const articleHtml = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    // 回退内置模板：含导航与主题切换
    expect(articleHtml).toContain("toggleTheme");
    expect(articleHtml).toContain("nav-menu");
  });

  it("renderPage 直接调用：外部模板 + 空 basePath 兜底", async () => {
    // 不经过 renderAll，直接测 renderPage 函数（覆盖 ctx.basePath 为空字符串分支）
    const { renderPage } = await import("../../src/site/build.js");
    const tpl = "<main>{{CONTENT}}</main><i>{{BASE_PATH}}</i>";
    const html = renderPage(
      { templateHtml: tpl, basePath: "", navItems: [] },
      { title: "t", content: "<p>x</p>", currentPath: "/" }
    );
    expect(html).toContain("<p>x</p>");
    expect(html).toContain("<i></i>"); // 空 basePath → 空字符串
  });

  it("无分类导航时文章页返回博客首页", async () => {
    // 导航只有 home（博客首页即列表），articles 文章应返回博客首页
    await fs.writeFile(
      path.join(siteRoot, "config.yml"),
      `site:
  title: 单页博客
navigation:
  - name: 博客
    path: /
    folder: home
    isHome: true
`
    );
    const articles = await renderAll({ cwd: siteRoot });
    expect(articles.some((a) => a.slug === "poisson")).toBe(true);
    const articleHtml = await fs.readFile(
      path.join(articlesDir, "poisson", "index.html"),
      "utf8"
    );
    // 返回博客首页（文章 /blog/articles/poisson/ → ../../index.html）
    expect(articleHtml).toContain('href="../../index.html"');
    expect(articleHtml).toContain("返回博客首页");
    // 不应再有分类返回按钮
    expect(articleHtml).not.toContain("返回技术文章");
  });

  it("processMarkdownFile 站点根级文件不加返回按钮", async () => {
    // 文件直接位于站点根（无子目录）→ 不加返回按钮链接
    const rootMd = path.join(siteRoot, "root-page.md");
    await fs.writeFile(rootMd, "# 根级页面\n");
    const meta = await processMarkdownFile(rootMd, ctx);
    expect(meta.title).toBe("root-page");
    const html = await fs.readFile(
      path.join(siteRoot, "root-page.html"),
      "utf8"
    );
    // 无返回按钮链接（<a class="back-button">）；CSS 选择器存在不算
    expect(html).not.toMatch(/<a[^>]*class="back-button"/);
    expect(html).not.toContain("← 返回");
  });
});
