"use strict";

/**
 * 渲染核心（core）：与站点骨架无关的 Markdown 渲染能力。
 * 只依赖 crossnote 引擎 + 纯文本处理，可独立测试、独立复用。
 */

module.exports = {
  ...require("./config"),
  ...require("./math"),
  ...require("./codeblock"),
  ...require("./links"),
  ...require("./renderer"),
};
