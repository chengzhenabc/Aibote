const axios = require('axios');
const unzipper = require('unzipper');

async function installExtend(zipUrl, outputDir) {
    try {
        console.log('正在安装插件...');
        
        const response = await axios({
            method: 'get',
            url: zipUrl,
            responseType: 'stream'
        });

        // 通过管道直接传给 unzipper
        await response.data
            .pipe(unzipper.Extract({ path: outputDir }))
            .promise(); // 返回一个 promise 确保解压完成

        console.log('安装完成！');
    } catch (error) {
        console.error('安装失败:', error.message);
    }
}

module.exports = installExtend
