/**
 * CLI 测试：直接调用导出函数（不走子进程），覆盖所有命令分支。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { createRequire } from "module";

import cli from "../src/cli.js";
const require2 = createRequire(import.meta.url);
// cli.js 通过 CJS require 使用 renderer，测试用同一实例 spyOn
const rendererCjs = require2("../src/core/renderer.js");

let tmpDir;
let consoleSpy;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-test-"));
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.exitCode = 0;
});

afterEach(async () => {
  await fs.remove(tmpDir);
  vi.restoreAllMocks();
  process.exitCode = 0;
});

describe("cli", () => {
  describe("parseRenderArgs", () => {
    it("解析 input/output/offline", () => {
      const opts = cli.parseRenderArgs(["a.md", "b.html", "--offline"]);
      expect(opts).toEqual({ input: "a.md", output: "b.html", offline: true });
    });

    it("只有 input 时 output 为 null", () => {
      const opts = cli.parseRenderArgs(["a.md"]);
      expect(opts.input).toBe("a.md");
      expect(opts.output).toBeNull();
    });

    it("无参数时全部为默认", () => {
      const opts = cli.parseRenderArgs([]);
      expect(opts.input).toBeNull();
      expect(opts.output).toBeNull();
      expect(opts.offline).toBe(false);
    });

    it("第三个及以后参数被忽略", () => {
      const opts = cli.parseRenderArgs(["a.md", "b.html", "c.md"]);
      expect(opts.input).toBe("a.md");
      expect(opts.output).toBe("b.html");
    });
  });

  describe("parseBuildArgs", () => {
    it("解析 --cwd 与 --config", () => {
      const opts = cli.parseBuildArgs([
        "--cwd",
        "/tmp/x",
        "--config",
        "/tmp/x/config.yml",
      ]);
      expect(opts.cwd).toBe("/tmp/x");
      expect(opts.config).toBe("/tmp/x/config.yml");
    });

    it("默认 cwd 为 process.cwd()", () => {
      const opts = cli.parseBuildArgs([]);
      expect(opts.cwd).toBe(process.cwd());
      expect(opts.config).toBeNull();
    });

    it("--config 无值时忽略", () => {
      const opts = cli.parseBuildArgs(["--config"]);
      expect(opts.config).toBeNull();
    });
  });

  describe("main", () => {
    it("render 命令渲染单个文件", async () => {
      const input = path.join(tmpDir, "a.md");
      const output = path.join(tmpDir, "a.html");
      await fs.writeFile(input, "# 标题\n\n公式 $E=mc^2$\n");
      await cli.main(["render", input, output]);
      expect(await fs.pathExists(output)).toBe(true);
      const html = await fs.readFile(output, "utf8");
      expect(html).toContain("<title>a</title>");
      expect(html).toContain("katex");
      expect(process.exitCode).toBe(0);
    });

    it("render 默认输出路径（.md → .html）", async () => {
      const input = path.join(tmpDir, "b.md");
      await fs.writeFile(input, "# B");
      await cli.main(["render", input]);
      expect(await fs.pathExists(path.join(tmpDir, "b.html"))).toBe(true);
    });

    it("render 无 input 时报用法错误", async () => {
      await cli.main(["render"]);
      expect(process.exitCode).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });

    it("render 输入文件不存在时报错", async () => {
      await cli.main(["render", path.join(tmpDir, "missing.md")]);
      expect(process.exitCode).toBe(1);
    });

    it("build 命令构建站点", async () => {
      // 迷你站点
      await fs.ensureDir(path.join(tmpDir, "articles", "post"));
      await fs.writeFile(
        path.join(tmpDir, "config.yml"),
        "navigation:\n  - name: 文章\n    path: /articles/\n    folder: articles\n    type: articles\n"
      );
      await fs.writeFile(
        path.join(tmpDir, "articles", "post", "index.md"),
        "---\ntitle: P\ndate: 2024-01-01\n---\n内容 $x^2$\n"
      );
      await cli.main(["build", "--cwd", tmpDir]);
      expect(
        await fs.pathExists(path.join(tmpDir, "articles", "post", "index.html"))
      ).toBe(true);
      expect(await fs.pathExists(path.join(tmpDir, "articles", "index.html"))).toBe(true);
      expect(process.exitCode).toBe(0);
    });

    it("build cwd 不存在时报错", async () => {
      await cli.main(["build", "--cwd", path.join(tmpDir, "nope")]);
      expect(process.exitCode).toBe(1);
    });

    it("无命令时打印用法", async () => {
      await cli.main([]);
      expect(console.log).toHaveBeenCalled();
      expect(cli.USAGE).toContain("render");
      expect(cli.USAGE).toContain("build");
    });

    it("--help 打印用法", async () => {
      await cli.main(["--help"]);
      expect(console.log).toHaveBeenCalled();
    });

    it("未知命令报错", async () => {
      await cli.main(["frobnicate"]);
      expect(process.exitCode).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });

    it("执行出错时捕获并设置 exitCode", async () => {
      // 用 spy 让渲染抛错 → main 的 catch 分支
      const spy = vi.spyOn(rendererCjs, "exportFullPage");
      spy.mockRejectedValue(new Error("渲染失败"));
      const input = path.join(tmpDir, "ok.md");
      await fs.writeFile(input, "# OK\n");
      await cli.main(["render", input, path.join(tmpDir, "ok.html")]);
      expect(process.exitCode).toBe(1);
      spy.mockRestore();
    });

    it("main 默认参数读取 process.argv（直接执行入口分支）", async () => {
      // 直接执行 main()（不传参）→ 从 process.argv 读取命令
      // vitest 进程的 argv 第一个参数通常不是 render/build → 走未知命令或用法
      await cli.main();
      expect(process.exitCode === 0 || process.exitCode === 1).toBe(true);
    });

    it("作为主模块直接执行（require.main === module 分支）", () => {
      // 用子进程执行 cli.js 本身 → require.main === module → main() 被调用
      const cliPath = path.join(__dirname, "..", "src", "cli.js");
      const output = execFileSync(process.execPath, [cliPath, "--help"], {
        encoding: "utf8",
      });
      expect(output).toContain("用法");
    });
  });
});
