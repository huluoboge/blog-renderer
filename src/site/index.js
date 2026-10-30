"use strict";

/**
 * 站点骨架（site）：在渲染核心之上提供博客站点构建能力。
 */

module.exports = {
  ...require("./config"),
  ...require("./nav"),
  ...require("./template"),
  ...require("./client-assets"),
  ...require("./discover"),
  ...require("./index-pages"),
  ...require("./build"),
};
