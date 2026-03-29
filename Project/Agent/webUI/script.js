//https://www.mimitool.com/javascript-obfuscator
let ws;
let wsPort = 8016;
let endpoint = '';
let modelType = '';
let apikey = '';
let toolList = [];
let toolNames = [
    "WinBaseTool", "WinWindowsTool", "WinMouseTool", "WinKeyboardTool", "WinImageColorTool", "WinAiTool", "WinElementTool", "WinClipboardTool", "WinProcessTool", "WinDownLoadTool", "WinExcelTool", "WinOtherTool",
    "WebBaseTool", "WebElementTool", "WebMouseTool", "WebKeyboardTool", "WebEmulationTool", "WebDownLoadTool", "WebCookieTool", "WebWindowsTool", "WebScreenshotTool", "WebAlertTool", "WebNavigateTool", "WebOtherTool",
    "AndroidBaseTool", "AndroidImageColorTool", "AndroidTouchTool", "AndroidKeyboardTool", "AndroidNavigateTool", "AndroidAITool", "AndroidElementTool", "AndroidFileTool", "AndroidDownloadTool", "AndroidClipboardTool", "AndroidToastTool", "AndroidHidTool", "AndroidActivityTool", "AndroidPackageTool", "AndroidOtherTool",
    "AiBaseTool", "AiboteCoder", "AiKnowledge", "GenerateHumanVideoEx_Service", "AiWebSearch", "AiVision", "AiGenerate", "SystemAgent", "AdbAgent", "AutoTask", "ExtendTool", "McpTool","SkillTool"
];

const CONFIG_MAP = {
    endpoint: "endpoint", modelType: "modelType", apikey: "apikey",
    tools: toolNames.reduce((acc, name) => { acc[name] = name; return acc; }, {})
};

async function sleep(ms) { await new Promise(resolve => setTimeout(resolve, ms)); }

function logMessage(message, obj) {
  const logArea = document.getElementById("log");
  const text = obj ? `${message} ${JSON.stringify(obj)}` : message;
  logArea.value += `[${new Date().toLocaleTimeString()}] ${text}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

// 移动端日志栏折叠切换
function toggleLog() {
  const footer = document.getElementById('logFooter');
  footer.classList.toggle('collapsed');
}

const pendingMap = new Map();
function sendAndWait(ws, payload, timeout) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random()}`;
    pendingMap.set(requestId, { resolve, reject });
    ws.send(JSON.stringify({ requestId, payload }));
    if(timeout > 0){
      setTimeout(() => {
        if (pendingMap.has(requestId)) { resolve(null); pendingMap.delete(requestId); }
      }, timeout);
    }
  });
}

async function getCredits() { return await sendMessage("getCredits", {}); }

async function refreshCredits() {
  const icon = document.getElementById('refreshIcon');
  const text = document.getElementById('userCredits');
  if (icon.classList.contains('rotating')) return;
  icon.classList.add('rotating');
  text.style.opacity = "0.5";
  icon.addEventListener('animationend', () => icon.classList.remove('rotating'), { once: true });
  try { text.innerText = await getCredits(); } 
  catch (error) { console.error("获取积分失败", error); } 
  finally { text.style.opacity = "1"; }
}

async function getWindowsId() {
  const response = await sendMessage("getWindowsId", {});
  document.getElementById('userId').textContent = "ID：" + response; // 移动端缩短文案
}

function initWebSocket() {
    let hostname =  window.location.hostname;
    if(hostname == ''|| hostname === 'localhost')
      hostname = "127.0.0.1"

    // 检测是否为 IPv6 地址（判断是否包含冒号且未被中括号包裹）
    let formattedHost = hostname;
    if (hostname.includes(':') && !hostname.startsWith('[')) {
        formattedHost = `[${hostname}]`;
    }

    //ws = new WebSocket(`ws://${hostname}:${wsPort}`);
    ws = new WebSocket(`ws://${formattedHost}:${wsPort}`);
    ws.onopen = async () => {
      await getWindowsId();
      await refreshCredits();
      await showExtendList();
      await showMcpList();
      await showSkillsList();
      await allTools();
      await setTool();
      document.getElementById('startService').disabled = false;
    }
    ws.onclose = () => logMessage("连接已关闭");
    ws.onerror = (error) => logMessage("错误", error);
    ws.addEventListener("message", (event) => {
      const index = event.data.indexOf("_");
      if(index == -1){ logMessage(event.data); return; }
      const requestId = event.data.slice(0, index); 
      const payload = event.data.slice(index + 1);  
      if (pendingMap.has(requestId)) {
        pendingMap.get(requestId).resolve(payload);
        pendingMap.delete(requestId);
      }
    });
    ws.addEventListener("error", (err) => {
      for (const { reject } of pendingMap.values()) reject(err);
      pendingMap.clear();
    });
}

async function sendMessage(command, data, timeout = 0) {
  let response = "AiDriver 未连接";
  data["cmd"] = command;
  if (ws && ws.readyState === WebSocket.OPEN) response = await sendAndWait(ws, data, timeout); 
  else logMessage("AiDriver 未连接");
  return response;
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}

function saveCacheData() {
  const data = {};
  ["endpoint", "modelType", "apikey"].forEach(name => {
      const el = document.getElementById(name);
      if (el) data[name] = el.value;
  });
  Object.keys(CONFIG_MAP.tools).forEach(key => {
      const el = document.getElementById(key);
      if (el) data[key] = el.checked;
  });
  localStorage.setItem("formData", JSON.stringify(data));
}

function updateCardHeaderState(card) {
    const hasChecked = card.querySelectorAll('.card-body input[type="checkbox"]:checked').length > 0;
    if (hasChecked) card.classList.add('has-selection');
    else card.classList.remove('has-selection');
}

function updateAllCardHeaderStates() {
    document.querySelectorAll('.config-card').forEach(updateCardHeaderState);
}

function loadCacheData() {
  const data = localStorage.getItem("formData");
  if (!data) return;
  try {
    const parsed = JSON.parse(data);
    ["endpoint", "modelType", "apikey"].forEach(name => {      
        const el = document.getElementById(name);
        if (el && parsed[name] !== undefined) {
            el.value = parsed[name];
            if(name === 'apikey') apikey = parsed[name];
            if(name === 'endpoint') endpoint = parsed[name];
            if(name === 'modelType') modelType = parsed[name];
        }
    });
    Object.keys(CONFIG_MAP.tools).forEach(key => {
        const el = document.getElementById(key);
        if (el && parsed[key] !== undefined) el.checked = parsed[key];
    });
    updateAllCardHeaderStates();
    toolList = toolNames.filter(name => document.getElementById(name)?.checked);

    syncAllSelectStates();
  } catch (e) { console.warn("缓存数据解析失败:", e); }
}

async function stopLlm() {
    let response = await sendMessage("stopLlm", {});
    logMessage("中断执行:", response);
}

async function clearMessage() {
  const chatContainer = document.getElementById('chat-container');
  chatContainer.innerHTML = '';
  const introMessage = document.createElement('div');
  introMessage.className = 'bot-message intro-message';
  introMessage.textContent = '👋 你好！我是 Aibote 智能助手。请配置好工具后开始与我对话。';
  chatContainer.appendChild(introMessage);
  let response = await sendMessage("clearMessage", {});
  logMessage("清除上下文:", response);
}

async function showExtendList() {
  let response = await sendMessage("showExtendList", {});
  let extendInfo = { titles: [], descriptions: [] };
  try { if (response) extendInfo = JSON.parse(response); } catch (e) { return response; }
  const { titles, descriptions } = extendInfo;
  const container = document.getElementById("ExtendTool")?.closest('.tools-grid-layout');
  if (!container) return response;
  
  container.innerHTML = "";
  container.style.gridTemplateColumns = ""; 

  if (titles && titles.length > 0) {
      titles.forEach((name, index) => {
          const desc = descriptions?.[index] || "暂无描述";
          const id = `ExtendTool_${index}`;
          container.insertAdjacentHTML('beforeend', `
            <label class="checkbox-card">
              <input type="checkbox" id="${id}">
              <div class="check-content"><span class="check-title">${name}</span><span class="check-desc">${desc}</span></div>
            </label>
          `);
          if (!toolNames.includes(id)) { toolNames.push(id); CONFIG_MAP.tools[id] = id; }
          document.getElementById(id).addEventListener('change', () => {
              saveConfig(document.getElementById('startService'));
              updateAllCardSelectionStates();
          });
      });
      loadCacheData();
  } else {
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">未检测到扩展插件</div>`;
  }
  return response;
}

async function showMcpList() {
  let response = await sendMessage("showMcpList", {});
  let mcpInfo = { titles: [], descriptions: [] };
  try { if (response) mcpInfo = JSON.parse(response); } catch (e) { return response; }
  const { titles, descriptions } = mcpInfo;
  const container = document.getElementById("McpTool")?.closest('.tools-grid-layout');
  if (!container) return response;
  
  container.innerHTML = "";
  container.style.gridTemplateColumns = ""; 

  if (titles && titles.length > 0) {
      titles.forEach((name, index) => {
          const desc = descriptions?.[index] || "暂无描述";
          const id = `McpTool_${index}`;
          container.insertAdjacentHTML('beforeend', `
            <label class="checkbox-card">
              <input type="checkbox" id="${id}">
              <div class="check-content"><span class="check-title">${name}</span><span class="check-desc">${desc}</span></div>
            </label>
          `);
          if (!toolNames.includes(id)) { toolNames.push(id); CONFIG_MAP.tools[id] = id; }
          document.getElementById(id).addEventListener('change', () => {
              saveConfig(document.getElementById('startService'));
              updateAllCardSelectionStates();
          });
      });
      loadCacheData();
  } else {
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">未检测到 MCP 服务</div>`;
  }
  return response;
}

async function showSkillsList() {
    let response = await sendMessage("showSkillsList", {});
    let skillInfo = { titles: [], descriptions: [] };
    try { 
        if (response) 
            skillInfo = JSON.parse(response); 
        } catch (e) { 
            return response; 
        }
    const { titles, descriptions } = skillInfo;
    const container = document.getElementById("SkillTool")?.closest('.tools-grid-layout');
    if (!container) return response;

    container.innerHTML = "";
    container.style.gridTemplateColumns = ""; 

    if (titles && titles.length > 0) {
        titles.forEach((name, index) => {
            const desc = descriptions?.[index] || "暂无描述";
            const id = `SkillTool_${index}`;
            container.insertAdjacentHTML('beforeend', `
            <label class="checkbox-card">
                <input type="checkbox" id="${id}">
                <div class="check-content"><span class="check-title">${name}</span><span class="check-desc">${desc}</span></div>
            </label>
            `);
            if (!toolNames.includes(id)) { toolNames.push(id); CONFIG_MAP.tools[id] = id; }
            document.getElementById(id).addEventListener('change', () => {
                saveConfig(document.getElementById('startService'));
                updateAllCardSelectionStates();
            });
        });
        loadCacheData();
    } else {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">未检测到技能模块</div>`;
    }
    return response;
}

async function setTool() {
    await sendMessage("setTool", { toolList, endpoint, modelType, apikey });
}

//获取所有工具
async function allTools() {
  const toolList = toolNames.filter(name => document.getElementById(name));
  await sendMessage("allTools", { toolList});
}

async function saveConfig(button){
    endpoint = document.getElementById("endpoint").value;
    modelType = document.getElementById("modelType").value;
    apikey = document.getElementById("apikey").value;
    toolList = toolNames.filter(name => document.getElementById(name)?.checked);
    saveCacheData();
    button.disabled = true;
    await setTool();
    button.disabled = false;
}

async function llmChat(input, enableThinking) {
  return await sendMessage("llmChat", { 'input':input, 'thinking':enableThinking });
}

function llm(){
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = role + '-message';
        if (role === 'bot') {
            try {
                marked.setOptions({
                highlight: function(code, lang) {
                    const language = (typeof hljs !== 'undefined' && hljs.getLanguage(lang)) ? lang : 'plaintext';
                    return typeof hljs !== 'undefined' ? hljs.highlight(code, { language }).value : code;
                },
                breaks: true,
                gfm: true
            });
            messageDiv.innerHTML = marked.parse(content);
            } catch (e) { 
              console.error("MD解析出错:", e);
              // 失败时至少保留基本的换行显示
              messageDiv.style.whiteSpace = 'pre-wrap';
              messageDiv.textContent = content;
            }
        } else {
            messageDiv.textContent = content; 
        }
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 在 llm() 函数内部找到 handleUserMessage 并替换
  async function handleUserMessage() {
      let message = userInput.value.trim();
      // 如果没文字也没文件，则不发送
      if (!message && pendingFiles.length === 0) return;

      // 1. 禁用 UI
      sendButton.disabled = true;
      document.getElementById('clear-button').disabled = true;

      // 2. 显示上传状态 (如果有文件)
      if (pendingFiles.length > 0) {
          const uploadMsg = document.createElement('div');
          uploadMsg.className = 'bot-message';
          uploadMsg.textContent = `正在上传 ${pendingFiles.length} 个文件...`;
          chatContainer.appendChild(uploadMsg);
          
          let fileList = [];
          // 依次上传所有文件
          for (const file of pendingFiles){
              if(await executeUpload(file))
                fileList.push(`uploads\\${file.name}`);
          }
        
          message = `<file_paths>\n${fileList.join('\n')}\n</file_paths>\n\n` + message;
          console.log(message);
          
          // 清空队列和预览
          pendingFiles = [];
          renderFilePreviews();
          chatContainer.removeChild(uploadMsg);
      }

      // 3. 显示用户消息
      addMessage('user', message || "[发送了文件]");
      userInput.value = '';
      
      // 4. 显示思考中
      const thinkingDiv = document.createElement('div');
      thinkingDiv.textContent = '思考中...';
      thinkingDiv.className = 'bot-message';
      chatContainer.appendChild(thinkingDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      // 5. 调用 LLM
      enableRecording = false;
      let botResponse = await llmChat(message, document.getElementById('thinking').checked);
      enableRecording = true;
      
      // 6. 恢复 UI
      chatContainer.removeChild(thinkingDiv);
      sendButton.disabled = false;
      document.getElementById('clear-button').disabled = false;
      addMessage('bot', botResponse);
  }
    
    sendButton.addEventListener('click', handleUserMessage);

    let composing = false;
    userInput.addEventListener('compositionstart', () => composing = true);
    userInput.addEventListener('compositionend', () => composing = false);
    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (composing) return;
        if (e.ctrlKey || e.shiftKey) {
          e.preventDefault();
          const start = this.selectionStart;
          const end = this.selectionEnd;
          this.value = this.value.slice(0, start) + '\n' + this.value.slice(end);
          this.selectionStart = this.selectionEnd = start + 1;
        } else {
          e.preventDefault();
          handleUserMessage();
        }
      }
    });
}

let enableRecording = true;
let recording = false;
function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input_voice = document.getElementById('input_voice');
  
  if (!SpeechRecognition) {
    logMessage("当前浏览器不支持语音识别");
    input_voice.disabled = true;
    return;
  } 
  
  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = true;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let userInput = document.getElementById('user-input');
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        userInput.value = finalTranscript;
        document.getElementById('send-button').click();
        finalTranscript = '';
        recording = false;
      } else {
        interimTranscript += transcript;
        userInput.value = interimTranscript;
      }
    }
  };

  recognition.onerror = (event) => { logMessage("识别错误:", event.error); recording = false; };
  recognition.onend = () => { recording = false; };

  input_voice.addEventListener('change', async () => {
      if(!input_voice.checked){ recognition.stop(); return; }
      while(input_voice.checked){
          if(enableRecording){
              playStartSound();
              recording = true;
              try { recognition.start(); } catch(e) {} // 防止重复 start 报错
          }
          do{ await sleep(1000); } while(recording);
      }
  });
}

function playStartSound() {
    try {
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
    } catch(e) {}
}

function showPassword(elementId) {
    const input = document.getElementById(elementId);
    input.type = (input.type === "password") ? "text" : "password";
}

// 优化：修复了原代码中 filter 不执行内部逻辑的 BUG，改为 forEach
function check_tools_event() {
    toolNames.forEach(toolName => {
        const element = document.getElementById(toolName);
        if (element) {
            element.addEventListener('change', function() {
                saveConfig(document.getElementById('startService'));
                updateAllCardSelectionStates();
            });
        }
    });
}

function initCollapsibleCards() {
  document.querySelectorAll('.config-card .card-header').forEach(header => {
      header.addEventListener('click', () => {
        
          //防止点击候选复选框，触发 其他事件
          const selectAllArea = header.querySelector('.module-load-label');
          if (selectAllArea) {
              selectAllArea.addEventListener('click', (e) => {
                  e.stopPropagation();               // 阻止事件冒泡，这样点击这里时，header 的点击事件就不会被触发
              });
          }

          header.parentElement.classList.toggle('collapsed');
          saveCollapseStatus();
      });
  });
  updateAllCardSelectionStates();
}

function updateAllCardSelectionStates() {
  document.querySelectorAll('.config-card').forEach(card => {
    const isAnyChecked = Array.from(card.querySelectorAll('.card-body input[type="checkbox"]')).some(cb => cb.checked);
    if (isAnyChecked) card.classList.add('has-selection');
    else card.classList.remove('has-selection');
  });
}

function saveCollapseStatus() {
  const status = {};
  document.querySelectorAll('.config-card').forEach((card, index) => {
      status[index] = card.classList.contains('collapsed');
  });
  localStorage.setItem('cardCollapseStatus', JSON.stringify(status));
}


function applyCollapseStatus() {
  const rawStatus = localStorage.getItem('cardCollapseStatus');
  const cards = document.querySelectorAll('.config-card');

  if (rawStatus === null) {
    // 情况 1：第一次打开（无缓存）
    cards.forEach((card, index) => {
      if (index === 0) 
        card.classList.remove('collapsed');// 第一个模块（大模型配置）保持展开
      else 
        card.classList.add('collapsed');// 其余所有模块默认折叠
    });
  } else {
    // 情况 2：已有缓存，按用户上次的操作习惯恢复
    try {
      const status = JSON.parse(rawStatus);
      cards.forEach((card, index) => {
        if (status[index] === true) 
          card.classList.add('collapsed');
        else 
          card.classList.remove('collapsed');
      });
    } catch (e) {
      // 容错处理：如果解析失败，回退到默认逻辑
      cards.forEach((card, index) => {
        if (index !== 0) card.classList.add('collapsed');
      });
    }
  }
  
  // 移动端额外逻辑：默认折叠日志栏
  if (window.innerWidth <= 768) {
    const logFooter = document.getElementById('logFooter');
    if (logFooter) logFooter.classList.add('collapsed');
  }
}


//上传文件处理
let pendingFiles = []; // 存储待上传的 File 对象

const inputArea = document.querySelector('.input-area');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('file-previews');

//禁止拖拽文件时打开文件
window.addEventListener('dragover', (e) => {
    e.preventDefault();
}, false);
window.addEventListener('drop', (e) => {
    e.preventDefault();
}, false);


// 拖拽进入/悬停时添加高亮样式
['dragenter', 'dragover'].forEach(eventName => {
    inputArea.addEventListener(eventName, () => {
        inputArea.classList.add('drag-active');
    }, false);
});

// 拖拽离开或松开时移除高亮样式
['dragleave', 'drop'].forEach(eventName => {
    inputArea.addEventListener(eventName, () => {
        inputArea.classList.remove('drag-active');
    }, false);
});


// 处理选择文件
fileInput.addEventListener('change', (e) => {
    addFilesToQueue(e.target.files);
    fileInput.value = ''; // 清空 input 以便重复选择同名文件
});

// 拖拽逻辑保持不变，但修改 drop 处理
inputArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    addFilesToQueue(dt.files);
});

// 将文件加入队列
function addFilesToQueue(files) {
    const fileArray = [...files];
    pendingFiles = [...pendingFiles, ...fileArray];
    renderFilePreviews();
}

// 渲染预览界面
function renderFilePreviews() {
    previewContainer.innerHTML = '';
    pendingFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        item.innerHTML = `
            <span class="file-preview-name" title="${file.name}">${file.name}</span>
            <span class="file-remove-btn" onclick="removePendingFile(${index})">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </span>
        `;
        previewContainer.appendChild(item);
    });
}

// 删除某个待传文件
function removePendingFile(index) {
    pendingFiles.splice(index, 1);
    renderFilePreviews();
}

// 真正的上传函数 (改为内部调用)
async function executeUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        if (response.ok) {
            const result = await response.json();
            logMessage(`上传成功: ${result.name}`);
            return true;
        }
    } catch (error) {
        logMessage(`上传错误: ${file.name}`, error);
    }
    return false;
}


// =========================================
// 全选与半选逻辑模块
// =========================================

function initSelectAllLogic() {
    document.querySelectorAll('.config-card').forEach(card => {
        const selectAllBtn = card.querySelector('.module-loader');
        const cardBody = card.querySelector('.card-body');
        
        // 如果该模块没有全选按钮或容器，则跳过
        if (!selectAllBtn || !cardBody) return;

        // 1. 定义核心状态更新函数，附加到 card 对象上方便全局调用
        card.updateSelectAll = function() {
            const checkboxes = cardBody.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length === 0) return;
            
            const total = checkboxes.length;
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

            if (checkedCount === total) {
                // 全部选中
                selectAllBtn.checked = true;
                selectAllBtn.indeterminate = false; 
            } else if (checkedCount === 0) {
                // 全没选中
                selectAllBtn.checked = false;
                selectAllBtn.indeterminate = false; 
            } else {
                // 部分选中：设置 checked 为 false，并开启半选 (横杠) 状态
                selectAllBtn.checked = false;
                selectAllBtn.indeterminate = true;  
            }
        };

        // 2. 监听 "全选" 按钮的点击事件
        selectAllBtn.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const checkboxes = cardBody.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(cb => {
                if (cb.checked !== isChecked) {
                    cb.checked = isChecked;
                    // 主动派发 change 事件，以触发你原有的 saveConfig 和蓝底高亮逻辑
                    cb.dispatchEvent(new Event('change'));
                }
            });
            card.updateSelectAll();
        });

        // 3. 监听模块内部所有子复选框的点击事件 (使用事件委托)
        cardBody.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                card.updateSelectAll();
            }
        });
    });
}

// 供全局调用的同步函数，用于在缓存读取或动态渲染后刷新UI
function syncAllSelectStates() {
    document.querySelectorAll('.config-card').forEach(card => {
        if (typeof card.updateSelectAll === 'function') {
            card.updateSelectAll();
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    initWebSocket();
    llm();
    setupVoiceRecognition();

    //初始化全选事件监听
    initSelectAllLogic();

    loadCacheData();
    check_tools_event();
    initCollapsibleCards();
    applyCollapseStatus();
});