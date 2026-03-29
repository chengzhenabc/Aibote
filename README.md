# AiboteClaw WebSocket 开发接入文档

AiboteClaw 采用标准 WebSocket 协议进行双向通信，允许开发者通过 JSON 指令集远程操控自动化工具、配置 AI 模型并进行智能对话。

* **WebSocket服务路径**: Aibote\Project\Agent\start.exe
* **DEMO源码路径**: Aibote\Project\Agent\webUI

---

## 1. 连接规范
* **默认地址**: `ws://127.0.0.1:8016`
* **IPv6 支持**: 若使用 IPv6 地址，需使用中括号包裹，例如 `ws://[::1]:8016`
* **心跳/状态**: 建议在 `onopen` 后立即获取 `WindowsId` 以确认连接有效性。

---

## 2. 数据协议

### 请求报文 (Request)
所有发送至服务的指令必须符合以下格式：
```json
{
  "requestId": "唯一标识符（建议：时间戳-随机数）",
  "payload": {
    "cmd": "指令名称",
    "参数1": "值1",
    "参数2": "值2"
  }
}
```

### 响应报文 (Response)
服务返回的数据为 **字符串格式**，采用下划线 `_` 分隔 ID 与内容：
* **格式**: `requestId_payload`
* **解析逻辑**:
    1. 寻找第一个 `_` 的索引。
    2. 索引前的部分为 `requestId`，用于匹配异步回调。
    3. 索引后的部分为 `payload`（通常为 JSON 字符串或纯文本）。

---

## 3. 核心指令集

### 3.1 系统与身份 (System)
| 指令 (cmd) | 说明 | 返回值 |
| :--- | :--- | :--- |
| `getWindowsId` | 获取当前设备的唯一识别 ID | 字符串 ID |
| `getCredits` | 获取账户剩余积分 | 数值字符串 |

### 3.2 工具配置 (Configuration)
在启动 AI 任务前，必须调用 `setTool` 同步配置信息。
* **`allTools`**: 同步客户端支持的所有工具列表名。
* **`setTool`**: 设置模型参数及启用的工具。
    * **参数**: `{ toolList: Array, endpoint: String, modelType: String, apikey: String }`

### 3.3 插件与技能发现 (Discovery)
用于动态获取服务端加载的扩展功能。返回值均为包含 `titles` 和 `descriptions` 数组的 JSON 对象。
* **`showExtendList`**: 获取扩展插件列表。
* **`showMcpList`**: 获取已安装的 MCP (Model Context Protocol) 服务列表。
* **`showSkillsList`**: 获取技能模块列表。

### 3.4 AI 对话与控制 (Execution)
| 指令 (cmd) | 参数 | 说明 |
| :--- | :--- | :--- |
| `llmChat` | `{ input: String, thinking: Boolean }` | 发送用户输入（支持带文件路径）。`thinking` 为是否开启推理模式。 |
| `stopLlm` | `{}` | 强制中断当前的 AI 执行/生成。 |
| `clearMessage`| `{}` | 清除上下文对话历史。 |

---

## 4. 特殊功能实现

### 4.1 文件传输逻辑
AiboteClaw 不直接通过 WS 发送二进制文件。文件需先通过 HTTP POST 接口上传至服务器：
1.  **上传**: 向 `/upload` 接口发送 `FormData`。
2.  **引用**: 上传成功后，在 `llmChat` 的 `input` 参数中以特定标签包装文件路径：
    ```text
    <file_paths>
    uploads\filename.png
    </file_paths>
    用户的问题内容...
    ```

### 4.2 语音识别集成
支持浏览器原生的 `SpeechRecognition` 接口。识别到 `isFinal` 状态后，建议自动触发 `llmChat` 请求以实现免打口令交互。

---

## 5. 简单示例 (Node.js/JavaScript)

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:8016');

ws.on('open', () => {
    // 发送获取 ID 请求
    const request = {
        requestId: Date.now().toString(),
        payload: { cmd: "getWindowsId" }
    };
    ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
    const message = data.toString();
    const index = message.indexOf('_');
    const id = message.slice(0, index);
    const result = message.slice(index + 1);
    
    console.log(`收到响应 [ID: \${id}]:`, result);
});
```

---


# Aibote Agent —— 从零开始打造你的私人 AI 助手

## 第一章：认识 Aibote Agent

### 什么是 Aibote Agent？
**Aibote Agent** 是一个运行在你本地电脑或服务器上的 AI 助手。与 ChatGPT、Claude 等云端 AI 不同，它跑在你的设备上，数据完全受你掌控。

它不仅仅是一个聊天机器人，更是一个具备“执行力”的数字员工：
* **全平台控制**：能操作电脑、浏览器、安卓手机。
* **深度交互**：读写文件、执行系统命令、编写并运行代码。
* **私有化**：数据安全，隐私无忧。

---

### 快速资源导航
* **官方网站**：[https://www.aibote.net](https://www.aibote.net)
* **视频教程**：[Bilibili 教程链接](https://www.bilibili.com/video/BV1aHqdBKEDN/)
* **许可证**：完全免费，支持自定义界面、名称和 LOGO。

---

### 核心功能概览
| 功能模块 | 描述 | 技术支撑 |
| :--- | :--- | :--- |
| **上网冲浪** | 自动网页操作、抓取数据、截图 | Aibote WebBot |
| **界面操作** | 模拟鼠键操作 Windows 窗口、ERP 等软件 | Aibote WindowsBot |
| **手机远控** | 控制安卓 APP、点外卖、自动化任务 | Aibote AndroidBot |
| **语音交互** | 与数字人实时对话并下达指令 | Aibote CPU 实时数字人 |
| **文件管家** | 分析代码、整理文档、读写文件 | 文件系统接口 |
| **执行专家** | 运行 Shell 命令、部署服务、执行自动生成的代码 | 系统执行引擎 |
| **扩展生态** | 支持插件扩展，7x24 小时系统服务运行 | 插件系统 |

---

### 目标用户
* **个人用户**：提升效率，管理日程，随叫随到的资料库。
* **开发者**：自动化部署、代码分析，解放双手。
* **企业团队**：处理报表、监控报警、智能客服，降本增效。
* **隐私敏感者**：对本地数据安全有极高要求的用户。

---

## 第二章：安装指南

### 硬件/系统需求
* **操作系统**：Windows 10 及以上
* **最低配置**：CPU 1核 / 内存 2GB / 硬盘空间 5GB

### 一键安装流程
1.  **⚠️ 预备工作**：请先关闭杀毒软件，防止误删核心组件。
2.  **下载地址**：[InstallAibote.exe](https://dl.aibote.net/InstallAibote.exe)
3.  **安装**：双击运行安装包，系统会自动解压安装。
4.  **完成**：安装后，桌面会自动生成 `Aibote` 文件夹。

---


## 第三章：快速使用
1.  **免费算力** 新用户无需配置大模型，免费赠送2万token算力
2.  **快速上手** 在配置界面勾选需要的工具，切到对话界面，发送指令。例如：`帮我打开百度，获取百度热搜信息`
3.  **⚠️ 注意事项** AI仅加载已勾选的工具。


## 第四章：核心功能与模块详解

> **技术优势**：Aibote 底层由团队自研 6 年，功能模块化程度极高。相比 OpenClaw，其 **Token 消耗仅为 1%**，且大模型理解精准度更高。

### 大模型配置 (AI 大脑)
路径：`Aibote 文件夹` -> `双击 Agent` -> `配置参数页面`
1.  填写 **API 地址**、**模型类型** 和 **API 密钥**。
2.  点击 **保存配置并应用**。

**🚨 注意事项：**
* 如果不填 API 密钥，系统将默认使用内置的微调大模型。
* 接口需支持 OpenAI 格式协议。
* **API 地址末尾必须加上 `/chat/completions`**。

---

### 电脑工具模块 (WindowsBot)
基于 DOM 树结构 + AI 视觉 + 找图取色技术，实现精准 UI 自动化。
* **基础模块 (必选)**：初始化环境，分析 UI 树结构。
* **窗口模块 (必选)**：获取窗口句柄，99% 的操作依赖此模块。
* **UI 元素与鼠键模块**：执行具体的点击、输入与数据获取。

### 网页工具模块 (WebBot)
基于 DOM 树结构 + AI 视觉，专门针对网页元素进行操作。
* **基础模块 (必选)**：初始化网页环境。
* **Web 元素**：负责元素定位与交互执行。

### 安卓工具模块 (AndroidBot)
基于无障碍/HID/Aibote 键盘等技术，实现手机自动化。
* **基础模块 (必选)**：初始化 Android 连接，分析 UI 树。
* **元素模块**：获取手机界面数据，执行点击与触屏。

### 人工智能模块
* **生成 Aibote 脚本**：自动生成 Node.js/Python 自动化代码。
* **AI 视觉**：理解图片及 20M 以内的视频内容。
* **实时数字人**：基于本地 CPU 算力，支持语音互动与指令指挥。
* **非实时数字人**：批量创作口播视频、短剧素材生成。
* **系统 Agent**：超级模式。控制电脑/手机解决任意问题（需 ADB 权限，请慎用）。

### 技巧：快速了解更多模块
1.  勾选感兴趣的模块。
2.  切换到 AI 对话，发送指令：**“加载所有工具列表，并给出介绍”**。

---

### 插件扩展生态
支持 JS/Python 源码或 EXE 程序。插件存放目录：`\Aibote\Project\Agent\extend`。

#### 示例 1：纯 Node.js 读写插件
**JS 逻辑 (read_writeFile.js):**
```javascript
const fs = require('fs');

async function readFile(args) {
    if (!fs.existsSync(args.filePath)) return "文件不存在";
    return await fs.readFileSync(args.filePath, 'utf8');
}

async function writeFile(args) {
    if (!fs.existsSync(args.filePath))
        await fs.writeFileSync(args.filePath, args.data, 'utf8');
    else
        return "文件已存在，禁止写入";
    return "文件写入成功";
}

module.exports = { readFile, writeFile }
```

**JSON 配置 (read_writeFile.json):**
```json
{
    "modulesPath":["./extend/read_writeFile.js"],
    "tools":[
        {
            "type": "function",
            "function": {
                "name": "readFile",
                "description": "读取文本内容",
                "parameters": {
                    "type": "object",
                    "properties": { "filePath": { "type": "string", "description": "文件路径" } },
                    "required": ["filePath"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "writeFile",
                "description": "写入文本内容",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "filePath": { "type": "string", "description": "文件路径" },
                        "data": { "type": "string", "description": "写入的数据" }
                    },
                    "required": ["filePath", "data"]
                }
            }
        }
    ]
}
```

#### 示例 2：EXE 程序插件 (远程安装)
**JS 逻辑 (aiSketch.js):**
```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const installExtend = require('../lib/installExtend.js');

async function aiSketch(args) {
  const exePath = "script\\ai_sketch_image.exe";
  if(!fs.existsSync(exePath))
    await installExtend("http://124.248.66.46:81/agentExtend/ai_sketch.zip", "script");

  spawn(exePath, [args.imagePath], { detached: true, stdio: 'ignore', shell: true }).unref();
  return true;
}
module.exports = { aiSketch }
```

**JSON 配置 (aiSketch.json):**
```json
{
    "modulesPath": [
        "./extend/aiSketch.js"
    ],
    "tools": [
        {
            "type": "function",
            "function": {
            "name": "aiSketch",
            "description": "模拟手工绘制",
            "parameters": {
                    "type": "object",
                    "properties": {
                        "imagePath": {
                            "type": "string",
                            "description": "参照图片路径，未指定则默认设置为：'script\\defaultImage.png'"
                        }
                    },
                    "required": [
                        "imagePath"
                    ]
                }
            }
        }
    ]
}
```

---

### MCP 服务生态
配置目录：`\Aibote\Project\Agent\mcpService`。

* **远程 MCP 配置 (baiduMap.json)**:
    ```json
    {
        "description":"百度地图。提供地图搜索服务",
        "url":"https://mcp.map.baidu.com/mcp?ak=xxxxxxxx"
    }
    ```
* **本地 MCP 配置 (a_share_mcp.json)**:
    ```json
    {
      "mcpServers": {
        "股票行情。提供 A 股实时行情": {
          "command": "uv",
          "args": ["--directory", "d:\\a-share-mcp", "run", "python", "mcp_server.py"],
          "transport": "stdio"
        }
      }
    }
    ```

---

---
### Skills 技能生态
配置目录：`\Aibote\Project\skills`。 每个技能单独存放到一个文件夹。
#### skill.md 规范示例:
```javascript
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
---
```



## 第五章：使用场景示例

### UI 自动化进阶指南

| 等级 | 模式 | 核心逻辑 | 优缺点 |
| :--- | :--- | :--- | :--- |
| **🟢 初级** | **自然语言交互** | 直接下令：“打开抖音查看粉丝数” | **优**：零门槛 / **缺**：Token 消耗大，稳定性中等 |
| **🟡 中级** | **辅助代码生成** | 记录路径并生成 Aibote 脚本 | **优**：0 Token 消耗，运行快 / **缺**：需基础自动化概念 |
| **🔴 高级** | **精准开发模式** | 基于精准 XPath 编写脚本 | **优**：企业级稳定，毫秒级响应 / **缺**：需熟练掌握元素提取 |

**高级模式指令示例：**
> “结合 AndroidBot 源码，生成脚本执行以下操作：1. 点击搜索；2. 输入 'Aibote' (XPath: `com.ss.android.ugc.aweme:id=et_search_kw`)；3. 获取文本...”

---

### AI 视觉与短视频创作
1.  **视频分析**：
    > “使用 AI 视觉分析 `C:\Users\Desktop\2.mp4`。请详细描述人物特征、面相、穿着、背景及风格。”
2.  **脚本创作**：
    > “根据分析结果编写 8 秒一集的拍摄脚本，包含详细的卡点建议和特写描述。”
3.  **批量生成**：
    > “根据脚本生成视频，比例 16:9，并利用尾帧技术生成后续集，全程使用普通话。”


## 第六章：AiboteClaw 集成指南：将能力嵌入您的应用

**AiboteClaw** 是一款**国产纯自研**的自动化与 AI 协同平台。其设计深度贴合国内开发者的操作习惯，安装便捷，生态开放。核心架构基于 **WebSocket 协议**，这意味着开发者可以使用任何编程语言，轻松调用 AiboteClaw 的全量能力。

---

### 一、 功能矩阵 (Capabilities)

AiboteClaw 它是一个集成了 AI 与系统控制权的“全能核心”：

| 维度 | 核心能力描述 |
| :--- | :--- |
| **AI 增强** | MCP 本地/云端执行、OpenClaw Skills 生态调用、联网搜索查询 |
| **多媒体创作** | AI 视频/图片创作与理解、实时/非实时数字人对话交互 |
| **自动化控制** | Windows UI 自动化、浏览器自动化 (CDP)、安卓原生 UI 自动化 |
| **系统底层** | Shell 指令执行、ADB 调试、自动代码编写与运行 |
| **辅助功能** | 本地知识库记忆、定时任务调度、自动化脚本生成 |
| **扩展性** | 支持任意语言开发的 **.exe** 或代码插件直接调用 |


---

### 二、 开源 WebUI 资源说明

为了降低开发门槛，AiboteClaw 提供了完整的开源 Web 交互界面，开发者可以基于此代码进行二次开发或样式定制。

* **技术栈**：标准 HTML5、CSS3、JavaScript（原生轻量，无重型框架依赖）。
* **通信机制**：通过 **WebSocket** 与 AiboteClaw 后端服务进行实时双向通信。
* **关键代码路径**：
    * **项目目录**：`Aibote\Project\Agent\webUI`
    * **核心逻辑**：`Aibote\Project\Agent\webUI\script.js` （包含所有 API 调用封装）。

---

### 三、 嵌入方案

根据您的应用程序架构，可以选择以下三种方案进行集成：

#### 1. Web 客户端程序 (原生 Web 集成)
* **实现方式**：在您的网页内通过 `<iframe>` 嵌入，或直接访问 AiboteClaw 服务启动的 URL 地址。
* **适用场景**：纯 Web 端管理后台或轻量化工具。
* **优点**：零开发成本，直接复用官方成熟 UI。

#### 2. 非 Web 客户端程序 (混合开发模式)
* **实现方式**：在您的原生应用（如 C++ MFC/Qt, C# WinForms/WPF, Java Swing, Electron）中启用 **WebView/WebView2** 内核控件，加载 AiboteClaw 的服务 URL。
* **适用场景**：桌面端桌面助手、行业专用自动化工具。
* **优点**：无缝嵌入，用户感知一体化，无需跳转浏览器。

#### 3. 全场景自定义方案 (推荐：协议级集成)
如果您需要完全自主的 UI 界面，或者希望在非 Web 环境（如纯控制台、后台服务）中使用：
* **操作方法**：将 `Aibote\Project\Agent\webUI\script.js` 的源码提供给大模型（如 Gemini, GPT）。
* **指令参考**：*“请分析这段 JavaScript 中的 WebSocket 通信协议和指令格式，并为我生成一套符合 [您的编程语言，如 C++, Node.js, Python] 环境的调用类库。”*
* **优点**：**性能最高，灵活性最强**。可以实现完全“去界面化”的静默自动化调用，或根据业务需求定制完全不同的交互逻辑。

---