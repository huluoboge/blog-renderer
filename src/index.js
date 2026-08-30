"use strict";

/**
 * blog-renderer：模块化 Markdown 博客渲染器。
 *
 *  - core：渲染核心（crossnote 引擎 + 公式支持 + 纯文本处理）
 *  - site：站点骨架（模板/导航/发现/索引页/批量构建）
 */

module.exports = {
  core: require("./core"),
  site: require("./site"),
};
