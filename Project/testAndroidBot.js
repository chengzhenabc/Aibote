const AndroidBot = require('AndroidBot');//引用AndroidBot模块

//注册主函数，安卓端连接脚本会自动调用androidMain，并传递AndroidBot对象。设置服务端监听端口，手机端默认连接端口16678
AndroidBot.registerMain(androidMain, 16678);

/**用作代码提示，androidMain函数会被多次调用，注意使用全局变量
* @param {AndroidBot} androidBot
*/
async function androidMain(androidBot){
    //设置隐式等待
    await androidBot.setImplicitTimeout(5000);
    
    // let androidId = await androidBot.getAndroidId();
    // console.log(androidId);

    let elements = await androidBot.getElements();
    console.log(elements);
}