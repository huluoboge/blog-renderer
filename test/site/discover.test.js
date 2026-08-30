import { describe, it, expect } from "vitest";
import path from "path";
import { discoverArticles } from "../../src/site/discover.js";

// 内存文件系统 mock（用于测试 discoverArticles 的分支逻辑）
function makeFs(structure) {
  const files = {};
  const dirs = new Set([path.resolve("/")]);

  function addDir(p) {
    dirs.add(p);
  }
  for (const [p, content] of Object.entries(structure)) {
    files[p] = content;
    let d = path.dirname(p);
    while (!dirs.has(d)) {
      dirs.add(d);
      const parent = path.dirname(d);
      if (parent === d) break;
      d = parent;
    }
  }

  return {
    async pathExists(p) {
      return files[p] !== undefined || dirs.has(p);
    },
    async readdir(p) {
      const children = new Set();
      for (const f of Object.keys(files)) {
        if (path.dirname(f) === p) children.add(path.basename(f));
      }
      for (const d of dirs) {
        if (d !== p && path.dirname(d) === p) children.add(path.basename(d));
      }
      return [...children];
    },
    async stat(p) {
      if (files[p] !== undefined) {
        return { isDirectory: () => false };
      }
      if (dirs.has(p)) {
        return { isDirectory: () => true };
      }
      throw new Error("ENOENT");
    },
    async readFile(p) {
      if (files[p] === undefined) throw new Error("ENOENT");
      return files[p];
    },
  };
}

const FIXTURE = "/site/articles";

describe("discover", () => {
  it("发现子目录中的 index.md 并解析 front-matter", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "post1", "index.md")]:
        "---\ntitle: 文章一\ndate: 2024-01-01\ntags: [a]\n---\n正文",
      [path.join(FIXTURE, "post2", "index.md")]:
        "---\ntitle: 文章二\n---\n正文2",
    });
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toHaveLength(2);
    const a1 = articles.find((a) => a.slug === "post1");
    expect(a1.attributes.title).toBe("文章一");
    // yaml 会把 ISO 日期解析为 Date 对象（与原博客行为一致）
    expect(new Date(a1.attributes.date).toISOString().startsWith("2024-01-01")).toBe(true);
    expect(a1.path).toBe(path.join(FIXTURE, "post1", "index.md"));
    expect(a1.folder).toBe(path.join(FIXTURE, "post1"));
  });

  it("草稿（draft: true）被跳过", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "draft1", "index.md")]:
        "---\ntitle: 草稿\ndraft: true\n---\n未完成",
      [path.join(FIXTURE, "pub", "index.md")]: "---\ntitle: 发布\n---\nok",
    });
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toHaveLength(1);
    expect(articles[0].slug).toBe("pub");
  });

  it("无 index.md 的子目录被跳过", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "noindex", "readme.txt")]: "hello",
      [path.join(FIXTURE, "ok", "index.md")]: "---\ntitle: t\n---\nc",
    });
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toHaveLength(1);
    expect(articles[0].slug).toBe("ok");
  });

  it("文件夹不存在返回空数组", async () => {
    const articles = await discoverArticles("/nonexistent", makeFs({}));
    expect(articles).toEqual([]);
  });

  it("普通文件（非目录）被跳过", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "index.md")]: "---\ntitle: t\n---\nc", // 直接放在 articles 下的文件
      [path.join(FIXTURE, "post", "index.md")]: "---\ntitle: p\n---\nc",
    });
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toHaveLength(1);
    expect(articles[0].slug).toBe("post");
  });

  it("front-matter 解析失败的文章被跳过", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "bad", "index.md")]: "---\n: : : 无效\n---\n内容",
      [path.join(FIXTURE, "good", "index.md")]: "---\ntitle: g\n---\nc",
    });
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toHaveLength(1);
    expect(articles[0].slug).toBe("good");
  });

  it("stat 失败（权限等）的条目被跳过", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "ok", "index.md")]: "---\ntitle: o\n---\nc",
    });
    fsApi.stat = async () => {
      throw new Error("EACCES");
    };
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toEqual([]);
  });

  it("无 front-matter 的文章也收录（attributes 为空对象）", async () => {
    const fsApi = makeFs({
      [path.join(FIXTURE, "plain", "index.md")]: "# 无元数据\n\n正文",
    });
    const articles = await discoverArticles(FIXTURE, fsApi);
    expect(articles).toHaveLength(1);
    expect(articles[0].attributes).toEqual({});
  });

  it("使用默认 fs-extra（不传 fsApi）扫描真实目录", async () => {
    const fsReal = require("fs-extra");
    const os = require("os");
    const realTmp = await fsReal.mkdtemp(path.join(os.tmpdir(), "disc-real-"));
    try {
      await fsReal.ensureDir(path.join(realTmp, "post1"));
      await fsReal.writeFile(
        path.join(realTmp, "post1", "index.md"),
        "---\ntitle: 真实\n---\n内容"
      );
      const articles = await discoverArticles(realTmp);
      expect(articles).toHaveLength(1);
      expect(articles[0].slug).toBe("post1");
    } finally {
      await fsReal.remove(realTmp);
    }
  });
});
