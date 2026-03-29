//AndroidBot 示例
const AndroidBot = require('AndroidBot');
AndroidBot.registerMain(androidMain, 16678);

let gAndroidBot = null;
async function androidMain(androidBot){
    //如果 webMain、windowsMain 使用到 androidBot，这里赋值给全局变量
    gAndroidBot = androidBot;

    //如果有使用gWindowsBot、gWebBot，需要先判断是否为null
    while(gWindowsBot == null || gWebBot == null)
        await androidBot.sleep(100);
    
    //使用androidBot
    await androidBot.setImplicitTimeout(5000);
    let androidId = await androidBot.getAndroidId();
    console.log(androidId);
}


//WindowsBot 示例
const WindowsBot = require('WindowsBot');
WindowsBot.registerMain(windowsMain, "127.0.0.1", 26678);

let gWindowsBot = null;
async function windowsMain(windowsBot) {
    //如果 webMain、androidMain 使用到 windowsBot，这里赋值给全局变量
    gWindowsBot = windowsBot;

    //如果有使用gAndroidBot、gWebBot，需要先判断是否为null
    while(gAndroidBot == null || gWebBot == null)
        await windowsBot.sleep(100);

    //使用windowsBot
    await windowsBot.setImplicitTimeout(5000);
    let windowsId = await windowsBot.getWindowsId();
    console.log(windowsId);
}


//WebBot 示例
const WebBot = require('WebBot');
WebBot.registerMain(webMain, "127.0.0.1", 36678, {browserName:"edge"});

let gWebBot = null;
async function webMain(webBot){
    //如果 windowsMain、androidMain 使用到 webBot，这里赋值给全局变量
    gWebBot = webBot;

    //如果有使用gAndroidBot、gWindowsBot，需要先判断是否为null
    while(gAndroidBot == null || gWindowsBot == null)
        await webBot.sleep(100);

    //使用webBot
    await webBot.setImplicitTimeout(5000);
    await webBot.goto('https://www.baidu.com/');
}