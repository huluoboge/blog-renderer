import { describe, it, expect } from "vitest";
import { defaultConfig,
  resolveConfig, } from "../../src/core/config.js";

describe("config", () => {
  it("默认配置包含全部公式定界符（与原博客 render.js 一致）", () => {
    const cfg = defaultConfig();
    expect(cfg.mathRenderingOption).toBe("KaTeX");
    expect(cfg.mathInlineDelimiters).toEqual([
      ["$", "$"],
      ["\\(", "\\)"],
    ]);
    expect(cfg.mathBlockDelimiters).toEqual([
      ["$$", "$$"],
      ["\\[", "\\]"],
    ]);
    expect(cfg.markdownParser).toBe("markdown-it");
    expect(cfg.enableEmojiSyntax).toBe(true);
    expect(cfg.enableExtendedTableSyntax).toBe(true);
    expect(cfg.enableLinkify).toBe(false);
    expect(cfg.breakOnSingleNewLine).toBe(false);
    expect(cfg.enableScriptExecution).toBe(false);
    expect(cfg.previewTheme).toBe("github-light.css");
    expect(cfg.codeBlockTheme).toBe("github-light.css");
    expect(cfg.katexConfig).toEqual({ macros: {} });
  });

  it("resolveConfig 合并用户配置，用户配置优先", () => {
    const cfg = resolveConfig({ mathRenderingOption: "MathJax" });
    expect(cfg.mathRenderingOption).toBe("MathJax");
    // 未覆盖的字段保持默认
    expect(cfg.markdownParser).toBe("markdown-it");
  });

  it("resolveConfig 空对象返回默认配置（不共享引用）", () => {
    const cfg = resolveConfig({});
    expect(cfg).toEqual(defaultConfig());
    expect(cfg).not.toBe(defaultConfig());
  });

  it("resolveConfig 不传参数返回默认配置", () => {
    const cfg = resolveConfig();
    expect(cfg.mathRenderingOption).toBe("KaTeX");
  });
});
