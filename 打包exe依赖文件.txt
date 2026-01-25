打包exe依赖文件：

1、WindowsBot 依赖：
libxl64.dll
opencv_world470.dll
WindowsAccessBridge-64.dll
libcurl.dll
opencv_videoio_ffmpeg470_64
libusb-1.0.dll
zip.dll
Microsoft.CognitiveServices.Speech.core.dll
Microsoft.CognitiveServices.Speech.extension.audio.sys.dll
Microsoft.CognitiveServices.Speech.extension.codec.dll
Microsoft.CognitiveServices.Speech.extension.kws.dll
Microsoft.CognitiveServices.Speech.extension.kws.ort.dll
Microsoft.CognitiveServices.Speech.extension.lu.dll
Microsoft.CognitiveServices.Speech.extension.mas.dll
swscale-8.dll
swresample-5.dll
SDL2.dll
postproc-58.dll
avutil-59.dll
avformat-61.dll
avfilter-10.dll
avcodec-61.dll
WindowsDriver.exe

2、WebBot 依赖：
libcurl.dll
WebDriver.exe

3、Aibote依赖：
AiDriver.exe
avcodec-61.dll
avdevice-61.dll
avfilter-10.dll
avformat-61.dll
avutil-59.dll
cpp-pinyin.dll
ffmpeg.exe
libcurl.dll
opencv_videoio_ffmpeg490_64.dll
opencv_world490.dll
postproc-58.dll
SDL2.dll
swresample-5.dll
swscale-8.dll
dict 文件夹


4、AndroidBot 手机安装aibote.apk。hid功能依赖WindowsBot

5、部分电脑缺少环境无法启动WindowsDriver.exe和WebDriver.exe，需要安装 "提示缺少dll文件点我安装" 目录下的程序

6、脱离aibote环境打包成exe不会自动生成环境变量，假如使用node.js界面调用，需要将相关依赖文件放在ScriptUI目录下，使程序直接调用

7、注意 代码前 和 打包exe后，脚本 引用文件的“相对路径”区别

8、数字人合成短视频依赖：ffmpeg.exe

9、引入第三发node.js模块，需要切换到Aibote根目录下再使用npm安装