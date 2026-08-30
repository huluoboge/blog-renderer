#!/usr/bin/env node

"use strict";

/**
 * CLI 入口：
 *   blog-renderer render <input.md> [output.html] [--offline]
 *   blog-renderer build [--cwd <siteRoot>] [--config <config.yml>]
 */

const path = require("path");
const fs = require("fs-extra");
const renderer = require("./core/renderer");
const { renderAll } = require("./site/build");

const USAGE = `用法:
  blog-renderer render <input.md> [output.html] [--offline]   渲染单个 markdown 文件为完整 HTML 页面
  blog-renderer build [--cwd <siteRoot>] [--config <config.yml>]  构建整个博客站点

示例:
  blog-renderer render article.md article.html
  blog-renderer render article.md --offline
  blog-renderer build --cwd /path/to/blog --config config.yml`;

/** 解析 render 子命令参数 */
function parseRenderArgs(args) {
  const opts = { input: null, output: null, offline: false };
  for (const arg of args) {
    if (arg === "--offline") {
      opts.offline = true;
    } else if (opts.input === null) {
      opts.input = arg;
    } else if (opts.output === null) {
      opts.output = arg;
    }
  }
  return opts;
}

/** 渲染单个文件 */
async function runRender(args) {
  const opts = parseRenderArgs(args);
  if (!opts.input) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }
  const inputPath = path.resolve(opts.input);
  if (!(await fs.pathExists(inputPath))) {
    console.error(`文件不存在: ${inputPath}`);
    process.exitCode = 1;
    return;
  }
  const content = await fs.readFile(inputPath, "utf8");
  const outputPath = opts.output
    ? path.resolve(opts.output)
    : inputPath.replace(/\.md$/, ".html");
  const { html } = await renderer.exportFullPage({
    filePath: inputPath,
    content,
    offline: opts.offline,
  });
  await fs.outputFile(outputPath, html);
  console.log(`渲染完成: ${outputPath}`);
}

/** 解析 build 子命令参数 */
function parseBuildArgs(args) {
  const opts = { cwd: process.cwd(), config: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cwd" && args[i + 1]) {
      opts.cwd = path.resolve(args[++i]);
    } else if (args[i] === "--config" && args[i + 1]) {
      opts.config = path.resolve(args[++i]);
    }
  }
  return opts;
}

/** 构建整个站点 */
async function runBuild(args) {
  const opts = parseBuildArgs(args);
  if (!(await fs.pathExists(opts.cwd))) {
    console.error(`站点目录不存在: ${opts.cwd}`);
    process.exitCode = 1;
    return;
  }
  await renderAll({ cwd: opts.cwd, configPath: opts.config });
}

/** 主入口（args 可注入以便测试，默认取 process.argv） */
async function main(args = process.argv.slice(2)) {
  const command = args[0];

  try {
    if (command === "render") {
      await runRender(args.slice(1));
    } else if (command === "build") {
      await runBuild(args.slice(1));
    } else if (!command || command === "--help" || command === "-h") {
      console.log(USAGE);
    } else {
      console.error(`未知命令: ${command}`);
      console.error(USAGE);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("执行失败:", error);
    process.exitCode = 1;
  }
}

// CLI 入口：仅作为主模块执行时调用（子进程测试验证，istanbul 统计不到）
/* istanbul ignore next */
if (require.main === module) {
  main();
}

module.exports = { main, parseRenderArgs, parseBuildArgs, USAGE };
