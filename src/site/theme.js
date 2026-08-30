// 原博客主题 CSS（提取自 huluoboge.github.io/render.js，保持原样）
// 支持暗色主题：html[data-theme="dark"]
"use strict";

const THEME_CSS = `.container {
        max-width: 800px;
        margin: 0 auto;
        padding: 0 20px;
      }
        :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --code-bg: #f8f9fa;
            --code-text: #333333;
            --border-color: #e9ecef;
            --nav-bg: #f8f9fa;
            --nav-text: #495057;
            --nav-hover: #007bff;
            --article-bg: #ffffff;
            --article-border: #e9ecef;
        }

        [data-theme="dark"] {
            --bg-color: #1a1a1a;
            --text-color: #e6e6e6;
            --code-bg: #2d2d2d;
            --code-text: #e6e6e6;
            --border-color: #444;
            --nav-bg: #2d2d2d;
            --nav-text: #e6e6e6;
            --nav-hover: #4a90e2;
            --article-bg: #2d2d2d;
            --article-border: #444;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px 0;
          line-height: 1.6;
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        nav {
            background: var(--nav-bg);
            padding: 1rem;
            margin-bottom: 2rem;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            gap: 1rem;
        }
        
        nav a {
            text-decoration: none;
            color: var(--nav-text);
            padding: 0.5rem 1rem;
            border-radius: 3px;
            transition: all 0.3s ease;
        }
        
        nav a:hover, nav a.active {
            background: var(--nav-hover);
            color: white;
        }
        
        .theme-switch {
            background: none;
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 0.5rem 1rem;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .theme-switch:hover {
            background: var(--border-color);
        }
        
        .article-list {
            list-style: none;
            padding: 0;
        }
        
        .article-item {
            margin-bottom: 1.5rem;
            padding: 1rem;
            border: 1px solid var(--article-border);
            border-radius: 5px;
            background: var(--article-bg);
            transition: all 0.3s ease;
        }
        
        .article-meta {
            color: var(--text-color);
            opacity: 0.7;
            font-size: 0.9em;
            margin-bottom: 0.5rem;
        }
        
        /* 数学公式响应式样式 */
        .katex { 
            font-size: 1.1em; 
        }

        /* 行内数学公式 */
        .katex-display {
            margin: 1rem 0;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.5rem 0;
        }

        /* 数学公式块 */
        .math-block {
            text-align: center;
            margin: 1rem 0;
            overflow-x: auto;
            overflow-y: hidden;
        }
        
        .mermaid { 
            background: var(--code-bg); 
            padding: 1rem; 
            margin: 1rem 0; 
            border-radius: 5px;
            overflow: auto;
        }
        
        pre code.hljs { 
            padding: 1rem; 
            border-radius: 5px; 
            font-size: 0.9em;
            background: var(--code-bg);
            color: var(--code-text);
        }

        pre {
            background: var(--code-bg);
            border-radius: 5px;
            padding: 1rem;
            overflow: auto;
            border: 1px solid var(--border-color);
        }
        
        code:not(.hljs) {
            background: var(--code-bg);
            color: var(--code-text);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        .math-block { text-align: center; margin: 1rem 0; }
        .math-inline { display: inline; }
        
        /* 返回按钮样式 */
        .back-button {
            display: inline-block;
            margin: 1rem 0 2rem 0;
            padding: 0.5rem 1rem;
            background: var(--nav-hover);
            color: white;
            text-decoration: none;
            border-radius: 3px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        /* 移动端返回按钮额外间距 */
        @media (max-width: 768px) {
            .back-button {
                margin-top: 1.5rem; /* 在移动端增加上边距，避免被导航栏遮挡 */
            }
        }
        
        .back-button:hover {
            background: var(--nav-text);
            transform: translateY(-1px);
        }
        
        /* 文章图像样式 */
        .article-image {
            width: 100%;
            max-width: 300px;
            height: auto;
            border-radius: 5px;
            margin-bottom: 1rem;
            object-fit: cover;
        }
        
        .article-item-with-image {
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 1rem;
            align-items: start;
        }
        
        .article-thumbnail {
            width: 100%;
            height: 80px;
            object-fit: cover;
            border-radius: 3px;
        }
        
        /* 汉堡菜单样式 */
        .hamburger {
            display: none;
            background: none;
            border: 1px solid var(--border-color);
            color: var(--text-color);
            padding: 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.3s ease;
        }
        
        .hamburger:hover {
            background: var(--border-color);
        }
        
        /* 移动端响应式样式 */
        @media (max-width: 768px) {
            /* 重置所有布局，从头开始设计 */
            html, body {
                width: 100%;
                max-width: 100%;
                overflow-x: hidden;
                margin: 0;
                padding: 0;
            }
            
            body {
                padding-top: 60px !important; /* 为固定导航栏留出空间 */
                padding-left: 15px;
                padding-right: 15px;
                box-sizing: border-box;
            }
            
            /* 导航栏基础样式 - 完全独立于页面内容 */
            nav {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%; /* 使用100%确保与视口一致 */
                height: 60px;
                background: var(--nav-bg);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 1001;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 15px;
                box-sizing: border-box;
                margin: 0;
                border-radius: 0;
                /* 确保导航栏完全独立于页面内容 */
                overflow: hidden;
            }
            
            /* 汉堡菜单 */
            .hamburger {
                display: block;
                background: none;
                border: 1px solid var(--border-color);
                color: var(--text-color);
                padding: 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 1.2rem;
                order: 1;
                flex-shrink: 0;
                /* 确保汉堡菜单位置固定 */
                position: relative;
                z-index: 1002;
            }
            
            /* 导航菜单 - 完全独立于页面内容 */
            .nav-menu {
                display: none;
                position: fixed;
                top: 60px;
                left: 0;
                width: 100%; /* 使用100%确保与视口一致 */
                background: var(--nav-bg);
                padding: 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                max-height: calc(100vh - 60px);
                overflow-y: auto;
                box-sizing: border-box;
                margin: 0;
                /* 确保导航菜单完全独立于页面内容 */
                overflow: hidden;
            }
            
            .nav-menu.active {
                display: flex;
                flex-direction: column;
            }
            
            .nav-menu ul {
                flex-direction: column;
                gap: 10px;
                margin: 0;
                padding: 0;
                width: 100%;
            }
            
            .nav-menu a {
                display: block;
                padding: 10px 15px;
                font-size: 0.9em;
                width: 100%;
                box-sizing: border-box;
            }
            
            /* 主题切换按钮 - 确保位置固定不受表格滚动条影响 */
            .theme-switch {
                margin-left: auto;
                order: 3;
                font-size: 0.9em;
                padding: 8px 12px;
                flex-shrink: 0;
                /* 确保主题切换按钮位置固定 */
                position: relative;
                z-index: 1002;
            }
            
            /* 主内容区域 */
            main {
                margin-top: 0;
                padding-top: 20px;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
                /* 确保main内容不会影响导航栏 */
                position: relative;
                z-index: 1;
            }
            
            /* 表格响应式 */
            table {
                display: block;
                overflow-x: auto;
                white-space: nowrap;
                max-width: 100%;
                margin: 1rem 0;
                /* 确保表格滚动条不会影响页面布局 */
                position: relative;
                z-index: 1;
            }
            
            th, td {
                padding: 0.5rem 0.75rem;
                font-size: 0.9em;
            }
            
            /* 数学公式优化 */
            .katex {
                font-size: 1em;
            }
            
            .katex-display {
                font-size: 0.95em;
                margin: 0.75rem 0;
                max-width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            .math-block {
                font-size: 0.95em;
                margin: 0.75rem 0;
                max-width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
        }
        
        /* 超小屏幕进一步优化 */
        @media (max-width: 480px) {
            .katex {
                font-size: 0.9em;
            }
            
            .katex-display {
                font-size: 0.85em;
            }
            
            .math-block {
                font-size: 0.85em;
            }
        }
        
        /* 响应式图片样式 */
        main img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1rem auto;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        /* 图片容器样式 */
        .image-container {
            text-align: center;
            margin: 1.5rem 0;
        }
        
        /* 图片标题样式 */
        .image-caption {
            margin-top: 0.5rem;
            color: var(--text-color);
            opacity: 0.7;
            font-size: 0.9em;
            font-style: italic;
        }
        
        /* 确保所有图片都响应式 */
        .article-thumbnail {
            max-width: 100%;
            height: auto;
        }
        
        .article-image {
            max-width: 100%;
            height: auto;
        }
        
        /* 表格样式 - 统一使用移动端响应式效果 */
        table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
            max-width: 100%;
            margin: 1rem 0;
            border-collapse: collapse;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: var(--article-bg);
            border: 1px solid var(--border-color);
            -webkit-overflow-scrolling: touch; /* 移动端平滑滚动 */
        }
        
        th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
            transition: all 0.3s ease;
            font-size: 0.95em;
            min-width: 120px; /* 确保单元格有最小宽度 */
        }
        
        th {
            background: var(--nav-bg);
            color: var(--nav-text);
            font-weight: 600;
            border-bottom: 2px solid var(--border-color);
            position: sticky;
            left: 0; /* 固定表头在滚动时可见 */
            z-index: 1;
        }
        
        tbody tr:hover {
            background: var(--code-bg);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        tbody tr:nth-child(even) {
            background: var(--code-bg);
        }
        
        tbody tr:nth-child(even):hover {
            background: var(--nav-bg);
            transform: translateY(-1px);
        }
        
        /* 响应式表格 - 移动端额外优化 */
        @media (max-width: 768px) {
            body {
                max-width: 100%;
                padding: 15px;
                overflow-x: hidden;
            }
            
            /* 确保表格容器不会导致页面布局问题 */
            main {
                max-width: 100%;
                overflow-x: hidden;
            }
            
            /* 修复导航栏在移动端的布局 */
            nav {
                max-width: 100%;
                overflow-x: hidden;
            }
            
            /* 确保页面内容宽度正确 */
            html, body {
                width: 100%;
                max-width: 100%;
                overflow-x: hidden;
            }
        }
        
        /* 表格标题样式 */
        table + p {
            margin-top: 0.5rem;
            color: var(--text-color);
            opacity: 0.7;
            font-size: 0.9em;
            font-style: italic;
            text-align: center;
        }

        /* Markdown 嵌入样式 */
        .markdown-embed {
            margin: 1.5rem 0;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }

        .markdown-embed:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-1px);
        }

        /* 移动端嵌入样式优化 */
        @media (max-width: 768px) {
            .markdown-embed {
                margin: 1rem 0;
                border-radius: 6px;
            }

        }`;

module.exports = { THEME_CSS };
