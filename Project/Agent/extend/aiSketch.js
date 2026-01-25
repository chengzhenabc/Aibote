const { spawn } = require('child_process');
const path = require('path');

function aiSketch(args) {
  const pythonPath = "script\\ai_sketch_image.exe"
  const cmdArgs = [args.imagePath];
  
  spawn(pythonPath, cmdArgs, {
    detached: true,
    stdio: 'ignore',
    shell: true
  }).unref(); // 不阻塞父进程，让脚本在后台独立运行
  
  return true;
}

module.exports = {
    aiSketch,
}