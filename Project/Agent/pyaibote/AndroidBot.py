import re,time,json,requests
from datetime import datetime
import os,sys
from multiprocessing import Process
from abc import ABC, abstractmethod
import socketserver,socket
import subprocess
import threading,multiprocessing
import copy
import random
import platform
import traceback
import base64
from io import BytesIO


class AndroidHidCorrelation:
    """
        hid相关
    """

    def __init_accessory(self) -> bool:
        """
            初始化 android Accessory，获取手机 hid 相关的数据

            return: True或者False
        """
        return "true" in self.SendData("initAccessory") 

    def init_hid(self, win_driver) -> bool:
        """
            初始化Hid,不能重复调用，重复调用会导致get_hid_data取不到数据
            
            hid实际上是由windowsBot 通过数据线直接发送命令给安卓系统并执行，并不是由aibote.apk执行的命令。
            我们应当将所有设备准备就绪再调用此函数初始化。
            Windows initHid 和 android initAccessory函数 初始化目的是两者的数据交换，并告知windowsBot发送命令给哪台安卓设备
            win_driver: windowsDriver 实例，是调用 build_win_driver 的返回值
            return: True或者False
        """
        
        self.android_id = self.get_android_id()
        self.win_driver = win_driver
        if not self.win_driver:
            return False
        if not self.__init_accessory():
            return False
        self.android_ids = self.win_driver.get_hid_data()
        
        for android_id in self.android_ids:
            if android_id == self.android_id:
                return True
        return False

    def get_rotation_angle(self) -> int:
        """
            获取手机旋转角度

            return: 手机旋转的角度
        """
        response = self.SendData("getRotationAngle")
        return int(response)

    def hid_press(self, coordinate: tuple) -> bool:
        """
            按下

            coordinate: x,y坐标
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return  self.win_driver.hid_press(self.android_id, self.angle, coordinate[0], coordinate[1]) 

    def hid_release(self) -> bool:
        """
            释放

            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return self.win_driver.hid_release(self.android_id, self.angle) 

    def hid_move(self, coordinate: tuple, duration: float) -> bool:
        """
            移动

            coordinate: x,y坐标
            duration: 移动时长,秒(移动时间内脚本需保持运行)
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return self.win_driver.hid_move(self.android_id, self.angle, coordinate[0], coordinate[1], duration) 

    def hid_click(self, coordinate: tuple) -> bool:
        """
            单击

            coordinate: x, y横坐标
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return self.win_driver.hid_click(self.android_id, self.angle, coordinate[0], coordinate[1]) 

    def hid_double_click(self, coordinate: tuple) -> bool:
        """
            双击

            coordinate: x,y横坐标
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return self.win_driver.hid_double_click(self.android_id, self.angle, coordinate[0], coordinate[1]) 

    def hid_long_click(self, coordinate: tuple, duration: float) -> bool:
        """
            长按

            coordinate: x,y坐标
            duration: 按下时长,秒(按下时间内脚本需保持运行)
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return  self.win_driver.hid_long_click(self.android_id, self.angle, coordinate[0], coordinate[1], duration) 

    def hid_swipe(self, Startcoordinate: tuple,Endcoordinate: tuple, duration: float) -> bool:
        """
            滑动坐标

            Startcoordinate: x,y 起始坐标
            Endcoordinate: x,y 结束坐标
            duration: 滑动时长,秒(滑动时间内脚本需保持运行)
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return self.win_driver.hid_swipe(self.android_id, self.angle, Startcoordinate[0], Startcoordinate[1], Endcoordinate[0], Endcoordinate[1], duration) 

    def hid_gesture(self, gesture_path: list, duration: float) -> bool:
        """
            Hid手势

            gesture_path: 手势路径，由一系列坐标点组成
            duration: 手势执行时长, 单位秒(执行时间内脚本需保持运行)
            return: True或者False
        """
        self.angle = self.get_rotation_angle()
        return self.win_driver.hid_gesture(self.android_id, self.angle, gesture_path, duration) 

    def hid_back(self) -> bool:
        """
            返回
            return
        """

        return self.win_driver.hid_back(self.android_id) 

    def hid_home(self) -> bool:
        """
            返回桌面
            home
        """
        return self.win_driver.hid_home(self.android_id) 

    def hid_recents(self) -> bool:
        """
            最近应用列表
            List of recent applications
        """
        return self.win_driver.hid_recents(self.android_id) 
    
class ColorFindingOperation:
    """
        色值相关
    """

    def get_color(self, point: tuple) -> str:
        """
            获取指定坐标点的色值

            point: x, y坐标点
            return: 色值字符串(例如: #008577)或者 None
        """
        response = self.SendData("getColor", point[0], point[1])
        if response == "null":
            return None
        return response

    def find_color(self, color: str, sub_colors: list = [], region: tuple = (0,0,0,0), similarity: float = 0.9, wait_time: float = 5, interval_time: float = 0.5) -> tuple:
        """
            获取指定色值的坐标点，返回坐标或者 None

            color: 颜色字符串，必须以 # 开头，例如：#008577；
            sub_colors: 辅助定位的其他颜色 (偏移x、偏移y、颜色字符串)
            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            similarity: 相似度，0-1 的浮点数，默认 0.9；
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 坐标或者 ()
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
            response = self.SendData("findColor", color, sub_colors_str, *region, similarity)
            if response == "-1.0|-1.0":
                time.sleep(interval_time)
            else:
                x, y = response.split("|")
                return (x, y)
        return ()

class Control:
    """
        控件操作
    """
    def create_text_view(self, _id: int, text: str, coordinate: tuple = (400,500), width: int = 400, height: int = 60) -> bool:
        """
            创建文本框控件

            _id:  控件ID，不可与其他控件重复
            text:  控件文本
            coordinate   默认 (400,500)
            width:  控件宽度，默认 400
            height:  控件高度，默认 60
            return: True或者False
        """
        return "true" in self.SendData("createTextView", _id, text, coordinate[0], coordinate[1], width, height)

    def create_edit_view(self, _id: int, text: str, coordinate: tuple = (400,500), width: int = 400, height: int = 150) -> bool:
        """
            创建编辑框控件

            _id:  控件ID，不可与其他控件重复
            text:  控件文本
            coordinate: x,y坐标 默认 (400,500)
            width:  控件宽度，默认 400
            height:  控件高度，默认 150
            return: True或者False
        """
        return "true" in self.SendData("createEditText", _id, text, coordinate[0], coordinate[1], width, height) 

    def create_check_box(self, _id: int, text: str, coordinate: tuple = (400,500), width: int = 400, height: int = 60,is_select: bool = False) -> bool:
        """
            创建复选框控件

            _id:  控件ID，不可与其他控件重复
            text:  控件文本
            coordinate:  x,y坐标 默认 (400,500)
            width:  控件宽度，默认 400
            height:  控件高度，默认 60
            is_select:  是否勾选，默认 False
            return: True或者False
        """
        return "true" in self.SendData("createCheckBox", _id, text, coordinate[0], coordinate[1], width, height, is_select) 

    def create_switch_button(self, _id: int, text: str, coordinate: tuple = (400,500), width: int = 400, height: int = 60,is_select: bool = False) -> bool:
        """
            创建SwitchButton控件

            _id:  控件ID，不可与其他控件重复
            text:  控件文本
            coordinate:  x,y坐标 默认 (400,500)
            width:  控件宽度，默认 400
            height:  控件高度，默认 60
            is_select:  是否开/关 默认 关
            return: True或者False
        """
        return "true" in self.SendData("createSwitchButton", _id, text, coordinate[0], coordinate[1], width, height, is_select) 

    def create_list_text(self, _id: int, hint_text: str, list_text: str, coordinate: tuple = (400,500), width: int = 400, height: int = 400) -> bool:
        """
            创建ListText控件

            _id:  控件ID，不可与其他控件重复
            hint_text:  提示文本
            list_text:  下拉列表中的文本以逗号分割
            coordinate: x,y坐标 默认 (400,500)
            width:  控件宽度
            height:  控件高度
            return: True或者False
        """
        return "true" in self.SendData("createListText", _id, hint_text, coordinate[0], coordinate[1], width, height, list_text) 

    def create_web_view(self, _id: int, url: str, coordinate: tuple = (-1,-1), controlsize: tuple = (-1,-1)) -> bool:
        """
            创建WebView控件(直接会打开浏览器进入页面)

            _id: 控件ID，不可与其他控件重复
            url: 加载的链接
            coordinate: 控件在屏幕上 x 坐标，值为 -1 时自动填充宽高
            controlsize: 控件宽,高度，值为 -1 时自动填充宽高
            return: True或者False
        """
        return "true" in self.SendData("createWebView", _id, url, coordinate[0], coordinate[1], controlsize[0], controlsize[1]) 

    def get_script_params(self) -> dict:
        """
            获取脚本配置参数(等待用户提交控件数据)

            return: 用户提交的控件数据
        """
        response = self.SendData("getScriptParam")
        if response == "null":
            return None
        try:
            params = json.loads(response)
        except Exception as e:
            return {}
        return params

    def clear_script_widget(self) -> bool:
        """
            清除脚本控件

            return: True或者False
        """
        return "true" in self.SendData("clearScriptControl") 

class CoordinateOperation:
    """
        坐标操作
    """

    def click(self, point: tuple) -> bool:
        """
            点击坐标

            point: x, y坐标
            return: Ture 或者 False
        """
        return "true" in self.SendData("click", point[0], point[1])

    def double_click(self, point: tuple) -> bool:
        """
            双击坐标

            point: 坐标
            return: Ture 或者 False
        """
        return "true" in self.SendData("doubleClick", point[0], point[1]) 

    def long_click(self, point: tuple, duration: int) -> bool:
        """
            长按坐标

            point: 坐标
            duration: 按住时长，单位秒
            return: Ture 或者 False
        """
        return "true" in self.SendData("longClick", point[0], point[1], duration * 1000) 

    def swipe(self, start_point: tuple, end_point: tuple, duration: float) -> bool:
        """
            滑动坐标

            start_point: 起始坐标
            end_point: 结束坐标
            duration: 滑动时长，单位秒
            return: Ture 或者 False
        """
        return "true" in self.SendData("swipe", start_point[0], start_point[1], end_point[0], end_point[1], duration * 1000)

    def gesture(self, gesture_path: list, duration: float) -> bool:
        """
            执行手势

            gesture_path: 手势路径，由一系列坐标点组成
            duration: 手势执行时长, 单位秒
            return: Ture 或者 False
        """

        gesture_path_str = ""
        for point in gesture_path:
            gesture_path_str += f"{point[0]}/{point[1]}/\n"
        gesture_path_str = gesture_path_str.strip()

        return "true" in self.SendData("dispatchGesture", gesture_path_str, duration * 1000) 

    def gestures(self, gestures_path: list) -> bool:
        """
            执行多个手势

            [[duration, [x1, y1], [x1, y1]...],[duration, [x1, y1], [x1, y1]...]]  
            duration:手势执行时长, 单位秒
            [x1, y1]: 手势路径，由一系列坐标点组成
            return: Ture 或者 False
        """

        gestures_path_str = ""
        for gesture_path in gestures_path:
            gestures_path_str += f"{gesture_path[0] * 1000}/"
            for point in gesture_path[1:len(gesture_path)]:
                gestures_path_str += f"{point[0]}/{point[1]}/\n"
            gestures_path_str += "\r\n"
        gestures_path_str = gestures_path_str.strip()

        return "true" in self.SendData("dispatchGestures", gestures_path_str) 

    def press(self, point: tuple, duration: float) -> bool:
        """
            手指按下

            point: 坐标
            duration: 持续时间，单位秒
            return: Ture 或者 False
        """
        return "true" in self.SendData("press", point[0], point[1], duration * 1000) 

    def move(self, point: tuple, duration: float) -> bool:
        """
            手指移动

            point: 坐标
            duration: 持续时间
            return: Ture 或者 False
        """
        return "true" in self.SendData("move", point[0], point[1], duration * 1000) 

    def release(self) -> bool:
        """
            手指抬起
        """
        return "true" in self.SendData("release") 

    def press_release(self, point: tuple, duration: float) -> bool:
        """
            按下屏幕坐标点并释放

            point: 按压坐标
            duration: 按压时长，单位秒
            return: Ture 或者 False
        """
        result = self.press(point, duration)
        if not result:
            return False
        time.sleep(duration)
        result2 = self.release()
        if not result2:
            return False
        return True

class ElementOperation:
    """
        元素操作
    """
    
    def get_element_rect(self, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> tuple:
        """
            获取元素位置，返回元素区域左上角和右下角坐标

            xpath: xpath 路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: x,y坐标 或者 空()
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementRect", xpath)
            if response == "-1|-1|-1|-1":
                time.sleep(interval_time)
            else:
                start_x, start_y, end_x, end_y = response.split("|")
                return ((float(end_x)+float(start_x))/2,(float(end_y)+float(start_y))/2)

        return ()

    def press_release_by_ele(self, xpath, duration: float, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            按压元素并释放

            xpath: 要按压的元素
            duration: 按压时长，单位秒
            wait_time: 查找元素的最长等待时间 默认5秒
            interval_time: 查找元素的轮询间隔时间 默认0.5
            return: Ture 或者 False
        """
        response = self.get_element_rect(xpath, wait_time=wait_time, interval_time=interval_time)
        if response:
            return self.press_release(response, duration)
        else:
            return False

    def get_element_desc(self, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> str:
        """
            获取元素描述

            xpath: xpath 路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 
            return: 元素描述字符串
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementDescription", xpath)
            if response == "null":
                time.sleep(interval_time)
            else:
                return response
        return None

    def get_element_text(self, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> str:
        """
            获取元素文本

            xpath: xpath 路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 元素文本
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("getElementText", xpath)
            if response == "null":
                time.sleep(interval_time)
            else:
                return response
        return None

    def set_element_text(self, xpath: str, text: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            设置元素文本

            xpath: 元素路径
            text: 设置的文本
            wait_time: 等待时间，默认取 self.wait_timeout
            interval_time: 轮询间隔时间，默认取 self.interval_timeout
            return:  成功返回True 失败返回False
        """
  
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("setElementText", xpath, text)
            if "false" in response or "null" in response:
                time.sleep(interval_time)
            else:
                return True
        return False

    def click_element(self, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            点击元素

            xpath: 元素路径
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 成功返回True 失败返回False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("clickElement", xpath)
            if "false" in response or "null" in response:
                time.sleep(interval_time)
            else:
                return True
        return False

    def click_any_elements(self, xpath_list: list, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            遍历点击列表中的元素，直到任意一个元素返回 True

            xpath_list: xpath 列表
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 成功返回True 失败返回False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            for xpath in xpath_list:
                result = self.click_element(xpath, wait_time, interval_time)
                if result:
                    return True
            time.sleep(interval_time)

        return False

    def scroll_element(self, xpath: str, direction: int = 0) -> bool:
        """
            滚动元素，0 向上滑动，1 向下滑动

            xpath: xpath 路径
            direction: 滚动方向，0 向上滑动，1 向下滑动
            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("scrollElement", xpath, direction) 

    def element_exists(self, xpath: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            元素是否存在

            xpath: xpath 路径
            wait_time: 等待时间，默认取 self.wait_timeout
            interval_time: 轮询间隔时间，默认取 self.interval_timeout
            return: 成功返回True 失败返回False
        """
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("existsElement", xpath) 
            if "false" in response or "null" in response:
                time.sleep(interval_time)
            else:
                return True
        return False

    def any_elements_exists(self, xpath_list: list, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            遍历列表中的元素

            xpath_list: xpath 列表
            wait_time: 等待时间，默认取 self.wait_timeout
            interval_time: 轮询间隔时间，默认取 self.interval_timeout
            return: 任意一个元素存在就返回 True 否则就是为False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            for xpath in xpath_list:
                result = self.element_exists(xpath, wait_time, interval_time)
                if result:
                    return result
            time.sleep(interval_time)
        return result

    def element_is_selected(self, xpath: str) -> bool:
        """
            判断元素是否选中

            xpath: xpath 路径
            return: 成功返回True 失败返回False
        """
        return  "true" in self.SendData("isSelectedElement", xpath) 

    def click_element_by_slide(self, xpath, distance: int = 1000, duration: float = 0.5, direction: int = 1,count: int = 999, end_flag_xpath: str = None, wait_time: float = 600,interval_time: float = 0.5) -> bool:
        """
            滑动列表，查找并点击指定元素

            xpath: xpath路径
            distance: 滑动距离，默认 1000
            duration: 滑动时间，默认 0.5 秒
            direction: 滑动方向，默认为 1； 1=上滑，2=下滑
            count: 滑动次数
            end_flag_xpath: 结束标志 xpath，无标志不检测此标志
            wait_time: 等待时间，默认 10 分钟
            interval_time: 轮询间隔时间，默认 0.5 秒
            return: 成功返回True 失败返回False
        """

        if direction == 1:
            _end_point = (500, 300)
            _start_point = (500, _end_point[1] + distance)
        elif direction == 2:
            _start_point = (500, 300)
            _end_point = (500, _start_point[1] + distance)

        end_time = time.time() + wait_time
        current_count = 0
        while time.time() < end_time and current_count < count:
            current_count += 1

            if self.click_element(xpath, wait_time=1, interval_time=0.5):
                return True

            if end_flag_xpath and self.element_exists(end_flag_xpath, wait_time=1, interval_time=0.5):
                return False

            self.swipe(_start_point, _end_point, duration)
            time.sleep(interval_time)

        return False

    def get_elements(self) -> json:
        """
            获取可见区域内的所有元素信息
            return: 成功返回数组json格式的元素信息，失败返回null
        """
        response = self.SendData("getElements")
        if response == "null":
            return None
        return json.loads(response)

class EquipmentOperation:
    """
         设备操作
    """

    def start_app(self, name: str, wait_time: float = 5, interval_time: float = 0.5) -> bool:
        """
            启动 APP

            name: APP名字或者包名
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return:成功返回True 失败返回False
        """

        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("startApp", name)
            if "false" in response or "null" in response:
                time.sleep(interval_time)
            else:
                return True
        return False

    def app_is_running(self, app_name: str) -> bool:
        """
            判断app是否正在运行(无障碍权限开启只判断前台，未开启则包含前后台 是否正在运行)
           
            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("appIsRunnig", app_name) 

    def get_installed_packages(self) -> list:
        """
            获取已安装app的包名(不包含系统APP)

            return: 包名列表 或者 空[]
        """
        resp = self.SendData("getInstalledPackages")
        if resp == "null" or resp == "":
            return []
        return resp.split("|")

    def get_title(self) -> str:
        """
            获取投屏标题

            return: app上的标题信息
        """
        response = self.SendData("getTitle")
        return response

    def get_group(self) -> str:
        """
            获取投屏组号

            return: app上的投屏组号
        """
        response = self.SendData("getGroup")
        return response

    def get_identifier(self) -> str:
        """
            获取投屏编号

            return: app上的投屏编号
        """
        response = self.SendData("getIdentifier")
        return response

    def activate_frame(self, secret_key) -> str:
        """
            激活安卓框架

            secret_key：激活框架的秘钥
            return: 成功返回True失败返回False
        """
        response = self.SendData("activateFrame", secret_key) 
        return response

    def get_device_ip(self) -> str:
        """
            获取设备IP地址

            return: 设备IP地址字符串
        """
        return self.client_address[0]

    def get_android_id(self) -> str:
        """
            获取 Android 设备 ID

            return: Android 设备 ID 字符串
        """
        response = self.SendData("getAndroidId")
        return response

    def get_window_size(self) -> dict:
        """
            获取屏幕大小

            return: 屏幕大小, 字典格式
        """
        response = self.SendData("getWindowSize")
        width, height = response.split("|")
        return {"width": float(width), "height": float(height)}

    def get_image_size(self, image_path: str) -> dict:
        """
            获取图片大小

            image_path: 图片路径
            return: 图片大小, 字典格式, 失败返回 {'width': -1.0, 'height': -1.0}
        """
        if not image_path.startswith("/storage/emulated/0/"):
            image_path = "/storage/emulated/0/" + image_path
        response = self.SendData("getImageSize", image_path)
        width, height = response.split("|")
        return {"width": float(width), "height": float(height)}

    def show_toast(self, text: str, duration: float = 3) -> bool:
        """
            Toast 弹窗

            text: 弹窗内容
            duration: 弹窗持续时间默认3秒
            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("showToast", text, duration * 1000) 

    def send_keys(self, text: str) -> bool:
        """
            发送文本，需要打开 AiBot 输入法

            text: 文本内容
            return:  成功返回True 失败返回False
        """
        return "true" in self.SendData("sendKeys", text)  

    def send_vk(self, vk: int) -> bool:
        """
            发送 vk , 需要打开 AiBot 输入法
            Send vk

            vk: 虚拟键值
            return: 成功返回True 失败返回False

            虚拟键值按键对照表 https://blog.csdn.net/yaoyaozaiye/article/details/122826340
        """
        return "true" in self.SendData("sendVk", vk) 

    def back(self) -> bool:
        """
            返回

            return: 成功返回True 失败返回False

        """
        return "true" in self.SendData("back") 
    
    def home(self) -> bool:
        """
            返回桌面

            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("home") 

    def recent_tasks(self) -> bool:
        """
            显示最近任务

            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("recents")

    def power_dialog(self) -> bool:
        """
            打开 开/关机 对话框，基于无障碍权限

            return:成功返回True 失败返回False
        """
        return "true" in self.SendData("powerDialog") 

    def call_phone(self, mobile: str) -> bool:
        """
            拨打电话

            mobile: 手机号码
            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("callPhone", mobile) 

    def send_msg(self, mobile, text) -> bool:
        """
            发送短信

            mobile: 手机号码
            text: 短信内容
            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("sendMsg", mobile, text)  

    def get_activity(self) -> str:
        """
            获取活动页

            return: 当前的窗口UI名称
        """
        response = self.SendData("getActivity")
        return response

    def get_package(self) -> str:
        """
            获取包名

            return: 包名称："com.aibot.client"
        """
        response = self.SendData("getPackage")
        return response

    def set_clipboard_text(self, text: str) -> bool:
        """
            设置剪切板文本

            text: 文本
            return: 成功返回True 失败返回False
        """
        return "true" in self.SendData("setClipboardText", text)

    def get_clipboard_text(self) -> str:
        """
            获取剪切板内容（需要开启Aibote输入法）

            return: 剪切板内容
        """
        response = self.SendData("getClipboardText")
        return response

    def start_activity(self, action: str, uri: str = '', package_name: str = '', class_name: str = '', typ: str = '') -> bool:
        """
            Intent 跳转

            action: 动作，例如 "android.intent.action.VIEW"
            uri: 跳转链接，例如：打开支付宝扫一扫界面，"alipayqr://platformapi/startapp?saId=10000007"
            package_name: 包名，"com.xxx.xxxxx"
            class_name: 类名
            typ: 类型
            return: True或者 False
        """
        return "true" in self.SendData("startActivity", action, uri, package_name, class_name, typ) 

    def write_android_file(self, remote_path: str, text: str, append: bool = False) -> bool:
        """
            写入安卓文件 

            remote_path: 安卓文件默认根目录:/storage/emulated/0/,  文件名必须是.txt后缀结
            text: 写入的内容
            append: 可选参数，是否追加，默认覆盖文件内容
            return: True 或者 False
        """
        if not remote_path.endswith(".txt"):
            raise TypeError("文件必须是.txt后缀结尾")

        if not remote_path.startswith("/storage/emulated/0/"):
            remote_path = "/storage/emulated/0/" + remote_path
        return "true" in self.SendData("writeAndroidFile", remote_path, text, append)

    def read_android_file(self, remote_path: str) -> str:
        """
            读取安卓文件 

            remote_path: 安卓文件路径 /storage/emulated/0/: 安卓文件根目录
            return: 文件内容
        """
        if not remote_path.startswith("/storage/emulated/0/"):
            remote_path = "/storage/emulated/0/" + remote_path

        response = self.SendData("readAndroidFile", remote_path)
        if response == "null":
            return None
        return response

    def exists_android_file(self, remote_path: str) -> bool:
        """
            安卓文件是否存在

            remote_path: 安卓文件路径
            return: 存在返回True 不存在返回False
        """
        if not remote_path.startswith("/storage/emulated/0/"):
            remote_path = "/storage/emulated/0/" + remote_path

        return "true" in self.SendData("existsAndroidFile", remote_path)

    def get_android_sub_files(self, android_directory: str = "") -> list:
        """
            获取文件夹内的所有文件(不包含深层子目录)

            android_directory: 安卓目录,默认为根目录下所有文件名
            return: 文件名列表
        """
        if not android_directory.startswith("/storage/emulated/0/"):
            android_directory = "/storage/emulated/0/" + android_directory

        response = self.SendData("getAndroidSubFiles", android_directory)
        if response == "null" or response == "":
            return []
        return response.split("|")

    def make_android_dir(self, android_directory: str) -> bool:
        """
            创建安卓文件夹

            android_directory: 安卓目录 /storage/emulated/0/: 安卓文件根目录
            return: 成功返回True 失败返回False
        """
        if not android_directory.startswith("/storage/emulated/0/"):
            android_directory = "/storage/emulated/0/" + android_directory
        return "true" in self.SendData("makeAndroidDir", android_directory) 

    def delete_android_file(self, remote_path: str) -> bool:
        """
            删除安卓文件

            remote_path: 安卓文件路径
            return: 成功返回True 失败返回False
        """
        if not remote_path.startswith("/storage/emulated/0/"):
            remote_path = "/storage/emulated/0/" + remote_path
        return "true" in self.SendData("deleteAndroidFile", remote_path) 

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

    def close_driver(self):
        """
            关闭连接
        """
        self.SendData("closeDriver")

    def set_android_timeout(self, timeout: float = 60):
        """
            设置安卓客户端接收超时，默认为永久等待

            timeout: 超时时间，单位秒
            return: 总是True
        """
        self.SendData("setAndroidTimeout", timeout*1000)

class FileTransfer:
    """
        文件传输
    """
    def __push_file(self, func_name: str, to_path: str, file: bytes) -> bool:
        func_name = bytes(func_name, "utf8")
        to_path = bytes(to_path, "utf8")
        str_data = ""
        str_data += str(len(func_name)) + "/"  # func_name 字节长度
        str_data += str(len(to_path)) + "/"  # to_path 字节长度
        str_data += str(len(file)) + "\n"  # file 字节长度
        bytes_data = bytes(str_data, "utf8")
        bytes_data += func_name
        bytes_data += to_path
        bytes_data += file
        self.request.sendall(bytes_data)
        data = self.request.recv(65535)
        return data.decode("utf8")

    def __pull_file(self, *args) -> bytes:
        args_len = ""
        args_text = ""

        for argv in args:
            argv = str(argv)
            args_text += argv
            args_len += str(len(bytes(argv, 'utf8'))) + "/"
        data = (args_len.strip("/") + "\n" + args_text).encode("utf8")
        self.request.sendall(data)
        response = self.request.recv(65535)
        if response == b"":
            self.request.close()
            raise ConnectionAbortedError(f"{self.client_address[0]}:{self.client_address[1]} 客户端断开链接")
        data_length, data = response.split(b"/", 1)
        while int(data_length) > len(data):
            data += self.request.recv(65535)
        return data

    def push_file(self, origin_path: str, to_path: str) -> bool:
        """
            将电脑文件传输到手机端

            origin_path: 源文件路径
            to_path: 安卓外部存储根目录 /storage/emulated/0/
            return: True或者False
        """

        if not to_path.startswith("/storage/emulated/0/"):
            to_path = "/storage/emulated/0/" + to_path

        with open(origin_path, "rb") as r:
            data = r.read()
        return "true" in self.__push_file("pushFile", to_path, data)

    def pull_file(self, remote_path: str, local_path: str) -> bool:
        """
            将手机文件传输到电脑端

            remote_path: 手机端文件路径
            local_path: 电脑本地文件存储路径
            return: 文件字节数据
        """
        if not remote_path.startswith("/storage/emulated/0/"):
            remote_path = "/storage/emulated/0/" + remote_path
        response = self.__pull_file("pullFile", remote_path)
        if response == b"null":
            return False
        with open(local_path, "wb") as w:
            w.write(response)
        return True

class MapFindingOperation:
    """
        找图功能
    """
    def find_images(self, image_name: str, region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0), similarity: float = 0.9, multi: int = 1, wait_time: float = 5, interval_time: float = 0.5) -> list:
        """
            寻找图片坐标，在当前屏幕中寻找给定图片中心点的坐标，返回坐标列表(如果想拿一个坐标取第一个坐标元祖即可)
            
            image_name: 图片名称（手机中）/storage/emulated/0/ 手机根目录
            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            algorithm:
                处理屏幕截图所用的算法，默认原图，注意：给定图片处理时所用的算法，应该和此方法的算法一致；
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
            similarity: 相似度，0-1 的浮点数，默认 0.9；
            multi: 目标数量，默认为 1，找到 1 个目标后立即结束；
            wait_time: 等待时间，默认取 self.wait_timeout
            interval_time: 轮询间隔时间，默认取 self.interval_timeout
            return: 坐标列表 或者 []
        """
        if not image_name.startswith("/storage/emulated/0/"):
            image_name = "/storage/emulated/0/" + image_name
    
        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("findImage", image_name, *region, similarity, algorithm_type, threshold, max_val, multi)
            if response == "-1.0|-1.0":
                time.sleep(interval_time)
            else:
                image_points = response.split("/")
                point_list = []
                for point_str in image_points:
                    x, y = point_str.split("|")
                    point_list.append((float(x),float(y)))
                return point_list
        return []

    def find_dynamic_image(self, interval_ti: int, region: tuple = (0,0,0,0), wait_time: float = 5, interval_time: float = 0.5) -> list:
        """
            找动态图，对比同一张图在不同时刻是否发生变化，返回坐标列表

            interval_ti: 前后时刻的间隔时间，单位毫秒；
            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            wait_time: 等待时间，默认取 5秒
            interval_time: 轮询间隔时间，默认取 0.5秒
            return: 坐标列表 或者 []
        """
        end_time = time.time() + wait_time
        while time.time() < end_time:
            response = self.SendData("findAnimation", interval_ti, *region)
            if response == "-1.0|-1.0":
                time.sleep(interval_time)
            else:
                image_points = response.split("/")
                point_list = []
                for point_str in image_points:
                    x, y = point_str.split("|")
                    point_list.append((float(x), float(y)))
                return point_list
        return []

class OcrCorrelation:
    """
        OCR 文字识别
    """
    def _parsing_ocr_data(self, ocr_server_id: str = "127.0.0.1", region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0), scale: float = 1.0)-> list:
        """
            OCR 文字服务，识别屏幕中的文字

            ocr_server_id: ocr服务端IP，端口固定为9527。当参数值为 "127.0.0.1"时，则使用手机内置的ocr识别
            region 指定区域 [10, 20, 100, 200]，region默认全屏
            algorithm: threshold二值化图片 (algorithm_type: 算法类型, threshold: 默认保存原图。thresh和maxval同为255时灰度处理 , max_val: 最大值)
                                                0   THRESH_BINARY算法，当前点值大于阈值thresh时，取最大值maxva，否则设置为0
                                                1   THRESH_BINARY_INV算法，当前点值大于阈值thresh时，设置为0，否则设置为最大值maxva
                                                2   THRESH_TOZERO算法，当前点值大于阈值thresh时，不改变，否则设置为0
                                                3   THRESH_TOZERO_INV 算法，当前点值大于阈值thresh时，设置为0，否则不改变
                                                4   THRESH_TRUNC算法，当前点值大于阈值thresh时，设置为阈值thresh，否则不改变
                                                5   ADAPTIVE_THRESH_MEAN_C算法，自适应阈值
                                                6   ADAPTIVE_THRESH_GAUSSIAN_C 算法，自适应阈值
            scale: 图片缩放率, 默认为 1.0 原大小。大于1.0放大，小于1.0缩小，不能为负数。
            return:  失败返回None，成功返回手机屏幕上的文字
        """

        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255
        response = self.SendData("ocr", ocr_server_id, *region, algorithm_type, threshold, max_val, scale)
        if response == "null" or response == "":
            return []
        return eval(response)

    def get_text(self, ocr_server_id: str = "127.0.0.1", region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0), scale: float = 1.0) -> list:
        """
            通过 OCR 识别屏幕中的文字，返回文字列表

            ocr_server_id: ocr服务端IP，端口固定为9527。当参数值为 "127.0.0.1"时，则使用手机内置的ocr识别
            region: 识别区域，默认全屏；
            algorithm: 处理图片/屏幕所用算法和参数，默认保存原图；
            threshold二值化图片, thresholdType算法类型：
                                                      0   THRESH_BINARY算法，当前点值大于阈值thresh时，取最大值maxva，否则设置为0
                                                      1   THRESH_BINARY_INV算法，当前点值大于阈值thresh时，设置为0，否则设置为最大值maxva
                                                      2   THRESH_TOZERO算法，当前点值大于阈值thresh时，不改变，否则设置为0
                                                      3   THRESH_TOZERO_INV算法，当前点值大于阈值thresh时，设置为0，否则不改变
                                                      4   THRESH_TRUNC算法，当前点值大于阈值thresh时，设置为阈值thresh，否则不改变
                                                      5   ADAPTIVE_THRESH_MEAN_C算法，自适应阈值
                                                      6   ADAPTIVE_THRESH_GAUSSIAN_C算法，自适应阈值
                                thresh阈值，maxval最大值，threshold默认保存原图。thresh和maxval同为255时灰度处理
            scale: 图片缩放率，默认为 1.0，1.0 以下为缩小，1.0 以上为放大
            return: 文字列表
        """
        
        text_info_list = self._parsing_ocr_data(ocr_server_id, region, algorithm, scale)
        return text_info_list

    def find_text(self, ocr_server_id: str, text: str, region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0), scale: float = 1.0) -> tuple:
        """
            查找文字所在的坐标，返回坐标列表（坐标是文本区域中心位置）

            ocr_server_id: ocr服务端IP，端口固定为9527。当参数值为 "127.0.0.1"时，则使用手机内置的ocr识别
            text: 要查找的文字；
            region: 识别区域，默认全屏；
            algorithm: 处理图片/屏幕所用算法和参数，默认保存原图；
            scale: 图片缩放率，默认为 1.0，1.0 以下为缩小，1.0 以上为放大；
            return: 坐标列表（坐标是文本区域中心位置）,找不到返回空列表 []
        """

        text_info_list = self._parsing_ocr_data(ocr_server_id, region, algorithm, scale)
        if text_info_list ==[]:
            return text_info_list

        default_tuple = ()
        for item in text_info_list:
            full_text = item["text"]
            if text in full_text:
                x1, y1, x2, y2 = item["box"]
        
                total_width = x2 - x1
                total_height = y2 - y1
                
                if len(full_text) == 0:
                    continue
                char_width = total_width / len(full_text)
                
                pos = full_text.find(text)
                if pos == -1:
                    continue  
                
                sub_text_width = len(text) * char_width
                offset_x = pos * char_width + sub_text_width / 2
                offset_y = total_height / 2
                
                abs_x = region[0] + x1 + offset_x
                abs_y = region[1] + y1 + offset_y
                
                scaled_x = abs_x / scale
                scaled_y = abs_y / scale
    
                return (float(scaled_x), float(scaled_y))
        return default_tuple

class ScreenProjectionOperation:
    """
        投屏操作
    """

    def get_group_id(self) -> str:
        """
            获取投屏组号

            return: 组号
        """
        response = self.SendData("getGroup")
        return response

    def get_identifier(self) -> str:
        """
            获取投屏编号

            return: 编号
        """
        response =  self.SendData("getIdentifier")
        return response

    def get_title(self) -> str:
        """
            获取投屏标题

            return: 标题
        """
        response = self.SendData("getTitle")
        return response

class ScreenshotOperation:
    """
        截图操作
    """
    def __pull_file(self, *args) -> bytes:
        args_len = ""
        args_text = ""

        for argv in args:
            argv = str(argv)
            args_text += argv
            args_len += str(len(bytes(argv, 'utf8'))) + "/"
        data = (args_len.strip("/") + "\n" + args_text).encode("utf8")
        if len(data) > 10000:
            self.debug(rf"<-<- {data[:100]}......")
        else:
            self.debug(rf"<-<- {data}")
        self.request.sendall(data)
        response = self.request.recv(65535)
        if len(response) > 10000:
            self.debug(rf"<-<- {response[:100]}......")
        else:
            self.debug(rf"<-<- {response}")
        if response == b"":
            self.request.close()
            raise ConnectionAbortedError(f"{self.client_address[0]}:{self.client_address[1]} 客户端断开链接")
        data_length, data = response.split(b"/", 1)
        while int(data_length) > len(data):
            data += self.request.recv(65535)
        return data

    def save_screenshot(self, image_name: str, region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0)) -> str:
        """
            保存截图，返回图片地址(手机中)或者 None

            image_name: 图片名称，保存在手机 /storage/emulated/0/ 路径下；
            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            algorithm: 处理截图所用算法和参数，默认保存原图，
                处理屏幕截图所用的算法，默认原图，注意：给定图片处理时所用的算法，应该和此方法的算法一致；
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
            return: 图片地址(手机中) 或者 None
        """
        if not image_name.startswith("/storage/emulated/0/"):
            image_name = "/storage/emulated/0/" + image_name

        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255

        response = self.SendData("saveScreenshot", image_name, *region, algorithm_type, threshold, max_val)
        if "true" in response:
            return image_name
        return None

    def save_element_screenshot(self, image_name: str, xpath: str) -> str:
        """
            保存元素截图

            image_name: 图片名称，保存在手机 /storage/emulated/0/ 路径下
            xpath: xpath路径
            return: 图片地址(手机中)或者 None
        """
        response = self.SendData("getElementRect", xpath)
        if response == "-1|-1|-1|-1":
             return None
        start_x, start_y, end_x, end_y = response.split("|")
        return self.save_screenshot(image_name, region=(start_x, start_y, end_x, end_y))

    def take_screenshot(self, region: tuple = (0,0,0,0), algorithm: tuple = (0,0,0), scale: float = 1.0) -> bytes:
        """
            保存截图，返回图像字节格式或者None, 此功能如果做投屏scale参数需要缩放3倍以上不然很慢

            region: 截图区域，默认全屏，``region = (起点x、起点y、终点x、终点y)``，得到一个矩形
            algorithm: 处理截图所用算法和参数，默认保存原图
                处理屏幕截图所用的算法，默认原图，注意：给定图片处理时所用的算法，应该和此方法的算法一致
                ``algorithm = (algorithm_type, threshold, max_val)``

                按元素顺序分别代表：
                0. ``algorithm_type`` 算法类型
                1. ``threshold`` 阈值
                2. ``max_val`` 最大值

                ``threshold`` 和 ``max_val`` 同为 255 时灰度处理
                ``algorithm_type`` 算法类型说明:
                    0. ``THRESH_BINARY``      算法，当前点值大于阈值 `threshold` 时，取最大值 ``max_val``，否则设置为 0
                    1. ``THRESH_BINARY_INV``  算法，当前点值大于阈值 `threshold` 时，设置为 0，否则设置为最大值 max_val
                    2. ``THRESH_TOZERO``      算法，当前点值大于阈值 `threshold` 时，不改变，否则设置为 0
                    3. ``THRESH_TOZERO_INV``  算法，当前点值大于阈值 ``threshold`` 时，设置为 0，否则不改变
                    4. ``THRESH_TRUNC``       算法，当前点值大于阈值 ``threshold`` 时，设置为阈值 ``threshold``，否则不改变
                    5. ``ADAPTIVE_THRESH_MEAN_C``      算法，自适应阈值；
                    6. ``ADAPTIVE_THRESH_GAUSSIAN_C``  算法，自适应阈值；

            scale: 图片缩放率，默认为 1.0，1.0 以下为缩小，1.0 以上为放大
            return: 图像字节格式或者"null"的字节格式
        """
        algorithm_type, threshold, max_val = algorithm
        if algorithm_type in (5, 6):
            threshold = 127
            max_val = 255

        response = self.__pull_file("takeScreenshot", *region, algorithm_type, threshold, max_val, scale)
        if b"null" in response:
            return None
        return response

class UrlRequest:
    """
        URL请求
    """

    def url_request(self, url: str = "https://www.baidu.com", requestType: str = "GET", headers: str = "null", postData: str = "null") -> str:
        """
            获取请求地址html数据

            url: 请求的地址 http://www.ai-bot.net
            requestType: 请求类型，GET或者POST
            headers: 可选参数，请求头
            postData: 可选参数，用作POST 提交的数据
            return: {Promise.<string>} 返回请求数据内容
        """
        response = self.SendData("urlRequest", url, requestType, headers, postData)
        if response == "null":
            return None
        return response

    def download_file(self, url: str, savePath: str) -> bool:
        """
            下载下载网络文件到手机
            Download download network files to your mobile phone

            url: 请求网络文件的地址
            savePath: 文件保存到手机哪个位置(默认手机根目录)
            return: Ture 或者 False
        """

        if not savePath.startswith("/storage/emulated/0/"):
            savePath = "/storage/emulated/0/" + savePath
            
        return "true" in self.SendData("downloadFile", url, savePath) 

class VerificationCodeOperation:
    """
        验证码
    """
    def get_captcha(self, file_path: str, username: str, password: str, soft_id: str, code_type: str, len_min: str = '0') -> dict:
        """
            识别验证码
            Identification verification code

            file_path: 图片文件路径
            username: 用户名
            password: 密码
            soft_id: 软件ID
            code_type: 图片类型 参考 https://www.chaojiying.com/price.html
            len_min: 最小位数 默认0为不启用,图片类型为可变位长时可启用这个参数
            return: JSON
                err_no,(数值) 返回代码  为0 表示正常，错误代码 参考 https://www.chaojiying.com/api-23.html
                err_str,(字符串) 中文描述的返回信息 
                pic_id,(字符串) 图片标识号，或图片id号
                pic_str,(字符串) 识别出的结果
                md5,(字符串) md5校验值,用来校验此条数据返回是否真实有效
        """
        if not file_path.startswith("/storage/emulated/0/"):
            file_path = "/storage/emulated/0/" + file_path

        response = self.SendData("getCaptcha", file_path, username, password, soft_id, code_type, len_min)
        return json.loads(response)

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
        response = self.SendData("errorCaptcha", username, password, soft_id, pic_id)
        return json.loads(response)

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
        response = self.SendData("scoreCaptcha", username, password)
        return json.loads(response)

class YoloService:
    """
        Yolo 目标检测
    """

    def yolo(self, ocr_server_id: str, region: tuple = (0,0,0,0), scale: float = 1.0) -> list:
        """
            yolo 目标检测

            ocr_server_id: yolo服务端IP，端口固定为9528
            scale: 图片缩放率, 默认为 1.0 原大小。大于 1.0 放大，小于 1.0 缩小，不能为负数。
            region: 识别区域，默认全屏
            return: 失败返回[]，成功返回数组形式的识别结果， 0~3目标矩形位置  4目标类别  5置信度
        """
        response = self.SendData("yolo", ocr_server_id, *region, scale)
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


class AndroidBotMain(
        ABC,
        CoordinateOperation,
        ElementOperation,
        EquipmentOperation,
        ScreenProjectionOperation,
        FileTransfer,
        Control,
        OcrCorrelation,
        YoloService,
        UrlRequest,
        ColorFindingOperation,
        MapFindingOperation,
        ScreenshotOperation,
        AndroidHidCorrelation,
        VerificationCodeOperation,
    ):

    @abstractmethod
    def script_main(self):
        pass
    








