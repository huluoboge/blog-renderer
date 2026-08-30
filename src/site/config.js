"use strict";

/**
 * 站点配置：读取 config.yml，失败时使用默认配置。
 * 原博客 render.js loadConfig 的模块化版本。
 */

const fs = require("fs-extra");
const yaml = require("yaml");

/** 默认站点配置（与原博客 render.js 完全一致） */
function defaultSiteConfig() {
  return {
    site: {
      title: "我的博客",
      description: "个人技术博客",
      author: "作者",
    },
    navigation: [
      { name: "首页", path: "/", folder: "home", isHome: true, type: "page" },
      {
        name: "技术文章",
        path: "/articles/",
        folder: "articles",
        type: "articles",
      },
      { name: "博客", path: "/blog/", folder: "blog", type: "blog" },
      {
        name: "开源项目",
        path: "/projects/",
        folder: "projects",
        type: "projects",
      },
    ],
    homepage: {
      latest_articles_count: 3,
      show_projects: true,
      show_blog_posts: false,
    },
  };
}

/**
 * 加载站点配置
 * @param {string} configPath config.yml 路径（默认 "config.yml"）
 * @returns {Promise<{config: object, navItems: Array}>}
 */
async function loadConfig(configPath = "config.yml") {
  try {
    const configContent = await fs.readFile(configPath, "utf8");
    const config = yaml.parse(configContent) || {};
    return { config, navItems: config.navigation || [] };
  } catch {
    const config = defaultSiteConfig();
    return { config, navItems: config.navigation };
  }
}

module.exports = { loadConfig, defaultSiteConfig };
