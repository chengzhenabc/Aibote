---
name: 安装与开发扩展插件
description: 参考现有插件模板，为系统开发并安装新的功能插件。
---

# 问题处理

**执行步骤**：

1. **参考学习（Reference）**：
   - 调用 \`readFile\` 工具读取并分析以下两类插件示例：
     - **Node.js 类**：\`extend/read_writeFile.js\`（逻辑）及 \`extend/read_writeFile.json\`（配置）。
     - **EXE 类**：\`extend/aiSketch.js\`（逻辑）及 \`extend/aiSketch.json\`（配置）。
   - **分析重点**：观察 JS 中的导出函数、参数传递方式，以及 JSON 中定义的 \`name\`, \`description\`, \`parameters\` 等字段的对应关系。
2. **插件实现（Implementation）**：
   - 严格遵循示例的架构规则，编写新插件的代码。
   - 确保 JS 逻辑与 JSON 配置文件中的定义（如指令名、参数类型）完全匹配。
3. **部署安装（Deployment）**：
   - 使用 \`writeFile\` 工具 将生成的 JS 和 JSON 文件写入到 \`./extend\` 目录下。
   - 确保文件命名规范且不覆盖已有关键文件。

**约束条件**：
- 必须同时生成 .js 和 .json 两个文件。
- 代码注释需清晰，JSON 格式需合法。