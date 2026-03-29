const { spawn } = require('child_process');
const path = require('path');

function execPyScript(args) {
  const pythonPath = path.join(__dirname, '..', '..', '..', 'Environment/Python/python.exe');
  
  const cmdArgs = [args.scriptPath, ...args.args];
  
  spawn(pythonPath, cmdArgs, {
    detached: true,
    stdio: 'ignore',
    shell: true
  }).unref(); // 不阻塞父进程，让脚本在后台独立运行
  
  return true;
}

module.exports = {
    execPyScript,
}