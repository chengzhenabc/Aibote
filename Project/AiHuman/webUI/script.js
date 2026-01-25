//https://www.mimitool.com/javascript-obfuscator
let ws;
let audioParam = {appid: '', token: '', cluster: '', spkId: '' ,speed_ratio: ''};
let llmParam = {llm_appid: '', apikey: ''};
let asrParam = {accessKeyId: '', accessKeySecret: '', appKey: ''};
let humanParam = {modelFolder: '', scale: '', figureVideoPath: '', bgPath: '', pushStream: '', isPalyMediaAudio : '', is_blur_mouth : ''};
let isStartHuman = false;
const voices = `
      <option value="zh_male_beijingxiaoye_emo_v2_mars_bigtts">北京小爷（多情感）</option>
      <option value="zh_female_roumeinvyou_emo_v2_mars_bigtts">柔美女友（多情感）</option>
      <option value="zh_male_yangguangqingnian_emo_v2_mars_bigtts">阳光青年（多情感）</option>
      <option value="zh_female_meilinvyou_emo_v2_mars_bigtts">魅力女友（多情感）</option>
      <option value="zh_female_shuangkuaisisi_emo_v2_mars_bigtts">爽快思思（多情感）</option>
      <option value="zh_female_cancan_mars_bigtts">灿灿/Shiny（通用场景）</option>
      <option value="zh_female_qingxinnvsheng_mars_bigtts">清新女声（通用场景）</option>
      <option value="zh_female_shuangkuaisisi_moon_bigtts">爽快思思/Skye（通用场景）</option>
      <option value="zh_male_wennuanahu_moon_bigtts">温暖阿虎/Alvin（通用场景）</option>
      <option value="zh_male_shaonianzixin_moon_bigtts">少年梓辛/Brayan（通用场景）</option>
      <option value="zh_female_zhixingnvsheng_mars_bigtts">知性女声（通用场景）</option>
      <option value="zh_male_qingshuangnanda_mars_bigtts">清爽男大（通用场景）</option>
      <option value="zh_female_linjianvhai_moon_bigtts">邻家女孩（通用场景）</option>
      <option value="zh_male_yuanboxiaoshu_moon_bigtts">渊博小叔（通用场景）</option>
      <option value="zh_male_yangguangqingnian_moon_bigtts">阳光青年（通用场景）</option>
      <option value="zh_female_tianmeixiaoyuan_moon_bigtts">甜美小源（通用场景）</option>
      <option value="zh_female_qingchezizi_moon_bigtts">清澈梓梓（通用场景）</option>
      <option value="zh_male_jieshuoxiaoming_moon_bigtts">解说小明（通用场景）</option>
      <option value="zh_female_kailangjiejie_moon_bigtts">开朗姐姐（通用场景）</option>
      <option value="zh_male_linjiananhai_moon_bigtts">邻家男孩（通用场景）</option>
      <option value="zh_female_tianmeiyueyue_moon_bigtts">甜美悦悦（通用场景）</option>
      <option value="zh_female_xinlingjitang_moon_bigtts">心灵鸡汤（通用场景）</option>
      <option value="ICL_zh_female_zhixingwenwan_tob">知性温婉（通用场景）</option>
      <option value="ICL_zh_male_nuanxintitie_tob">暖心体贴（通用场景）</option>
      <option value="ICL_zh_female_wenrouwenya_tob">温柔文雅（通用场景）</option>
      <option value="ICL_zh_male_kailangqingkuai_tob">开朗轻快（通用场景）</option>
      <option value="ICL_zh_male_huoposhuanglang_tob">活泼爽朗（通用场景）</option>
      <option value="ICL_zh_male_shuaizhenxiaohuo_tob">率真小伙（通用场景）</option>
      <option value="zh_male_wenrouxiaoge_mars_bigtts">温柔小哥（通用场景）</option>
      <option value="zh_male_jingqiangkanye_moon_bigtts">京腔侃爷/Harmony（趣味口音）</option>
      <option value="zh_female_wanwanxiaohe_moon_bigtts">湾湾小何（趣味口音）</option>
      <option value="zh_female_wanqudashu_moon_bigtts">湾区大叔（趣味口音）</option>
      <option value="zh_female_daimengchuanmei_moon_bigtts">呆萌川妹（趣味口音）</option>
      <option value="zh_male_guozhoudege_moon_bigtts">广州德哥（趣味口音）</option>
      <option value="zh_male_beijingxiaoye_moon_bigtts">北京小爷（趣味口音）</option>
      <option value="zh_male_haoyuxiaoge_moon_bigtts">浩宇小哥（趣味口音）</option>
      <option value="zh_male_guangxiyuanzhou_moon_bigtts">广西远舟（趣味口音）</option>
      <option value="zh_female_meituojieer_moon_bigtts">妹坨洁儿（趣味口音）</option>
      <option value="zh_male_yuzhouzixuan_moon_bigtts">豫州子轩（趣味口音）</option>
      <option value="zh_male_naiqimengwa_mars_bigtts">奶气萌娃（角色扮演）</option>
      <option value="zh_female_popo_mars_bigtts">婆婆（角色扮演）</option>
      <option value="zh_female_gaolengyujie_moon_bigtts">高冷御姐（角色扮演）</option>
      <option value="zh_male_aojiaobazong_moon_bigtts">傲娇霸总（角色扮演）</option>
      <option value="zh_female_meilinvyou_moon_bigtts">魅力女友（角色扮演）</option>
      <option value="zh_male_shenyeboke_moon_bigtts">深夜播客（角色扮演）</option>
      <option value="zh_female_sajiaonvyou_moon_bigtts">柔美女友（角色扮演）</option>
      <option value="zh_female_yuanqinvyou_moon_bigtts">撒娇学妹（角色扮演）</option>
      <option value="ICL_zh_female_bingruoshaonv_tob">病弱少女（角色扮演）</option>
      <option value="ICL_zh_female_huoponvhai_tob">活泼女孩（角色扮演）</option>
      <option value="zh_male_dongfanghaoran_moon_bigtts">东方浩然（角色扮演）</option>
      <option value="ICL_zh_male_lvchaxiaoge_tob">绿茶小哥（角色扮演）</option>
      <option value="ICL_zh_female_jiaoruoluoli_tob">娇弱萝莉（角色扮演）</option>
      <option value="ICL_zh_male_lengdanshuli_tob">冷淡疏离（角色扮演）</option>
      <option value="ICL_zh_male_hanhoudunshi_tob">憨厚敦实（角色扮演）</option>
      <option value="ICL_zh_male_aiqilingren_tob">傲气凌人（角色扮演）</option>
      <option value="ICL_zh_female_huopodiaoman_tob">活泼刁蛮（角色扮演）</option>
      <option value="ICL_zh_male_guzhibingjiao_tob">固执病娇（角色扮演）</option>
      <option value="ICL_zh_male_sajiaonianren_tob">撒娇粘人（角色扮演）</option>
      <option value="ICL_zh_female_aomanjiaosheng_tob">傲慢娇声（角色扮演）</option>
      <option value="ICL_zh_male_xiaosasuixing_tob">潇洒随性（角色扮演）</option>
      <option value="ICL_zh_male_fuheigongzi_tob">腹黑公子（角色扮演）</option>
      <option value="ICL_zh_male_guiyishenmi_tob">诡异神秘（角色扮演）</option>
      <option value="ICL_zh_male_ruyacaijun_tob">儒雅才俊（角色扮演）</option>
      <option value="ICL_zh_male_bingjiaobailian_tob">病娇白莲（角色扮演）</option>
      <option value="ICL_zh_male_zhengzhiqingnian_tob">正直青年（角色扮演）</option>
      <option value="ICL_zh_female_jiaohannvwang_tob">娇憨女王（角色扮演）</option>
      <option value="ICL_zh_female_bingjiaomengmei_tob">病娇萌妹（角色扮演）</option>
      <option value="ICL_zh_male_qingsenaigou_tob">青涩小生（角色扮演）</option>
      <option value="ICL_zh_male_chunzhenxuedi_tob">纯真学弟（角色扮演）</option>
      <option value="ICL_zh_female_nuanxinxuejie_tob">暖心学姐（角色扮演）</option>
      <option value="ICL_zh_female_keainvsheng_tob">可爱女生（角色扮演）</option>
      <option value="ICL_zh_female_chengshujiejie_tob">成熟姐姐（角色扮演）</option>
      <option value="ICL_zh_female_bingjiaojiejie_tob">病娇姐姐（角色扮演）</option>
      <option value="ICL_zh_male_youroubangzhu_tob">优柔帮主（角色扮演）</option>
      <option value="ICL_zh_male_yourougongzi_tob">优柔公子（角色扮演）</option>
      <option value="ICL_zh_female_wumeiyujie_tob">妩媚御姐（角色扮演）</option>
      <option value="ICL_zh_female_tiaopigongzhu_tob">调皮公主（角色扮演）</option>
      <option value="ICL_zh_female_aojiaonvyou_tob">傲娇女友（角色扮演）</option>
      <option value="ICL_zh_male_tiexinnanyou_tob">贴心男友（角色扮演）</option>
      <option value="ICL_zh_male_shaonianjiangjun_tob">少年将军（角色扮演）</option>
      <option value="ICL_zh_female_tiexinnvyou_tob">贴心女友（角色扮演）</option>
      <option value="ICL_zh_male_bingjiaogege_tob">病娇哥哥（角色扮演）</option>
      <option value="ICL_zh_male_xuebanantongzhuo_tob">学霸男同桌（角色扮演）</option>
      <option value="ICL_zh_male_youmoshushu_tob">幽默叔叔（角色扮演）</option>
      <option value="ICL_zh_female_xingganyujie_tob">性感御姐（角色扮演）</option>
      <option value="ICL_zh_female_jiaxiaozi_tob">假小子（角色扮演）</option>
      <option value="ICL_zh_male_lengjunshangsi_tob">冷峻上司（角色扮演）</option>
      <option value="ICL_zh_male_wenrounantongzhuo_tob">温柔男同桌（角色扮演）</option>
      <option value="ICL_zh_male_bingjiaodidi_tob">病娇弟弟（角色扮演）</option>
      <option value="ICL_zh_male_youmodaye_tob">幽默大爷（角色扮演）</option>
      <option value="ICL_zh_male_aomanshaoye_tob">傲慢少爷（角色扮演）</option>
      <option value="ICL_zh_male_shenmifashi_tob">神秘法师（角色扮演）</option>
      <option value="ICL_zh_female_heainainai_tob">和蔼奶奶（视频配音）</option>
      <option value="ICL_zh_female_linjuayi_tob">邻居阿姨（视频配音）</option>
      <option value="zh_female_wenrouxiaoya_moon_bigtts">温柔小雅（视频配音）</option>
      <option value="zh_male_tiancaitongsheng_mars_bigtts">天才童声（视频配音）</option>
      <option value="zh_male_sunwukong_mars_bigtts">猴哥（视频配音）</option>
      <option value="zh_male_xionger_mars_bigtts">熊二（视频配音）</option>
      <option value="zh_female_peiqi_mars_bigtts">佩奇猪（视频配音）</option>
      <option value="zh_female_wuzetian_mars_bigtts">武则天（视频配音）</option>
      <option value="zh_female_gujie_mars_bigtts">顾姐（视频配音）</option>
      <option value="zh_female_yingtaowanzi_mars_bigtts">樱桃丸子（视频配音）</option>
      <option value="zh_male_chunhui_mars_bigtts">广告解说（视频配音）</option>
      <option value="zh_female_shaoergushi_mars_bigtts">少儿故事（视频配音）</option>
      <option value="zh_male_silang_mars_bigtts">四郎（视频配音）</option>
      <option value="zh_male_jieshuonansheng_mars_bigtts">磁性解说男声/Morgan（视频配音）</option>
      <option value="zh_female_jitangmeimei_mars_bigtts">鸡汤妹妹/Hope（视频配音）</option>
      <option value="zh_female_tiexinnvsheng_mars_bigtts">贴心女声/Candy（视频配音）</option>
      <option value="zh_female_qiaopinvsheng_mars_bigtts">俏皮女声（视频配音）</option>
      <option value="zh_female_mengyatou_mars_bigtts">萌丫头/Cutey（视频配音）</option>
      <option value="zh_male_lanxiaoyang_mars_bigtts">懒音绵宝（视频配音）</option>
      <option value="zh_male_dongmanhaimian_mars_bigtts">亮嗓萌仔（视频配音）</option>
      <option value="zh_male_changtianyi_mars_bigtts">悬疑解说（有声阅读）</option>
      <option value="zh_male_ruyaqingnian_mars_bigtts">儒雅青年（有声阅读）</option>
      <option value="zh_male_baqiqingshu_mars_bigtts">霸气青叔（有声阅读）</option>
      <option value="zh_male_qingcang_mars_bigtts">擎苍（有声阅读）</option>
      <option value="zh_male_yangguangqingnian_mars_bigtts">活力小哥（有声阅读）</option>
      <option value="zh_female_gufengshaoyu_mars_bigtts">古风少御（有声阅读）</option>
      <option value="zh_female_wenroushunv_mars_bigtts">温柔淑女（有声阅读）</option>
      <option value="zh_male_fanjuanqingnian_mars_bigtts">反卷青年（有声阅读）</option>
    `;

const llmPrompt_id = 'llmPrompt';
const barrageUrl_id = 'barrageUrl';
const waresUrl_id = 'waresUrl';


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

function initWebSocket() {
    ws = new WebSocket("ws://localhost:8070");
    ws.onopen = async () => {logMessage("已连接到 AiDriver 服务");
      await startAibot();//websocket 连接成功后，启动Aibot服务
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

//更新音色选择
function updateVoiceSelect(cluster = null) {
  if(cluster == null)
    cluster = document.getElementById("cluster").value;
  const wrapper = document.getElementById("voiceWrapper");
  wrapper.innerHTML = "";

  if (cluster === "volcano_icl") {
    const input = document.createElement("input");
    input.type = "text";
    input.id = "voiceSelect";
    input.placeholder = "[可选]，不填写则调用中转积分系统服务";
    wrapper.appendChild(input);
  } else {
    const select = document.createElement("select");
    select.id = "voiceSelect";
    select.innerHTML = voices;
    wrapper.appendChild(select);
  }
}


// 保存表单数据到缓存
function saveCacheData() {
  const data = {
    appid: document.getElementById("appid").value,
    token: document.getElementById("token").value,
    cluster: document.getElementById("cluster").value,
    spkId: document.getElementById("voiceSelect")?.value || '',
    speed_ratio: document.getElementById("speed_ratio").value,
    llm_appid: document.getElementById("llm_appid").value,
    apikey: document.getElementById("apikey").value,

    accessKeyId: document.getElementById("accessKeyId").value,
    accessKeySecret: document.getElementById("accessKeySecret").value,
    appKey: document.getElementById("appKey").value,

    modelFolder: document.getElementById("modelFolder").value,
    scale: document.getElementById("scale").value,
    figureVideoPath: document.getElementById("figureVideoPath").value,
    bgPath: document.getElementById("bgPath").value,
    pushStream: document.getElementById("pushStream").value,
    isPalyMediaAudio : document.getElementById('paly_media_audio').checked,
    isBlurMouth : document.getElementById('is_blur_mouth').checked
  };

  localStorage.setItem("formData", JSON.stringify(data));
}

// 加载缓存的数据
function loadCacheData() {
  updateVoiceSelect(null);//创建控件
  const data = localStorage.getItem("formData");
  if (!data) 
    return;

  try {
    const parsed = JSON.parse(data);
    document.getElementById("appid").value = parsed.appid || "";
    document.getElementById("token").value = parsed.token || "";
    document.getElementById("cluster").value = parsed.cluster || "";
    document.getElementById("voiceSelect").value = parsed.spkId || "";
    document.getElementById("speed_ratio").value = parsed.speed_ratio || "";
    document.getElementById("llm_appid").value = parsed.llm_appid || "";
    document.getElementById("apikey").value = parsed.apikey || "";
    document.getElementById("accessKeyId").value = parsed.accessKeyId || "";
    document.getElementById("accessKeySecret").value = parsed.accessKeySecret || "";
    document.getElementById("appKey").value = parsed.appKey || "";
    document.getElementById("modelFolder").value = parsed.modelFolder || "";
    document.getElementById("scale").value = parsed.scale || "";
    document.getElementById("figureVideoPath").value = parsed.figureVideoPath || "";
    document.getElementById("bgPath").value = parsed.bgPath || "";
    document.getElementById("pushStream").value = parsed.pushStream || "";
    document.getElementById('paly_media_audio').checked = parsed.isPalyMediaAudio || false;
    document.getElementById('is_blur_mouth').checked = parsed.isBlurMouth || false;

    // 如果语音选择框存在
    const voice = parsed.spkId || "";
    const voiceSelect = document.getElementById("voiceSelect");
    if (voiceSelect){
      updateVoiceSelect(parsed.cluster);//更新
      document.getElementById("voiceSelect").value = voice;
    }
  } catch (e) {
    console.warn("缓存数据解析失败:", e);
  }
}

//读取用户ID
async function getWindowsId() {
  data = {}
  let response = await sendMessage("getWindowsId", data);
  const userIdSpan = document.getElementById('userId');
  userIdSpan.textContent = response;
}


//启动Aibot Server
async function startAibot() {
    data = {}
    let response = await sendMessage("startAibot", data);
    logMessage("启动服务", response);

    //打印用户ID
    await getWindowsId();
}

//保存配置
async function saveConfig(button){
  llmParam = {
    llm_appid: document.getElementById("llm_appid").value,
    apikey:  document.getElementById("apikey").value
  };
  
  asrParam = {
    accessKeyId:  document.getElementById("accessKeyId").value,
    accessKeySecret:  document.getElementById("accessKeySecret").value,
    appKey:  document.getElementById("appKey").value
  }

  audioParam = {
    appid: document.getElementById("appid").value,
    token: document.getElementById("token").value,
    cluster: document.getElementById("cluster").value,
    spkId: document.getElementById("voiceSelect").value,
    speed_ratio: parseFloat(document.getElementById("speed_ratio").value),
  };

  humanParam = {
    modelFolder: document.getElementById("modelFolder").value,
    scale: parseFloat(document.getElementById("scale").value),
    figureVideoPath: document.getElementById("figureVideoPath").value,
    bgPath: document.getElementById("bgPath").value,
    pushStream: document.getElementById("pushStream").value,
    isPalyMediaAudio : document.getElementById('paly_media_audio').checked,
    isBlurMouth : document.getElementById('is_blur_mouth').checked,
  }
  
  saveCacheData();//保存缓存
  button.disabled = true;
  // //启动aibot服务
  // data = {}
  // let response = await sendMessage("startAibot", data);
  // logMessage("启动服务", response);

  //if(humanParam['modelFolder'] != '' && humanParam['figureVideoPath'] != ''){
  if(humanParam['modelFolder'] != ''){
    let response = await sendMessage("startHuman", humanParam);
    logMessage(response);
    isStartHuman = true;
  }
  button.disabled = false;
}


 // 调用 llm API
 async function callLlmAPI(message) {
  // llm API 端点
  const ENDPOINT = `https://dashscope.aliyuncs.com/api/v1/apps/${llmParam['llm_appid']}/completion`;
  const payload = {
    input: {
      prompt: message
    },
    parameters: {
      has_thoughts: true
    },
    debug: {}
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${llmParam['apikey']}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const botReply = data['output']['text'];
    return botReply;
  } catch (error) {
      console.error('调用 API 出错:', error);
      return "抱歉，处理您的请求时出现问题。";
  }
}

//中转 llm服务
async function llm_Service(message) {
  let serviceParam = {
    prompt: JSON.stringify(message),//message,
  };
  data = {...serviceParam};
  return await sendMessage("llm_Service", data);
}

//大语言模型
function llm(){
    let conversationHistory = [];// 存储完整的对话历史（用于上下文）
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // 添加消息到聊天界面
    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = role + '-message';
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // 处理用户发送消息
    async function handleUserMessage() {
      enableRecording = false;
      
      let is_llm_Service = false;
      if(llmParam == null || llmParam['apikey'] == '' || llmParam['llm_appid'] == ''){
        is_llm_Service = true;
        // logMessage("请先配置大语言模型参数");
        // return ;
      }
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
      chatContainer.appendChild(thinkingDiv);
      // 调用 API 并获取响应
      let botResponse = null;
      if (document.getElementById('human_mode').checked)
        botResponse = message;//阿凡达模式
      else{
        // 将用户消息加入历史
        if(conversationHistory.length >= 10)
          conversationHistory.splice(0, 2); //只记录前5次对话
        conversationHistory.push({ role: "user", content: message });
        if(is_llm_Service)
          //botResponse = await llm_Service(conversationHistory);//中转服务
          botResponse = await llm_Service(message);//中转服务 不保存上下文
        else
          botResponse = await callLlmAPI(conversationHistory);
        // 将 AI 回复加入历史
        conversationHistory.push({ role: "system", content: botResponse });
      }
      
      // 移除"思考中"提示，添加实际响应
      chatContainer.removeChild(thinkingDiv);
      sendButton.disabled = false;
      addMessage('bot', botResponse);
      
      if(isStartHuman){
        // if(audioParam == null || audioParam['appid'] == undefined || audioParam['token'] == undefined){
        //   logMessage("请先配置语音参数");
        //   return ;
        // }
        const text = {speakText: botResponse};
        await humanSpeak(text, true);
      }
      enableRecording = true;
    }
    
    // 事件监听
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });
}

//提交语音合成
async function submitSynthesis(text, saveAudioPath) {
  // if(audioParam == null || audioParam['appid'] == undefined || audioParam['token'] == undefined){
  //   logMessage("请先配置语音参数");
  //   return ;
  // }
  data = {
    text: text,
    saveAudioPath: saveAudioPath
  };

  if(data['text'] == "" || data['saveAudioPath'] == ""){
    logMessage("请输入合成的参数");
    return ;
  }

  data = {...audioParam, ...data};
  let response = await sendMessage("synthesis", data);
  logMessage(response);
  document.getElementById('synthesis_btn').disabled = false;
}


//判断是音频路径 还是 数字人播报文本
function containsDriveLetter(str) {
  // 匹配格式如 C:\ 或 C:/（不区分大小写）
  return /[a-zA-Z]:[\\/]/.test(str);
}

//数字人生成
async function submitAvatar() {
  const data = {
    serverIp: document.getElementById("serverIp").value,
    callApiKey: document.getElementById("callApiKey").value,
    audioPath: document.getElementById("audioPath").value,
    videoPath: document.getElementById("videoPath").value,
    saveVideoPath: document.getElementById("saveVideoPath").value,
    isMusic: document.getElementById('is_music').checked
  };

  // if(data['serverIp'] == "" || data['callApiKey'] == "" || data['audioPath'] == "" 
  //   || data['videoPath'] == "" || data['saveVideoPath'] == ""){
  //   logMessage("请输入生成的参数");
  //   return ;
  // }

  if(data['audioPath'] == "" || data['videoPath'] == "" || data['saveVideoPath'] == ""){
    logMessage("请输入生成的参数");
    return ;
  }

  //判断是音频路径还是合成的文本
  if(!containsDriveLetter(data['audioPath'])){
    const timestamp = Date.now();
    let saveAudioPath = `tempAudio\\audio_${timestamp}.wav`;
    await submitSynthesis(data['audioPath'], saveAudioPath);
    data['audioPath'] = saveAudioPath;
  }

  document.getElementById('avatar_btn').disabled = true;//禁用，防止重复提交
  let response = await sendMessage("avatar", data);
  logMessage(response);
  document.getElementById('avatar_btn').disabled = false;
}

//发送作品
async function submitPublish() {
  const data = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    topics: document.getElementById("topics").value,
    publishPath: document.getElementById("publishPath").value
  };

  if(data['title'] == "" || data['description'] == "" || data['publishPath'] == ""){
    logMessage("请输入作品的参数");
    return ;
  }

  document.getElementById('publish_btn').disabled = true;//禁用，防止重复提交
  let response = await sendMessage("publish", data);
  logMessage(response);
  document.getElementById('publish_btn').disabled = false;
}

//形象训练
async function submitHumanClone(){
  const data = {
    serverIp: document.getElementById("human_clone_serverIp").value,
    callApiKey: document.getElementById("human_clone_callApiKey").value,
    videoPath: document.getElementById("human_clone_videoPath").value,
  };

  // if(data['serverIp'] == "" || data['callApiKey'] == "" || data['videoPath'] == ""){
  //   logMessage("请输入训练的参数");
  //   return ;
  // }

  
  if(data['videoPath'] == ""){
    logMessage("请输入训练的参数");
    return ;
  }

  document.getElementById('human_clone_btn').disabled = true;//禁用，防止重复提交
  let response = await sendMessage("getFaceData", data);
  logMessage(response);
  document.getElementById('human_clone_btn').disabled = false;
}

//声音克隆
async function submitVoiceClone(){
  const data = {
    appid: document.getElementById("voice_clone_appid").value,
    token: document.getElementById("voice_clone_token").value,
    spkId: document.getElementById("voice_clone_spkId").value,
    referAudioPath: document.getElementById("refer_audio_path").value,
  };

  // if(data['appid'] == "" || data['token'] == "" || data['spkId'] == "" || data['referAudioPath'] == ""){
  //   logMessage("请输入克隆的参数");
  //   return ;
  // }

  if(data['referAudioPath'] == ""){
    logMessage("请输入克隆的参数");
    return ;
  }

  document.getElementById('voice_clone_btn').disabled = true;//禁用，防止重复提交
  let response = await sendMessage("trainVoiceEx", data);
  logMessage(response);
  document.getElementById('voice_clone_btn').disabled = false;
}


//模型训练
async function submitTrainModel(){
  const data = {
    serverIp: document.getElementById("train_model_serverIp").value,
    callApiKey: document.getElementById("train_model_callApiKey").value,
    videoOrImagePath: document.getElementById("train_data_path").value,
    saveFolder: document.getElementById("train_save_folder").value,
  };

  // if(data['serverIp'] == "" || data['callApiKey'] == "" || data['videoOrImagePath'] == "" || data['saveFolder'] == ""){
  //   logMessage("请输入训练的参数");
  //   return ;
  // }

  if(data['videoOrImagePath'] == "" || data['saveFolder'] == ""){
    logMessage("请输入训练的参数");
    return ;
  }

  document.getElementById('train_model_btn').disabled = true;//禁用，防止重复提交
  let response = await sendMessage("trainBaseModel", data);
  logMessage(response);
  document.getElementById('train_model_btn').disabled = false;
}

// 语音识别功能
let is_live_page = false;//区分大屏幕互动 和 直播
let enableRecording = true;
let recording = false;
function setupVoiceRecognition() {
  const input_mode = document.getElementById('input_mode');
  const live_input_mode = document.getElementById('live_input_mode');
  // 获取浏览器的语音识别构造函数
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    logMessage("语音识别初始化失败");
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';           // 设置识别语言为中文
    recognition.continuous = false;//true;        // 连续识别
    recognition.interimResults = true;    // 返回中间结果

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let userInput = null;
      let sendButton = null;
      if(!is_live_page){
        userInput = document.getElementById('user-input');
        sendButton = document.getElementById('send-button');
      }
      else {
        userInput = document.getElementById('insertScript');//插入应急话术
        sendButton = document.getElementById('insertScriptButton');
      }
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          userInput.value = finalTranscript;
          sendButton.click();//发送
          finalTranscript = '';
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
    //大语言模型互动语音输入
    input_mode_event(recognition);
    //直播间语音输入
    live_input_mode_event(recognition);
  }
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

//大屏幕互动 语音输入事件
function input_mode_event(recognition){
  const input_voice = document.getElementById('input_mode') 
  input_voice.addEventListener('change', async () => {
      is_live_page = false;
    
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

// function input_mode_event(input_mode, recognition){
//   // 按住开始，松开停止
//   input_mode.addEventListener('mousedown', () => {
//     input_mode.textContent = '录制中....';
//     is_live_page = false;
//     if(document.getElementById('human_mode').checked && checkAsrConfig()){
//       startRecording();
//     }else{
//         recognition.start();
//         recording = true;
//     }
//   });
//   input_mode.addEventListener('mouseup', async () => {
//     input_mode.textContent = '按住录制';
//     if(document.getElementById('human_mode').checked && checkAsrConfig()){
//       let audioData = await stopRecording();
//       console.log(audioData);
      
//       //发送数字人播放命令
//       await humanSpeakByAudioData(audioData, false);
//     }else{
//       recording = false;
//       recognition.stop();
//     }
//   });
// }

//直播间语音输入
function live_input_mode_event(recognition){
  const input_voice = document.getElementById('live_input_mode') 
  input_voice.addEventListener('change', async () => {
      is_live_page = true;
    
      if(!input_voice.checked){
          recognition.stop();
          return ;
      }
  
      while(input_voice.checked){
          if(enableRecording){
              playStartSound();
              recording = true;
              if(checkAsrConfig()){
                let base64Data = await startRecording();
                if(base64Data.length > 200000)
                  await humanSpeakByAudioData(base64Data, true);//发送数字人播放命令
              }else{
                  recognition.start();
                  do{
                    await sleep(1000);
                }while(recording);
              }
          }
          
          // do{
          //     await sleep(1000);
          // }while(recording);
      }
  });
}
// function live_input_mode_event(liv_input_mode, recognition){
//   // 按住开始，松开停止
//   liv_input_mode.addEventListener('mousedown', () => {
//     liv_input_mode.textContent = '录制中....';
//     is_live_page = true;
//     if(checkAsrConfig()){
//       startRecording();
//     }else{
//         recognition.start();
//         recording = true;
//     }
//   });
//   liv_input_mode.addEventListener('mouseup', async () => {
//     liv_input_mode.textContent = '按住录制';
//     if(checkAsrConfig()){
//       let audioData = await stopRecording();
//       console.log(audioData);
//       //发送数字人播放命令，需要插入到head
//       await humanSpeakByAudioData(audioData, true);
//     }else{
//       recording = false;
//       recognition.stop();
//     }
//   });
// }

/*==========================================================录制麦克风========================================================*/
let audioContext, mediaStream, processor;
let audioData = {
  size: 0,
  buffer: []
};

// --- 配置项 ---
const SILENCE_DURATION = 1000; // 1秒静音
const SILENCE_THRESHOLD = 0.02; // 静音阈值 (0.0 ~ 1.0)，根据麦克风底噪调整
let silenceStart = null;        // 记录静音开始的时间
let isRecording = false;        // 防止重复触发停止

// 关键变量：用于存储 Promise 的 resolve 函数
let pendingResolve = null;

// 将 Float32 PCM 数据编码成 16 位 WAV (保持不变)
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// 计算音频片段的 RMS (均方根) 音量
function calculateRMS(channelData) {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
}

// 启动录音
// 现在它返回一个 Promise，只有录音结束才会有结果
function startRecording() {
  return new Promise(async (resolve, reject) => {
    // 保存 resolve 函数，以便在 stopRecording 中调用
    pendingResolve = resolve;

    // 重置状态
    audioData.size = 0;
    audioData.buffer = [];
    silenceStart = null;
    isRecording = true;

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const input = audioContext.createMediaStreamSource(mediaStream);

      // 4096 样本缓冲
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = e => {
        if (!isRecording) return;

        const channelData = e.inputBuffer.getChannelData(0);

        // 1. 保存数据
        audioData.buffer.push(new Float32Array(channelData));
        audioData.size += channelData.length;

        // 2. 计算音量
        const vol = calculateRMS(channelData);

        // 3. 静音检测逻辑
        if (vol < SILENCE_THRESHOLD) {
          if (silenceStart === null) {
            silenceStart = Date.now();
          } else {
            // 检查是否超过静音时长
            if (Date.now() - silenceStart > SILENCE_DURATION) {
              console.log("检测到1秒静音，自动停止...");
              // 直接调用 stopRecording，它会触发 pendingResolve
              stopRecording(); 
            }
          }
        } else {
          // 有声音，重置计时
          silenceStart = null;
        }
      };

      input.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log("录音开始，说话中...");

    } catch (err) {
      console.error("无法启动录音", err);
      isRecording = false;
      reject(err);
    }
  });
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function stopRecording() {
  if (!isRecording) 
    return;
  isRecording = false;

  // 停止资源
  if (processor) processor.disconnect();
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  // 注意：ScriptProcessor 模式下 close 后 context 可能无法再访问 sampleRate，建议提前保存
  const sr = audioContext ? audioContext.sampleRate : 48000;
  if (audioContext) await audioContext.close();

  // 合并数据
  const samples = new Float32Array(audioData.size);
  let offset = 0;
  for (let buf of audioData.buffer) {
    samples.set(buf, offset);
    offset += buf.length;
  }

  // 编码 WAV (调用你之前的 helper 函数)
  const wavBlob = encodeWAV(samples, sr);
  const buffer = await wavBlob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  // 【核心修改】触发 Promise 完成
  if (pendingResolve) {
    pendingResolve(base64); // 这行代码会让 await startRecording() 返回结果
    pendingResolve = null;  // 清空
  }

  return base64;
}
// let audioContext, mediaStream, processor;
// let audioData = {
//   size: 0,        // 总采样点数
//   buffer: []      // 存放 Float32Array 的数组
// };

// // 将 Float32 PCM 数据编码成 16 位 WAV
// function encodeWAV(samples, sampleRate) {
//   const buffer = new ArrayBuffer(44 + samples.length * 2);
//   const view = new DataView(buffer);

//   function writeString(offset, str) {
//     for (let i = 0; i < str.length; i++) {
//       view.setUint8(offset + i, str.charCodeAt(i));
//     }
//   }

//   // RIFF chunk descriptor
//   writeString(0, 'RIFF');
//   view.setUint32(4, 36 + samples.length * 2, true);
//   writeString(8, 'WAVE');

//   // fmt sub-chunk
//   writeString(12, 'fmt ');
//   view.setUint32(16, 16, true);           // Subchunk1Size (16 for PCM)
//   view.setUint16(20, 1, true);            // AudioFormat = 1 (PCM)
//   view.setUint16(22, 1, true);            // NumChannels = 1 (mono)
//   view.setUint32(24, sampleRate, true);   // SampleRate
//   view.setUint32(28, sampleRate * 2, true);// ByteRate = SampleRate * NumChannels * BitsPerSample/8
//   view.setUint16(32, 2, true);            // BlockAlign = NumChannels * BitsPerSample/8
//   view.setUint16(34, 16, true);           // BitsPerSample = 16

//   // data sub-chunk
//   writeString(36, 'data');
//   view.setUint32(40, samples.length * 2, true);

//   // 写入 PCM 样本（16-bit little-endian）
//   let offset = 44;
//   for (let i = 0; i < samples.length; i++, offset += 2) {
//     // 将 Float  [-1..1] 转为 16-bit PCM
//     let s = Math.max(-1, Math.min(1, samples[i]));
//     view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
//   }

//   return new Blob([view], { type: 'audio/wav' });
// }

// async function startRecording() {
//   // 请求麦克风权限
//   mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
//   audioContext = new (window.AudioContext || window.webkitAudioContext)();
//   const input = audioContext.createMediaStreamSource(mediaStream);
//   // 16384 样本缓冲；1 个输入通道，1 个输出通道
//   processor = audioContext.createScriptProcessor(16384, 1, 1);

//   // 拦截音频数据
//   processor.onaudioprocess = e => {
//     const channelData = e.inputBuffer.getChannelData(0);
//     // 复制一份，不要直接引用
//     audioData.buffer.push(new Float32Array(channelData));
//     audioData.size += channelData.length;
//   };

//   input.connect(processor);
//   processor.connect(audioContext.destination);
// }


// //音频二进制转base64
// function arrayBufferToBase64(buffer) {
//   let binary = '';
//   const bytes = new Uint8Array(buffer);
//   for (let b of bytes) binary += String.fromCharCode(b);
//   return btoa(binary);
// }

// async function stopRecording() {
//   // 停止所有处理
//   processor.disconnect();
//   audioContext.close();
//   mediaStream.getTracks().forEach(t => t.stop());

//   // 合并所有 Float32Array 到一个大数组
//   const samples = new Float32Array(audioData.size);
//   let offset = 0;
//   for (let buf of audioData.buffer) {
//     samples.set(buf, offset);
//     offset += buf.length;
//   }

//   // 编码 WAV
//   const wavBlob = encodeWAV(samples, audioContext.sampleRate);

//   // 重置缓存
//   audioData.size = 0;
//   audioData.buffer = [];

//   let buffer = await wavBlob.arrayBuffer();
//   return arrayBufferToBase64(buffer);
// }

//显示密码
function showPassword(elementId) {
  const input = document.getElementById(elementId);
  input.type = (input.type === "password") ? "text" : "password";
}

/*==========================================================数字人直播========================================================*/

// 保存直播配置缓存
function saveLiveData() {
  // 普通 input / textarea
  localStorage.setItem(llmPrompt_id, document.getElementById(llmPrompt_id).value);
  localStorage.setItem(barrageUrl_id, document.getElementById(barrageUrl_id).value);
  localStorage.setItem(waresUrl_id, document.getElementById(waresUrl_id).value);

  // 表格内容序列化
  ['keywordTable', 'welcomeTable', 'interactionTable'].forEach(id => {
    const table = document.getElementById(id);
    const data = [];
    Array.from(table.tBodies[0].rows).forEach(row => {
      const cells = Array.from(row.cells).map(cell => cell.textContent.trim());
      data.push(cells);
    });
    localStorage.setItem(id, JSON.stringify(data));
  });
}

// 加载缓存的数据
function loadLiveData() {
   // 恢复普通 input / textarea
   const fields = [llmPrompt_id, barrageUrl_id, waresUrl_id];
   fields.forEach(id => {
     const v = localStorage.getItem(id);
     if (v !== null) 
      document.getElementById(id).value = v;
   });

   // 恢复表格
   ['keywordTable', 'welcomeTable', 'interactionTable'].forEach(id => {
     const raw = localStorage.getItem(id);
     if (!raw) return;
     const data = JSON.parse(raw);
     const tbody = document.getElementById(id).tBodies[0];
     tbody.innerHTML = ''; // 清空现有行
     data.forEach(cells => {
       const tr = document.createElement('tr');
       cells.forEach(text => {
         const td = document.createElement('td');
         td.contentEditable = 'true';
         td.textContent = text;
         tr.appendChild(td);
       });
       tbody.appendChild(tr);
     });
   });
}

 // 监听页面上所有 input/textarea 的变化，实时保存
 function attachAutoSave() {
  const elems = [
    llmPrompt_id, barrageUrl_id, waresUrl_id
  ].map(id => document.getElementById(id));
  elems.forEach(el => {
    el.addEventListener('input', saveLiveData);
  });


  // 对表格的 cell blur（结束编辑）时保存
  ['keywordTable', 'welcomeTable', 'interactionTable'].forEach(id => {
    document.getElementById(id).addEventListener('blur', event => {
      if (event.target.tagName === 'TD') 
        saveLiveData();
    }, true);
  });
}


//添加行
function addTableRow(tableId) {
  const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
  const newRow = table.insertRow();
  if(tableId == 'keywordTable'){
    newRow.innerHTML = `
      <td contenteditable="true">新关键词</td>
      <td contenteditable="true">新回复内容</td>
    `;
  }else{
      newRow.innerHTML = `
      <td contenteditable="true"></td>
    `;
  }

  saveLiveData();
}

// 删除选中行
function delTableRow(tableId) {
  const tbody = document.getElementById(tableId).querySelector("tbody");
  const selectedRow = tbody.querySelector("tr.selected");
  if (selectedRow){
      selectedRow.remove();
      saveLiveData();
  }
}

//折叠表格
let isCollapsed = false;
function toggleTable(tableId, button) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const rows = tbody.querySelectorAll("tr");
  //const btn = document.getElementById("toggle-table-btn");

  if (isCollapsed) {
    // 展开全部
    rows.forEach(row => row.style.display = "");
    button.textContent = "🔽折叠";
  } else {
    // 折叠，仅保留前2行
    rows.forEach((row, index) => {
      row.style.display = index < 2 ? "" : "none";
    });
    button.textContent = "▶️展开";
  }

  isCollapsed = !isCollapsed;
}

// 绑定表格的点击事件，选中单行
function enableRowSelection(tableId) {
  const tbody = document.getElementById(tableId).querySelector("tbody");

  tbody.addEventListener("click", function (event) {
    const clickedRow = event.target.closest("tr");

    // 取消其他选中
    [...tbody.querySelectorAll("tr")].forEach(row => row.classList.remove("selected"));

    // 标记当前行为选中
    if (clickedRow) {
      clickedRow.classList.add("selected");
    }
  });
}


//检查asr配置参数
function checkAsrConfig(){
  // if(asrParam == null || asrParam['accessKeyId'] == "" || asrParam['accessKeySecret'] == ""|| asrParam['appKey'] == "")
  //   return false;

  return true;
}

//初始化弹幕服务
let enableBarrageService = false;
async function initBarrageService(button){
  let barrageUrl = document.getElementById(barrageUrl_id).value;
  if(barrageUrl == '')
    return ;

  button.disabled = true;
  data = {
    barrageUrl: barrageUrl,
  }
  let response = await sendMessage("initBarrageService", data, 10000);
  logMessage(response);
  enableBarrageService = true;
  button.disabled = false;
}

//获取弹幕
async function getBarrage(){
  if(!enableBarrageService){
    //logMessage('未启动弹幕服务');
    return null;
  }

  data = {}
  let response = await sendMessage("getBarrage", data, 10000);
  if(response == null)
    return null;
  
  arrageList = JSON.parse(response.replace(/^getBarrage:/, ''));
  return arrageList;
}

//初始化商品弹窗服务
let enablePopupWares = false;
async function initPopupWaresService(button){
  let waresUrl = document.getElementById(waresUrl_id).value;
  if(waresUrl == '')
    return ;

  data = {
    waresUrl: waresUrl,
  }
  let response = await sendMessage("initPopupWaresService", data, 10000);
  logMessage(response);
  enablePopupWares = true;
}

//商品弹窗
async function popupWares(waresId){
  if(!enablePopupWares){
    logMessage('未启动商品弹窗服务');
    return null;
  }

  button.disabled = true;
  data = {
    waresId: waresId,
  }
  let response = await sendMessage("popupWares", data, 10000);
  logMessage(response);
  button.disabled = false;
}

//插入特写视频
async function insertVideo(videoPath) {
  if(!isStartHuman){
    logMessage("请先配置数字人参数");
    return ;
  }

  data = {
    videoPath: videoPath,
  }
  let response = await sendMessage("insertVideo", data);
  logMessage(response);
}

//切换形象动作
async function switchAction(figureVideoPath) {
  data = {
    figureVideoPath : figureVideoPath,
    scale : parseFloat(document.getElementById("scale").value),
    isPalyMediaAudio : document.getElementById('paly_media_audio').checked
  }

  let response = await sendMessage("switchAction", data);
  logMessage(response);
}

//切换背景
async function addBackground(bgPath) {
  data = {
    bgPath : bgPath,
  }

  let response = await sendMessage("addBackground", data);
  logMessage(response);
}

//插入应急话术
async function insertScript(){
  let startButton = document.getElementById('start-live-btn');
  if(!startButton.disabled){
    logMessage("请先开始直播");
    return ;
  }

  let userInput = document.getElementById('insertScript');
  let message = userInput.value.trim();
  if(!message)
    return;
  
  const text = {speakText: message};
  userInput.value = '';
  await humanSpeak(text, false, true);
}

//获取关键词表格数据
function getTableData(tableId) {
  const table = document.getElementById(tableId);
  const rows = table.querySelectorAll("tbody tr");
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 2) {
      const keyword = cells[0].innerText.trim();
      const text = cells[1].innerText.trim();
      data.push({ keyword, text });
    }else{
      const text = cells[0].innerText.trim();
      data.push({ text});
    }
  });

  return data;
}

//获取第一个标点符号话术
function getTextBeforeFirstPunctuation(fixedScript) {
  // 找出所有 {} 中的范围
  const ranges = [];
  const regex = /\{[^}]*\}/g;
  let match;
  while ((match = regex.exec(fixedScript)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }

  // 判断某个位置是否在大括号范围内
  function isInBraces(index) {
    return ranges.some(([start, end]) => index >= start && index < end);
  }

  // 查找第一个不在 {} 中的标点符号
  const punctuationRegex = /[。！？.!?']/g;///[，。！？；：、,.!?;:']/g;
  let punctuationMatch;
  while ((punctuationMatch = punctuationRegex.exec(fixedScript)) !== null) {
    if (!isInBraces(punctuationMatch.index)) {
      const index = punctuationMatch.index;
      let curText = fixedScript.slice(0, index);
      let remainingScript = fixedScript.slice(index + 1);
      return { curText, fixedScript: remainingScript };
    }
  }

  // 如果没有匹配的标点
  return { curText: fixedScript, fixedScript: "" };
}

// 获取当前时间字符串
function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours < 12 ? '上午' : '下午';

  // 转为12小时制
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${period} ${hours}点${minutes}分`;
}

let sleepTo = 0;//固定话术延迟播报时间
let fixedAudios = [];//固定音频路径

//获取固定音频路径
async function parseFixedAudios(audioFolder){
  let strFixedAudios = await sendMessage("parseFixedAudios", {audioFolder : audioFolder});
  return strFixedAudios.split(',');
}

//解析固定话术数据
async function parseFixedScriptData(text) {
  // 定义一个正则，用于每次只匹配第一个 {…}
  const singleBraceRegex = /\{(.*?)\}/;

  // 不断循环，直到文本中不再有 {…} 为止
  while (true) {
    const match = text.match(singleBraceRegex);
    if (!match) {
      // 没有匹配到，直接返回最终文本
      return text;
    }

    const fullMatch = match[0]; // 整个 "{…}"
    const content = match[1];   // 花括号里面的内容，比如 "大家|各位|宝子们"

    let replacement = "";

    let keywordMatch = null; 
    if (content === "当前时间") {
      // 如果是“当前时间”，同步获取当前时间字符串
      replacement = getCurrentTime();
    } else if (content.includes("|")) {
      // 如果包含“|”，当做可选话术，从中随机挑一个
      const variants = content.split("|");
      replacement = variants[Math.floor(Math.random() * variants.length)];
    } else if (/^\d+$/.test(content)) {
      // 如果纯数字，调用弹窗（异步），并替换为“空字符串”
      await popupWares(content);
      replacement = "";
    } else if (keywordMatch = content.match(/特写视频\s+([a-zA-Z]:.*?\.mp4)/i)) {
      // 如果以 .mp4 结尾，或包含路径符号，认为是视频路径，调用播放，并替换为空
      await insertVideo(keywordMatch[1]);
      replacement = "";
    }else if(/延迟播报\s*(\d+)/.test(content)){//延迟播报，单位秒
      const sleepTime = content.replace(/延迟播报\s*/g, "");
      sleepTo = Date.now() + parseInt(sleepTime) * 1000;
      await sleep(100);
      return ''
    } else if(keywordMatch = content.match(/切换形象\s+([a-zA-Z]:.*?\.mp4)/i)){//切换形象动作
      const figureVideoPath = keywordMatch[1];
      await switchAction(figureVideoPath);
      replacement = "";
    } else if(keywordMatch = content.match(/切换背景\s+([a-zA-Z]:.*?\.(png|jpg|mp4))/i)){//切换背景
      const bgPath = keywordMatch[1];
      await addBackground(bgPath);
      replacement = "";
    }else if(keywordMatch = content.match(/固定音频\s+([a-zA-Z]:[\\/](?:[\w-]+[\\/])*[\w-]+(?:\.wav)?)$/i)){//固定音频
      const audioPath = keywordMatch[1];
      if(audioPath.includes(".")){
        await humanSpeakByAudioPath(audioPath, false);
        replacement = "";
      }else{
        const audioFolder = keywordMatch[1];
        fixedAudios = await parseFixedAudios(audioFolder);
        replacement = "";
      }
    }
    else {
      // 其它情况，默认不做替换，直接去掉花括号内容
      replacement = "";
    }

    // 用计算好的 replacement 去替换掉这次匹配到的 {…}
    // 注意只替换第一个出现的 fullMatch
    text = text.replace(fullMatch, replacement);
    // 进入下一次循环，继续寻找下一个 {…}
  }
}

async function stopSpeak() {
  data = {}
  let response = await sendMessage("stopSpeak", data);
  logMessage("stopSpeak:", response);
}

async function humanSpeak(text, waitPlaySound, insertHead = false){
  logMessage("humanSpeak:", text);

  data = {...audioParam, ...text, ...{waitPlaySound:waitPlaySound, insertHead: insertHead}};
  await sendMessage("humanSpeak", data);
}

//音频数据直接驱动数字人说话
async function humanSpeakByAudioData(audioData, insertHead = false){
  logMessage("humanSpeakByAudioData");

  data = {...asrParam, ...{audioData : audioData}, ...{insertHead: insertHead}};
  await sendMessage("humanSpeakByAudioData", data);
}

async function humanSpeakByAudioPath(audioPath, insertHead = false){
  logMessage("humanSpeakByAudioPath");

  data = {...asrParam, ...{audioPath : audioPath}, ...{insertHead: insertHead}};
  await sendMessage("humanSpeakByAudioPath", data);
}

async function getHumanSpeakQueueCount() {
  data = {}
  let response = await sendMessage("getHumanSpeakQueueCount", data);
  return parseInt(response);
}

//开始直播
async function startLive(button, stopButtonId) {
  if(!isStartHuman){
    logMessage("请先配置数字人参数");
    return ;
  }

  let is_llm_Service = false;
  if(llmParam == null || llmParam['apikey'] == '' || llmParam['llm_appid'] == '')
    is_llm_Service = true;

  //修改按钮状态
  button.disabled = true;
  stopButton = document.getElementById(stopButtonId);
  stopButton.disabled = false;

  //开始获取数据
  let index = Math.floor(Math.random() * fixedScripts.length);
  let fixedScript = fixedScripts[index]['content'].replace(/[\t\n\r\f\v]+/g, '');//删除空白符号(排除空格)
  let keyWords = getTableData('keywordTable');//关键词
  let welcomes = getTableData('welcomeTable');//欢迎新进来的人
  let interactions = getTableData('interactionTable');//互动预读观众名称

  let welcomeTime = Math.floor(Date.now() / 1000);
  //循环处理固定话术 弹幕 欢迎 关键词
  while(stopButton.disabled == false){
    let arrageList = await getBarrage();//弹幕内容
    if(arrageList != null && arrageList.length > 0){
      //检查关键词
      for(let i = 0; i < arrageList.length; i++){
        for(let j = 0; j < keyWords.length; j++){
          if(arrageList[i]['text'] != null && arrageList[i]['text'].includes(keyWords[j]['keyword'])){
            //播报
            
            //关键词支持固定话术语法
            let arrText =  keyWords[j]['text'].split(/[。!！?？]/);//split(/[.。!！?？]/);  不能包括“.” 因为固定话术语法播放视频有这个 .
            for(let i = 0; i < arrText.length; i++){
              let curText = await parseFixedScriptData(arrText[i]);//解析大括号里面的内容
              if(curText != ''){
                //提交合成播报
                const text = {speakText: curText};
                await humanSpeak(text, false, false);
              }
            }

            //删除处理过的弹幕
            arrageList.splice(i, 1);
            i -= 1;
          }
        }
      }

      //检查最后一个弹幕
      if(arrageList.length > 0){
        let lastArrage = arrageList[arrageList.length - 1];
        if(lastArrage['text'] == '送了礼物'){
          //礼物
        }else if(lastArrage['text'] == '为主播点赞了'){
          //点赞
        }else if(lastArrage['text'] != '来了'){//llm 互动
          let randomInteraction = interactions[Math.floor(Math.random() * interactions.length)]['text'];
          let name = lastArrage['name'].replace('：', '');
          const maxLength = Math.floor(Math.random() * 5) + 6;//6-10
          if(name.length > maxLength)
            name = name.substring(0, 8);

          if(randomInteraction.includes("{name}"))
            randomInteraction = randomInteraction.replace("{name}", name);//发送弹幕的人
          if(randomInteraction.includes("{text}"))
            randomInteraction = randomInteraction.replace("{text}", lastArrage['text']);//弹幕文本
          
          let llmPromptText = document.getElementById(llmPrompt_id).value;//获取大语言提示词
          let message = [
            {"role":"system","content":llmPromptText},
            {"role":"user","content":lastArrage['text']}
          ]

          if(is_llm_Service)
            randomInteraction = randomInteraction + "," + await llm_Service(message)
          else
            randomInteraction = randomInteraction + "," + await callLlmAPI(message)

          //播报
          const text = {speakText: randomInteraction};
          await humanSpeak(text, false, true);
        }else if(lastArrage['text'] == '来了'){
          let curTime = Math.floor(Date.now() / 1000);
          if(curTime - welcomeTime >= 10){
            welcomeTime = curTime;

            //随机获取欢迎话术
            let randomWelcome = welcomes[Math.floor(Math.random() * welcomes.length)]['text'];
            let name = lastArrage['name'];
            const maxLength = Math.floor(Math.random() * 5) + 6;//6-10
            if(name.length > maxLength)
              name = name.substring(0, maxLength);
            randomWelcome = randomWelcome.replace("{name}", name);
            
            //播报
            const text = {speakText: randomWelcome};
            await humanSpeak(text, false, true);
          }
        }
      }
    }

    //固定话术 处理逻辑
    if(sleepTo == 0){
      if(fixedAudios.length > 0){//固定音频话术
        let audioPath = fixedAudios.shift();
        await humanSpeakByAudioPath(audioPath, false);
      }
      else if(fixedScript != ''){//固定文本话术
        let aar = getTextBeforeFirstPunctuation(fixedScript);
        fixedScript = aar['fixedScript'];
        let curText = aar['curText'];
        curText = await parseFixedScriptData(curText);//解析大括号里面的内容
        if(curText != ''){
          //提交合成播报
          const text = {speakText: curText};
          await humanSpeak(text, false);
        }
      }

      //while(fixedScript == ''){//从新开始
      if(fixedScript == '' && fixedAudios.length == 0){//从新开始
        index = Math.floor(Math.random() * fixedScripts.length);
        fixedScript = fixedScripts[index]['content'].replace(/[\t\n\r\f\v]+/g, '');//删除空白符号(排除空格)
        //logMessage("切换固定话术:" + fixedScripts[index]['id']);
        //await sleep(200);
      }
    }else{
      if(Date.now() >= sleepTo)
        sleepTo = 0;
    }

    //等待播放剩下最后一句话
    while(true){
      await sleep(500);
      let queueCount = await getHumanSpeakQueueCount();
      if(queueCount <= 0)
        break;
    }
  }
}

//停止直播
async function stopLive(button, startButtonId) {
  //修改按钮状态
  button.disabled = true;
  startButton = document.getElementById(startButtonId);
  startButton.disabled = false;
}

document.addEventListener('DOMContentLoaded', function(event) {
  initWebSocket();
  llm();
  setupVoiceRecognition();
  enableRowSelection('keywordTable');
  enableRowSelection('welcomeTable');
  enableRowSelection('interactionTable');

  //配置数据缓存
  loadCacheData();

  loadFixedScripts();//固定话术标签

  //直播数据缓存
  loadLiveData();
  attachAutoSave();
});

//直播插入应急话术回车事件
document.getElementById('insertScript').addEventListener('keypress', function(e) {
  if (e.key === 'Enter')
    insertScript();
});

//实时去重
async function enableRandomParam(isEnable){
  logMessage("enableRandomParam:" + isEnable);
  data = {
    isEnable: isEnable,
  }
  await sendMessage("enableRandomParam", data);
}

//实时去重事件
document.getElementById('random_param').addEventListener('change', async function() {
    await enableRandomParam(this.checked)
});



//固定话术
// 默认提示词 (仅作为 placeholder)
const defaultScript = '{切换形象 d:\\action.mp4}。{切换背景 d:\\bg.png}。现在是{当前时间}。{特写视频 C:\\1.mp4}。这是话术变量{展示|演示|示例}。弹出商品编号{234237461871234}。固定话术推迟播报单位秒。{延迟播报 10}。\n音频文件驱动数字人，需配置阿里云语音识别极速版。单个音频文件示例。{固定音频 c:\\audio\\1.wav}。\n遍历音频音频文件夹驱动数字人示例，按音频文件名称大小排序，支持一级子目录，若子目录存在音频文件，则随机选择一个音频参与播报。{固定音频 c:\\audio}';

let fixedScripts = [];
function saveFixedScripts() { localStorage.setItem('fixedScripts', JSON.stringify(fixedScripts)); }

//加载固定话术缓存
function loadFixedScripts() {
  const data = localStorage.getItem('fixedScripts');
  fixedScripts = data ? JSON.parse(data) : [];
  if (fixedScripts.length === 0) addFixedTab();
  fixedScripts.forEach(tab => renderFixedTab(tab.id, tab.content));
  updateTabLabels();
  switchFixedTab(fixedScripts[0].id);
}

//添加固定话术tab
function addFixedTab() {
  const id = 'fixed-' + Date.now();
  fixedScripts.push({ id, content: '' });
  saveFixedScripts();
  renderFixedTab(id, '');
  updateTabLabels();
  switchFixedTab(id);
}

//移除固定话术tab
function removeFixedTab(id) {
  if (!confirm('确认删除此话术？')) return;
  // 更新数据
  fixedScripts = fixedScripts.filter(t => t.id !== id);
  saveFixedScripts();
  // 删除 DOM
  document.querySelector(`.tab-header .tab-btn[data-id="${id}"]`).remove();
  document.getElementById(id).remove();
  // 重新编号，并切换
  if (fixedScripts.length) {
    updateTabLabels();
    switchFixedTab(fixedScripts[0].id);
  } else {
    addFixedTab();
  }
}

//更新
function updateTabLabels() {
  document.querySelectorAll('.tab-header .tab-btn').forEach((btn, idx) => {
    const id = btn.dataset.id;
    btn.firstChild.textContent = `固定话术 ${idx + 1}`; // 保持 close-btn 不受影响
  });
}

//选择固定话术标签
function switchFixedTab(id) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.id === id));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === id));
}

function renderFixedTab(id, content) {
  const header = document.querySelector('.tab-header');
  if (!header.querySelector(`[data-id="${id}"]`)) {
    const btn = document.createElement('div');
    btn.className = 'tab-btn'; btn.dataset.id = id;
    const textNode = document.createTextNode('固定话术');
    btn.appendChild(textNode);
    const close = document.createElement('div'); close.className = 'close-btn'; close.textContent = '×';
    close.onclick = e => { e.stopPropagation(); removeFixedTab(id); };
    btn.appendChild(close);
    btn.onclick = () => switchFixedTab(id);
    header.insertBefore(btn, document.getElementById('add-fixed-tab'));
  }
  const wrapper = document.querySelector('.tab-content-wrapper');
  if (!document.getElementById(id)) {
    const pane = document.createElement('div'); pane.className = 'tab-pane'; pane.id = id;
    const ta = document.createElement('textarea'); ta.value = content;
    ta.placeholder = defaultScript;
    ta.oninput = () => { const idx = fixedScripts.findIndex(t => t.id === id); fixedScripts[idx].content = ta.value; saveFixedScripts(); };
    pane.appendChild(ta); wrapper.appendChild(pane);
  }
}