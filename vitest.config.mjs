import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json"],
      include: ["src/**/*.js"],
      // theme.js 是纯 CSS 数据常量（无逻辑分支），istanbul 对巨型模板字符串插桩异常
      exclude: ["src/**/index.js", "src/site/theme.js"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
