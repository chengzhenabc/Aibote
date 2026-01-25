const AiBot = require('AiBot');//引用WindowsBot模块

//注册主函数
AiBot.registerMain(aiMain, "127.0.0.1", 56678);

/**用作代码提示，windowsMain函数会被多次调用，注意使用全局变量
* @param {AiBot} aiBot
*/
async function aiMain(aiBot) {
    // const savePath = "d:\\1.mp4";
    // const prompt = "一位精致美丽，穿着得体的女性正在介绍他手上的东西。生成超写实高清视频";
    // let aspectRatio = "9:16";
    // let duration = 10;
    // let size = "small";
    // let referImagePath = "C:\\Users\\mengyuan\\Desktop\\line_drawing_output.png";
    // let result = await aiBot._sora(savePath, prompt, aspectRatio, duration, size, referImagePath);
    // console.log(result);

    // //await aiBot._sora_create_character("D:\\11.mp4","0,3");
    // await aiBot._sora_create_character(result,"0,3");


    // const savePath = "d:\\1.png";
    // const prompt = "创建一个由四张参考图组成的四宫格拼图（2x2网格），每张参考图占据一个格子。内容应忠实于原图。";
    // let aspectRatio = "1:1";
    // let imageSize = "2K";
    // let referImagePath = ['C:\\Users\\mengyuan\\Desktop\\11.png',
    // 'C:\\Users\\mengyuan\\Desktop\\22.png',
    // 'C:\\Users\\mengyuan\\Desktop\\33.png',
    // 'C:\\Users\\mengyuan\\Desktop\\44.png'];
    // let result = await aiBot._nanoBanana(savePath, prompt, aspectRatio, imageSize, referImagePath);
    // console.log(result);
}