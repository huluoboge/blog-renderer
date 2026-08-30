import { describe, it, expect } from "vitest";
import { extractMainContent,
  buildLatestArticlesHTML,
  buildAllArticlesHTML,
  buildProjectsHTML,
  buildHomepageContent,
  buildIndexContent,
  formatDate, } from "../../src/site/index-pages.js";

const ALL_ARTICLES = [
  {
    title: "旧文章",
    date: "2023-01-01",
    folder: "articles",
    slug: "old",
    file: "index.md",
  },
  {
    title: "新文章",
    date: "2024-06-15",
    folder: "articles",
    slug: "new",
    file: "index.md",
    tags: ["CV", "SfM"],
  },
  {
    title: "无日期文章",
    folder: "articles",
    slug: "nodate",
    file: "index.md",
    excerpt: "一篇无日期的文章摘要",
  },
  {
    title: "项目A",
    date: "2024-01-01",
    folder: "projects",
    slug: "proj-a",
    file: "index.md",
    excerpt: "一个开源项目",
  },
  {
    title: "项目B",
    date: "2022-05-05",
    folder: "projects",
    slug: "proj-b",
    file: "index.md",
  },
  {
    title: "博客贴",
    date: "2024-02-02",
    folder: "blog",
    slug: "post",
    file: "index.md",
  },
];

describe("index-pages", () => {
  describe("extractMainContent", () => {
    it("提取 main 标签内容", () => {
      const html = "<html><main><h1>标题</h1><p>正文</p></main></html>";
      expect(extractMainContent(html)).toBe("<h1>标题</h1><p>正文</p>");
    });

    it("找不到 main 返回 null", () => {
      expect(extractMainContent("<html><body>x</body></html>")).toBeNull();
    });

    it("空 main 返回 null", () => {
      expect(extractMainContent("<main></main>")).toBeNull();
    });

    it("带属性的 main 标签也能提取", () => {
      const html = '<html><main class="content"><h1>标题</h1></main></html>';
      expect(extractMainContent(html)).toBe("<h1>标题</h1>");
    });

    it("外部模板 .blog-content 容器优先提取（避免嵌套）", () => {
      const html =
        '<main class="content"><div class="blog-content"><h1>正文</h1></div></main>';
      expect(extractMainContent(html)).toBe("<h1>正文</h1>");
    });

    it("无 .blog-content 时回退 main 提取", () => {
      const html =
        '<main class="content"><h1>直接内容</h1></main>';
      expect(extractMainContent(html)).toBe("<h1>直接内容</h1>");
    });
  });

  describe("formatDate", () => {
    it("字符串日期保持不变", () => {
      expect(formatDate("2024-06-15")).toBe("2024-06-15");
    });

    it("Date 对象格式化为 YYYY-MM-DD", () => {
      expect(formatDate(new Date(2024, 5, 15))).toBe("2024-06-15");
    });

    it("空值返回空字符串", () => {
      expect(formatDate("")).toBe("");
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
    });

    it("非法日期截断为前 10 字符", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });

    it("ISO 时间戳截断为日期部分", () => {
      expect(formatDate("2025-10-27T21:32:00+08:00")).toBe("2025-10-27");
    });
  });

  describe("buildLatestArticlesHTML", () => {
    it("按日期降序取前 N 篇（默认 3）", () => {
      const html = buildLatestArticlesHTML(ALL_ARTICLES);
      expect(html).toContain("新文章");
      expect(html).toContain("旧文章");
      const newIdx = html.indexOf("新文章");
      const oldIdx = html.indexOf("旧文章");
      expect(newIdx).toBeLessThan(oldIdx);
    });

    it("只包含 articles 分类且有日期的文章", () => {
      const html = buildLatestArticlesHTML(ALL_ARTICLES);
      expect(html).not.toContain("项目A");
      expect(html).not.toContain("博客贴");
      expect(html).not.toContain("无日期文章");
    });

    it("count 限制条数", () => {
      const html = buildLatestArticlesHTML(ALL_ARTICLES, 1);
      expect(html).toContain("新文章");
      expect(html).not.toContain("旧文章");
    });

    it("链接指向 articles/slug/index.html 且含中文日期", () => {
      const html = buildLatestArticlesHTML(ALL_ARTICLES, 1);
      expect(html).toContain('href="articles/new/index.html"');
      expect(html).toContain("2024");
    });

    it("空列表返回空字符串", () => {
      expect(buildLatestArticlesHTML([])).toBe("");
    });
  });

  describe("buildAllArticlesHTML", () => {
    it("包含全部 articles 分类文章（不截断）", () => {
      const html = buildAllArticlesHTML(ALL_ARTICLES);
      expect(html).toContain("新文章");
      expect(html).toContain("旧文章");
      expect(html).toContain("无日期文章");
    });

    it("排除非 articles 分类", () => {
      const html = buildAllArticlesHTML(ALL_ARTICLES);
      expect(html).not.toContain("项目A");
      expect(html).not.toContain("博客贴");
    });

    it("按日期降序排列", () => {
      const html = buildAllArticlesHTML(ALL_ARTICLES);
      expect(html.indexOf("新文章")).toBeLessThan(html.indexOf("旧文章"));
    });

    it("卡片含标题链接/日期/标签/摘要", () => {
      const html = buildAllArticlesHTML(ALL_ARTICLES);
      expect(html).toContain('class="article-item"');
      expect(html).toContain('href="articles/new/index.html"');
      expect(html).toContain("发布于: 2024-06-15");
      expect(html).toContain("标签:");
    });

    it("空列表返回空字符串", () => {
      expect(buildAllArticlesHTML([])).toBe("");
    });

    it("excerpt 显示在卡片中", () => {
      const html = buildAllArticlesHTML(ALL_ARTICLES);
      expect(html).toContain("一篇无日期的文章摘要");
    });

    it("无日期文章排最后", () => {
      const html = buildAllArticlesHTML(ALL_ARTICLES);
      expect(html.indexOf("无日期文章")).toBeGreaterThan(html.indexOf("旧文章"));
    });

    it("全部无日期时保持相对顺序", () => {
      const noDate = [
        { title: "A", folder: "articles", slug: "a", file: "index.md" },
        { title: "B", folder: "articles", slug: "b", file: "index.md" },
      ];
      const html = buildAllArticlesHTML(noDate);
      expect(html.indexOf("A")).toBeLessThan(html.indexOf("B"));
    });

    it("有日期文章排无日期文章之前", () => {
      const mixed = [
        { title: "无日期", folder: "articles", slug: "nd", file: "index.md" },
        { title: "有日期", date: "2024-01-01", folder: "articles", slug: "d", file: "index.md" },
      ];
      const html = buildAllArticlesHTML(mixed);
      expect(html.indexOf("有日期")).toBeLessThan(html.indexOf("无日期"));
    });
  });

  describe("buildProjectsHTML", () => {
    it("只包含 projects 分类，按日期降序", () => {
      const html = buildProjectsHTML(ALL_ARTICLES);
      expect(html).toContain("项目A");
      expect(html).toContain("项目B");
      expect(html).not.toContain("新文章");
      expect(html.indexOf("项目A")).toBeLessThan(html.indexOf("项目B"));
    });

    it("项目 excerpt 显示，无 excerpt 显示默认文案", () => {
      const html = buildProjectsHTML(ALL_ARTICLES);
      expect(html).toContain("一个开源项目");
      expect(html).toContain("开源项目");
    });

    it("链接指向 projects/file.html", () => {
      const html = buildProjectsHTML(ALL_ARTICLES);
      expect(html).toContain('href="projects/index.html"');
    });
  });

  describe("buildHomepageContent", () => {
    const HOMEPAGE = `<h1>欢迎</h1>
<div id="latest-articles-placeholder"></div>
<div id="open-source-projects-placeholder"></div>`;

    it("替换最新文章与开源项目占位符", () => {
      const html = buildHomepageContent(HOMEPAGE, ALL_ARTICLES, {});
      expect(html).toContain("新文章");
      expect(html).toContain("项目A");
      expect(html).not.toContain("latest-articles-placeholder");
      expect(html).not.toContain("open-source-projects-placeholder");
    });

    it("show_projects: false 时不替换项目占位符", () => {
      const html = buildHomepageContent(HOMEPAGE, ALL_ARTICLES, {
        show_projects: false,
      });
      expect(html).toContain("open-source-projects-placeholder");
      expect(html).not.toContain("项目A");
    });

    it("latest_articles_count 自定义", () => {
      const html = buildHomepageContent(HOMEPAGE, ALL_ARTICLES, {
        latest_articles_count: 1,
      });
      expect(html).toContain("新文章");
      expect(html).not.toContain("旧文章");
    });

    it("无占位符时原样返回", () => {
      const html = buildHomepageContent("<p>普通内容</p>", ALL_ARTICLES, {});
      expect(html).toBe("<p>普通内容</p>");
    });

    it("不传 homepageCfg 时使用默认配置", () => {
      const html = buildHomepageContent(HOMEPAGE, ALL_ARTICLES);
      expect(html).toContain("新文章");
      expect(html).toContain("项目A");
    });

    it("all-articles-placeholder 替换为完整文章列表", () => {
      const html = buildHomepageContent(
        '<div id="all-articles-placeholder"></div>',
        ALL_ARTICLES,
        {}
      );
      expect(html).toContain('class="article-list"');
      expect(html).toContain("新文章");
      expect(html).toContain("旧文章");
      expect(html).toContain("无日期文章"); // 不截断
      expect(html).not.toContain("all-articles-placeholder");
      expect(html).not.toContain("项目A"); // 排除非 articles
    });
  });

  describe("buildIndexContent", () => {
    it("生成分类标题与文章列表", () => {
      const html = buildIndexContent(ALL_ARTICLES.slice(0, 3), {
        name: "技术文章",
      });
      expect(html).toContain("<h1>技术文章</h1>");
      expect(html).toContain("新文章");
      expect(html).toContain("旧文章");
    });

    it("文章按日期降序，无日期排最后", () => {
      const html = buildIndexContent(ALL_ARTICLES.slice(0, 3), {
        name: "技术文章",
      });
      expect(html.indexOf("新文章")).toBeLessThan(html.indexOf("旧文章"));
      expect(html.indexOf("旧文章")).toBeLessThan(html.indexOf("无日期文章"));
    });

    it("链接指向 slug/index.html", () => {
      const html = buildIndexContent([ALL_ARTICLES[1]], { name: "x" });
      expect(html).toContain('href="new/index.html"');
    });

    it("有 image 的文章带缩略图容器", () => {
      const articles = [
        { ...ALL_ARTICLES[1], image: "/img/a.jpg" },
        ALL_ARTICLES[0],
      ];
      const html = buildIndexContent(articles, { name: "x" });
      expect(html).toContain("article-item-with-image");
      expect(html).toContain('src="/img/a.jpg"');
      expect(html).toContain("article-thumbnail");
    });

    it("显示日期与标签", () => {
      const articles = [
        { ...ALL_ARTICLES[1], tags: ["CV", "SLAM"] },
      ];
      const html = buildIndexContent(articles, { name: "x" });
      expect(html).toContain("发布于: 2024-06-15");
      expect(html).toContain("标签: CV, SLAM");
    });

    it("excerpt 显示", () => {
      const html = buildIndexContent(
        [{ ...ALL_ARTICLES[1], excerpt: "简介文字" }],
        { name: "x" }
      );
      expect(html).toContain("简介文字");
    });

    it("无日期无标签文章正常渲染（不崩）", () => {
      const html = buildIndexContent([ALL_ARTICLES[2]], { name: "x" });
      expect(html).toContain("无日期文章");
    });

    it("空文章列表生成空列表容器", () => {
      const html = buildIndexContent([], { name: "空分类" });
      expect(html).toContain("<h1>空分类</h1>");
      expect(html).toContain("article-list");
    });

    it("无日期文章排序逻辑：一篇无日期 + 一篇有日期", () => {
      const html = buildIndexContent(
        [ALL_ARTICLES[2], ALL_ARTICLES[1]],
        { name: "x" }
      );
      expect(html.indexOf("新文章")).toBeLessThan(html.indexOf("无日期文章"));
    });

    it("两篇都无日期时保持原顺序", () => {
      const html = buildIndexContent(
        [ALL_ARTICLES[2], { ...ALL_ARTICLES[2], slug: "nodate2" }],
        { name: "x" }
      );
      expect(html).toContain("无日期文章");
    });
  });
});
