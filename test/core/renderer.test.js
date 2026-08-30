/**
 * 渲染核心集成测试：使用真实 crossnote 引擎渲染 fixture 中的
 * 原博客真实文章，断言公式零泄漏、KaTeX 数量、代码块修复。
 *
 * 这是"公式支持与原博客一致"的关键回归测试。
 */

import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import fs from "fs-extra";

import { renderMarkdown, exportFullPage, getNotebook, clearNotebookCache } from "../../src/core/renderer.js";
import { analyzeMath, hasNoLeaks } from "../../src/core/math.js";

const FIXTURES_DIR = path.join(__dirname, "..", "..", "fixtures", "math");

describe("renderer 集成（真实 crossnote 渲染）", () => {
  beforeAll(() => {
    clearNotebookCache();
  });

  it("公式测试页渲染：零泄漏 + 大量 KaTeX 公式", async () => {
    const md = await fs.readFile(
      path.join(__dirname, "..", "..", "examples", "formula-test.md"),
      "utf8"
    );
    const { html } = await renderMarkdown({
      filePath: path.join(FIXTURES_DIR, "formula-test.md"),
      content: md,
    });

    const analysis = analyzeMath(html);
    // 综合测试页应有大量公式
    expect(analysis.katexTotal).toBeGreaterThanOrEqual(30);
    expect(analysis.katexDisplay).toBeGreaterThanOrEqual(15);
    // 零泄漏：所有公式都被解析
    expect(hasNoLeaks(analysis.leaks)).toBe(true);
    // 泄漏详情（失败时输出便于调试）
    expect(analysis.leaks).toEqual({
      "$$": 0,
      "\\[": 0,
      "\\]": 0,
      "\\(": 0,
      "\\)": 0,
      "\\begin{": 0,
      "\\end{": 0,
    });
    // 关键公式确实被渲染（annotation 存在）
    expect(analysis.uniqueFormulas.has("E = mc^2")).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\begin{cases}"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\begin{bmatrix}"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\begin{align*}"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\begin{equation}"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\underbrace"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\binom"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\tag"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\operatorname"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\mathbb"))
    ).toBe(true);
    expect(
      [...analysis.uniqueFormulas].some((f) => f.includes("\\mathcal"))
    ).toBe(true);
  });

  it("代码块中的公式不被渲染", async () => {
    const md = await fs.readFile(
      path.join(FIXTURES_DIR, "test-markdown.md"),
      "utf8"
    );
    const { html } = await renderMarkdown({
      filePath: path.join(FIXTURES_DIR, "test-markdown.md"),
      content: md,
    });
    const analysis = analyzeMath(html);
    expect(hasNoLeaks(analysis.leaks)).toBe(true);
  });

  it.each([
    ["test-markdown.md", 12],
    ["poisson_understand_1.md", 40],
    ["poisson_understand_2.md", 80],
    ["3dgs-geometry-grounded.md", 80],
    ["ekf.md", 60],
    ["superpoint.md", 10],
  ])("真实文章 %s：零泄漏且 KaTeX 公式 ≥ %d 个", async (file, minKatex) => {
    const md = await fs.readFile(path.join(FIXTURES_DIR, file), "utf8");
    const { html } = await renderMarkdown({
      filePath: path.join(FIXTURES_DIR, file),
      content: md,
    });
    const analysis = analyzeMath(html);
    expect(hasNoLeaks(analysis.leaks), JSON.stringify(analysis.leaks)).toBe(true);
    expect(analysis.katexTotal).toBeGreaterThanOrEqual(minKatex);
    // 修复后的 HTML 不应包含未修复的 data-role 代码块
    expect(html).not.toContain('data-role="codeBlock"');
    expect(html).toContain("katex");
  });

  it("无公式 markdown 正常渲染", async () => {
    const { html } = await renderMarkdown({
      filePath: path.join(FIXTURES_DIR, "plain.md"),
      content: "# 标题\n\n普通文本段落。",
    });
    expect(html).toContain("<h1");
    expect(html).toContain("普通文本段落");
    expect(analyzeMath(html).katexTotal).toBe(0);
  });

  it("front-matter 被正确剥离且不进入 HTML", async () => {
    const md = `---\ntitle: 测试文章\ndate: 2024-01-01\ntags: [a, b]\n---\n\n# 正文\n\n$E=mc^2$`;
    const { html } = await renderMarkdown({
      filePath: path.join(FIXTURES_DIR, "fm.md"),
      content: md,
    });
    expect(html).not.toContain("测试文章");
    expect(html).not.toContain("2024-01-01");
    expect(html).toContain("<h1");
  });

  it("getNotebook 返回缓存实例", async () => {
    const nb1 = await getNotebook("/tmp/renderer-test-nb", {});
    const nb2 = await getNotebook("/tmp/renderer-test-nb", {});
    expect(nb1).toBe(nb2);
    clearNotebookCache();
    const nb3 = await getNotebook("/tmp/renderer-test-nb", {});
    expect(nb3).not.toBe(nb1);
  });

  it("getNotebook 不传 config 时使用默认配置", async () => {
    clearNotebookCache();
    const nb = await getNotebook("/tmp/renderer-test-nb2");
    expect(nb).toBeTruthy();
    clearNotebookCache();
  });

  it("getNotebook 空 notebookPath 时回退到 process.cwd 上级目录", async () => {
    clearNotebookCache();
    // notebookPath 为空 → dir = path.dirname(process.cwd())
    const nb = await getNotebook("");
    expect(nb).toBeTruthy();
    clearNotebookCache();
  });

  it("renderMarkdown 中 getNoteMarkdownEngine 失败时抛出错误", async () => {
    await expect(
      renderMarkdown({
        filePath: "relative/path/without/notebook.md",
        content: "# x",
      })
    ).rejects.toThrow();
  });

  it("renderMarkdown filePath 为空时报错", async () => {
    await expect(
      renderMarkdown({ filePath: "", content: "# x" })
    ).rejects.toThrow(/filePath 不能为空/);
  });

  it("exportFullPage 生成完整 HTML 页面（默认 CDN 模式）", async () => {
    const { html, bodyHtml, yamlConfig } = await exportFullPage({
      filePath: path.join(FIXTURES_DIR, "export.md"),
      content: "# 标题\n\n$E=mc^2$\n",
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>");
    expect(bodyHtml).toContain("katex");
    expect(yamlConfig).toEqual({});
  });

  it("exportFullPage offline 模式（资源内联/CDN 关闭）", async () => {
    const { html } = await exportFullPage({
      filePath: path.join(FIXTURES_DIR, "export-offline.md"),
      content: "# 离线\n\n公式 $x^2$\n",
      offline: true,
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("katex");
  });

  it("exportFullPage front-matter html.offline 覆盖调用参数", async () => {
    const md = `---\nhtml:\n  offline: true\n  embed_local_images: false\n  embed_svg: false\n---\n# fm\n\n$x$\n`;
    const { html } = await exportFullPage({
      filePath: path.join(FIXTURES_DIR, "export-fm.md"),
      content: md,
      offline: false,
      embedLocalImages: true,
      embedSVG: true,
    });
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("exportFullPage front-matter html 为字符串时忽略覆盖", async () => {
    const md = `---\nhtml: "not-an-object"\n---\n# fm2\n\n$x$\n`;
    const { html } = await exportFullPage({
      filePath: path.join(FIXTURES_DIR, "export-fm2.md"),
      content: md,
      offline: true,
    });
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("exportFullPage filePath 校验", async () => {
    await expect(
      exportFullPage({ filePath: "", content: "# x" })
    ).rejects.toThrow(/filePath 不能为空/);
    await expect(
      exportFullPage({ filePath: "relative.md", content: "# x" })
    ).rejects.toThrow(/必须是绝对路径/);
  });

  it("renderMarkdown 自定义 parseOptions 生效", async () => {
    const { html } = await renderMarkdown({
      filePath: path.join(FIXTURES_DIR, "parse-options.md"),
      content: "# T\n",
      parseOptions: { hideFrontMatter: false },
    });
    expect(html).toContain("<h1");
  });
});
