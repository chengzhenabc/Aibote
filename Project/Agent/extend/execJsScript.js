const { spawn } = require('child_process');
const path = require('path');

function execJsScript(args){
  const nodePath = path.join(__dirname, '..', '..', '..', 'Environment/Node/node.exe');
  const cmdArgs = [args.scriptPath, ...args.args];
  
  spawn(nodePath, cmdArgs, {
    detached: true,
    stdio: 'ignore',
    shell: true
  }).unref(); // 让父进程不需要等待子进程结束
  
  return true;
}

module.exports = {
    execJsScript,
}