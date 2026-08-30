import { describe, it, expect } from "vitest";
import { processLinksAndEmbeds, EMBED_RE, LINK_RE } from "../../src/core/links.js";

// 内存文件系统 mock
function makeFs(files) {
  return {
    async pathExists(p) {
      return p in files;
    },
    async readFile(p) {
      if (!(p in files)) throw new Error(`ENOENT: ${p}`);
      return files[p];
    },
  };
}

describe("links", () => {
  it("正则 EMBED_RE 匹配 ![](x.md)", () => {
    const m = "![alt](a.md)".match(EMBED_RE);
    expect(m).toHaveLength(1);
  });

  it("正则 LINK_RE 匹配 [text](x.md)", () => {
    const m = "[text](b.md)".match(LINK_RE);
    expect(m).toHaveLength(1);
  });

  it("链接改写为 .html", async () => {
    const fsApi = makeFs({ "/blog/other.md": "content" });
    const { content, filesToProcess } = await processLinksAndEmbeds(
      "看 [这篇文章](other.md) 了解更多",
      "/blog",
      fsApi
    );
    expect(content).toBe('看 <a href="other.html">这篇文章</a> 了解更多');
    expect(filesToProcess).toEqual(["/blog/other.md"]);
  });

  it("链接文件不存在时保留原样", async () => {
    const fsApi = makeFs({});
    const { content, filesToProcess } = await processLinksAndEmbeds(
      "[不存在](missing.md)",
      "/blog",
      fsApi
    );
    expect(content).toBe("[不存在](missing.md)");
    expect(filesToProcess).toEqual([]);
  });

  it("file:// 绝对路径链接转相对路径", async () => {
    const fsApi = makeFs({ "/blog/other.md": "content" });
    const { content } = await processLinksAndEmbeds(
      "[绝对](file:///blog/other.md)",
      "/blog",
      fsApi
    );
    expect(content).toBe('<a href="other.html">绝对</a>');
  });

  it("嵌入语法被替换为内联内容", async () => {
    const fsApi = makeFs({ "/blog/part.md": "嵌入内容" });
    const { content } = await processLinksAndEmbeds(
      "开头 ![](part.md) 结尾",
      "/blog",
      fsApi
    );
    expect(content).toBe("开头 嵌入内容 结尾");
  });

  it("嵌入内容中的链接被递归处理", async () => {
    const fsApi = makeFs({
      "/blog/sub.md": "见 [目标](deep.md)",
      "/blog/deep.md": "deep",
    });
    const { content } = await processLinksAndEmbeds(
      "![](sub.md)",
      "/blog",
      fsApi
    );
    expect(content).toBe('见 <a href="deep.html">目标</a>');
  });

  it("嵌入递归时相对路径基于被嵌入文件目录", async () => {
    const fsApi = makeFs({
      "/blog/sub/inner.md": "见 [目标](leaf.md)",
      "/blog/sub/leaf.md": "leaf",
    });
    const { content } = await processLinksAndEmbeds(
      "![](sub/inner.md)",
      "/blog",
      fsApi
    );
    expect(content).toBe('见 <a href="leaf.html">目标</a>');
  });

  it("循环嵌入引用被跳过（防无限递归）", async () => {
    const fsApi = makeFs({
      "/blog/a.md": "![](b.md)",
      "/blog/b.md": "![](a.md)",
    });
    const { content } = await processLinksAndEmbeds("![](a.md)", "/blog", fsApi);
    expect(content).toBe("![](a.md)"); // a 嵌入 b，b 嵌入 a 被跳过 → 保留原样
  });

  it("嵌入与链接混合按位置顺序处理", async () => {
    const fsApi = makeFs({
      "/blog/part.md": "PART",
      "/blog/other.md": "x",
    });
    const { content } = await processLinksAndEmbeds(
      "前 ![嵌](part.md) 中 [链](other.md) 后",
      "/blog",
      fsApi
    );
    expect(content).toBe('前 PART 中 <a href="other.html">链</a> 后');
  });

  it("filesToProcess 包含嵌入与链接引用的所有文件且去重", async () => {
    const fsApi = makeFs({
      "/blog/a.md": "a",
      "/blog/b.md": "b",
    });
    const { filesToProcess } = await processLinksAndEmbeds(
      "![](a.md) [x](a.md) [y](b.md)",
      "/blog",
      fsApi
    );
    expect(filesToProcess.sort()).toEqual(["/blog/a.md", "/blog/b.md"]);
  });

  it("替换后 offsetAdjustment 正确处理多个链接", async () => {
    const fsApi = makeFs({
      "/blog/a.md": "a",
      "/blog/b.md": "b",
    });
    const { content } = await processLinksAndEmbeds(
      "[A](a.md) 中间文本 [B](b.md)",
      "/blog",
      fsApi
    );
    expect(content).toBe('<a href="a.html">A</a> 中间文本 <a href="b.html">B</a>');
  });

  it("多个嵌入替换不互相干扰", async () => {
    const fsApi = makeFs({
      "/blog/x.md": "X",
      "/blog/y.md": "Y",
    });
    const { content } = await processLinksAndEmbeds(
      "![](x.md) ![](y.md) ![](x.md)",
      "/blog",
      fsApi
    );
    // 第二次嵌入 x 已被 processedFiles 记录 → 跳过保留原样
    expect(content).toBe("X Y ![](x.md)");
  });
});
