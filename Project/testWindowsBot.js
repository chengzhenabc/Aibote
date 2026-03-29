const WindowsBot = require('WindowsBot');//引用WindowsBot模块

//注册主函数
WindowsBot.registerMain(windowsMain, "127.0.0.1", 26678);

/**用作代码提示，windowsMain函数会被多次调用，注意使用全局变量
* @param {WindowsBot} windowsBot
*/
async function windowsMain(windowsBot) {
    //设置隐式等待
    await windowsBot.setImplicitTimeout(5000);
    
    let windowsId = await windowsBot.getWindowsId();
    console.log(windowsId);


    const hwnd = await windowsBot.findWindow(null, '运行');
    console.log(hwnd);
    
    let elements = await windowsBot.getElements(hwnd);
    console.log(elements);
}