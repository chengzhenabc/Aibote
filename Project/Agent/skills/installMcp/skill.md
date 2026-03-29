---
name: 安装MCP服务
description: MCP 服务自动化发现、环境安装与配置文件生成 (Strict Context & Search Mode)
---

# 问题处理

## 1. 核心指令 (Strict Constraints)
1. **禁止发散搜索**：严禁搜索“如何安装 MCP”、“什么是 MCP”等通用教程。
2. **上下文优先**：如果用户对话中已经包含了配置 JSON 或代码块，**禁止**调用联网工具。
3. **定向检索 (仅限 Case B)**：只有在参数缺失时才允许联网，且必须限定在：Smithery, Glama, LobeHub, GitHub。
4. **路径绝对化**：所有 `command` 中的路径（如 Python 脚本位置）必须转换为 Windows 绝对路径，以确保 Aibote 客户端正确调用。

## 2. 核心定义
**目标**：实现 MCP（Model Context Protocol）服务的自动化发现、依赖安装与配置文件生成。
**存储路径**：项目根目录下的 \`./mcpService/\` 文件夹。
**存储原则**：**单文件原则 (Single File Strategy)**。每个 MCP 服务必须独立占用一个 \`.json\` 文件（例如：\`服务名.json\`）。严禁在单个 JSON 文件中包含多个 \`mcpServers\` 配置，以确保客户端解析兼容性。

---

## 3. 自动化执行逻辑
### 情况 A：用户已提供配置 (直接处理)
1. **解析内容**：从对话的代码块中提取 `mcpServers` 下的 `command`, `args`, 或 `url`。
2. **校验并写入**：
   - 检查是否具备 `transport: "stdio"` (本地) 或 `url` (远程)。
   - 调用 `writeFile` 保存至 `./mcpService/{服务名}.json`。


### 情况 B：用户未提供配置 (精准搜索安装)
1. **限定域搜索**：必须使用 联网搜索`ai_webSearch` 工具 配合 `site:` 指令或关键词，仅从以下平台获取元数据：
   - **Smithery** (`site:smithery.ai`): 优先级最高，寻找 `npx` 或 `uv` 一键安装指令。
   - **Glama** (`site:glama.ai/mcp`): 获取标准 `mcpServers` JSON 结构。
   - **LobeHub** (`site:lobehub.com/mcp`): 验证插件的配置参数。
   - **GitHub** (`awesome-mcp-servers`): 确认环境依赖（如需要特定的 API Key）。

2. **自动环境准备**：
   - **Python**: 检查是否存在 `pyproject.toml`。优先执行 `uv sync` 或 `uv run`；若无 `uv` 则回退至 `pip install`。
   - **Node.js**: 执行 `npm install` 或直接使用 `npx` 启动。

3. **生成配置**：根据抓取到的 `runtime` 和 `entry_point` 构造 JSON 模板。

4. **保存配置**：使用 `writeFile` 工具 将生成的 JSON 写入 `./mcpService/{服务名}.json`。

---

## 4. 配置文件标准模板

### 模板 1：本地服务 (Local MCP)
```json
{
  "mcpServers": {
    "服务名称": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\项目实际路径\\mcp-server-folder",
        "run",
        "python",
        "mcp_server.py"
      ],
      "transport": "stdio"
    }
  }
}
```
  
### 模板 2：远程服务 (Remote MCP)
```json
{
  "mcpServers": {
    "服务名称": {
      "url": "https://mcp.map.baidu.com/mcp?ak=你的密钥"
    }
  }
}
```