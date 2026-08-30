import { describe, it, expect } from "vitest";
import { generateHTML } from "../../src/site/template.js";

const NAV_ITEMS = [
  { name: "首页", path: "/", folder: "home", isHome: true },
  { name: "文章", path: "/articles/", folder: "articles" },
];

describe("template", () => {
  it("生成完整 HTML 页面骨架", () => {
    const html = generateHTML({
      title: "测试页",
      content: "<h1>内容</h1>",
      currentPath: "/articles/x/",
      navItems: NAV_ITEMS,
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>测试页</title>");
    expect(html).toContain("<h1>内容</h1>");
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain("</html>");
  });

  it("包含导航、主题切换与菜单脚本", () => {
    const html = generateHTML({
      title: "t",
      content: "c",
      currentPath: "/",
      navItems: NAV_ITEMS,
    });
    expect(html).toContain("toggleTheme");
    expect(html).toContain("toggleMenu");
    expect(html).toContain("localStorage");
    expect(html).toContain("首页");
    expect(html).toContain('href="/articles/index.html"');
  });

  it("内联 CSS 主题变量（dark/light）", () => {
    const html = generateHTML({
      title: "t",
      content: "c",
      currentPath: "/",
      navItems: NAV_ITEMS,
    });
    expect(html).toContain("data-theme");
    expect(html).toContain("--bg-color");
  });

  it("激活导航项带 active 类", () => {
    const html = generateHTML({
      title: "t",
      content: "c",
      currentPath: "/articles/a/",
      navItems: NAV_ITEMS,
    });
    expect(html).toContain('class="active"');
  });

  it("空内容也能生成页面", () => {
    const html = generateHTML({
      title: "",
      content: "",
      currentPath: "/",
      navItems: [],
    });
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("XSS 转义 title", () => {
    const html = generateHTML({
      title: '<script>alert(1)</script>',
      content: "c",
      currentPath: "/",
      navItems: NAV_ITEMS,
    });
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("默认参数：不传 currentPath/navItems 也能生成页面", () => {
    const html = generateHTML({ title: "t", content: "c" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>t</title>");
    expect(html).toContain("<main>");
  });

  it("basePath：导航链接与静态资源带前缀", () => {
    const html = generateHTML({
      title: "t",
      content: "c",
      currentPath: "/",
      navItems: NAV_ITEMS,
      basePath: "/blog",
    });
    expect(html).toContain('href="/blog/index.html"');
    expect(html).toContain('href="/blog/articles/index.html"');
    expect(html).toContain('href="/blog/static/css/katex.min.css"');
    expect(html).toContain('src="/blog/static/js/mermaid.min.js"');
  });

  it("显式 staticPrefix 优先于 basePath 推导", () => {
    const html = generateHTML({
      title: "t",
      content: "c",
      navItems: [],
      basePath: "/blog",
      staticPrefix: "/custom",
    });
    expect(html).toContain('href="/custom/css/katex.min.css"');
  });
});
