const WebBot = require('WebBot');//引用WebBot模块

//注册主函数，指定浏览器相关参数
WebBot.registerMain(webMain, "127.0.0.1", 36678, {browserName:"edge"});

/**用作代码提示，webMain函数会被多次调用，注意使用全局变量
* @param {WebBot} webBot
*/
async function webMain(webBot){
    //设置隐式等待
    await webBot.setImplicitTimeout(5000);

    await webBot.goto('https://www.baidu.com/');
}