const WindowsBot = require('WindowsBot');
const AndroidBot = require('AndroidBot');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto')

let gWindowsBot = null;
let agentHwnd = null;
WindowsBot.registerMain(async(windowsBot)=>{
    while(agentHwnd == null){
        agentHwnd = await windowsBot.findWindow("Chrome_WidgetWin_1", "Aibote Agent - 个人 - Microsoft​ Edge");
        await windowsBot.sleep(1000);
    }

    gWindowsBot = windowsBot;
}, "127.0.0.1", 26678);

//检查是否正在思考中
async function isThinking() {
    const text = await gWindowsBot.getElementName(agentHwnd, 'Text@name=思考中...');
    if(text != null)
        return true;
    else
        return false;
}

//提交弹幕提示词
async function submitBarage(content, savePath) {
    await gWindowsBot.setElementValue(agentHwnd, 'Edit@name=在此输入指令... (Shift+Enter 换行)', `生成素描图片：${content}；图片大小：1K；宽高比：9:16；保存路径：${savePath}`);
    await gWindowsBot.sleep(1000);
    await gWindowsBot.clickElement(agentHwnd, 'Document/Group[1]/Button[2]', 1);
}

//提示词作为图片名称
function generateFilename(inputStr) {
    // 计算 MD5 哈希
    const hash = crypto.createHash('md5').update(inputStr).digest('hex');
    // 截取前 16 个字符作为文件名
    return hash.slice(0, 16);
}

//查询缓存图片是否命中
async function queryCache(rootDir, content) {
    return "";
    const txtContents = [];
    const files = fs.readdirSync(rootDir);
    files.forEach(file => {
        const fullFilePath = path.join(folderPath, file);// 拼接文件完整路径
        
        // 检查是否是文件（排除子文件夹），且后缀是.txt
        const stat = fs.statSync(fullFilePath);
        if (stat.isFile() && path.extname(file).toLowerCase() === '.txt') {
            const content = fs.readFileSync(fullFilePath, 'utf8');
            txtContents.push({path: fullFilePath, content: content});
        }
    });

    //有命中返回图片路径
    
    return "";
}

AndroidBot.registerMain(androidMain, 16678);
/**用作代码提示，androidMain函数会被多次调用，注意使用全局变量
* @param {AndroidBot} androidBot
*/
async function androidMain(androidBot){
    //等待windowsBot
    while(gWindowsBot == null)
        await androidBot.sleep(1000);

    let preName = "", preContent = "";
    while(true){
        let now = new Date();
        let hour = String(now.getHours()).padStart(2, '0'); // 时
        let minute = String(now.getMinutes()).padStart(2, '0'); // 分
        let second = String(now.getSeconds()).padStart(2, '0'); // 秒
        let formattedTime = `${hour}:${minute}:${second}`;
        console.log(`\n${formattedTime}:玩法提示：`);
        console.log(`作图指令：@生成一只黑白相间的斑点狗`);
        const barrage = await newBarage(androidBot);
        if(barrage == null){
            console.log(`未检测到新的作图指令`);
            await androidBot.sleep(3000);
            continue;
        }
            
        const arr = barrage.split("：@");
        let name = arr[0];
        let content = arr[1];
        if(content == preContent)
            continue;

        console.log(`AI正在为生成图片：${name}，作图提示词：${content}`);
        preName = name;
        preContent = content;

        let rootDir = 'C:/Users/mengyuan/Desktop/Agent/images';
        let fileName, resultPath;
        //判断是否命中缓存
        const cacheImgPath = await queryCache(rootDir, content);
        if(cacheImgPath == ""){
            //发送用户提示词
            fileName = generateFilename(content);
            resultPath = `${rootDir}/${fileName}.png`;
            await submitBarage(content, resultPath);
        }else{
            fileName = null;//有缓存不用标注
            resultPath = cacheImgPath;//缓存图片路径
            console.log(`命中缓存图片:${resultPath}`);
        }

        console.log('AI创作已提交，正在创作...');

        // //启动python绘图脚本
        // const scriptPath = "C:/Users/mengyuan/Desktop/Aibote/Project/Agent/script/create_image.py";
        // await gWindowsBot.startProcess(`python.exe ${scriptPath} ${resultPath}`);

        //等待结果
        let bRet = true;
        while(bRet){
            await androidBot.sleep(1000);
            bRet = await isThinking();
        }

        const exist = await fs.existsSync(resultPath);
        if(!exist){
            console.log("生成图片失败");
            continue;
        }

        //启动之前先关闭
        const preDrawHwnd = await gWindowsBot.findWindow(null, "Drawing Canvas");
        await gWindowsBot.closeWindow(preDrawHwnd, "Window");
        //启动python绘图脚本
        const scriptPath = "C:/Users/mengyuan/Desktop/Aibote/Project/Agent/script/create_image.py";
        await gWindowsBot.startProcess(`python.exe ${scriptPath} ${resultPath}`);

        //标注
        if(fileName != null){
            const decsPath = `C:/Users/mengyuan/Desktop/Agent/images/${fileName}.txt`;
            await fs.writeFileSync(decsPath, content, 'utf8');
        }

        // console.log('AI创作完成，正在将图片发送到粉丝群');
        // //发送图片到粉丝群
        // await sendImg(androidBot, resultPath);

        // console.log('发送完毕！提醒幸运观众加入粉丝群下载图片');
    }
}

//发送图片到抖音粉丝群
async function sendImg(androidBot, imgPath) {
    const pushPath = `/storage/emulated/0/Android/media/com.aibot.client/${Date.now()}.png`;
    await androidBot.pushFile(imgPath, pushPath);

    await androidBot.setImplicitTimeout(5000);
    await androidBot.back();
    await androidBot.sleep(2000);
    await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@desc=消息，按钮');
    await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@text=RPA+AI');
    await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.ImageView@desc[1]=更多面板');
    await androidBot.sleep(1000);
    await androidBot.click(124, 1341);
    await androidBot.sleep(500);
    await androidBot.click(290, 1526);
    await androidBot.sleep(500);
    await androidBot.click(806, 1529);

    // await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@text=相册');
    // await androidBot.clickElement('com.ss.android.ugc.aweme/com.ss.android.ugc.aweme:id=4tr');
    // await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@text=原图');
    // await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.Button@text=发送(1)');
    
    //返回到我的界面
    await androidBot.sleep(2000);
    await androidBot.back();
    await androidBot.sleep(2000);
    await androidBot.back();
    await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@desc=我，按钮');

    //重新进入直播间抓取弹幕
    await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.ImageView@containsDesc=用户头像');

    await androidBot.setImplicitTimeout(10);
}

//获取新弹幕
async function newBarage(androidBot) {
    for(let i = 10; i > 0; i--){
        let barage = await androidBot.getElementText(`com.ss.android.ugc.aweme/com.ss.android.ugc.aweme:id=text[${i}]`)
        if(barage == null || !barage.includes('：@'))
            continue;
        
        return barage;
    }

    return null;
}