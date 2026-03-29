const fs = require('fs');

async function readFile(args) {
    if (!fs.existsSync(args.filePath))
        return "文件不存在";
    
    const result = await fs.readFileSync(args.filePath, 'utf8');
    return result;
}

async function writeFile(args) {
    if (!fs.existsSync(args.filePath))
        await fs.writeFileSync(args.filePath, args.data, 'utf8');
    else
        return "文件已存在，禁止写入";

    return "文件写入成功";
}

module.exports = {
    readFile,
    writeFile
}