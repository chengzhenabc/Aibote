//https://www.mimitool.com/javascript-obfuscator
let ws;
let wsPort = 8080;
let apikey = '';
let toolList = [];
let toolNames = [
    "WinBaseTool",
    "WinWindowsTool",
    "WinMouseTool",
    "WinKeyboardTool",
    "WinImageColorTool",
    "WinAiTool",
    "WinElementTool",
    "WinClipboardTool",
    "WinProcessTool",
    "WinDownLoadTool",
    "WinExcelTool",
    "WinOtherTool",

    "WebBaseTool",
    "WebElementTool",
    "WebMouseTool",
    "WebKeyboardTool",
    "WebEmulationTool",
    "WebDownLoadTool",
    "WebCookieTool",
    "WebWindowsTool",
    "WebScreenshotTool",
    "WebAlertTool",
    "WebNavigateTool",
    "WebOtherTool",

    "AndroidBaseTool", 
    "AndroidImageColorTool", 
    "AndroidTouchTool", 
    "AndroidKeyboardTool", 
    "AndroidNavigateTool",
    "AndroidAITool", 
    "AndroidElementTool", 
    "AndroidFileTool", 
    "AndroidDownloadTool", 
    "AndroidClipboardTool", 
    "AndroidToastTool",
    "AndroidHidTool", 
    "AndroidActivityTool", 
    "AndroidPackageTool", 
    "AndroidOtherTool",

    "AiBaseTool",
    "AiboteCoder",
    "AiKnowledge",
    "GenerateHumanVideoEx_Service",
    "AiVision",
    "AiGenerate",
    "AiSystemAgent",
    "ExtendTool"
  ];

// 配置映射
const CONFIG_MAP = {
    apikey: "apikey",
    tools: toolNames.reduce((acc, toolName) => {
        acc[toolName] = toolName;
        return acc;
    }, {})
};


async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

//打印日志
function logMessage(message, obj) {
  const logArea = document.getElementById("log");
  const text = obj ? `${message} ${JSON.stringify(obj)}` : message;
  logArea.value += `[${new Date().toLocaleTimeString()}] ${text}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

//初始化websocket
const pendingMap = new Map();
function sendAndWait(ws, payload, timeout) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random()}`;
    pendingMap.set(requestId, { resolve, reject });

    const msg = {
      requestId,
      payload,
    };
    ws.send(JSON.stringify(msg));

    // 可选：超时机制
    if(timeout > 0){
      setTimeout(() => {
        if (pendingMap.has(requestId)) {
          //reject("Timeout");
          resolve(null)
          pendingMap.delete(requestId);
        }
      }, timeout);
    }
  });
}

//获取积分
async function getCredits() {
  data = {}
  let response = await sendMessage("getCredits", data);
  return response;
}

//刷新积分
async function refreshCredits() {
  const icon = document.getElementById('refreshIcon');
  const text = document.getElementById('userCredits');

  // 如果正在动画中，则防止重复点击
  if (icon.classList.contains('rotating')) return;

  // 1. 开始动画和视觉反馈
  icon.classList.add('rotating');
  text.style.opacity = "0.5";

  // 动画结束后自动移除类，以便下次点击触发
  icon.addEventListener('animationend', () => {
    icon.classList.remove('rotating');
  }, { once: true }); // {once: true} 确保监听器只执行一次

  try {
    const result = await getCredits();
    text.innerText = result;
  } catch (error) {
    console.error("获取积分失败", error);
  } finally {
    text.style.opacity = "1";
    // 注意：动画移除现在交给了上面的 animationend 处理
  }
}

//读取用户ID
async function getWindowsId() {
  data = {}
  let response = await sendMessage("getWindowsId", data);
  const userIdSpan = document.getElementById('userId');
  userIdSpan.textContent = "用户ID：" + response;
}

function initWebSocket() {
    ws = new WebSocket(`ws://localhost:${wsPort}`);
    ws.onopen = async () => {
      //logMessage("已连接到 MCP 服务");
      await getWindowsId();
      await refreshCredits();
      await showExtendList();//显示插件列表
      await setTool();
      document.getElementById('startService').disabled = false;
    }
    ws.onclose = () => logMessage("连接已关闭");
    ws.onerror = (error) => logMessage("错误", error);
    ws.addEventListener("message", (event) => {
      const index = event.data.indexOf("_");
      if(index == -1){
        logMessage(event.data)
        return;
      }
      const requestId = event.data.slice(0, index); 
      const payload = event.data.slice(index + 1);  
  
      if (pendingMap.has(requestId)) {
        const { resolve } = pendingMap.get(requestId);
        resolve(payload);
        pendingMap.delete(requestId);
      }
    });
  
    ws.addEventListener("error", (err) => {
      // 把所有 pending 都 reject 掉
      for (const { reject } of pendingMap.values()) {
        reject(err);
      }
      pendingMap.clear();
    });
}

//发送数据给AiDriver
async function sendMessage(command, data, timeout = 0) {
  let response = "AiDriver 未连接";
  data["cmd"] = command;
  if (ws && ws.readyState === WebSocket.OPEN) {
    response = await sendAndWait(ws, data, timeout); 
  } else {
    logMessage("AiDriver 未连接");
  }

  return response;
}

//切换tab
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // 更安全的方式来激活对应 tab
  const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  } else {
    console.warn(`未找到匹配的 tab: ${tabId}`);
  }

  const activeContent = document.getElementById(tabId);
  if (activeContent) {
    activeContent.classList.add('active');
  } else {
    console.warn(`未找到匹配的 tab-content: ${tabId}`);
  }
}

// 保存表单数据到缓存
function saveCacheData() {
  const data = {}
    // 保存大语言模型参数配置
      const element = document.getElementById(CONFIG_MAP.apikey);
      if (element)
          data[CONFIG_MAP.apikey] = element.value;
    
    // 保存工具参数配置
    Object.keys(CONFIG_MAP.tools).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            data[key] = element.checked;
        }
    });

  localStorage.setItem("formData", JSON.stringify(data));
}

// 加载缓存的数据
function loadCacheData() {
  const data = localStorage.getItem("formData");
  if (!data) 
    return;

  try {
    const parsed = JSON.parse(data);

    // 加载大语言模型参数配置
    const element = document.getElementById(CONFIG_MAP.apikey);
    element.value = parsed[CONFIG_MAP.apikey];
    apikey = parsed[CONFIG_MAP.apikey];


    // 加载工具参数配置
    Object.keys(CONFIG_MAP.tools).forEach(key => {
        const element = document.getElementById(key);
        if (element && parsed[key] !== undefined) {
            element.checked = parsed[key];
        }
    });

    //使用 filter 方法直接筛选选中的工具
    toolList = toolNames.filter(toolName => 
      document.getElementById(toolName)?.checked
    );

  } catch (e) {
    console.warn("缓存数据解析失败:", e);
  }
}

//中断执行
async function stopLlm() {
    data = {};
    let response = await sendMessage("stopLlm", data);
    logMessage("中断执行:", response);
}

//清空历史记录
async function clearMessage() {
  const chatContainer = document.getElementById('chat-container');
  const userInput = document.getElementById('user-input'); // 获取输入框元素

  chatContainer.innerHTML = ''; // 清空聊天记录

  // --- 新增代码 ---
  //userInput.value = ''; // 清空输入框内容
  //userInput.style.height = 'auto'; // 重置输入框高度（如果启用了自动增高）
  // ----------------

  // 重新添加初始的欢迎信息
  const introMessage = document.createElement('div');
  introMessage.className = 'bot-message intro-message';
  introMessage.textContent = '👋 你好！我是 Aibote 智能助手。请配置好工具后开始与我对话。';
  chatContainer.appendChild(introMessage);

  data = {};
  let response = await sendMessage("clearMessage", data);
  logMessage("清除上下文:", response);
}

//显示扩展插件
async function showExtendList() {
  data = {}
  // 1. 请求后端获取插件列表
  let response = await sendMessage("showExtendList", data);

  let extendInfo = { titles: [], descriptions: [] };
  try {
      if (response) {
          extendInfo = JSON.parse(response);
      }
  } catch (e) {
      console.error("解析扩展插件列表失败:", e);
      return response;
  }

  const { titles, descriptions } = extendInfo;

  // 2. 定位扩展模块的容器
  // 默认 HTML 中有一个 id="ExtendTool" 的 input，我们找到它的父级 grid 容器
  const extendToolInput = document.getElementById("ExtendTool");
  if (!extendToolInput) return response;

  const container = extendToolInput.closest('.tools-grid-layout');
  if (!container) return response;

  // 3. 清空现有内容（例如默认的那个 ExtendTool 复选框）
  container.innerHTML = "";
  
  // 移除 HTML 中内联的 style="grid-template-columns: 1fr;"，恢复 CSS 中的 grid 布局
  container.style.gridTemplateColumns = ""; 

  // 4. 动态创建控件
  if (titles && titles.length > 0) {
      titles.forEach((name, index) => {
          // 获取描述，如果没有则显示默认文本
          const desc = (descriptions && descriptions[index]) ? descriptions[index] : "暂无描述";

          // 创建 label 容器
          const label = document.createElement('label');
          label.className = "checkbox-card";

          // 创建 checkbox
          const input = document.createElement('input');
          input.type = "checkbox";
          // 使用插件名称作为 ID，注意：后端 setTool 需要能识别这个 ID
          // 如果后端只识别 "ExtendTool"，这里可能需要特殊处理，但通常插件化设计是按名称加载
          input.id = `ExtendTool_${index}`; 

          // 创建内容区域
          const contentDiv = document.createElement('div');
          contentDiv.className = "check-content";

          // 标题
          const spanTitle = document.createElement('span');
          spanTitle.className = "check-title";
          spanTitle.innerText = name;

          // 描述
          const spanDesc = document.createElement('span');
          spanDesc.className = "check-desc";
          spanDesc.innerText = desc;

          // 组装 DOM
          contentDiv.appendChild(spanTitle);
          contentDiv.appendChild(spanDesc);
          label.appendChild(input);
          label.appendChild(contentDiv);

          // 添加到页面
          container.appendChild(label);

          // 5. 关键：将动态生成的 ID 注册到脚本的工具列表中
          // 这样 saveConfig() 才能遍历到它，loadCacheData() 才能保存它的状态
          if (!toolNames.includes(input.id)) {
              toolNames.push(input.id);
              // 更新配置映射，确保缓存读取正常
              CONFIG_MAP.tools[input.id] = input.id; 
          }

          // 绑定变更事件（与 check_tools_event 逻辑一致）
          input.addEventListener('change', function() {
              const startBtn = document.getElementById('startService');
              saveConfig(startBtn);
          });
      });

      // 6. 重新加载缓存状态
      // 因为控件是刚生成的，需要重新从 localStorage 读取 checked 状态
      loadCacheData();

  } else {
      // 如果没有插件，显示提示
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">未检测到扩展插件</div>`;
  }

  return response;
}

//设置工具列表
async function setTool() {
    data = {
        toolList:toolList,
        apikey: apikey
    }
    
    let response = await sendMessage("setTool", data);
    // //更新扩展模块描述
    // if(response.length > 3){
    //   response = response.replace(/","/g, '、');
    //   response = response.replace(/\[|\]|"/g, '');
    //   document.getElementById("ExtendToolDesc").textContent = response;
    //   //logMessage("工具模块:", response.split(','));
    // }
}

//保存配置
async function saveConfig(button){
    apikey = document.getElementById("apikey").value;//密钥 为空则用Gemini3
  
    //使用 filter 方法直接筛选选中的工具
    toolList = toolNames.filter(toolName => 
        document.getElementById(toolName)?.checked
    );

    saveCacheData();//保存缓存
    button.disabled = true;

    //设置工具模块
    await setTool();

    button.disabled = false;
}


//发送对话文本
async function llmChat(input, enableThinking) {
  data = {
    'input':input,
    'thinking':enableThinking
  }
  return await sendMessage("llmChat", data);
}

//大语言模型
function llm(){
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // 添加消息到聊天界面
    function addMessage(role, content) {
        // const messageDiv = document.createElement('div');
        // messageDiv.className = role + '-message';
        // messageDiv.textContent = content;
        // chatContainer.appendChild(messageDiv);
        // chatContainer.scrollTop = chatContainer.scrollHeight;
        const messageDiv = document.createElement('div');
        messageDiv.className = role + '-message';
        
        if (role === 'bot') {
            // 如果是机器人，解析 Markdown
            try {
                // 配置 marked 使用 highlight.js
                marked.setOptions({
                    highlight: function(code, lang) {
                        const language = highlight.getLanguage(lang) ? lang : 'plaintext';
                        return hljs.highlight(code, { language }).value;
                    },
                    langPrefix: 'hljs language-'
                });
                messageDiv.innerHTML = marked.parse(content);
            } catch (e) {
                // 如果解析出错，回退到纯文本
                console.error("Markdown parse error:", e);
                messageDiv.textContent = content;
            }
        } else {
            // 用户消息通常保持纯文本，防止 XSS，或者也可以解析
            messageDiv.textContent = content; 
        }

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // 处理用户发送消息
    async function handleUserMessage() {
      const message = userInput.value.trim();
      if (!message) 
        return;
      
      addMessage('user', message);
      userInput.value = '';
      
      // 显示正在思考的提示
      const thinkingDiv = document.createElement('div');
      thinkingDiv.textContent = '思考中...';
      thinkingDiv.className = 'bot-message';
      sendButton.disabled = true;
      document.getElementById('clear-button').disabled = sendButton.disabled;
      chatContainer.appendChild(thinkingDiv);
      const enableThinking = document.getElementById('thinking').checked
      //与AI对话并获取响应
      enableRecording = false;
      let botResponse = await llmChat(message, enableThinking);
      enableRecording = true;
      
      // 移除"思考中"提示，添加实际响应
      chatContainer.removeChild(thinkingDiv);
      sendButton.disabled = false;
      document.getElementById('clear-button').disabled = sendButton.disabled;
      addMessage('bot', botResponse);
    }
    
    // 事件监听
    sendButton.addEventListener('click', handleUserMessage);

    // 防止 IME（中文输入法）在拼写时误触
    let composing = false;
    userInput.addEventListener('compositionstart', () => composing = true);
    userInput.addEventListener('compositionend', () => composing = false);
    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        // 如果正在输入法合成阶段，什么也不做，等待 compositionend
        if (composing) return;

        if (e.ctrlKey || e.shiftKey) {
          // 插入换行（在光标当前位置），并保持光标在新行
          e.preventDefault();
          const start = this.selectionStart;
          const end = this.selectionEnd;
          const value = this.value;
          this.value = value.slice(0, start) + '\n' + value.slice(end);
          const newPos = start + 1;
          this.selectionStart = this.selectionEnd = newPos;
          // 可选：保持滚动位置
          // this.scrollTop = this.scrollTop;
        } else {
          // 单按 Enter -> 提交（调用你现有的 handleUserMessage）
          e.preventDefault();
          handleUserMessage();
        }
      }
    });
}


// 语音识别功能
let enableRecording = true;
let recording = false;//标识是否正在识别
function setupVoiceRecognition() {
  // 获取浏览器的语音识别构造函数
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    logMessage("语音识别初始化失败");
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';           // 设置识别语言为中文
    recognition.continuous = false;        // 连续识别
    recognition.interimResults = true;    // 返回中间结果

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let userInput = document.getElementById('user-input');
      let sendButton = document.getElementById('send-button');

      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          userInput.value = finalTranscript;
          sendButton.click();//发送
          finalTranscript = '';

          recording = false;//标识录制结束
        } 
        else {
          interimTranscript += transcript;
          userInput.value = interimTranscript;
        }
      }
    };

    recognition.onerror = (event) => {
      logMessage("识别错误:", event.error);
      recording = false;//标识录制结束
    };

    recognition.onend = () => {
      logMessage("语音识别结束");
      recording = false;//标识录制结束
    };

    // 绑定复选框事件
    input_voice_event(recognition);
  }
}

function sleep(millisecond){
  return new Promise(resolve => {setTimeout(() => {resolve()}, millisecond)});
}

//开始录制提示音
function playStartSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, context.currentTime);
    gainNode.gain.setValueAtTime(0.5, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
}

//语音输入事件
function input_voice_event(recognition){
    const input_voice = document.getElementById('input_voice') 
    input_voice.addEventListener('change', async () => {
        if(!input_voice.checked){
            recognition.stop();
            return ;
        }
    
        while(input_voice.checked){
            if(enableRecording){
                playStartSound();
                recording = true;
                recognition.start();
            }
            
            do{
                await sleep(1000);
            }while(recording);
        }
    });
}

//显示密码
function showPassword(elementId) {
    const input = document.getElementById(elementId);
    input.type = (input.type === "password") ? "text" : "password";
}

//添加工具复选框事件
function check_tools_event(){
    toolNames.filter(toolName =>{
      
        let checkbox = document.getElementById(toolName);
        checkbox.addEventListener('change', function() {
            const startBtn = document.getElementById('startService');
            saveConfig(startBtn);
        });
    });
}

document.addEventListener('DOMContentLoaded', function(event) {
    initWebSocket();
    llm();
    setupVoiceRecognition();
    
    //配置数据缓存
    loadCacheData();

    check_tools_event();
});