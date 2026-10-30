import { describe, it, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  detectClientAssets,
  stripSyncHeavyScripts,
  ensureLazyClientAssets,
} = require("../../src/site/client-assets");

describe("client-assets", () => {
  it("detects mermaid and highlight from content", () => {
    expect(detectClientAssets('<div class="mermaid">graph TD</div>').mermaid).toBe(true);
    expect(detectClientAssets("<p>plain</p>").mermaid).toBe(false);
    expect(detectClientAssets("<pre><code>x=1</code></pre>").highlight).toBe(true);
    expect(detectClientAssets("<p>plain</p>").highlight).toBe(false);
  });

  it("strips sync mermaid/highlight script tags", () => {
    const html = `<head>
<script src="/blog/static/js/mermaid.min.js"></script>
<script src="/blog/static/js/highlight.min.js"></script>
<link rel="stylesheet" href="/blog/static/css/katex.min.css">
</head><body>hi</body>`;
    const out = stripSyncHeavyScripts(html);
    expect(out).not.toContain("mermaid.min.js");
    expect(out).not.toContain("highlight.min.js");
    expect(out).toContain("katex.min.css");
  });

  it("injects on-demand loader and removes sync scripts", () => {
    const html = `<!DOCTYPE html><html><head>
<script src="/blog/static/js/mermaid.min.js"></script>
</head><body><p>list</p></body></html>`;
    const out = ensureLazyClientAssets(html, { staticPrefix: "/blog/static" });
    expect(out).not.toMatch(/<script[^>]+src="[^"]*mermaid\.min\.js"/);
    expect(out).toContain('data-blog-asset-loader="1"');
    expect(out).toContain('querySelector(".mermaid")');
  });

  it("does not duplicate loader when already present", () => {
    const html = `<!DOCTYPE html><html><body>
<script data-blog-asset-loader="1">/* existing */</script>
</body></html>`;
    const out = ensureLazyClientAssets(html, { staticPrefix: "/blog/static" });
    expect((out.match(/data-blog-asset-loader/g) || []).length).toBe(1);
  });
});
