
import re,os,time,json,requests
from ast import literal_eval
import base64
from urllib import request as request_lib, parse


class ColorOperation:
    """
        图色操作
    """
    def save_screenshot(self, hwnd: str, save_path: str, region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0), mode: bool = False) -> bool:
        """
            截图
            screenshot

            hwnd: 窗口句柄
            save_path: 图片存储路径
            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            algorithm:
                处理截图所用算法和参数，默认保存原图，
                ``algorithm = (algorithm_type, threshold, max_val)``
                按元素顺序分别代表：
                0. ``algorithm_type`` 算法类型
                1. ``threshold`` 阈值
                2. ``max_val`` 最大值

                ``threshold`` 和 ``max_val`` 同为 255 时灰度处理.
                    ``algorithm_type`` 算法类型说明:
                        0. ``THRESH_BINARY``      算法，当前点值大于阈值 `threshold` 时，取最大值 ``max_val``，否则设置为 0；
                        1. ``THRESH_BINARY_INV``  算法，当前点值大于阈值 `threshold` 时，设置为 0，否则设置为最大值 max_val；
                        2. ``THRESH_TOZERO``      算法，当前点值大于阈值 `threshold` 时，不改变，否则设置为 0；
                        3. ``THRESH_TOZERO_INV``  算法，当前点值大于阈值 ``threshold`` 时，设置为 0，否则不改变；
                        4. ``THRESH_TRUNC``       算法，当前点值大于阈值 ``threshold`` 时，设置为阈值 ``threshold``，否则不改变；
                        5. ``ADAPTIVE_THRESH_MEAN_C``      算法，自适应阈值；
                        6. ``ADAPTIVE_THRESH_GAUSSIAN_C``  算法，自适应阈值；

            mode: 操作模式，后台 true，前台 false, 默认前台操作
            return: "False"或者 "True"
        """

        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255

        return "true" in self.SendData("saveScreenshot", hwnd, save_path, *region, algorithm_type, threshold, max_val,mode)

    def get_color(self, hwnd: str, x: float, y: float, mode: bool = False) -> str:
        """
            获取指定坐标点的色值

            hwnd: 窗口句柄
            x: x 坐标；
            y: y 坐标；
            mode: 操作模式，后台 True，前台 False, 默认前台操作
            return: 色值字符串(#008577)或者 None
        """
        response = self.SendData("getColor", hwnd, x, y, mode)
        if response == "null":
            return None
        return response

    def find_color(self, hwnd: str, color: str, sub_colors: tuple = (), region: tuple = (0, 0, 0, 0),similarity: float = 0.9, mode: bool = False, wait_time: float = 5, interval_time: float = 0.5)  -> tuple:
        """
            获取指定色值的坐标点，返回坐标或者 None

            hwnd: 窗口句柄
            color: 颜色字符串，必须以 # 开头，例如：#008577
            sub_colors: 辅助定位的其他颜色
            region: 在指定区域内找色，默认全屏
            similarity: 相似度，0-1 的浮点数，默认 0.9
            mode: 操作模式，后台 true，前台 false, 默认前台操作
            wait_time: 等待时间，默认取 self.wait_timeout
            interval_time: 轮询间隔时间，默认取 self.interval_timeout
            return: 成功返回{x:number, y:number} 失败返回None
        """

        if sub_colors:
            sub_colors_str = ""
            for sub_color in sub_colors:
                offset_x, offset_y, color_str = sub_color
                sub_colors_str += f"{offset_x}/{offset_y}/{color_str}\n"
            sub_colors_str = sub_colors_str.strip()
        else:
            sub_colors_str = "null"

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("findColor", hwnd, color, sub_colors_str, *region, similarity, mode)
            if response == "-1.0|-1.0":
                time.sleep(interval_time)
            else:
                x, y = response.split("|")
                return (x,y)

        return None

    def compare_color(self, hwnd: str, main_x: float, main_y: float, color: str, sub_colors: tuple = (), region: tuple = (0, 0, 0, 0), similarity: float = 0.9, mode: bool = False) -> bool:
        """
            比较指定坐标点的颜色值

            hwnd: 窗口句柄；
            main_x: 主颜色所在的X坐标；
            main_y: 主颜色所在的Y坐标；
            color: 颜色字符串，必须以 # 开头，例如：#008577；
            sub_colors: 辅助定位的其他颜色；
            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            similarity: 相似度，0-1 的浮点数，默认 0.9；
            mode: 操作模式，后台 true，前台 false, 默认前台操作；
            return: True或者 False
        """

        if sub_colors:
            sub_colors_str = ""
            for sub_color in sub_colors:
                offset_x, offset_y, color_str = sub_color
                sub_colors_str += f"{offset_x}/{offset_y}/{color_str}\n"
            sub_colors_str = sub_colors_str.strip()
        else:
            sub_colors_str = "null"
        return "true" in self.SendData("compareColor", hwnd, main_x, main_y, color, sub_colors_str, *region, similarity,mode)

    def extract_image_by_video(self, video_path: str, save_folder: str, jump_frame: int = 1) -> bool:
        """
            提取视频帧

            video_path: 视频路径
            save_folder: 提取的图片保存的文件夹目录
            jump_frame: 跳帧，默认为1 不跳帧
            return: True或者False
        """
        return "true" in self.SendData("extractImageByVideo", video_path, save_folder, jump_frame)

    def crop_image(self, image_path, save_path, left, top, rigth, bottom) -> bool:
        """
            裁剪图片

            image_path: 图片路径
            save_path: 裁剪后保存的图片路径
            left: 裁剪的左上角横坐标
            top: 裁剪的左上角纵坐标
            rigth: 裁剪的右下角横坐标
            bottom: 裁剪的右下角纵坐标
            return: True或者False
        """
        return "true" in self.SendData("cropImage", image_path, save_path, left, top, rigth, bottom) 

    def find_images(self, hwnd_or_big_image_path: str, image_path: str, region: tuple = (0, 0, 0, 0), algorithm: tuple = (0, 0, 0), similarity: float = 0.9, mode: bool = False, multi: int = 1, wait_time: float = 5, interval_time: float = 0.5) -> list:
        """
            寻找图片坐标，在当前屏幕中寻找给定图片中心点的坐标，返回坐标列表

            hwnd_or_big_image_path: 窗口句柄或者图片路径；
            image_path: 图片的绝对路径；
            region: 从指定区域中找图，默认全屏；
            algorithm: 处理屏幕截图所用的算法，默认原图，注意：给定图片处理时所用的算法，应该和此方法的算法一致；
            similarity: 相似度，0-1 的浮点数，默认 0.9；
            mode: 操作模式，后台 true，前台 false, 默认前台操作；
            multi: 返回图片数量，默认1张；
            wait_time: 等待时间，默认取 self.wait_timeout；
            interval_time: 轮询间隔时间，默认取 self.interval_timeout；
            return: 成功返回 单坐标点[{x:number, y:number}]，多坐标点[{x1:number, y1:number}, {x2:number, y2:number}...] 失败返回空[]

            thresholdType算法类型：
                0   THRESH_BINARY算法，当前点值大于阈值thresh时，取最大值maxva，否则设置为0
                1   THRESH_BINARY_INV算法，当前点值大于阈值thresh时，设置为0，否则设置为最大值maxva
                2   THRESH_TOZERO算法，当前点值大于阈值thresh时，不改变，否则设置为0
                3   THRESH_TOZERO_INV算法，当前点值大于阈值thresh时，设置为0，否则不改变
                4   THRESH_TRUNC算法，当前点值大于阈值thresh时，设置为阈值thresh，否则不改变
                5   ADAPTIVE_THRESH_MEAN_C算法，自适应阈值
                6   ADAPTIVE_THRESH_GAUSSIAN_C算法，自适应阈值
                thresh阈值，maxval最大值，threshold默认保存原图。thresh和maxval同为255时灰度处理
        """

        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255

        end_time = time.time() + wait_time
        while time.time() < end_time:
            if hwnd_or_big_image_path.isdigit():
                response = self.SendData("findImage", hwnd_or_big_image_path, image_path, *region, similarity,
                                            algorithm_type,
                                            threshold, max_val, multi, mode)
            else:
                response = self.SendData("findImageByFile", hwnd_or_big_image_path, image_path, *region, similarity,
                                            algorithm_type,
                                            threshold, max_val, multi, mode)
            if response in ["-1.0|-1.0", "-1|-1"]:
                time.sleep(interval_time)
                continue
            else:
                image_points = response.split("/")
                point_list = []
                for point_str in image_points:
                    x, y = point_str.split("|")
                    point_list.append((float(x), float(y)))
                return point_list
        return []

    def find_dynamic_image(self, hwnd: str, interval_ti: int, region: tuple = (0, 0, 0, 0), mode: bool = False, wait_time: float = 5, interval_time: float = 0.5) -> list:
        """
            找动态图，对比同一张图在不同时刻是否发生变化，返回坐标列表

            hwnd: 窗口句柄
            interval_ti: 前后时刻的间隔时间，单位毫秒
            region: 在指定区域找图，默认全屏
            mode: 操作模式，后台 true，前台 false, 默认前台操作
            wait_time: 等待时间，默认取 self.wait_timeout
            interval_time: 轮询间隔时间，默认取 self.interval_timeout
            return: 成功返回 单坐标点[{x:number, y:number}]，多坐标点[{x1:number, y1:number}, {x2:number, y2:number}...] 失败返回空[]
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("findAnimation", hwnd, interval_ti, *region, mode)
            if response == "-1|-1":
                time.sleep(interval_time)
                continue
            else:
                image_points = response.split("/")
                point_list = []
                for point_str in image_points:
                    x, y = point_str.split("|")
                    point_list.append((float(x), float(y)))
                return point_list
        return []

class DigitalHumanOperation:
    """
        数字人
    """

    def init_metahuman(self, metahuman_mde_path: str, metahuman_scale_width: int, metahuman_scale_height: int, is_update_metahuman: bool = False, enable_random_image: bool = False ) -> bool:
        """
            初始化数字人，第一次初始化需要一些时间

            metahuman_mde_path: 数字人模型路径
            metahuman_scale_width: 数字人宽度缩放倍数，1为原始大小。为2时放大一倍，0.5则缩小一半
            metahuman_scale_height: 数字人高度缩放倍数，1为原始大小。为2时放大一倍，0.5则缩小一半
            is_update_metahuman: 是否强制更新，默认fasle。为true时强制更新会拖慢初始化速度
            enable_random_image: 是否启用随机对比度、亮度和形变 参数，默认Fasle
            return: True或者False
        """
        return "true" in self.SendData("initMetahuman", metahuman_mde_path, metahuman_scale_width, metahuman_scale_height, is_update_metahuman, enable_random_image) 

    def metahuman_speech(self, save_voice_folder: str, text: str, language: str, voice_name: str, quality: int = 0, wait_play_sound: bool = True, speech_rate: int = 0, voice_style: str = "General") -> bool:
        """
            数字人说话，此函数需要调用 initSpeechService 初始化语音服务

            save_voice_folder: 保存的发音文件目录，文件名以0开始依次增加，扩展为.mp3格式
            text: 要转换语音的文本
            language: 语言，参考开发文档 语言和发音人
            voice_name: 发音人，参考开发文档 语言和发音人
            quality: 音质，0低品质  1中品质  2高品质， 默认为0低品质
            wait_play_sound: 等待音频播报完毕，默认为 true等待
            speech_rate:  语速，默认为0，取值范围 -100 至 200
            voice_style: 语音风格，默认General常规风格，其他风格参考开发文档 语言和发音人
            return: True或者False
        """
        return  "false" not in self.SendData("metahumanSpeech", save_voice_folder, text, language, voice_name, quality,wait_play_sound, speech_rate, voice_style) 

    def metahuman_speech_cache(self, save_voice_folder: str, text: str, language: str, voice_name: str, quality: int = 0, wait_play_sound: bool = True, speech_rate: int = 0, voice_style: str = "General") -> bool:
        """
            数字人说话缓存模式，需要调用 initSpeechService 初始化语音服务。函数一般用于常用的话术播报，非常用话术切勿使用，否则内存泄漏

            save_voice_folder: 保存的发音文件目录，文件名以0开始依次增加，扩展为.wav格式
            text: 要转换语音的文本
            language: 语言，参考开发文档 语言和发音人
            voice_name: 发音人，参考开发文档 语言和发音人
            quality: 音质，0低品质  1中品质  2高品质， 默认为0低品质
            wait_play_sound: 等待音频播报完毕，默认为 true等待
            speech_rate:  语速，默认为0，取值范围 -100 至 200
            voice_style: 语音风格，默认General常规风格，其他风格参考开发文档 语言和发音人
            return: True或者False
        """
        return "true" in self.SendData("metahumanSpeechCache", save_voice_folder, text, language, voice_name, quality, wait_play_sound, speech_rate, voice_style)

    def metahuman_insert_video(self, video_file_path: str, audio_file_path: str, wait_play_video: bool = True) -> bool:
        """
            数字人插入视频

            video_file_path: 插入的视频文件路径
            audio_file_path: 插入的音频文件路径
            wait_play_video: 等待视频播放完毕，默认为 true等待
            return: True或者False
        """
        return "true" in self.SendData("metahumanInsertVideo", video_file_path, audio_file_path, wait_play_video) 

    def replace_background(self, bg_file_path: str, replace_red: int = -1, replace_green: int = -1, replace_blue: int = -1, sim_value: int = 0) -> bool:
        """
            替换数字人背景

            bg_file_path: 数字人背景 图片/视频 路径，默认不替换背景。仅替换绿幕背景的数字人模型
            replace_red: 数字人背景的三通道之一的 R通道色值。默认-1 自动提取
            replace_green: 数字人背景的三通道之一的 G通道色值。默认-1 自动提取
            replace_blue: 数字人背景的三通道之一的 B通道色值。默认-1 自动提取
            sim_value: 相似度。 默认为0，取值应当大于等于0
            return: True或者False
        """
        return "true" in self.SendData("replaceBackground", bg_file_path, replace_red, replace_green, replace_blue, sim_value) 

    def show_speech_text(self, origin_y: int = 0, font_type: str = "Arial", font_size: int = 30, font_red: int = 128,font_green: int = 255, font_blue: int = 0, italic: bool = False,underline: bool = False) -> bool:
        """
            显示数字人说话的文本

            origin_y, 第一个字显示的起始Y坐标点。 默认0 自适应高度
            font_type, 字体样式，支持操作系统已安装的字体。例如"Arial"、"微软雅黑"、"楷体"
            font_size, 字体的大小。默认30
            font_red, 字体颜色三通道之一的 R通道色值。默认128
            font_green, 字体颜色三通道之一的 G通道色值。默认255
            font_blue, 字体颜色三通道之一的 B通道色值。默认0
            italic, 是否斜体,默认false
            underline, 是否有下划线,默认false
            return: True或者False
        """
        return "true" in self.SendData("showSpeechText", origin_y, font_type, font_size, font_red, font_green, font_blue,italic, underline) 

    def make_metahuman_video(self, save_video_folder: str, text: str, language: str, voice_name: str, bg_file_path: str, sim_value: float = 0, voice_style: str = "General", quality: int = 0, speech_rate: int = 0,) -> bool:
        """
            生成数字人短视频，此函数需要调用 initSpeechService 初始化语音服务

            save_video_folder: 保存的视频目录
            text: 要转换语音的文本
            language: 语言，参考开发文档 语言和发音人
            voice_name: 发音人，参考开发文档 语言和发音人
            bg_file_path: 数字人背景 图片/视频 路径，扣除绿幕会自动获取绿幕的RGB值，null 则不替换背景。仅替换绿幕背景的数字人模型
            sim_value: 相似度，默认为0。此处参数用作绿幕扣除微调RBG值。取值应当大于等于0
            voice_style: 语音风格，默认General常规风格，其他风格参考开发文档 语言和发音人
            quality: 音质，0低品质  1中品质  2高品质， 默认为0低品质
            speech_rate:  语速，默认为0，取值范围 -100 至 200
            return: True或者False
        """
        return "true" in self.SendData("makeMetahumanVideo", save_video_folder, text, language, voice_name, bg_file_path, sim_value, voice_style, quality, speech_rate) 

    def init_speech_clone_service(self, api_key: str, voice_id: str) -> bool:
        """
            初始化数字人声音克隆服务(不支持win 7系统)  声音克隆服务卡密获取网站：elevenlabs.io

            api_key: API密钥
            voice_id: 声音ID
            return: True或者False
        """
        return "true" in self.SendData("initSpeechCloneService", api_key, voice_id) 

    def metahuman_speech_clone(self, save_audio_path: str, text: str, language: str = "zh-cn", wait_play_sound: bool = True) -> bool:
        """
            数字人使用克隆声音说话，此函数需要调用 initSpeechCloneService 初始化语音服务

            save_audio_path: 保存的发音文件路径, 这里是文件路径，不是目录！
            text: 要转换语音的文本
            language: 语言，中文：zh-cn，其他语言：other-languages
            wait_play_sound: 等待音频播报完毕，默认为 true等待
            return: True或者False
        """
        return "true" in self.SendData("metahumanSpeechClone", save_audio_path, text, language, wait_play_sound) 

    def make_metahuman_video_clone(self, save_video_folder: str, text: str, language: str = "zh-cn", bg_file_path: str = "", sim_value: int = 0) -> bool:
        """
            使用克隆声音生成数字人短视频，此函数需要调用 initSpeechCloneService 初始化语音服务

            save_video_folder: 保存的视频和音频文件目录
            text: 要转换语音的文本
            language: 语言，语言，中文：zh-cn，其他语言：other-languages
            bg_file_path: 数字人背景 图片/视频 路径，扣除绿幕会自动获取绿幕的RGB值，null 则不替换背景。仅替换绿幕背景的数字人模型
            sim_value: 相似度，默认为0。此处参数用作绿幕扣除微调RBG值。取值应当大于等于0
            return: True或者False
        """
        return "true" in self.SendData("makeMetahumanVideoClone", save_video_folder, text, language, bg_file_path, sim_value) 


    def make_metahuman_speech_file_clone(self, save_audio_path: str, text: str, language: str = "zh-cn") -> bool:
        """
            生成数字人说话文件(声音克隆)，生成MP3文件和 lab文件，提供给 metahumanSpeechByFile 和使用

            save_audio_path: 保存的发音文件路径。这里是路径，不是目录！
            text: 要转换语音的文本
            language: 语言，中文：zh-cn，其他语言：other-languages
            return: True或者False
        """
        return "true" in self.SendData("makeMetahumanSpeechFileClone", save_audio_path, text, language) 

    def metahuman_speech_byFile(self, audio_path: str, wait_play_sound : bool = True) -> bool:
        """
            数字人说话文件缓存模式

            audio_path: 音频路径， 同名的 .lab文件需要和音频文件在同一目录下
            wait_play_sound: 是否等待播报完毕，默认为true 等待
            return: True或者False
        """
        return "true" in self.SendData("metahumanSpeechByFile", audio_path, wait_play_sound) 

    def metahuman_speech_break(self) -> bool:
        """
            打断数字人说话，一般用作人机对话场景。metahumanSpeech和metahumanSpeechCache的 waitPlaySound 参数 设置为false时，此函数才有意义

            return: 返回true打断正在说话， 返回false 则为未说话状态
        """
        return "true" in self.SendData("metahumanSpeechBreak") 

    def make_metahuman_speech_file(self, save_audio_path: str, text: str, language: str = "zh-cn", voice_name: str = "", quality: int = 0, speech_rate: int = 0, voice_style: str = "General") -> bool:
        """
            生成数字人说话文件，生成MP3文件和 lab文件，提供给 metahumanSpeechByFile 和使用

            save_audio_path: 保存的音频文件路径，扩展为.MP3格式。同名的 .lab文件需要和音频文件在同一目录下
            text: 要转换语音的文本
            language: 语言，参考开发文档 语言和发音人
            voice_name: 发音人，参考开发文档 语言和发音人
            quality: 音质，0低品质  1中品质  2高品质， 默认为0低品质
            speech_rate: 语速，默认为0，取值范围 -100 至 200
            voice_style: 语音风格，默认General常规风格，其他风格参考开发文档 语言和发音人
            return: True或者False
        """
        return "true" in self.SendData("makeMetahumanSpeechFile", save_audio_path, text, language, voice_name, quality, speech_rate, voice_style) 

    def switch_action(self, call_apiKey: str, action_video_or_image: str, user_simValue: bool) -> bool:
        """
            切换新的人物形象动作，此函数无需训练数字人模型，直接切换各种人物形象动作和场景

            call_apiKey: 调用函数的密钥
            action_video_or_image: 闭嘴的人物视频或者图片
            user_simValue: 是否使用近似值加速(影响精度)，默认不加速
            return: True或者False
        """
        return "true" in self.SendData("switchAction", call_apiKey, action_video_or_image, user_simValue) 

    def train_human_model(self, call_apiKey: str, train_video_or_image: str, src_metahuman_model_path: str, save_human_model_folder: str) -> bool:
        """
            训练数字人，训练时长为10-30分钟

            call_apiKey: 调用函数的密钥
            train_video_or_image: 闭嘴的人物视频或者图片 素材
            src_metahuman_model_path: 预训练数字人模型路径
            save_human_model_folder: 保存训练完成的模型目录
            return: True或者False
        """
        return "true" in self.SendData("trainHumanModel", call_apiKey, train_video_or_image, src_metahuman_model_path, save_human_model_folder) 

    def make_metahuman_video_by_file(self, audio_path: str, bg_file_path: str, sim_value: str = 0) -> bool:
        """
            通过音频文件生成数字人短视频， 此函数依赖 initMetahuman 函数运行，否则程序会崩溃

            audio_path: 字符串型，音频路径， 同名的 .lab文件需要和音频文件在同一目录下
            bg_file_path: 字符串型，数字人背景 图片/视频 路径，扣除绿幕会自动获取绿幕的RGB值，null 则不替换背景。仅替换绿幕背景的数字人模型
            sim_value: 整型，相似度，默认为0。此处参数用作绿幕扣除微调RBG值。取值应当大于等于0
            return: True 或者 False
        """
        return "true" in self.SendData("makeMetahumanVideoByFile", audio_path, bg_file_path, sim_value) 

    def get_switch_action_state(self) -> bool:
        """
            获取切换人物形象动作状态
   
            return: True或者False
        """
        return "true" in self.SendData("getSwitchActionState") 

    def make_clone_audio(self, clone_server_ip: str, save_audio_path: str, refer_audio_path: str, refer_text: str, clone_text: str, speed_factor: float) -> bool:
        """
            克隆声音，需要部署服务端

            clone_server_ip: 克隆声音服务端IP
            save_audio_path: 保存克隆声音的路径
            refer_audio_path: 参考音频路径，10-40秒，推荐25秒左右的参考音频
            refer_text: 参考音频对应的文本
            clone_text: 要克隆的文本
            speed_factor: 语速（0.5为半速，1.0为正常速度，1.5为1.5倍速，以此类推）。默认为1.0 正常语速
            return: True或者False
        """
        return "true" in self.SendData("makeCloneAudio", clone_server_ip ,save_audio_path, refer_audio_path, refer_text, clone_text, speed_factor)


    def make_clone_lab(self, lab_server_ip: str, audio_path: str) -> bool:
        """
            生成lab文件，需要部署服务端

            lab_server_ip: 保存的发音文件路径。这里是路径，不是目录！
            audio_path: 要转换语音的文本
            return: True或者False
        """
        return "true" in self.SendData("makeCloneLab", lab_server_ip, audio_path) 

    def clone_audio_to_text(self, lab_server_ip: str, audio_path: str) -> bool:
        """
            语音识别，需要部署服务端

            lab_server_ip: lab服务端IP
            audio_path: 音频文件
            return: 失败返回None, 成功返回识别到的内容
        """
        return "true" in self.SendData("cloneAudioToText", lab_server_ip, audio_path)
    
    def text_to_audio_and_lab_file(self, save_audio_path: str, text: str, language: str = "zh-cn", voice_name: str = "", quality: int = 0, speech_rate: int = 0, voice_style: str = "General") -> bool:
        """
            文本合成语音保存到本地音频文件

            save_audio_path: 保存的音频文件路径，扩展为.MP3格式。同名的 .lab文件需要和音频文件在同一目录下
            text: 要转换语音的文本
            language: 语言，参考开发文档 语言和发音人
            voice_name: 发音人，参考开发文档 语言和发音人
            quality: 音质，0低品质  1中品质  2高品质， 默认为0低品质
            speech_rate: 语速，默认为0，取值范围 -100 至 200
            voice_style: 语音风格，默认General常规风格，其他风格参考开发文档 语言和发音人
            return: True或者False
        """
        return "true" in self.SendData("textToAudioAndLabFile", save_audio_path, text, language, voice_name, quality, speech_rate, voice_style)
    

    def switch_clone_audio_model(self, clone_server_ip: str, gpt_weights_path: str, sovits_weights_path: str) -> bool:
        """
            切换声音克隆模型，需要部署服务端(切换到与原模型无关音色的模型，切记更换参考音频和文本)

            clone_server_ip: 克隆声音服务端
            gpt_weights_path: gpt 模型权重路径。指克隆服务所在的电脑/服务器 路径
            sovits_weights_path: sovits 模型权重路径。指克隆服务所在的电脑/服务器 路径
            return: 成功返回True，失败返回False
        """
        return "true" in self.SendData("switchCloneAudioModel", clone_server_ip, gpt_weights_path, sovits_weights_path)
    

    def restart_clone_audio_server(self, clone_server_ip: str) -> bool:
        """
            重启声音克隆服务，需要部署服务端

            clone_server_ip: 克隆声音服务端
            return: 成功返回True，失败返回False
        """
        return "true" in self.SendData("restartCloneAudioServer", clone_server_ip)


    def play_audio(self, audio_path: str, is_wait: bool = True) -> bool:
        """
            播报音频文件 不需要lab文件

            audio_path: 音频文件路径
            is_wait: 是否等待，为True时，等待播放完毕
            return: 成功返回True，失败返回False
        """
        return "true" in self.SendData("playAudio", audio_path, is_wait)
    

    def play_media(self, video_path: str, video_sacle: float = 1.0, isLoop_play: bool = False, enable_random_param: bool = False, is_wait: bool = True) -> bool:
        """
            播报视频文件 (多个视频切换播放 视频和音频编码必须一致)

            video_path: 视频文件路径
            video_sacle: 视频缩放（0.5缩小一半，1.0为原始大小）
            isLoop_play: 是否循环播放
            enable_random_param: 是否启用随机去重参数
            is_wait: 是否等待播报完毕。值为false时，不等待播放结束。未播报结束前再次调用此函数 会终止前面的播报内容
            return: 成功返回True，失败返回False
        """

        return "true" in self.SendData("playMedia", video_path, video_sacle, isLoop_play, enable_random_param, is_wait)
    

    def extract_audio(self, video_path: str) -> bool:
        """
            复制视频中的音频为mp3文件

            video_path: 视频文件路径 音频文件保存为mp3和视频在一个目录
            return: 成功返回True，失败返回False
        """
        
        return "true" in self.SendData("extractAudio", video_path)


    def set_media_volume_scale(self, volume_scale: float) -> bool:
        """
            调节 playMedia 音量大小(底层用的内存共享，支持多进程控制)

            volume_scale: 浮点型，音量缩放（0.5调低一半，1.0为原始音量大小）。默认为原始大小
            return: 总是返回True
        """
        
        return "true" in self.SendData("setMediaVolumeScale", volume_scale)


    def metahuman_speech_by_file_ex(self, audio_path: str, enable_random_param: bool , wait_play_sound: bool = True) -> bool:
        """
            数字人说话文件缓存模式(Ex)，不能与 PlayAudioEx 同步执行

            audio_path: 音频路径， 同名的 .lab文件需要和音频文件在同一目录下。若.lab文件不存在，则自动生成.lab文件。生成.lab文件产生的费用，请联系管理员
            enable_random_param: 是否启用随机去重参数
            wait_play_sound : 是否等待播报完毕，默认为True 等待。为False时 多次调用此函数会添加到队列按顺序播报
            return: 成功返回True，失败返回False

        """
        
        return "true" in self.SendData("metahumanSpeechByFileEx", audio_path, enable_random_param, wait_play_sound)
    

    def play_audio_ex(self, audio_path, enable_random_param, is_wait) -> bool:
        """
            播报音频文件(EX)，不能与 metahumanSpeechByFileEx 同步执行

            audio_path: 音频文件路径
            enable_random_param: 是否启用随机去重参数
            is_wait : 是否等待。为true时,等待播放完毕
            return: 总是返回true，函数仅添加播放音频文件到队列不处理返回
        """
        
        return "true" in self.SendData("playAudioEx", audio_path, enable_random_param, is_wait)

class DrivingOperation:
    """
        驱动操作
    """

    def close_driver(self) -> bool:
        """
            远程部署时关闭WindowsDriver.exe驱动程序

            return: 布尔值
        """

        return "true" in self.SendData("closeDriver")

    def close_driver_local(self) -> bool:
        """
            本地部署时关闭WindowsDriver.exe驱动程序(避免堆积大量WindowsDriver.exe进程占用系统资源)

            return: 布尔值
        """

        os.system('taskkill /f /t /im  "WindowsDriver.exe"')
        return True 

    def activate_frame(self, secret_key) -> str:
        """
            激活Windows框架

            secret_key：激活框架的秘钥
            return: 成功返回True失败返回False

        """

        response = self.SendData("activateFrame", secret_key) 
        return response

    def get_extend_param(self) -> str:
        """
            获取驱动程序命令行参数(不包含ip和port)

            return: 成功返回参数，失败返回None
        """

        response = self.SendData("getExtendParam")
        if response == "null":
            return None
        return response

    def get_windows_id(self) -> str:
        """
            获取Windows 唯一ID用于区分机器

            return: 成功返回参数，失败返回None
        """

        response = self.SendData("getWindowsId")
        if response == "null":
            return None
        return response
    
class ElementOperation:
    """
        元素操作
    """
    def get_element_name(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> str:
        """
            获取元素名称

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认 0.5秒
            return: 元素名称字符串或 None
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementName", hwnd, xpath)
            if response == "null":
                time.sleep(interval_time)
                continue
            else:
                return response
        return None

    def get_element_value(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> str:
        """
            获取元素文本(可编辑的那种文本)

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 元素文本字符串或 None
        """
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementValue", hwnd, xpath)
            if response == "null":
                time.sleep(interval_time)
                continue
            else:
                return response
        return None

    def get_element_rect(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> tuple:
        """
            获取元素矩形，返回左上和右下坐标

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间，默认取 self.wait_timeout；
            interval_time: 轮询间隔时间，默认取 self.interval_timeout；
            return: 左上和右下坐标

        """
        if wait_time is None:
            wait_time = self.wait_timeout

        if interval_time is None:
            interval_time = self.interval_timeout

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementRect", hwnd, xpath)
            if response == "-1|-1|-1|-1":
                time.sleep(interval_time)
                continue
            else:
                x1, y1, x2, y2 = response.split("|")
                return ((float(x2)+float(x1))/2,(float(y2)+float(y1))/2)
        return ()

    def get_element_window(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> str:
        """
            获取元素窗口句柄

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 元素窗口句柄字符串或 None
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementWindow", hwnd, xpath)
            if response == "null":
                time.sleep(interval_time)
                continue
            else:
                return response
        return None

    def click_element(self, hwnd: str, xpath: str, typ: int, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            点击元素

            hwnd: 窗口句柄
            xpath: 元素路径
            typ: 操作类型，单击左键:1 单击右键:2 按下左键:3 弹起左键:4 按下右键:5 弹起右键:6 双击左键:7 双击右键:8
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return:  成功返回True 失败返回 False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData('clickElement', hwnd, xpath, typ)
            if response == "false":
                time.sleep(interval_time)
                continue
            else:
                return True
        return False

    def invoke_element(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            执行元素默认操作(一般是点击操作)

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间，默认取 self.wait_timeout；
            interval_time: 轮询间隔时间，默认取 self.interval_timeout；
            return: 成功返回True 失败返回 False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData('invokeElement', hwnd, xpath)
            if response == "false":
                time.sleep(interval_time)
                continue
            else:
                return True
        return False

    def set_element_focus(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            设置元素作为焦点

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间，默认取 5秒
            param interval_time: 轮询间隔时间，默认取 0.5秒
            return: 成功返回True 失败返回 False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData('setElementFocus', hwnd, xpath)
            if response == "false":
                time.sleep(interval_time)
                continue
            else:
                return True
        return False

    def set_element_value(self, hwnd: str, xpath: str, value: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            设置元素文本

            hwnd: 窗口句柄
            xpath: 元素路径
            value: 要设置的内容
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 成功返回True 失败返回 False
        """
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData('setElementValue', hwnd, xpath, value)
            if response == "false":
                time.sleep(interval_time)
                continue
            else:
                return True
        return False

    def scroll_element(self, hwnd: str, xpath: str, horizontal: int= -1, vertical: int = -1, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            滚动元素

            hwnd: 窗口句柄
            xpath: 元素路径
            horizontal: 水平百分比 -1不滚动
            vertical: 垂直百分比 -1不滚动
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 成功返回True 失败返回 False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData('setElementScroll', hwnd, xpath, horizontal, vertical)
            if response == "false":
                time.sleep(interval_time)
                continue
            else:
                return True
        return False

    def is_selected(self, hwnd: str, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            单/复选框是否选中

            hwnd: 窗口句柄
            xpath: 元素路径
            wait_time: 等待时间， 默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return:  成功返回True 失败返回 False
        """
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData('isSelected', hwnd, xpath)
            if response == "false":
                time.sleep(interval_time)
                continue
            else:
                return True
        return False

    def close_window(self, hwnd: str, xpath: str) -> bool:
        """
            关闭窗口

            hwnd: 窗口句柄
            xpath: 元素路径
            return:  成功返回True 失败返回 False
        """
        return "true" in self.SendData('closeWindow', hwnd, xpath) 

    def set_element_state(self, hwnd: str, xpath: str, state: str) -> bool:
        """
            设置窗口状态

            hwnd: 窗口句柄
            xpath: 元素路径
            state: 0正常 1最大化 2 最小化
            return:  成功返回True 失败返回 False
        """
        return "true" in self.SendData('setWindowState', hwnd, xpath, state)
    
    def get_elements(self, hwnd) -> json:
        """
            获取可见区域内的所有元素信息

            hwnd: 窗口句柄
            return: 成功返回数组json格式的元素信息，失败返回null
        """
        response = self.SendData("getElements", hwnd)
        if response == "null":
            return None
        return json.loads(response)

class ExcelOperation:
    """
        EXCEL操作
    """

    def open_excel(self, excel_path: str) -> dict:
        """
            获取Excel对象

            excel_path: excle路径
            return: excel对象或者None
        """
        response = self.SendData("openExcel", excel_path)
        if response == "null":
            return None
        return json.loads(response)

    def open_excel_sheet(self, excel_object: object, sheet_name: str) -> str:
        """
            打开excel表格

            excel_object: excel对象
            sheet_name: 表名
            return: 成功返回sheet对象，失败返回None
        """
        response = self.SendData("openExcelSheet", excel_object['book'], excel_object['path'], sheet_name)
        if response == "null":
            return None
        return response

    def save_excel(self, excel_object: object) -> bool:
        """
            保存excel文档

            excel_object: excel对象
            return: True或者False
        """
        return "true" in self.SendData("saveExcel", excel_object['book'], excel_object['path']) 

    def write_excel_num(self, excel_object: object, row: int, col: int, value: int) -> bool:
        """
            写入数字到excel表格

            excel_object: excel对象
            row: 行
            col: 列
            value: 写入的值
            return: True或者False
        """
        return "true" in self.SendData("writeExcelNum", excel_object, col, row, value) 

    def write_excel_str(self, excel_object: object, row: int, col: int, str_value: str) -> bool:
        """
            写入字符串到excel表格

            excel_object: excel对象
            row: 行
            col: 列
            str_value: 写入的值
            return: True或者False
        """
        return "true" in self.SendData("writeExcelStr", excel_object, row, col, str_value)

    def read_excel_num(self, excel_object: object, row: int, col: int) -> float:
        """
            读取excel表格数字

            excel_object: excel对象
            row: 行
            col: 列
            return: 读取的数字
        """
        response = self.SendData("readExcelNum", excel_object, col, row)
        return float(response)

    def read_excel_str(self, excel_object: object, row: int, col: int) -> str:
        """
            读取excel表格字符串

            excel_object: excel对象
            row: 行
            col: 列
            return: 读取的字符串
        """
        response = self.SendData("readExcelStr", excel_object, row, col)
        return response

    def remove_excel_row(self, excel_object: object, row_first: int, row_last: int) -> bool:
        """
            删除excel表格行

            excel_object: excel对象
            row_first: 起始行
            row_last: 结束行
            return: True或者False
        """
        return "true" in self.SendData("removeExcelRow", excel_object, row_first, row_last)

    def remove_excel_col(self, excel_object: object, col_first: int, col_last: int) -> bool:
        """
            删除excel表格列

            excel_object: excel对象
            col_first: 起始列
            col_last: 结束列
            return: True或者False
        """
        return "true" in self.SendData("removeExcelCol", excel_object, col_first, col_last) 

class KeymouseOperation:
    """
        键鼠操作
    """

    def move_mouse(self, hwnd: str, x: float, y: float, mode: bool = False, ele_hwnd: str = "0") -> bool:
        """
            移动鼠标

            hwnd: 当前窗口句柄
            x: 横坐标
            y: 纵坐标
            mode: 操作模式，后台 True，前台 False, 默认前台操作
            ele_hwnd: 元素句柄，如果 mode=True 且目标控件有单独的句柄，则需要通过 get_element_window 获得元素句柄，指定 ele_hwnd 的值(极少应用窗口由父窗口响应消息，则无需指定)
            return: 总是返回True
        """
        return "true" in self.SendData("moveMouse", hwnd, x, y, mode, ele_hwnd)

    def move_mouse_relative(self, hwnd: str, x: float, y: float, mode: bool = False) -> bool:
        """
            移动鼠标(相对坐标)

            hwnd: 当前窗口句柄
            x: 相对横坐标
            y: 相对纵坐标
            mode: 操作模式，后台 True，前台 False, 默认前台操作
            return: 总是返回True
        """
        return "true" in self.SendData("moveMouseRelative", hwnd, x, y, mode)

    def scroll_mouse(self, hwnd: str, x: float, y: float, count: int, mode: bool = False) -> bool:
        """
            滚动鼠标

            hwnd: 当前窗口句柄
            x: 横坐标
            y: 纵坐标
            count: 鼠标滚动次数, 负数下滚鼠标, 正数上滚鼠标
            mode: 操作模式，后台 True，前台 False, 默认前台操作
            return: 总是返回True
        """
        return "true" in self.SendData("rollMouse", hwnd, x, y, count, mode)

    def click_mouse(self, hwnd: str, x: float, y: float, typ: int, mode: bool = False, ele_hwnd: str = "0") -> bool:
        """
            鼠标点击

            hwnd: 当前窗口句柄
            x: 横坐标
            y: 纵坐标
            typ: 点击类型，单击左键:1 单击右键:2 按下左键:3 弹起左键:4 按下右键:5 弹起右键:6 双击左键:7 双击右键:8
            mode: 操作模式，后台 true，前台 false, 默认前台操作
            ele_hwnd: 元素句柄，如果 mode=True 且目标控件有单独的句柄，则需要通过 get_element_window 获得元素句柄，指定 ele_hwnd 的值(极少应用窗口由父窗口响应消息，则无需指定);
            return: 总是返回True
        """
        return "true" in self.SendData("clickMouse", hwnd, x, y, typ, mode, ele_hwnd) 

    def send_keys(self, text: str) -> bool:
        """
            输入文本

            text: 输入的文本
            return: 总是返回True
        """
        return "true" in self.SendData("sendKeys", text) 

    def send_keys_by_hwnd(self, hwnd: str, text: str) -> bool:
        """
            后台输入文本(杀毒软件可能会拦截)

            hwnd: 窗口句柄
            text: 输入的文本
            return: 总是返回True
        """
        return "true" in self.SendData("sendKeysByHwnd", hwnd, text)

    def send_vk(self, vk: int, typ: int) -> bool:
        """
            输入虚拟键值(VK)

            vk: VK键值  按键对照表: http://www.atoolbox.net/Tool.php?Id=815
            typ: 输入类型，按下弹起:1 按下:2 弹起:3
            return: 总是返回True
        """
        return "true" in self.SendData("sendVk", vk, typ)

    def send_vk_by_hwnd(self, hwnd: str, vk: int, typ: int) -> bool:
        """
            后台输入虚拟键值(VK)

            hwnd: 窗口句柄
            vk: VK键值
            typ: 输入类型，按下弹起:1 按下:2 弹起:3
            return: 总是返回True
        """
        return "true" in self.SendData("sendVkByHwnd", hwnd, vk, typ)

class OcrOperation:
    """
        OCR 操作
    """

    def ocr_server_by_file(self, ocr_server_id: str, image_path: str, region: tuple = (0, 0, 0, 0), algorithm: tuple = (0, 0, 0)) -> list:
        """
            OCR 服务，通过 OCR 识别图片路径中的文字

            ocr_server_id: ocr服务端IP，端口固定为9527
            image_path: 图片路径
            region: (左上角x点, 左上角y点, 右下角 x点, 右下角 y点)
            algorithm: (二值化算法类型, 阈值, 最大值)
            return: 失败返回null，成功返回列表形式的识别结果: [[[[317, 4], [348, 4], [348, 22], [317, 22]]]]
        """
        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255

        response = self.SendData("ocrByFile", ocr_server_id, image_path, *region, algorithm_type, threshold, max_val)
        if response == "null" or response == "":
            return []
        return literal_eval(response)

    def ocr_server_by_hwnd(self, ocr_server_id: str, hwnd: str, region: tuple = (0, 0, 0, 0), algorithm: tuple = (0, 0, 0), mode: bool = False) -> list:
        """
            OCR 服务，通过 OCR 识别窗口句柄中的文字
            
            ocr_server_id: ocr服务端IP，端口固定为9527
            hwnd: Window 句柄
            region: (左上角x点, 左上角y点, 右下角 x点, 右下角 y点)
            algorithm: (二值化算法类型, 阈值, 最大值)
            mode: 操作模式，后台 true，前台 false。默认前台操作   
            return: 失败返回null，成功返回列表形式的识别结果: [[[[317, 4], [348, 4], [348, 22], [317, 22]]]]
         """
        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255

        response = self.SendData("ocrByHwnd", ocr_server_id, hwnd, *region, algorithm_type, threshold, max_val, mode)
        if response == "null" or response == "":
            return []
        return literal_eval(response)

    def get_text(self, ocr_server_id: str, hwnd_or_image_path: str, region: tuple = (0, 0, 0, 0), algorithm: tuple = (0, 0, 0), mode: bool = False) -> list:
        """
            通过 OCR 识别窗口/图片中的文字，

            ocr_server_id: ocr服务端IP，端口固定为9527
            hwnd_or_image_path: 窗口句柄或者图片路径；
            region: 识别区域，默认全屏；
            threshold二值化图片, thresholdType算法类型：
                                                      0   THRESH_BINARY算法，当前点值大于阈值thresh时，取最大值maxva，否则设置为0
                                                      1   THRESH_BINARY_INV算法，当前点值大于阈值thresh时，设置为0，否则设置为最大值maxva
                                                      2   THRESH_TOZERO算法，当前点值大于阈值thresh时，不改变，否则设置为0
                                                      3   THRESH_TOZERO_INV算法，当前点值大于阈值thresh时，设置为0，否则不改变
                                                      4   THRESH_TRUNC算法，当前点值大于阈值thresh时，设置为阈值thresh，否则不改变
                                                      5   ADAPTIVE_THRESH_MEAN_C算法，自适应阈值
                                                      6   ADAPTIVE_THRESH_GAUSSIAN_C算法，自适应阈值
                                thresh阈值，maxval最大值，threshold默认保存原图。thresh和maxval同为255时灰度处理
            mode: 操作模式，后台 True，前台 False, 默认前台操作；
            return: 返回文字列表
        """
        if hwnd_or_image_path.isdigit():
            text_info_list = self.ocr_server_by_hwnd(ocr_server_id, hwnd_or_image_path, region, algorithm, mode)
        else:
            text_info_list = self.ocr_server_by_file(ocr_server_id, hwnd_or_image_path, region, algorithm)

        return text_info_list

    def find_text(self, ocr_server_id: str, hwnd_or_image_path: str, text: str, region: tuple = (0, 0, 0, 0), algorithm: tuple = (0, 0, 0), mode: bool = False) -> list:
        """
            通过 OCR 识别窗口/图片中的文字

            ocr_server_id: ocr服务端IP，端口固定为9527
            hwnd_or_image_path: 句柄或者图片路径
            text: 要查找的文字
            region: 识别区域，默认全屏
            algorithm: 处理图片/屏幕所用算法和参数，默认保存原图
            threshold二值化图片, thresholdType算法类型：
                                                      0   THRESH_BINARY算法，当前点值大于阈值thresh时，取最大值maxva，否则设置为0
                                                      1   THRESH_BINARY_INV算法，当前点值大于阈值thresh时，设置为0，否则设置为最大值maxva
                                                      2   THRESH_TOZERO算法，当前点值大于阈值thresh时，不改变，否则设置为0
                                                      3   THRESH_TOZERO_INV算法，当前点值大于阈值thresh时，设置为0，否则不改变
                                                      4   THRESH_TRUNC算法，当前点值大于阈值thresh时，设置为阈值thresh，否则不改变
                                                      5   ADAPTIVE_THRESH_MEAN_C算法，自适应阈值
                                                      6   ADAPTIVE_THRESH_GAUSSIAN_C算法，自适应阈值
                                thresh阈值，maxval最大值，threshold默认保存原图。thresh和maxval同为255时灰度处理
            mode: 操作模式，后台 true，前台 false, 默认前台操作
            return: 文字坐标列表
        """

        if hwnd_or_image_path.isdigit():
            text_info_list = self.ocr_server_by_hwnd(ocr_server_id, hwnd_or_image_path, region, algorithm, mode)
        else:
            text_info_list = self.ocr_server_by_file(ocr_server_id, hwnd_or_image_path, region, algorithm)

        text_points = []
        for item in text_info_list:
            full_text = item["text"]
            if text in full_text:
                x1, y1, x2, y2 = item["box"]
                
                # 文本区域尺寸
                width = x2 - x1
                height = y2 - y1
                
                # 跳过空文本或无效 box
                if len(full_text) == 0 or width <= 0 or height <= 0:
                    continue
                
                # 等宽假设：每个字符宽度
                single_char_width = width / len(full_text)
                
                # 查找子串首次出现位置
                pos = full_text.find(text)
                if pos == -1:
                    continue  # 理论不会发生
                
                # 子串中心相对于 box 左上角的偏移
                sub_width = len(text) * single_char_width
                offset_x = pos * single_char_width + sub_width / 2
                offset_y = height / 2
                
                # 绝对坐标（加上 region 偏移）
                point_x = region[0] + x1 + offset_x
                point_y = region[1] + y1 + offset_y
                
                text_points.append((float(point_x), float(point_y)))
        
        return text_points

class OtherOperations:
    """
        其他操作
    """

    def download_file(self, url: str, file_path: str, is_wait: bool) -> bool:
        """
            下载文件
            Download file

            url: 文件地址
            file_path: 文件保存的路径
            is_wait: 是否等待下载完成
            return:  总是返回True
        """
        return "true" in self.SendData("downloadFile", url, file_path, is_wait)

class SystemOperation:
    """
        系统操作
    """

    def set_clipboard_text(self, text: str) -> bool:
        """
            设置剪切板内容

            text: 要设置的内容
            return: 成功返回True 失败返回 False
        """
        return "true" in self.SendData("setClipboardText", text)

    def get_clipboard_text(self) -> str:
        """
            获取剪切板内容

            return: 剪切板内容
        """
        response = self.SendData("getClipboardText")
        return  response

    def start_process(self, cmd: str, show_window=True, is_wait=False) -> bool:
        """
            启动指定程序

            cmd: 命令
            show_window: 是否显示窗口，默认显示
            is_wait: 是否等待程序结束， 默认不等待
            return: 成功返回True 失败返回 False
        """
        return "true" in self.SendData("startProcess", cmd, show_window, is_wait)

    def execute_command(self, command: str, wait_timeout: int = 3) -> str:
        """
            执行cmd命令

            command: cmd命令，不能含 "cmd"字串
            wait_timeout: 可选参数，等待结果返回超时，单位毫秒，默认3秒
            return: cmd执行结果
        """
        return  self.SendData("executeCommand", command, wait_timeout*1000)

class VerificationCodeOperation:
    """
        验证码操作
    """
    def get_captcha(self, file_path: str, username: str, password: str, soft_id: str, code_type: str, len_min: str = '0') -> dict:
        """
            识别验证码

            file_path: 图片文件路径
            username: 用户名
            password: 密码
            soft_id: 软件ID
            code_type: 图片类型 参考https://www.chaojiying.com/price.html
            len_min: 最小位数 默认0为不启用,图片类型为可变位长时可启用这个参数
            return: JSON
                err_no,(数值) 返回代码  为0 表示正常，错误代码 参考https://www.chaojiying.com/api-23.html
                err_str,(字符串) 中文描述的返回信息
                pic_id,(字符串) 图片标识号，或图片id号
                pic_str,(字符串) 识别出的结果
                md5,(字符串) md5校验值,用来校验此条数据返回是否真实有效
        """
        file = open(file_path, mode="rb")
        file_data = file.read()
        file_base64 = base64.b64encode(file_data)
        file.close()
        url = "http://upload.chaojiying.net/Upload/Processing.php"
        data = {
            'user': username,
            'pass': password,
            'softid': soft_id,
            'codetype': code_type,
            'len_min': len_min,
            'file_base64': file_base64
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        parse_data = parse.urlencode(data).encode('utf8')
        req = request_lib.Request(url, parse_data, headers)
        response = request_lib.urlopen(req)
        result = response.read().decode()
        return json.loads(result)

    def error_captcha(self, username: str, password: str, soft_id: str, pic_id: str) -> dict:
        """
            识别报错返分

            username: 用户名
            password: 密码
            soft_id: 软件ID
            pic_id: 图片ID 对应 getCaptcha返回值的pic_id 字段
            return: JSON
                err_no,(数值) 返回代码
                err_str,(字符串) 中文描述的返回信息
        """
        url = "http://upload.chaojiying.net/Upload/ReportError.php"
        data = {
            'user': username,
            'pass': password,
            'softid': soft_id,
            'id': pic_id,
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        parse_data = parse.urlencode(data).encode('utf8')
        req = request_lib.Request(url, parse_data, headers)
        response = request_lib.urlopen(req)
        result = response.read().decode()
        return json.loads(result)

    def score_captcha(self, username: str, password: str) -> dict:
        """
            查询验证码剩余题分

            username: 用户名
            password: 密码
            return: JSON
                err_no,(数值) 返回代码
                err_str,(字符串) 中文描述的返回信息
                tifen,(数值) 题分
                tifen_lock,(数值) 锁定题分
        """
        url = "http://upload.chaojiying.net/Upload/GetScore.php"
        data = {
            'user': username,
            'pass': password,
        }
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        parse_data = parse.urlencode(data).encode('utf8')
        req = request_lib.Request(url, parse_data, headers)
        response = request_lib.urlopen(req)
        result = response.read().decode()
        return json.loads(result)

class VoiceService:
    """
        语音服务
    """

    def init_speech_service(self, speech_key: str, speech_region: str) -> bool:
        """
            初始化语音服务(不支持win7)，需要调用 activateSpeechService 激活

            speech_key: 微软语音API密钥
            speech_region: 区域
            return: True或者False
        """
        return "true" in self.SendData("initSpeechService", speech_key, speech_region) 

    def audio_file_to_text(self, file_path, language: str) -> str:
        """
            音频文件转文本

            file_path: 音频文件路径
            language: 语言，参考开发文档 语言和发音人 zh-cn
            return: 转换后的音频文本或者None
        """
        response = self.SendData("audioFileToText", file_path, language)
        if response == "null":
            return None
        return response

    def microphone_to_text(self, language: str) -> str:
        """
            麦克风输入流转换文本

            language: 语言，参考开发文档 语言和发音人 zh-cn
            return: 转换后的音频文本或者None
        """
        response = self.SendData("microphoneToText", language)
        if response == "null":
            return None
        return response

    def text_to_bullhorn(self, ssml_path_or_text: str, language: str, voice_name: str) -> bool:
        """
            文本合成音频到扬声器

            ssml_path_or_text: 要转换语音的文本或者".xml"格式文件路径
            language: 语言，参考开发文档 语言和发音人 zh-cn
            voice_name: 发音人，参考开发文档 语言和发音人  zh-cn-XiaochenNeural
            return: True或者False 
        """
        return "true" in self.SendData("textToBullhorn", ssml_path_or_text, language, voice_name) 

    def text_to_audio_file(self, ssml_path_or_text: str, language: str, voice_name: str, audio_path: str) -> bool:
        """
            文本合成音频并保存到文件

            ssml_path_or_text: 要转换语音的文本或者".xml"格式文件路径
            language: 语言，参考开发文档 语言和发音人
            voice_name: 发音人，参考开发文档 语言和发音人
            audio_path: 保存音频文件路径
            return: True或者False
        """
        return "true" in self.SendData("textToAudioFile", ssml_path_or_text, language, voice_name, audio_path) 

    def microphone_translation_text(self, source_language: str, target_language: str) -> str:
        """
            麦克风音频翻译成目标语言文本

            source_language: 要翻译的语言，参考开发文档 语言和发音人
            target_language: 翻译后的语言，参考开发文档 语言和发音人
            return: 转换后的音频文本或者None
        """
        response = self.SendData("microphoneTranslationText", source_language, target_language)
        if response == "null":
            return None
        return response

    def audio_file_translation_text(self, audio_path: str, source_language: str, target_language: str) -> str:
        """
            麦克风输入流转换文本

            audio_path: 要翻译的音频文件路径
            source_language: 要翻译的语言，参考开发文档 语言和发音人
            target_language: 翻译后的语言，参考开发文档 语言和发音人
            return: 转换后的音频文本或者None
        """
        response = self.SendData("audioFileTranslationText", audio_path, source_language, target_language)
        if response == "null":
            return None
        return response

class WindowOperation:
    """
        窗口操作
    """

    def find_window(self, class_name: str = None, window_name: str = None) -> str:
        """
            查找窗口句柄，仅查找顶级窗口，不包含子窗口

            class_name: 窗口类名
            window_name: 窗口名
            return: 字符串
        """
        response = self.SendData("findWindow", class_name, window_name)
        if response == "null":
            return None
        return response

    def find_windows(self, class_name: str = None, window_name: str = None) -> str:
        """
            查找窗口句柄数组，仅查找顶级窗口，不包含子窗口 class_name 和 window_name 都为 None，则返回所有窗口句柄

            class_name: 窗口类名
            window_name: 窗口名
            return: 窗口句柄的列表
        """
        response = self.SendData("findWindows", class_name, window_name)
        if response == "null":
            return []
        return response.split("|")

    def find_sub_window(self, hwnd: str, class_name: str = None, window_name: str = None) -> str:
        """
            查找子窗口句柄

            hwnd: 当前窗口句柄
            class_name: 窗口类名
            window_name: 窗口名
            return: 子窗口句柄或 None
        """
        response = self.SendData("findSubWindow", hwnd, class_name, window_name)
        if response == "null":
            return None
        return response

    def find_parent_window(self, hwnd: str) -> str:
        """
            查找父窗口句柄

            hwnd: 当前窗口句柄
            return: 父窗口句柄或 None
        """
        response = self.SendData("findParentWindow", hwnd)
        if response == "null":
            return None
        return response

    def find_desktop_window(self) -> str:
        """
            查找桌面窗口句柄

            return: 桌面窗口句柄或None
        """
        response = self.SendData("findDesktopWindow")
        if response == "null":
            return None
        return response

    def get_window_name(self, hwnd: str) -> str:
        """
            获取窗口名称

            hwnd: 当前窗口句柄
            return: 窗口名称或 None
        """
        response = self.SendData("getWindowName", hwnd)
        if response == "null":
            return None
        return response

    def show_window(self, hwnd: str, isShow: bool) -> bool:
        """
            显示/隐藏窗口

            hwnd: 当前窗口句柄
            isShow: 显示窗口 True 隐藏窗口 False
            return: 布尔值
        """
        return "true" in self.SendData("showWindow", hwnd, isShow)

    def get_window_pos(self, hwnd: str, wait_time: float = 5, interval_time: float = 0.5) -> dict:
        """
            获取窗口大小和位置

            hwnd: 窗口句柄
            wait_time: 循环等待的总时间 默认5秒
            interval_time: 每隔多少时间重试一次 默认0.5
            return: left和top：windwos窗口最左侧为起点坐标，width和height：句柄窗口大小，或者超时返回 None
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getWindowPos", hwnd)
            if response == "-1|-1|-1|-1":
                time.sleep(interval_time)
                continue
            else:
                x1, y1, x2, y2 = response.split("|")
                return {"left": x1, "top": y1, "width": x2, "height": y2}
        return None

    def set_window_pos(self, hwnd: str, left: float, top: float, width: float, height: float) -> bool:
        """
            设置窗口位置

            hwnd: 当前窗口句柄
            left: 左上角横坐标
            top: 左上角纵坐标
            width: 窗口宽度
            height: 窗口高度
            return: 布尔值
        """
        return "true" in self.SendData("setWindowPos", hwnd, left, top, width, height)

    def set_window_top(self, hwnd: str, top: bool) -> bool:
        """
            设置窗口到最顶层

            hwnd: 当前窗口句柄
            top: 是否置顶，True 置顶， False 取消置顶
            return: 布尔值
        """
        return "true" in self.SendData("setWindowTop", hwnd, top)

    def coordinate_transform(self, coordinate: tuple, resolution_a: tuple, resolution_b: tuple) -> tuple:
        """
            根据屏幕分辨率缩放比例，进行不同分辨率坐标转换

            coordinate: 需要装换的坐标可以是x,y坐标，也可以是矩形坐标 x1, y1, x2, y2
            resolution_a: 你抓取过坐标的设备标准分辨率
            resolution_b：你需要转换的设备分辨率
            retrun: 元祖
        """
        
        def convert_coordinates(x, y, resolution_a, resolution_b):
            W_A, H_A = resolution_a  
            W_B, H_B = resolution_b 
            

            scale_x = W_B / W_A
            scale_y = H_B / H_A
            

            x_b = x * scale_x
            y_b = y * scale_y
            
            return (x_b, y_b)

        if len(coordinate) == 2:
            result = convert_coordinates(coordinate[0], coordinate[1], resolution_a, resolution_b)
            return result

        if len(coordinate) == 4:
            result = convert_coordinates(coordinate[0], coordinate[1], resolution_a, resolution_b)
            result2 = convert_coordinates(coordinate[2], coordinate[3], resolution_a, resolution_b)
            return (result[0], result[1], result2[0], result2[1])
        return ()

class WinHidCorrelation:
    """
        windows hid模式
    """

    def init_hid(self) -> bool:
        """
            初始化Hid

            return: True或者False
        """
        return "true" in self.SendData("initHid") 

    def get_hid_data(self) -> list:
        """
            获取Hid相关数据 先调用 windowsBot.initHid，再调用androidBot.initHid

            return: 激活成功的hid手机的安卓ID
        """
        response = self.SendData("getHidData")
        if response == "":
            return []
        return response.split("|")

    def hid_press(self, android_id: str, angle: int, x: float, y: float) -> bool:
        """
            按下

            android_id: 安卓id
            angle: 手机旋转角度
            x: 横坐标
            y: 纵坐标
            return: True或者False
        """
        return "void" in self.SendData("hidPress", android_id, angle, x, y) 

    def hid_release(self, android_id: str, angle: int) -> bool:
        """
            释放

            android_id: 安卓id
            angle: 手机旋转角度
            return: True或者False
        """
        return "void" in self.SendData("hidRelease", android_id, angle) 

    def hid_move(self, android_id: str, angle: int, x: float, y: float, duration: float) -> bool:
        """
            移动

            android_id: 安卓id
            angle: 手机旋转角度
            x: 横坐标
            y: 纵坐标
            duration: 移动时长,秒
            return: True或者False
        """
        return  "void" in self.SendData("hidMove", android_id, angle, x, y, duration * 1000) 

    def hid_click(self, android_id: str, angle: int, x: float, y: float) -> bool:
        """
            单击

            android_id: 安卓id
            angle: 手机旋转角度
            x: 横坐标
            y: 纵坐标
            return: True或者False
        """
        return "void" in self.SendData("hidClick", android_id, angle, x, y) 

    def hid_double_click(self, android_id: str, angle: int, x: float, y: float) -> bool:
        """
            双击

            android_id: 安卓id
            angle: 手机旋转角度
            x: 横坐标
            y: 纵坐标
            return: True或者False
        """
        return "void" in self.SendData("hidDoubleClick", android_id, angle, x, y) 

    def hid_long_click(self, android_id: str, angle: int, x: float, y: float, duration: float) -> bool:
        """
            长按

            android_id: 安卓id
            angle: 手机旋转角度
            x: 横坐标
            y: 纵坐标
            duration: 按下时长,秒
            return: True或者False
        """
        return "void" in self.SendData("hidLongClick", android_id, angle, x, y, duration * 1000) 

    def hid_swipe(self, android_id: str, angle: int, startX: float, startY: float, endX: float, endY: float, duration: float) -> bool:
        """
            滑动坐标

            android_id: 安卓id
            angle: 手机旋转角度
            startX: 起始横坐标
            startY: 起始纵坐标
            endX: 结束横坐标
            endY: 结束纵坐标
            duration: 滑动时长,秒
            return: True或者False
        """
        return "void" in self.SendData("hidSwipe", android_id, angle, startX, startY, endX, endY, duration * 1000) 

    def hid_gesture(self, android_id: str, angle: int, gesture_path: list, duration: float) -> bool:
        """
            Hid手势

            android_id: 安卓id
            angle: 手机旋转角度
            gesture_path: 手势路径，由一系列坐标点组成
            duration: 手势执行时长, 单位秒
            return: True或者False
        """
        gesture_path_str = ""
        for point in gesture_path:
            gesture_path_str += f"{point[0]}/{point[1]}/\n"
        gesture_path_str = gesture_path_str.strip()
        return "void" in self.SendData("hidDispatchGesture", android_id, angle, gesture_path_str, duration * 1000) 

    def hid_back(self, android_id: str) -> bool:
        """
            返回

            android_id: 安卓id
            return: True或者False
        """
        return "void" in self.SendData("hidBack", android_id) 

    def hid_home(self, android_id: str) -> bool:
        """
            返回桌面

            android_id: 安卓id
            return: True或者False
        """
        return "void" in self.SendData("hidHome", android_id) 

    def hid_recents(self, android_id: str) -> bool:
        """
            最近应用列表

            android_id: 安卓id
            return: True或者False
        """
        return "void" in self.SendData("hidRecents", android_id) 

class YoloOperation:
    """
        yolo目标检测
    """

    def yolo_by_hwnd(self, ocr_server_id: str, hwnd: int, region: tuple = (0, 0, 0, 0), mode: bool = False) -> list:
        """
            yolo 根据窗口句柄目标检测

            ocr_server_id: yolo服务端IP，端口固定为9528
            hwnd: 窗口句柄
            region: (左上角x点, 左上角y点, 右下角 x点, 右下角 y点)
            mode: 操作模式，后台 True，前台 False。默认前台操作 
            return: 失败返回空[]，成功返回数组形式的识别结果。 0~3目标矩形位置  4目标类别  5置信度
        """
        response = self.SendData("yoloByHwnd", ocr_server_id, hwnd, *region, mode)
        if response == "null" or response == "":
            return []
        return json.loads(response)

    def yolo_by_file(self, ocr_server_id: str, file_path: str, region: tuple = (0, 0, 0, 0)) -> list:
        """
            yolo 根据图片进行目标检测

            ocr_server_id: yolo服务端IP，端口固定为9528
            file_path: 图片路径
            region: (左上角x点, 左上角y点, 右下角 x点, 右下角 y点)
            return:  失败返回空[]，成功返回数组形式的识别结果。 0~3目标矩形位置  4目标类别  5置信度
        """
        response = self.SendData("yoloByFile", ocr_server_id, file_path, *region)
        if response == "null" or response == "":
            return []
        return json.loads(response)

    def yolo_tool_by_file(self, tool_server_ip: str, tool_server_port: str, file_path: str, is_get_class_name: str = '0') -> dict:
        """
            yolo综合工具 根据图片进行目标检测

            tool_server_ip: 工具部署电脑的IP地址 本机部署就是 127.0.0.1, 公网写公网IP
            tool_server_port： 需要和工具上面填写的端口号一致
            file_path: 图片路径
            region: (左上角x点, 左上角y点, 右下角 x点, 右下角 y点)
            is_get_class_name： 获取pt模型中所有训练的类名 0：不获取  1：获取
            return:  失败返回空{}，成功返回数组形式的识别结果。 0~3目标矩形位置  4目标类别  5置信度
        """

        url = f'http://{tool_server_ip}:{tool_server_port}/pt_model_predict'

        with open(file_path, 'rb') as f:
            image_content = f.read()

        files = {'file': image_content}
        data = {'get_class_name': is_get_class_name}

        response = requests.post(url, files=files, data=data)
        if response.status_code == 200:
            data_json = json.loads(response.text)
            return data_json
        else:
            return {}





class WinBotMain(
        DrivingOperation,
        WindowOperation,
        KeymouseOperation,
        ColorOperation,
        OcrOperation,
        YoloOperation,
        ElementOperation,
        SystemOperation,
        OtherOperations,
        ExcelOperation,
        VoiceService,
        DigitalHumanOperation,
        VerificationCodeOperation,
        WinHidCorrelation
    ):

    # @abstractmethod
    def script_main(self):
        pass
    