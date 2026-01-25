const AndroidBot = require('AndroidBot');//引用AndroidBot模块
const AiBot = require('AiBot');//引用WindowsBot模块

let gAibot = null;
//注册主函数
AiBot.registerMain((aibot)=>{
    gAibot = aibot;
}, "127.0.0.1", 56678);


//注册主函数，安卓端连接脚本会自动调用androidMain，并传递AndroidBot对象。设置服务端监听端口，手机端默认连接端口16678
AndroidBot.registerMain(androidMain, 16678);

/**用作代码提示，androidMain函数会被多次调用，注意使用全局变量
* @param {AndroidBot} androidBot
*/
async function androidMain(androidBot){
    //设置隐式等待
    await androidBot.setImplicitTimeout(10000);

    //打开抖音APP
    await androidBot.startApp("抖音");
    await androidBot.sleep(5000);

    //进入消息界面
    await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@desc=消息，按钮');

    //监控并循环评论
    while(true){
        await androidBot.setImplicitTimeout(10);
        let messageConut = await androidBot.getElementText('com.ss.android.ugc.aweme/com.ss.android.ugc.aweme:id=q3l[3]/android.widget.FrameLayout/android.widget.TextView');
        if(messageConut == null){
            await androidBot.sleep(1000);
            continue;
        }

        await androidBot.setImplicitTimeout(3000);
        await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@text=评论与弹幕');
        for(let i = 0; i < messageConut; i++){
            //获取用户消息
            const message = await androidBot.getElementText(`com.ss.android.ugc.aweme/com.ss.android.ugc.aweme:id=tbn[${i}]`);
            if(message == null)
                break;
            
            //大模型返回回复内容
            const input = [
                {role: "system", content: "根据用户的评论作出回复"},
                {role: "user", content: message}
            ];
            const result = await gAibot.agent(null, input, [], false);
            console.log(`回复内容：${result.choices[0].message.content}`);
            
            //点击回复评论
            await androidBot.clickElement(`com.ss.android.ugc.aweme/android.widget.TextView@text[${i}]=回复评论`);
            
            //设置回复内容
            await androidBot.setElementText('com.ss.android.ugc.aweme/android.widget.EditText@containsText=回复', result.choices[0].message.content);
            
            //发送
            await androidBot.clickElement('com.ss.android.ugc.aweme/android.widget.TextView@text=发送');
        }

        //返回到消息界面
        await androidBot.sleep(1000);
        await androidBot.back();
    }
}