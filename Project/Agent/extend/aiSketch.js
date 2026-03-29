const { spawn } = require('child_process');
const fs = require('fs');
const installExtend = require('../lib/installExtend.js');//当前js文件为根目录

async function aiSketch(args) {
  const exePath = "script\\ai_sketch_image.exe";
  const cmdArgs = [args.imagePath];
  
  //脚本不存在则远程下载安装
  if(!fs.existsSync(exePath))
    await installExtend("http://124.248.66.46:81/agentExtend/ai_sketch.zip", "script");

  spawn(exePath, cmdArgs, {
    detached: true,
    stdio: 'ignore',
    shell: true
  }).unref(); // 不阻塞父进程，让脚本在后台独立运行
  
  return true;
}

module.exports = {
    aiSketch,
}