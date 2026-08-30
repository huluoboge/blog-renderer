import { describe, it, expect } from "vitest";
import { generateHTML, renderWithTemplate } from "../../src/site/template.js";

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

  describe("renderWithTemplate（外部模板：渲染器只提供内容）", () => {
    it("替换 TITLE/CONTENT/BASE_PATH 占位符", () => {
      const tpl = "<html><title>{{TITLE}}</title><body>{{CONTENT}}|{{BASE_PATH}}</body></html>";
      const html = renderWithTemplate(tpl, {
        title: "测试页",
        content: "<h1>正文</h1>",
        basePath: "/blog",
      });
      expect(html).toContain("<title>测试页</title>");
      expect(html).toContain("<h1>正文</h1>");
      expect(html).toContain("|/blog");
      expect(html).not.toContain("{{TITLE}}");
    });

    it("title 自动 HTML 转义防 XSS", () => {
      const html = renderWithTemplate("<title>{{TITLE}}</title>", {
        title: '<script>alert(1)</script>',
      });
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("默认参数（空 vars）也能渲染", () => {
      const html = renderWithTemplate("{{TITLE}}|{{CONTENT}}|{{BASE_PATH}}");
      expect(html).toBe("||");
    });

    it("占位符带空格也能匹配", () => {
      const html = renderWithTemplate("{{ TITLE }}", { title: "x" });
      expect(html).toBe("x");
    });

    it("多个相同占位符全部替换", () => {
      const html = renderWithTemplate("{{TITLE}}-{{TITLE}}", { title: "a" });
      expect(html).toBe("a-a");
    });

    it("正文含 $' $& 等 replace 特殊模式时不被截断（回归）", () => {
      // 代码块常见 r'$\tau$' —— 字符串替换会把 $' 当"匹配后剩余部分"导致截断
      const content = "plt.xlabel(r'$\\tau$ (s)'); plt.ylabel(r'$\\sigma(\\tau)$')\nplt.grid(True)";
      const tpl = "<body>{{CONTENT}}</body>";
      const html = renderWithTemplate(tpl, { content });
      expect(html).toContain("r'$\\tau$ (s)'");
      expect(html).toContain("r'$\\sigma(\\tau)$'");
      expect(html).toContain("plt.grid(True)");
      expect(html).toContain("<body>");
      expect(html).toContain("</body>");
    });
  });
});
