const WebBot = require('WebBot');//引用WebBot模块
const WebSocketBot = require('WebSocketBot');//引用WebSocketBot

let gWebBot = null;//定义全局变量，存放WebBot对象

//构建WebSocketBot
let webSocketBot = WebSocketBot.build(async (data, isBinary)=>{
    //解析客户端字符串格式数据
    //let strMsg = data.toString();

    //解析客户端json格式数据
    let jsonMsg = JSON.parse(data);
    let command = jsonMsg["command"];
    let msg = jsonMsg["data"];
    switch(command){
        case "openUrl":
            await gWebBot.goto(msg);
            webSocketBot.sendData("已打开" + msg);
            break;
    }
}, 8181);


//注册主函数
WebBot.registerMain(webMain, "127.0.0.1", 36678, {browserName:"edge"});

/**用作代码提示，webMain函数会被多次调用，注意使用全局变量
* @param {WebBot} webBot
*/
async function webMain(webBot){
    //设置隐式等待
    await webBot.setImplicitTimeout(5000);

    gWebBot = webBot;//赋值给全局变量
}