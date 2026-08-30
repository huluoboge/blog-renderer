import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";

import { loadConfig, defaultSiteConfig } from "../../src/site/config.js";

let tmpDir;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cfg-test-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("config", () => {
  it("defaultSiteConfig 返回完整默认配置", () => {
    const cfg = defaultSiteConfig();
    expect(cfg.site.title).toBe("我的博客");
    expect(cfg.navigation).toHaveLength(4);
    expect(cfg.navigation[0].isHome).toBe(true);
    expect(cfg.homepage.latest_articles_count).toBe(3);
  });

  it("loadConfig 读取存在的 config.yml", async () => {
    const configPath = path.join(tmpDir, "config.yml");
    await fs.writeFile(
      configPath,
      "site:\n  title: 测试博客\nnavigation:\n  - name: 首页\n    path: /\n    folder: home\n    isHome: true\n"
    );
    const { config, navItems } = await loadConfig(configPath);
    expect(config.site.title).toBe("测试博客");
    expect(navItems).toHaveLength(1);
    expect(navItems[0].name).toBe("首页");
  });

  it("loadConfig yaml 为空内容时返回空配置", async () => {
    const configPath = path.join(tmpDir, "config.yml");
    await fs.writeFile(configPath, "");
    const { config, navItems } = await loadConfig(configPath);
    expect(config).toEqual({});
    expect(navItems).toEqual([]);
  });

  it("loadConfig 文件不存在时回退默认配置", async () => {
    const { config, navItems } = await loadConfig(
      path.join(tmpDir, "missing.yml")
    );
    expect(config.site.title).toBe("我的博客");
    expect(navItems).toHaveLength(4);
  });

  it("loadConfig yaml 语法错误时回退默认配置", async () => {
    const configPath = path.join(tmpDir, "config.yml");
    await fs.writeFile(configPath, "site: [unclosed");
    const { config } = await loadConfig(configPath);
    expect(config.site.title).toBe("我的博客");
  });

  it("loadConfig 默认参数使用 config.yml", async () => {
    await fs.writeFile(
      path.join(tmpDir, "config.yml"),
      "site:\n  title: 相对路径测试\n"
    );
    const cwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const { config } = await loadConfig();
      expect(config.site.title).toBe("相对路径测试");
    } finally {
      process.chdir(cwd);
    }
  });

  it("loadConfig 的默认 fs 依赖可用（不传 fs 参数）", async () => {
    // loadConfig 内部使用默认 fs-extra
    const configPath = path.join(tmpDir, "cfg2.yml");
    await fs.writeFile(configPath, "site:\n  title: 直接调用\n");
    const { config } = await loadConfig(configPath);
    expect(config.site.title).toBe("直接调用");
  });
});
