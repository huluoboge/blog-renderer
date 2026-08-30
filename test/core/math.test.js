import { describe, it, expect } from "vitest";
import { KATEX_SPAN_RE,
  countKatex,
  extractAnnotations,
  detectLeaks,
  analyzeMath,
  hasNoLeaks, } from "../../src/core/math.js";

// 模拟 crossnote/KaTeX 渲染输出：行内 + 块级公式
const KATEX_HTML = `<p>行内公式 <span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">E = mc^2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true">…</span></span> 文本</p>
<div class="katex-display"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>a</mi></mrow><annotation encoding="application/x-tex">a</annotation></semantics></math></span><span class="katex-html" aria-hidden="true">…</span></span></div>`;

describe("math", () => {
  it("KATEX_SPAN_RE 匹配完整的 katex 块", () => {
    const matches = KATEX_HTML.match(KATEX_SPAN_RE);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toContain('class="katex"');
    expect(matches[0]).toContain("E = mc^2");
  });

  it("countKatex 统计行内与块级公式数", () => {
    const { total, display } = countKatex(KATEX_HTML);
    expect(total).toBe(2);
    expect(display).toBe(1);
  });

  it("countKatex 无公式返回 0", () => {
    expect(countKatex("<p>没有公式</p>")).toEqual({ total: 0, display: 0 });
  });

  it("extractAnnotations 提取并去重公式源", () => {
    const anns = extractAnnotations(KATEX_HTML);
    expect(anns).toBeInstanceOf(Set);
    expect(anns.has("E = mc^2")).toBe(true);
    expect(anns.has("a")).toBe(true);
    expect(anns.size).toBe(2);
  });

  it("extractAnnotations 重复公式去重", () => {
    const html = `<p><span class="katex"><annotation encoding="application/x-tex">x</annotation></span></p><p><span class="katex"><annotation encoding="application/x-tex">x</annotation></span></p>`;
    expect(extractAnnotations(html).size).toBe(1);
  });

  it("detectLeaks 正常渲染的公式零泄漏", () => {
    const leaks = detectLeaks(KATEX_HTML);
    expect(leaks).toEqual({
      "$$": 0,
      "\\[": 0,
      "\\]": 0,
      "\\(": 0,
      "\\)": 0,
      "\\begin{": 0,
      "\\end{": 0,
    });
  });

  it("detectLeaks 检测未解析的定界符泄漏", () => {
    const html = "<p>泄漏的块级 $$x^2$$ 和 \\[y\\]，行内 \\(z\\)，裸环境 \\begin{cases} a \\end{cases}</p>";
    const leaks = detectLeaks(html);
    // $$x^2$$ 泄漏两个 $$ 标记（开 + 闭）
    expect(leaks["$$"]).toBe(2);
    expect(leaks["\\["]).toBe(1);
    expect(leaks["\\]"]).toBe(1);
    expect(leaks["\\("]).toBe(1);
    expect(leaks["\\)"]).toBe(1);
    expect(leaks["\\begin{"]).toBe(1);
    expect(leaks["\\end{"]).toBe(1);
  });

  it("detectLeaks 多个相同定界符计数", () => {
    const html = "<p>$$a$$ 和 $$b$$</p>";
    expect(detectLeaks(html)["$$"]).toBe(4);
  });

  it("detectLeaks 代码块内的定界符不算泄漏", () => {
    const html = '<pre><code>演示 $$x^2$$ 和 \\begin{matrix}</code></pre><p>正常公式 <span class="katex"><span class="katex-mathml"><annotation encoding="application/x-tex">y</annotation></span><span class="katex-html" aria-hidden="true">…</span></span></p>';
    const leaks = detectLeaks(html);
    expect(leaks["$$"]).toBe(0);
    expect(leaks["\\begin{"]).toBe(0);
  });

  it("analyzeMath 汇总统计", () => {
    const result = analyzeMath(KATEX_HTML);
    expect(result.katexTotal).toBe(2);
    expect(result.katexDisplay).toBe(1);
    expect(result.uniqueFormulas.has("E = mc^2")).toBe(true);
    expect(hasNoLeaks(result.leaks)).toBe(true);
  });

  it("hasNoLeaks 任一泄漏返回 false", () => {
    expect(hasNoLeaks({ "$$": 0, "\\[": 1 })).toBe(false);
    expect(hasNoLeaks({ "$$": 0, "\\[": 0, "\\begin{": 1 })).toBe(false);
  });
});
