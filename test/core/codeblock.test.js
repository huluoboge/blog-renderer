import { describe, it, expect } from "vitest";
import { fixCodeBlocks, normalizeLang } from "../../src/core/codeblock.js";

describe("codeblock", () => {
  it("data-role codeBlock 带语言 → hljs language-x", () => {
    const html = `<pre data-role="codeBlock" data-info="javascript" class="language-javascript javascript"><code>var x = 1;</code></pre>`;
    expect(fixCodeBlocks(html)).toBe(
      `<pre><code class="hljs language-javascript">var x = 1;</code></pre>`
    );
  });

  it("data-role codeBlock 语言大写 → 小写", () => {
    const html = `<pre data-role="codeBlock" data-info="Python" class="language-Python"><code>print(1)</code></pre>`;
    const out = fixCodeBlocks(html);
    expect(out).toContain('class="hljs language-python"');
    expect(out).not.toContain("data-role");
  });

  it("data-role codeBlock 无语言 → hljs", () => {
    const html = `<pre data-role="codeBlock" data-info="" class="language-text"><code>plain</code></pre>`;
    expect(fixCodeBlocks(html)).toBe(
      `<pre><code class="hljs">plain</code></pre>`
    );
  });

  it("data-role 旧 mume 格式（data-info 空）→ hljs", () => {
    const html = `<pre data-role="codeBlock" data-info=" class="language-"><code>plain</code></pre>`;
    expect(fixCodeBlocks(html)).toBe(`<pre><code class="hljs">plain</code></pre>`);
  });

  it("language-text / language-plain → 不带语言类", () => {
    expect(
      fixCodeBlocks(`<pre><code class="language-text">t</code></pre>`)
    ).toBe(`<pre><code class="hljs">t</code></pre>`);
    expect(
      fixCodeBlocks(`<pre><code class="language-plain">p</code></pre>`)
    ).toBe(`<pre><code class="hljs">p</code></pre>`);
  });

  it("pre 级 data-role 无语言兜底 → hljs", () => {
    const html = `<pre data-role="codeBlock" data-info="" class="language-text"><code>plain</code></pre>`;
    expect(fixCodeBlocks(html)).toBe(`<pre><code class="hljs">plain</code></pre>`);
  });

  it("普通 <pre><code class=language-x> → hljs language-x", () => {
    const html = `<pre><code class="language-cpp">int main() {}</code></pre>`;
    const out = fixCodeBlocks(html);
    expect(out).toContain('<pre><code class="hljs language-cpp">');
  });

  it("无语言 <pre><code> → hljs", () => {
    const html = `<pre><code>plain text</code></pre>`;
    expect(fixCodeBlocks(html)).toBe(`<pre><code class="hljs">plain text</code></pre>`);
  });

  it("已有 hljs 的代码块不被重复修改", () => {
    const html = `<pre><code class="hljs language-js">x</code></pre>`;
    expect(fixCodeBlocks(html)).toBe(html);
  });

  it("pre 级 data-role 兜底转换（无紧跟 <code> 时）", () => {
    const html = `<pre data-role="codeBlock" data-info="java" class="language-java"><span>x</span></pre>`;
    const out = fixCodeBlocks(html);
    expect(out).toContain('<pre><code class="hljs language-java">');
  });

  it("pre 级 data-role 无语言兜底 → hljs", () => {
    const html = `<pre data-role="codeBlock" data-info="" class="language-text"><span>plain</span></pre>`;
    expect(fixCodeBlocks(html)).toContain('<pre><code class="hljs">');
  });

  it("多语言代码块全部转换", () => {
    const html = `<pre data-role="codeBlock" data-info="js" class="language-js"><code>a</code></pre>\n<pre data-role="codeBlock" data-info="py" class="language-py"><code>b</code></pre>`;
    const out = fixCodeBlocks(html);
    expect(out).toContain('class="hljs language-js"');
    expect(out).toContain('class="hljs language-py"');
    expect(out).not.toContain("data-role");
  });

  it("空字符串", () => {
    expect(fixCodeBlocks("")).toBe("");
  });

  it("normalizeLang 处理空值/undefined", () => {
    expect(normalizeLang(undefined)).toBeNull();
    expect(normalizeLang(null)).toBeNull();
    expect(normalizeLang("")).toBeNull();
    expect(normalizeLang("  ")).toBeNull();
    expect(normalizeLang("Python")).toBe("python");
  });
});
