import { describe, it, expect } from "vitest";
import { isNavItemActive,
  navItemHref,
  generateNav, } from "../../src/site/nav.js";

const NAV_ITEMS = [
  { name: "首页", path: "/", folder: "home", isHome: true },
  { name: "文章", path: "/articles/", folder: "articles" },
  { name: "博客", path: "/blog/", folder: "blog" },
  { name: "项目", path: "/projects/", folder: "projects" },
];

describe("nav", () => {
  describe("navItemHref", () => {
    it("首页返回 /index.html", () => {
      expect(navItemHref({ isHome: true, folder: "home" })).toBe("/index.html");
    });

    it("普通分类返回 /folder/index.html", () => {
      expect(navItemHref({ isHome: false, folder: "articles" })).toBe(
        "/articles/index.html"
      );
    });

    it("basePath 前缀生效（子目录部署）", () => {
      expect(navItemHref({ isHome: true, folder: "home" }, "/blog")).toBe(
        "/blog/index.html"
      );
      expect(
        navItemHref({ isHome: false, folder: "articles" }, "/blog")
      ).toBe("/blog/articles/index.html");
    });
  });

  describe("isNavItemActive", () => {
    it("首页：根路径/空/index.html 均激活", () => {
      const home = NAV_ITEMS[0];
      expect(isNavItemActive(home, "/")).toBe(true);
      expect(isNavItemActive(home, "")).toBe(true);
      expect(isNavItemActive(home, "index.html")).toBe(true);
      expect(isNavItemActive(home, "/index.html")).toBe(true);
    });

    it("首页：文章页不激活", () => {
      expect(isNavItemActive(NAV_ITEMS[0], "/articles/x/")).toBe(false);
    });

    it("分类：前缀匹配激活（文章子页面）", () => {
      expect(isNavItemActive(NAV_ITEMS[1], "/articles/poisson/")).toBe(true);
    });

    it("分类：folder 包含匹配激活", () => {
      expect(
        isNavItemActive(NAV_ITEMS[1], "/articles/poisson/index.html")
      ).toBe(true);
    });

    it("分类：index.html 路径激活", () => {
      expect(isNavItemActive(NAV_ITEMS[1], "/articles/index.html")).toBe(true);
      expect(isNavItemActive(NAV_ITEMS[1], "/articles/")).toBe(true);
    });

    it("分类：其他分类路径不激活", () => {
      expect(isNavItemActive(NAV_ITEMS[1], "/blog/x/")).toBe(false);
    });
  });

  describe("generateNav", () => {
    it("输出所有导航项且带正确 href", () => {
      const html = generateNav(NAV_ITEMS, "/");
      expect(html).toContain("首页");
      expect(html).toContain("文章");
      expect(html).toContain("博客");
      expect(html).toContain("项目");
      expect(html).toContain('href="/index.html"');
      expect(html).toContain('href="/articles/index.html"');
      expect(html).toContain('href="/blog/index.html"');
      expect(html).toContain('href="/projects/index.html"');
    });

    it("首页激活时首页项带 active 类", () => {
      const html = generateNav(NAV_ITEMS, "/");
      expect(html).toContain('class="active"');
    });

    it("文章页激活时文章分类带 active 类", () => {
      const html = generateNav(NAV_ITEMS, "/articles/poisson/");
      const articleLi = html
        .split("\n")
        .find((line) => line.includes('href="/articles/index.html"'));
      expect(articleLi).toContain('class="active"');
      // 首页不应激活
      const homeLi = html
        .split("\n")
        .find((line) => line.includes('href="/index.html"'));
      expect(homeLi).toContain('class=""');
    });

    it("空导航列表返回空字符串", () => {
      expect(generateNav([], "/")).toBe("");
    });

    it("generateNav 支持 basePath 前缀", () => {
      const html = generateNav(NAV_ITEMS, "/articles/poisson/", "/blog");
      expect(html).toContain('href="/blog/index.html"');
      expect(html).toContain('href="/blog/articles/index.html"');
      expect(html).toContain('href="/blog/projects/index.html"');
    });

    it("默认 currentPath 为空字符串", () => {
      const html = generateNav(NAV_ITEMS);
      expect(html).toContain("首页");
    });
  });
});
