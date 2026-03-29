const AiBot = require('AiBot');
const WebBot = require('WebBot');
const WebSocket = require('ws');
const crypto = require('crypto');
const {exec} = require('child_process');
const child_process = require('child_process');
const wsServer = new WebSocket.Server({ port: 8070 });

// 启动本地web 服务
const http = require('http');
const path = require('path');
const fs   = require('fs');

const PORT = 3000;
const PUBLIC_DIR = path.join("./", 'webUI');

http.createServer((req, res) => {
  // 默认访问 / 时返回 index.html
  let filePath = req.url === '/' ? '/index.html' : req.url;
  let fullPath = path.join(PUBLIC_DIR, filePath);
  

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('404 Not Found');
    }
    // 简单根据后缀设置 Content-Type
    const ext = path.extname(fullPath).toLowerCase();
    const map = {
      '.html': 'text/html',
      '.js':   'application/javascript',
      '.css':  'text/css',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      // …可继续补充
    };
    res.writeHead(200, { 'Content-Type': map[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});


let gAibot = null;
let publishWebBot = null;//发布作品webBot
let barrageWebBot = null;//抓取弹幕
let popupWaresWebBot = null;//商品弹窗
let gWs = null;

let preFigureVideoPath = null;
let preScale = null;
let preBgPath = '';


//等待服务与驱动连接
async function waitDriver(bot) {
    let waitCount = 10;
    while(waitCount--){
        await AiBot.sleep(1000);
        if(bot != null && bot.socket.readyState != 'closed')
            return true;
    }

    return false;
}

//启动aiDriver.exe驱动
async function startAiDriver(port) {
    let driverName = 'AiDriver.exe';
    //获取驱动程序路径
    let driverPath = "../../" + driverName;
    
    let isExist = fs.existsSync(driverPath);
    if(!isExist)
        driverPath = driverName;

    child_process.execFile(driverPath, ["127.0.0.1", port]);
    console.log("正在启动AiDriver...");
    
    //重置
    preFigureVideoPath = null;
    preScale = null;
    preBgPath = '';
}

//启动webdriver.exe 驱动
async function startWebDriver(port) {
    //获取驱动程序路径
    let driverPath = "../../WebDriver.exe";
    let isExist = fs.existsSync(driverPath);
    if(!isExist)
        driverPath = 'WebDriver.exe';

    let browserParam = `{"serverIp":"127.0.0.1", "serverPort":${port}, "browserName":"edge", "debugPort":0, "userDataDir":"C:/AiboteAppData2","browserPath":"null", "argument":"null", "extendParam":""}`;
    child_process.execFile(driverPath, [browserParam]);
    console.log("正在启动WebDriver...");
}

//启动aibot服务
async function startAibot() {
    let port = 56671;//56678
    if(gAibot == null){
        await startAiDriver(port);
        AiBot.registerMain(async function(aiBot) {
            gAibot = aiBot;
        }, "127.0.0.111", port);
        
        //等待服务与驱动连接
        let waitCount = 10;
        while(waitCount--){
            await AiBot.sleep(1000);
            if(gAibot != null && gAibot.socket.readyState != 'closed')
                return "启动aibot服务";
        }
    }
    else if(gAibot.socket.readyState == 'closed'){
        await startAiDriver(port);
        return "启动aibot服务";
    }
    else
        return "请勿重复启动aibot服务";

    return "启动aibot服务失败";
}

//切换形象
async function switchAction(figureVideoPath, scale, isPalyMediaAudio) {
    let ret = false;
    if(preFigureVideoPath != figureVideoPath || preScale != scale){
        ret = await gAibot.switchAction(figureVideoPath, scale, isPalyMediaAudio, false);
        preFigureVideoPath = figureVideoPath;
        preScale = scale;
    }
    return ret;
}

//切换背景
async function addBackground(bgPath) {
    let ret = false;
    if(bgPath != preBgPath){
        ret = await gAibot.addBackground(bgPath);
        preBgPath = bgPath;
    }

    return ret;
}

//启动数字人
async function startHuman(modelFolder, scale, figureVideoPath, bgPath, pushStreamUrl, isPalyMediaAudio, isBlurMouth) {
    await gAibot.blurMouth(isBlurMouth);//模糊嘴型
    if(preFigureVideoPath == null){
        let enableRandomParam = false;
        let ret = await gAibot.initNewHuman(modelFolder, scale, isPalyMediaAudio, enableRandomParam, pushStreamUrl);
        if(ret != true)
            return ret;
    }

    if(preFigureVideoPath != figureVideoPath || preScale != scale){
        if(figureVideoPath != ''){//不能为空
            ret = await gAibot.switchAction(figureVideoPath, scale, isPalyMediaAudio, false);
            if(ret != true)
                return ret;
        }
    }

    if(bgPath != preBgPath){
        if(bgPath == '')
            ret = await gAibot.delBackground();
        else
            ret = await gAibot.addBackground(bgPath);

        if(ret != true)
            return ret;
    }

    preFigureVideoPath = figureVideoPath;
    preScale = scale;
    preBgPath = bgPath;
    return "启动数字人成功!";
}

//语音合成
async function synthesis(appid, token, spkId, cluster, text, speed_ratio, saveAudioPath) {
    let ret;
    if(appid == '' || token == '' || spkId == '')
        ret = await gAibot.textToAudioEx_Service(spkId, cluster, text, speed_ratio, saveAudioPath);
    else
        ret = await gAibot.textToAudioEx(appid, token, spkId, cluster, text, speed_ratio, saveAudioPath);
    return ret;
}

//数字人生成
async function avatar(serverIp, callApiKey, audioPath, videoPath, saveVideoPath, isMusic) {
    let ret;
    if(serverIp == '' || callApiKey == '')
        ret = await gAibot.generateHumanVideoEx_Service(audioPath, videoPath, saveVideoPath, isMusic);
    else
        ret = await gAibot.generateHumanVideoEx(serverIp, callApiKey, audioPath, videoPath, saveVideoPath, isMusic);
    return ret;
}

async function publishFailed() {
    //关闭清场
    await publishWebBot.closeBrowser();
    await publishWebBot.closeDriver();
    publishWebBot = null;
    return "发布作品失败";
}

//发布作品
async function publish(title, description, topics, publishPath) {
    WebBot.registerMain(async function(webBot) {
        await webBot.setImplicitTimeout(5000);//设置隐式等待
        publishWebBot = webBot;
    }, "127.0.0.1", 36678, {browserName:"edge", userDataDir:"C:/AiboteAppData1"}, "../../");

    //等待服务与驱动连接
    let waitCount = 10;
    while(waitCount--){
        await AiBot.sleep(1000);
        if(publishWebBot != null && publishWebBot.socket.readyState != 'closed')
            break;
    }

    await publishWebBot.goto("https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page");
    await AiBot.sleep(3000);
    while(true){
        let bRet = await publishWebBot.isDisplayed('//input[@placeholder="填写作品标题，为作品获得更多流量"]');
        if(bRet)
            break;

        gWs.send("请登录账号, 登录后输入并跳转至：https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page");
        await AiBot.sleep(3000);
    }
    await AiBot.sleep(1000);
    if(!await publishWebBot.sendKeys('//input[@placeholder="填写作品标题，为作品获得更多流量"]', title))
        return publishFailed();

    await AiBot.sleep(500);
    if(!await publishWebBot.sendKeys('//div[@data-placeholder="添加作品简介"]', description))
        return publishFailed();

    const topic = topics.split("、");
    if(topic[0] != ''){
        for(let i = 0; i < topic.length; i++){
            if(!await publishWebBot.clickElement('//div[text()="#添加话题"]'))
                return publishFailed();

            if(!await publishWebBot.sendKeys('//div[contains(@class, "editor-kit-container") and @contenteditable="true"]',topic[i]))
                return publishFailed();
            await publishWebBot.sleep(500);
            if(!await publishWebBot.clickElement('//div[text()="#添加话题"]'))
                return publishFailed();
        }
    }

    if(!await publishWebBot.uploadFile('//input[@name="upload-btn" and @type="file" and contains(@accept, ".mp4")]', publishPath))
        return publishFailed();

    //等待上传完毕
    while(true){
        let bRet = await publishWebBot.isDisplayed('//div[text()="重新上传"]');
        if(bRet)
            break;
        await AiBot.sleep(1000);
    }
    if(!await publishWebBot.clickElement('//button[text()="发布"]'))
        return publishFailed();

    //关闭清场
    await AiBot.sleep(5000);//5秒关闭
    await publishWebBot.closeBrowser();
    await publishWebBot.closeDriver();
    publishWebBot = null;

    return "发布作品完成";
}

//分割标点符号
function splitAndMerge(text, minLength = 10) {
    // 按标点符号分割，保留分隔符
    //const parts = text.split(/([,，.。!！?？])/).filter(part => part !== '');
    const parts = text.split(/([.。!！?？])/).filter(part => part !== '');

    // 将内容和标点重新组合为完整句子数组
    const sentences = [];
    for (let i = 0; i < parts.length; i += 2) {
      const sentence = parts[i] + (parts[i + 1] || '');
      sentences.push(sentence.trim());
    }
  
    // 合并不满足最小长度的句子
    const result = [];
    let buffer = '';
    for (const sentence of sentences) {
      buffer += sentence;
      if (buffer.length >= minLength) {
        result.push(buffer);
        buffer = '';
      }
    }
  
    // 处理剩余的内容
    if (buffer)
      result.push(buffer);
  
    return result;
  }


function generateFilename(inputStr) {
    // 计算 MD5 哈希
    const hash = crypto.createHash('md5').update(inputStr).digest('hex');
    // 截取前 16 个字符作为文件名
    return hash.slice(0, 16);
}


let isStopSpeak = false;
//打断数字人说话
async function stopSpeak() {
    isStopSpeak = true;
    return await gAibot.stopSpeak();
}

//数字人说话
async function humanSpeak(appid, token, spkId, cluster, speakText, speed_ratio, insertHead, waitPlaySound = false) {
    let texts = null;
    if(insertHead)
        texts = [speakText];//应急话术不能拆分处理
    else
        texts = splitAndMerge(speakText);
    
    for(let i = 0; i < texts.length; i++){
        if(isStopSpeak){
            isStopSpeak = false;
            await gAibot.stopSpeak();
            break ;
        }
        let saveFileName = generateFilename(`${spkId}${texts[i]}`);
        let saveAudioPath = `tempAudio\\${saveFileName}.wav`;
        if(!fs.existsSync(saveAudioPath)){//判断文件是否存在
            let ret;
            if(appid == '' || token == '' || spkId == '')
                ret = await gAibot.textToAudioEx_Service(spkId, cluster, texts[i], speed_ratio, saveAudioPath);
            else
                ret = await gAibot.textToAudioEx(appid, token, spkId, cluster, texts[i], speed_ratio, saveAudioPath);
            if(ret != true)
                return ret;
        }
        
        ///let waitPlaySound = false;
        if(i == texts.length - 1)
            ret = await gAibot.humanSpeak(saveAudioPath, waitPlaySound, insertHead);
        else
            ret = await gAibot.humanSpeak(saveAudioPath, false, insertHead);
        if(ret != true)
            return ret;
    }

    return "数字人播报成功!";
}

//数字人通过音频数据说话
async function humanSpeakByAudioData(accessKeyId, accessKeySecret, appKey, audioData, insertHead) {
    let saveFileName = `record_${Date.now()}`;
    let saveAudioPath = `tempAudio\\${saveFileName}.wav`;
    await fs.writeFileSync(saveAudioPath, Buffer.from(audioData, 'base64'));
    //获取lab
    let ret;
    if(accessKeyId == '' || accessKeySecret == '' || appKey == '')
        ret= await gAibot.audioToLabEx_Service(saveAudioPath)
    else
        ret= await gAibot.audioToLabEx(accessKeyId, accessKeySecret, appKey, saveAudioPath);
    if(ret != true)
        return ret;
    
    let waitPlaySound = false;
    ret = await gAibot.humanSpeak(saveAudioPath, waitPlaySound, insertHead)
    if(ret != true)
        return ret;


    return "数字人播报成功!";
}

//数字人通过音频路径说话
async function humanSpeakByAudioPath(accessKeyId, accessKeySecret, appKey, audioPath, insertHead) {
    const labPath = audioPath.replace(/\.wav/i, '.lab'); //先判断 有没有存在的lab
    if(!fs.existsSync(labPath)){//判断文件是否存在
        //获取lab
        let ret;
        if(accessKeyId == '' || accessKeySecret == '' || appKey == '')
            ret= await gAibot.audioToLabEx_Service(audioPath)
        else
            ret = await gAibot.audioToLabEx(accessKeyId, accessKeySecret, appKey, audioPath)
        if(ret != true)
            return ret;
    }
    
    let waitPlaySound = false;
    ret = await gAibot.humanSpeak(audioPath, waitPlaySound, insertHead)
    if(ret != true)
        return ret;


    return "数字人播报成功!";
}

//初始化弹幕抓取服务
async function initBarrageService(barrageUrl) {
    let port = 36677;
    if(barrageWebBot == null){
        await startWebDriver(port);
        WebBot.registerMain(async function(webBot) {
            gBarrageUrl = barrageUrl;
            barrageWebBot = webBot;
            await webBot.goto(barrageUrl);
        }, "127.0.0.111", port, {browserName:"edge",  userDataDir:"C:/AiboteAppData2"}, "../../");
    
        //等待服务与驱动连接
        let waitCount = 10;
        while(waitCount--){
            await AiBot.sleep(1000);
            if(barrageWebBot != null && barrageWebBot.socket.readyState != 'closed')
                break;
        }
        return "启动抓取弹幕服务";
    }
    else if(barrageWebBot.socket.readyState == 'closed'){
        await startWebDriver(port);
        await waitDriver(barrageWebBot);//等待服务与驱动连接
        await barrageWebBot.goto(barrageUrl);
        return "启动抓取弹幕服务";
    }
    else
        return "请勿重复启动弹幕服务";
}

//抓取弹幕
let preBarrageList = [];
let gBarrageUrl = "";

//pinduoduo
async function getBarrageFromPinduoduo() {
    let barrageList = [];

    //新来的人
    let name = await barrageWebBot.getElementText(`(//section)[5]//span[text()][1]`);
    let text = await barrageWebBot.getElementText(`(//section)[5]//span[text()][3]`);
    if(name != null && name != '')
        barrageList.push({"name":name, "text":text});

    //获取最新 3 个弹幕
    for(let i = 3; i > 0; i--){
        let name = await barrageWebBot.getElementText(`(//section[@id='msgBox']//*[@class][last() - ${i}]//span[text()])[1]`);
        let text = await barrageWebBot.getElementText(`(//section[@id='msgBox']//*[@class][last() - ${i}]//span[text()])[2]`);

        if(name != null && name != ''){
            if(text == ' ' && name.includes('：') == false)
                text = '为主播点赞了';
            else
                name = name.slice(0, -1);
            barrageList.push({"name":name, "text":text});
        }
    }
    

    //删除上一个弹幕
    let tempBarrageList = [...barrageList];//保留副本
    preBarrageList.forEach(itemToRemove => {
        let index = barrageList.findIndex(
            x => x.name === itemToRemove.name && x.text === itemToRemove.text
        );
        if (index !== -1) {
            barrageList.splice(index, 1);
        }
    });
    if(tempBarrageList.length > 0)
        preBarrageList = tempBarrageList;

    return JSON.stringify(barrageList);
}

async function getBarrage() {
    if(barrageWebBot == null)
        return "抓取弹幕服务未启动";

    if(gBarrageUrl.includes('.yangkeduo.'))
        return await getBarrageFromPinduoduo();

    //滚动弹幕栏，防止弹幕休眠
    //await barrageWebBot.wheelMouseByXpath(`//div[contains(@class, 'webcast-chatroom___list')]`, 0, -10);
    await barrageWebBot.clickElement("//div[text()='继续播放']");//点击继续播放，防止休眠
    await barrageWebBot.wheelMouseByXpath(`//div[contains(@class, 'webcast-chatroom___list')]`, 0, 100);


    let barrageList = [];

    //点赞/新来的人
    let name = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___bottom-message'])[1]//span[text()])[1]`);
    let text = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___bottom-message'])[1]//span[text()])[2]`);
    if(name == '' && text == ''){
        name = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___bottom-message'])[2]//span[text()])[1]`);
        text = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___bottom-message'])[2]//span[text()])[2]`);
    }
    if(name != null && name != '')
        barrageList.push({"name":name, "text":text});

    //获取最新 3 个弹幕
    for(let i = 2; i >= 0; i--){

        //contains(@class, 'webcast-chatroom___item-wrapper')
        let name = await barrageWebBot.getElementText(`((//div[contains(@class, 'webcast-chatroom___item-wrapper')])[last() - ${i}]//span[text()])[1]`);
        let text = await barrageWebBot.getElementText(`((//div[contains(@class, 'webcast-chatroom___item-wrapper')])[last() - ${i}]//span[text()])[2]`);
        let otherText = await barrageWebBot.getElementText(`((//div[contains(@class, 'webcast-chatroom___item-wrapper')])[last() - ${i}]//span[text()])[3]`);
        // let name = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___item webcast-chatroom___item_new'])[last() - ${i}]//span[text()])[1]`);
        // let text = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___item webcast-chatroom___item_new'])[last() - ${i}]//span[text()])[2]`);
        // let otherText = await barrageWebBot.getElementText(`((//div[@class='webcast-chatroom___item webcast-chatroom___item_new'])[last() - ${i}]//span[text()])[3]`);
        if(text != null && text.includes('送出了 × '))
            text = '送了礼物';

        if(name != null && name != '' && otherText == null)
            barrageList.push({"name":name, "text":text});
    }
    

    //删除上一个弹幕
    let tempBarrageList = [...barrageList];//保留副本
    preBarrageList.forEach(itemToRemove => {
        let index = barrageList.findIndex(
            x => x.name === itemToRemove.name && x.text === itemToRemove.text
        );
        if (index !== -1) {
            barrageList.splice(index, 1);
        }
    });
    if(tempBarrageList.length > 0)
        preBarrageList = tempBarrageList;

    return JSON.stringify(barrageList);
}

//初始化商品弹窗服务
async function initPopupWaresService(waresUrl) {
    let port = 36676;
    if(popupWaresWebBot == null){
        await startWebDriver(port);
        WebBot.registerMain(async function(webBot) {
            popupWaresWebBot = webBot;
            await webBot.goto(waresUrl);
        }, "127.0.0.111", port, {browserName:"edge", userDataDir:"C:/AiboteAppData3"}, "../../");

        //等待服务与驱动连接
        let waitCount = 10;
        while(waitCount--){
            await AiBot.sleep(1000);
            if(popupWaresWebBot != null && popupWaresWebBot.socket.readyState != 'closed')
                break;
        }

        return "启动商品弹窗服务";
    }
    else if(popupWaresWebBot.socket.readyState == 'closed'){
        await startWebDriver(port);
        await waitDriver(popupWaresWebBot);//等待服务与驱动连接

        await popupWaresWebBot.goto(waresUrl);
        return "启动商品弹窗服务";
    }
    else
        return "请勿重复启动弹窗服务";
}

//商品弹窗
async function popupWares(waresId) {
    if(popupWaresWebBot == null)
        return "商品弹窗服务未启动";

    //鼠标事件后 在清空元素
    let bRet = await popupWaresWebBot.clickMouseByXpath("//input[@placeholder='请输入商品名称或ID']", 7);
    if(!bRet)
        return "先登录账号";
    bRet = await popupWaresWebBot.setElementValue("//input[@placeholder='请输入商品名称或ID']", '');//清空

    bRet = await popupWaresWebBot.sendKeys("//input[@placeholder='请输入商品名称或ID']", waresId);
    await popupWaresWebBot.sleep(200);
    bRet = await popupWaresWebBot.clickElement("//span[@aria-label='search']"); 
    await popupWaresWebBot.sleep(200);
    bRet = await popupWaresWebBot.clickElement("//div[contains(@class, 'goods-item highlight')]//button[contains(text(), '讲解')]");
    if(!bRet)
        return `不存在的商品ID:${waresId}`;
    
    return "弹出商品ID:" + waresId;
}

//插入特写视频
async function insertVideo(videoPath) {
    let bRet = await gAibot.insertVideo(videoPath);
    return bRet;
}

//形象训练
async function getFaceData(serverIp, callApiKey, videoPath) {
    let bRet;
    if(serverIp == '' || callApiKey == '')
        bRet= await gAibot.getFaceData_Service(videoPath);
    else
        bRet= await gAibot.getFaceData(serverIp, callApiKey, videoPath);

    if(bRet == true)
        return "形象训练成功，请保存好.pt后缀的人脸数据文件";
    else
        return bRet;
}

//声音克隆
async function trainVoiceEx(appid, token, spkId, referAudioPath) {
    let bRet;
    if(appid == '' || token == '' || spkId == '')
        bRet = await gAibot.trainVoiceEx_Service(referAudioPath);
    else
        bRet = await gAibot.trainVoiceEx(appid, token, spkId, referAudioPath);

    if(bRet == true)
        return "声音克隆成功";
    else
        return bRet;
}

//训练基础模型
async function trainBaseModel(serverIp, callApiKey, videoOrImagePath, saveFolder) {
    let bRet;
    if(serverIp == '' || callApiKey == '')
        bRet = await gAibot.trainBaseModel_Service(videoOrImagePath, saveFolder);
    else
        bRet = await gAibot.trainBaseModel(serverIp, callApiKey, videoOrImagePath, saveFolder);
    if(bRet == true)
        return "模型训练成功！";
    else
        return bRet;
}

//随机参数
async function enableRandomParam(isEnable) {
    let bRet = await gAibot.enableRandomParam(isEnable);
    return bRet;
}

//获取固定音频路径
async function parseFixedAudios(audioFolder){
    const files = fs.readdirSync(audioFolder);
    const wavFiles = [];
  
    files.forEach(file => {
      const filePath = path.join(audioFolder, file);
      const stat = fs.statSync(filePath);
  
      if (stat.isDirectory()) {
        // 如果是文件夹，则遍历这个一级子目录中的文件
        let subFilePaths = []
        const subFiles = fs.readdirSync(filePath);
        subFiles.forEach(subFile => {
          const subFilePath = path.join(filePath, subFile);
          if (fs.statSync(subFilePath).isFile() && /\.wav$/i.test(subFile))//只处理.wav
            subFilePaths.push(subFilePath);
        });
        
        //存入子目录的音频文件，只处理1级子目录
        if(subFilePaths.length > 0){
            const subWavFile = subFilePaths[Math.floor(Math.random() * subFilePaths.length)];//随机获取一个音频文件
            wavFiles.push(subWavFile);
        }
      } else if (/\.wav$/i.test(file)) {
        // 如果是文件且符合 .wav 格式
        wavFiles.push(filePath);
      }
    });

    //按照文件名大小排序
    wavFiles.sort((a, b) => {
        const fileNameA = path.basename(a);
        const fileNameB = path.basename(b);
        return fileNameA.localeCompare(fileNameB);
      });
    return wavFiles.join();  
}

async function llm_Service(prompt) {
    let ret = await gAibot.llm_Service(prompt);
    return ret;
}

//用户ID
async function getWindowsId() {
    let ret = await gAibot.getWindowsId();
    return ret;
}
async function recvMessage(data){
    let arrData = JSON.parse(data);
    let requestId = arrData['requestId'];
    let jsonMsg = arrData['payload'];
    let cmd = jsonMsg["cmd"];
    let ret;
    switch(cmd){
        case "startAibot"://启动Aibot服务
            ret = await startAibot();
            gWs.send(`${requestId}_startAibot:${ret}`);
            break;
        case "startHuman"://启动数字人
            ret = await startHuman(jsonMsg["modelFolder"], jsonMsg["scale"], jsonMsg["figureVideoPath"], jsonMsg["bgPath"], jsonMsg["pushStream"], jsonMsg["isPalyMediaAudio"], jsonMsg["isBlurMouth"]);
            gWs.send(`${requestId}_startHuman:${ret}`);
            break;
        case "switchAction"://切换形象
            ret = await switchAction(jsonMsg["figureVideoPath"], jsonMsg["scale"], jsonMsg["isPalyMediaAudio"]);
            gWs.send(`${requestId}_switchAction:${ret}`);
            break;
        case "addBackground"://切换背景
            ret = await addBackground(jsonMsg["bgPath"]);
            gWs.send(`${requestId}_addBackground:${ret}`);
            break;
        case "stopSpeak"://打断数字人说话
            ret = await stopSpeak()
            gWs.send(`${requestId}_stopSpeak:${ret}`);
            break;
        case "humanSpeak"://数字人说话
            ret = await humanSpeak(jsonMsg["appid"], jsonMsg["token"], jsonMsg["spkId"], jsonMsg["cluster"], jsonMsg["speakText"], jsonMsg["speed_ratio"], jsonMsg["insertHead"], jsonMsg["waitPlaySound"])
            gWs.send(`${requestId}_humanSpeak:${ret}`);
            break;
        case "humanSpeakByAudioData"://数字人通过音频数据说话
            ret = await humanSpeakByAudioData(jsonMsg["accessKeyId"], jsonMsg["accessKeySecret"], jsonMsg["appKey"], jsonMsg["audioData"], jsonMsg["insertHead"])
            gWs.send(`${requestId}_humanSpeakByAudioData:${ret}`);
            break;
        case "humanSpeakByAudioPath"://数字人通过音频文件说话
            ret = await humanSpeakByAudioPath(jsonMsg["accessKeyId"], jsonMsg["accessKeySecret"], jsonMsg["appKey"], jsonMsg["audioPath"], jsonMsg["insertHead"])
            gWs.send(`${requestId}_humanSpeakByAudioPath:${ret}`);
            break;
        case "getHumanSpeakQueueCount"://获取队列数量
            ret = await gAibot.getHumanSpeakQueueCount();
            gWs.send(`${requestId}_${ret}`);
            break;
        case "synthesis"://语音合成
            ret = await synthesis(jsonMsg["appid"], jsonMsg["token"], jsonMsg["spkId"], jsonMsg["cluster"], jsonMsg["text"], jsonMsg["speed_ratio"], jsonMsg["saveAudioPath"]);
            gWs.send(`${requestId}_synthesis:${ret}`);
            break;
        case "avatar"://数字人生成
            ret = await avatar(jsonMsg["serverIp"], jsonMsg["callApiKey"], jsonMsg["audioPath"], jsonMsg["videoPath"], jsonMsg["saveVideoPath"], jsonMsg["isMusic"]);
            gWs.send(`${requestId}_avatar:${ret}"}`);
            break;
        case "publish"://发布作品
            ret = await publish(jsonMsg["title"], jsonMsg["description"], jsonMsg["topics"], jsonMsg["publishPath"]);
            gWs.send(`${requestId}_publish:${ret}`);
            break;
        case "initBarrageService"://初始化弹幕服务
            ret = await initBarrageService(jsonMsg["barrageUrl"]);
            gWs.send(`${requestId}_initBarrageService:${ret}`);
            break;
        case "getBarrage"://抓取弹幕
            ret = await getBarrage();
            gWs.send(`${requestId}_getBarrage:${ret}`);
            break;
        case "initPopupWaresService"://初始商品弹窗服务
            ret = await initPopupWaresService(jsonMsg["waresUrl"]);
            gWs.send(`${requestId}_initPopupWaresService:${ret}`);
            break;
        case "popupWares"://商品弹窗
            ret = await popupWares(jsonMsg["waresId"]);
            gWs.send(`${requestId}_popupWares:${ret}`);
            break;
        case "insertVideo"://插入特写视频
            ret = await insertVideo(jsonMsg["videoPath"]);
            gWs.send(`${requestId}_insertVideo:${ret}`);
            break;
        case "getFaceData"://获取脸部数据
            ret = await getFaceData(jsonMsg["serverIp"], jsonMsg["callApiKey"], jsonMsg["videoPath"]);
            gWs.send(`${requestId}_getFaceData:${ret}`);
            break;
        case "trainVoiceEx"://声音克隆
            ret = await trainVoiceEx(jsonMsg["appid"], jsonMsg["token"], jsonMsg["spkId"], jsonMsg["referAudioPath"]);
            gWs.send(`${requestId}_trainVoiceEx:${ret}`);
            break;
        case "enableRandomParam"://实时去重
            ret = await enableRandomParam(jsonMsg["isEnable"]);
            gWs.send(`${requestId}_enableRandomParam:${ret}`);
            break;
        case "trainBaseModel"://训练基础模型
            ret = await trainBaseModel(jsonMsg["serverIp"], jsonMsg["callApiKey"], jsonMsg["videoOrImagePath"], jsonMsg["saveFolder"]);
            gWs.send(`${requestId}_trainBaseModel:${ret}`);
            break;
        case "parseFixedAudios"://获取固定音频文件
            ret = await parseFixedAudios(jsonMsg["audioFolder"]);
            //gWs.send(`${requestId}_parseFixedAudios:${ret}`);
            gWs.send(`${requestId}_${ret}`);
            break;
        case "llm_Service"://通义千问(中转服务)
            ret = await llm_Service(jsonMsg["prompt"]);
            gWs.send(`${requestId}_${ret}`);
            break;
        case "getWindowsId"://windowsId
            ret = await getWindowsId();
            gWs.send(`${requestId}_${ret}`);
            break;
    }
}

wsServer.on('connection', (ws) => {
    gWs = ws;
    console.log('客户端已连接');
    ws.on('message', recvMessage);

    ws.on('close', () => {
      console.log('客户端已断开连接');
    });
  
    ws.send('成功连接AiDriver服务！');
  });


//启动edge 并进入webui
async function startEdge(url, extendParam = '') {
    // let edgeExeName = 'msedge';
    // if(fs.existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\miedge.exe'))
    //     edgeExeName = 'miedge';

    // // 启动 Microsoft Edge
    // exec(`start ${edgeExeName} "${url}" ${extendParam}`, (error, stdout, stderr) => {
    // if (error) {
    //     console.error(`启动 Edge 时出错: ${error.message}`);
    //     return;
    // }
    // if (stderr) {
    //     console.error(`stderr: ${stderr}`);
    //     return;
    // }
    // console.log('Edge 浏览器已启动');
    // });
    exec(`start "" "${url}"`);
}


// 启动webUI
(async () => {
    let url = "http://127.0.0.1:3000/";
    await startEdge(url);
})();