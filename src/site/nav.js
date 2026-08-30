"use strict";

/**
 * 导航生成（纯函数）：根据导航配置和当前路径生成导航 HTML。
 * 激活状态判断与原博客 render.js 保持一致。
 */

/**
 * 判断导航项是否处于激活状态
 * @param {object} item        导航项 { name, path, folder, isHome, type }
 * @param {string} currentPath 当前页面路径（如 "/articles/poisson/index.html"）
 */
function isNavItemActive(item, currentPath) {
  if (item.isHome) {
    return (
      currentPath === "/" ||
      currentPath === "" ||
      currentPath === "index.html" ||
      currentPath === "/index.html"
    );
  }
  return (
    currentPath.startsWith(item.path) ||
    currentPath.includes(`/${item.folder}/`) ||
    currentPath === `/${item.folder}/index.html` ||
    currentPath === `/${item.folder}/`
  );
}

/**
 * 生成导航项 href
 * @param {object} item 导航项 { isHome, folder }
 * @param {string} [basePath] 站点部署前缀（如 "/blog"），默认 ""
 */
function navItemHref(item, basePath = "") {
  return item.isHome
    ? `${basePath}/index.html`
    : `${basePath}/${item.folder}/index.html`;
}

/**
 * 生成导航 HTML
 * @param {Array} navItems     导航项数组
 * @param {string} currentPath 当前页面路径（如 "/articles/poisson/index.html"）
 * @param {string} [basePath]  站点部署前缀（如 "/blog"），默认 ""
 */
function generateNav(navItems, currentPath = "", basePath = "") {
  return navItems
    .map((item) => {
      const isActive = isNavItemActive(item, currentPath);
      return `<li><a href="${navItemHref(item, basePath)}" class="${
        isActive ? "active" : ""
      }">${item.name}</a></li>`;
    })
    .join("\n");
}

module.exports = { generateNav, isNavItemActive, navItemHref };
