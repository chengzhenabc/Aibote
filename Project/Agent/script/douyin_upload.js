const WebBot = require('WebBot');//引用WebBot模块

//注册主函数，指定浏览器相关参数
WebBot.registerMain(webMain, "127.0.0.1", 36678, {browserName:"edge"});

/**用作代码提示，webMain函数会被多次调用，注意使用全局变量
* @param {WebBot} webBot
*/
async function webMain(webBot){
    // "d:/1.mp4" "d:/1.png" "标题" "描述" "话题1、话题2"
    //获取启动参数
    const args = process.argv.slice(2);

    const videoPath = args[0];//视频路径
    const coverPath = args[1];//封面路径
    const title = args[2];//标题
    const decs = args[3];//描述
    const topicTag = args[4].split("、");//话题标签
    
    if(!videoPath || !coverPath || !title || !decs || !topicTag) 
        return process.exit(-1);

    //设置隐式等待
    await webBot.setImplicitTimeout(5000);

    //进入上传页面
    await webBot.goto('https://creator.douyin.com/creator-micro/content/post/video');

    //上传文件
    await webBot.uploadFile('//*[@id="DCPF"]/div/div[2]/div[1]/div/div/div/div/div/div/input', videoPath);

    //等待上传完毕
    await webBot.sleep(5000);
    await webBot.setImplicitTimeout(100);
    let bRet = true;
    while (bRet){
         bRet = await webBot.getElementText("//div[text()='取消上传']");
         await webBot.sleep(1000);
         console.log("等待视频上传...");
    }
    await webBot.setImplicitTimeout(5000);

     //选择封面
     await webBot.clickElement("//div[text()='选择封面']");

     //上传封面
     await webBot.uploadFile('//*[@id="dy-creator-content-modal-body"]/div/div[2]/div[2]/div[1]/div[4]/div/div[2]/div[2]/input[1]', coverPath)
    
     //点击完成按钮
    await webBot.clickElement("//button[contains(normalize-space(.), '完成')]");
    await webBot.sleep(3000);
    
    //标题
    await webBot.sendKeys("//input[@placeholder='填写作品标题，为作品获得更多流量']", title);

    //描述
    await webBot.sendKeys("//div[@contenteditable='true']", decs);

    //话题
    for(let i = 0; i < topicTag.length; i++){
        await webBot.clickElement("//div[text()='#添加话题']");
        await webBot.sendKeys("//div[@contenteditable='true']", topicTag[i]);
        await webBot.sendVk(13);
    }

    //发布
    await webBot.clickElement("//button[text()='发布']");

    //等待30退出
    await webBot.sleep(30000);
    await webBot.closeBrowser();
    process.exit();
}