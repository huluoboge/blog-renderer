# blog-renderer

模块化 Markdown 博客渲染器：渲染核心（core）与站点骨架（site）分离，
从原博客仓库（huluoboge.github.io，内容与渲染逻辑混合）重构而来。

## 核心特性

- **LaTeX 公式全面支持**：原博客的各种公式写法均可正确渲染（KaTeX）
  - 行内：`$...$`、`\(...\)`
  - 块级：`$$...$$`、`\[...\]`
  - 环境：`equation`、`align*`、`aligned`、`bmatrix`、`cases`、`array`
  - 特殊宏：`\operatorname`、`\text`、`\underbrace`、`\binom`、`\mathbb`、`\mathcal`、`\tag`
  - 中文混排、嵌套环境（`align*` 内嵌 `array`）
- **100% 测试覆盖率**（语句/分支/函数/行，vitest + istanbul）
- **零泄漏断言**：所有公式必须被 KaTeX 解析，原始定界符不出现于页面文本
- 代码块修复（crossnote Prism 输出 → highlight.js 格式）
- `.md` 链接改写与嵌入递归处理（含循环引用检测）
- 站点骨架：导航、索引页、首页占位符替换、静态资源复制

## 目录结构

```
src/
  core/      渲染核心（与站点无关，可独立复用）
    config.js    引擎配置（公式定界符等）
    math.js      公式分析：计数 / annotation 提取 / 泄漏检测
    codeblock.js 代码块修复（Prism → hljs）
    links.js     .md 链接与嵌入处理
    renderer.js  crossnote 引擎封装（Notebook 缓存、单文件渲染、完整页面导出）
  site/      站点骨架
    config.js    config.yml 加载
    nav.js       导航生成（激活态判断）
    template.js  页面模板（含主题 CSS 与切换脚本）
    discover.js  文章发现（front-matter 解析、草稿跳过）
    index-pages.js 首页/索引页 HTML 构建
    build.js     站点批量构建（processMarkdownFile / renderAll）
  cli.js     命令行入口
  index.js   统一导出

test/        单元 + 集成测试（覆盖率 100%）
fixtures/math/  原博客真实公式文章（回归测试素材）
examples/
  formula-test.md   综合公式测试页（覆盖全部公式特征）
  formula-test.html 渲染输出（可直接浏览器打开）
```

## 使用

### 编程 API

```js
const { renderMarkdown, analyzeMath, hasNoLeaks } = require("blog-renderer").core;

// 单文件渲染
const { html } = await renderMarkdown({
  filePath: "/path/to/article.md",
  content: markdownString,
});

// 公式质量检查
const analysis = analyzeMath(html);
console.log(analysis.katexTotal, hasNoLeaks(analysis.leaks));

// 完整站点构建（在博客根目录执行）
const { renderAll } = require("blog-renderer").site;
await renderAll({ cwd: "/path/to/blog" });
```

### CLI

```bash
# 渲染单个 markdown 为完整 HTML 页面
blog-renderer render article.md article.html [--offline]

# 构建整个博客站点（读取 config.yml，原地生成 .html）
blog-renderer build [--cwd <siteRoot>] [--config <config.yml>]
```

### 测试

```bash
npm test            # 跑全部测试
npm run test:cov    # 覆盖率（100% 阈值，低于则失败）
```

## 公式支持验证

`fixtures/math/` 存放原博客公式最密集的真实文章（test-markdown、poisson_understand_1/2、
3dgs-geometry-grounded、ekf、superpoint 等），集成测试断言：**零泄漏** + KaTeX 公式数量下限。
`examples/formula-test.md` 是综合公式测试页，覆盖原博客全部公式特征，渲染后可用浏览器直接查看。

## 渲染效果对齐 markdown-preview-enhanced

本项目的渲染引擎是 **crossnote**——VSCode 插件 markdown-preview-enhanced（MPE）的底层引擎
（mume 的继任者），因此公式解析内核与 MPE 完全一致：

- **KaTeX 0.16.x 服务端渲染**（`renderToString`），输出 MathML + KaTeX HTML 双格式
- **默认预览主题 github-light.css**（与 MPE 默认一致）：Helvetica Neue 16px、1.6 行高、
  块级公式居中、标题/表格/引用/代码块完整排版
- **mhchem 化学公式**：`\ce{H2O -> H+ + OH-}` 在 `$...$` / `$$...$$` 内直接可用
- **katexConfig 可配置**（macros 自定义宏等，经 `config.js` 传入引擎）

> ⚠️ 查看渲染效果请用 `exportFullPage`（CLI `render` 命令 / `npm run test:formula`）：
> 它输出完整 HTML 页面（含 KaTeX CSS、github-light 主题、Prism 代码高亮）。
> `renderMarkdown` 只返回无样式的 body 片段（供站点模板内嵌），直接打开会看不到样式。


## mermaid 图表

- **整站构建（build）**：模板自带 `mermaid.min.js` 脚本标签 + `mermaid.run()` 初始化，开箱即用
- **单文件导出（render / exportFullPage）**：crossnote 完整页模板自带 mermaid CDN 脚本与初始化逻辑（默认走 CDN，`--offline` 时自动内联），同样开箱即用
- 代码块写 ` ```mermaid ` 即可，支持 graph/sequenceDiagram/classDiagram 等全部图表类型

## 子目录部署（basePath）

站点部署在域名子目录（如 `huluoboge.top/blog/`）时，在 config.yml 顶层配置：

```yaml
basePath: "/blog"
```

- 导航链接自动加前缀：`/index.html` → `/blog/index.html`
- 静态资源前缀自动推导：`/blog/static`（也可用 `staticPrefix` 显式覆盖）
- 不配置时行为不变（默认部署在域名根）
