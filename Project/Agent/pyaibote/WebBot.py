import re
import json

class CookiesOperation:
    """
         Cookies操作
    """

    def get_cookies(self, url: str) -> list:
        """
            获取指定 url 的 Cookies

            url: url 字符串
            return: 布尔值
        """
        response = self.SendData("getCookies", url)
        response = response.replace("\n","").replace("\t","")
        if response == "null":
            return None
        return json.loads(response)

    def get_all_cookies(self) -> list:
        """
            获取浏览器所有的Cookies

            return: 列表格式的 cookies
        """
        response = self.SendData("getAllCookies")
        response = response.replace("\n","").replace("\t","")
        if response == "null":
            return None
        return json.loads(response)

    def set_cookies(self, url: str, name: str, value: str, options: dict = None) -> bool:
        """
            设置指定 url 的 Cookies

            url: 要设置 Cookie 的域
            name: Cookie 名
            value: Cookie 值
            options: 其他属性
            return: 布尔值
        """
        default_options = {
            "domain": "",
            "path": "",
            "secure": False,
            "httpOnly": False,
            "sameSite": "",
            "expires": 0,
            "priority": "",
            "sameParty": False,
            "sourceScheme": "",
            "sourcePort": 0,
            "partitionKey": "",
        }
        if options:
            default_options.update(options)
        return "true" in self.SendData("setCookie", name, value, url, *default_options.values())

    def delete_cookies(self, name: str, url: str = "", domain: str = "", path: str = "") -> bool:
        """
            删除指定 Cookie

            name: 要删除的 Cookie 的名称
            url: 删除所有匹配 url 和 name 的 Cookie
            domain: 删除所有匹配 domain 和 name 的 Cookie
            path: 删除所有匹配 path 和 name 的 Cookie
            return: 布尔值
        """
        return "true" in self.SendData("deleteCookies", name, url, domain, path)

    def delete_all_cookies(self) -> bool:
        """
            删除所有 Cookie

            return: 布尔值
        """
        return "true" in self.SendData("deleteAllCookies")

    def clear_cache(self) -> bool:
        """
            清除缓存

            return: 布尔值
        """
        return "true" in self.SendData("clearCache") 

class DrivingOperation:
    """
        驱动程序相关
    """

    def close_driver(self) -> bool:
        """
            关闭WebDriver.exe驱动程序，服务端会抛错

            return: 布尔值
        """
        return "true" in self.SendData("closeDriver") 


    def get_extend_param(self) -> str:
        """
            获取驱动程序命令行参数(不包含ip和port)

            return: 成功返回参数，失败返回None
        """

        response = self.SendData("getExtendParam")
        if response == "null":
            return None
        return response


    def activate_frame(self, secret_key) -> str:
        """
            激活Web框架

            secret_key：激活框架的秘钥
            return: 成功返回True失败返回False
        """

        response = self.SendData("activateFrame", secret_key) 
        return response
    
    
    def set_download_dir(self, dir_name) -> str:
        """
            设置浏览器默认下载目录

            dir_name：下载目录

            return: 成功返回True失败返回False
        """

        return "true" in self.SendData("setDownloadDir", dir_name)

class ElementOperation:
    """
        元素操作 
    """

    def is_displayed(self, xpath: str) -> bool:
        """
            元素是否可见

            xpath: xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("isDisplayed", xpath)

    def is_available(self, xpath: str) -> bool:
        """
            判断元素是否可用

            xpath: xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("isEnabled", xpath)

    def is_selected(self, xpath: str) -> bool:
        """
            元素是否已选中

            xpath: xpath 路径
            return: 布尔值
        """

        return "true" in self.SendData("isSelected", xpath)

    def get_element_outer_html(self, xpath: str) -> str:
        """
            获取元素的HTML包含对象本身以及所有子节点

            xpath: xpath 路径
            return: HTML 带标签格式文本
        """
        response = self.SendData("getElementOuterHTML", xpath)
        if response == "null":
            return None
        return response

    def get_element_inner_html(self, xpath: str) -> str:
        """
            获取元素的HTML所有子节点不包含对象本身

            xpath: xpath 路径
            return: HTML 带标签格式文本
        """
        response = self.SendData("getElementInnerHTML", xpath)
        if response == "null":
            return None
        return response

    def get_element_text(self, xpath: str) -> str:
        """
            获取元素文本

            xpath: 元素的 xpath 路径
            return: 元素文本字符串或 None
        """
        response = self.SendData("getElementText", xpath)
        if "null" in response:
            return None
        return response

    def get_element_attr(self, xpath: str, attr_name: str) -> str:
        """
            获取元素HTML属性

            xpath: xpath 路径
            attr_name: 属性名称
            return: 字符串
        """
        response = self.SendData("getElementAttribute", xpath, attr_name)
        if response == "null":
            return None
        return response

    def get_element_value(self, xpath: str) -> str:
        """
            获取input编辑框中的值

            xpath: input输入框中的xpath路径
            return: 成功返回input输入框的值失败返回None
        """

        command =   """(function () {\
            let element = document.evaluate('"""
            
        command2 = """', document).iterateNext();\
            if(element == null)\
                return null;\
            else\
                return element.value;\
            })()"""
        command3 = command+xpath+command2
        response = self.execute_script(command3)
        if response == "None":
            return None
        return response

    def click_element(self, xpath: str) -> bool:
        """
            点击元素

            xpath: 元素的 xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("clickElement", xpath)

    def clear_element(self, xpath: str) -> bool:
        """
            清除元素值

            xpath: xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("clearElement", xpath)

    def set_element_focus(self, xpath: str) -> bool:
        """
            设置元素焦点

            xpath: xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("setElementFocus", xpath)

    def send_keys(self, xpath: str, value: str) -> bool:
        """
            用于模拟键盘输入，输入的字符会往后叠加；如果元素不能设置焦点，应先 click_mouse 点击元素获得焦点后再输入

            xpath: 元素 xpath 路径
            value: 输入的内容
            return: 布尔值
        """
        return "true" in self.SendData("sendKeys", xpath, value)

    def set_element_value(self, xpath: str, value: str) -> bool:
        """
            设置元素值 (与send_keys原理一样不同的是set_element_value不会往后叠加字符)

            xpath: 元素 xpath 路径
            value: 设置的内容
            return: 布尔值
        """
        return "true" in self.SendData("setElementValue", xpath, value)

    def send_vk(self, vk: str) -> bool:
        """
            发送Vk虚拟键码, 按键对照表: http://www.atoolbox.net/Tool.php?Id=815

            vk: 输入内容
            return: 布尔值
        """
        return "true" in self.SendData("sendVk", vk)

    def set_element_attr(self, xpath: str, attr_name: str, attr_value: str) -> bool:
        """
            设置元素属性

            xpath: 元素 xpath 路径
            attr_name: 属性名称
            attr_value: 属性值
            return: 布尔值
        """
        return "true" in self.SendData("setElementAttribute", xpath, attr_name, attr_value)

    def upload_file_by_element(self, xpath: str, file_path: str) -> bool:
        """
            通过元素上传文件

            xpath:  元素 xpath 路径
            file_path: 文件路径
            return: 布尔值
        """
        return "true" in self.SendData("uploadFile", xpath, file_path)

    def get_element_rect(self, xpath: str) -> tuple:
        """
            获取元素矩形坐标

            xpath: xpath 路径
            return: 元素矩形坐标或None
        """
        response = self.SendData("getElementRect", xpath)
        if response == "null":
            return None
        Coordinate = json.loads(response)
        L = Coordinate.get("left")
        R = Coordinate.get("right")

        T = Coordinate.get("top")
        B = Coordinate.get("bottom")
        response = (L+(R-L)/2, T+(B-T)/2)
        return response

    def save_screenshot(self, xpath: str = None, path: str = 'PyAibote.png') -> str:
        """
            截图，返回 PNG 格式的 base64, 保存图片时尽量不要把浏览器开全屏会出现异常抛错情况

            xpath: 元素路径，如果指定该参数则截取元素图片
            path: 生成图片路径，如果不设置路径则默认在当前目录生成名为PyAibote.png图片,如果设置为空值则不生成图片
            return: PNG 格式的 base64 的字符串或 None
        """
        if xpath is None:
            response = self.SendData("takeScreenshot")
        else:
            response = self.SendData("takeScreenshot", xpath)
        if response == "null":
            return None
        if path:
            self.SaveBase64Png(response,path)
        return response

    def show_xpath(self) -> bool:
        """
            显示元素xpath路径，页面加载完毕再调用。
            调用此函数后，可在页面移动鼠标会显示元素区域。移动并按下ctrl键，会在浏览器控制台打印相对xpath 和 绝对xpath路径
            ifrmae 内的元素，需要先调用 switchFrame 切入进去，再调用showXpath函数

            return: 总是True
        """
        return "true" in self.SendData("showXpath")

    def show_xpath(self) -> bool:
        """
            显示元素xpath路径，页面加载完毕再调用。
            调用此函数后，可在页面移动鼠标会显示元素区域。移动并按下ctrl键，会在浏览器控制台打印相对xpath 和 绝对xpath路径
            ifrmae 内的元素，需要先调用 switchFrame 切入进去，再调用showXpath函数

            return: 总是True
        """
        return "true" in self.SendData("showXpath")

    def get_elements(self) -> json:
        """
            获取可见区域内的所有元素信息
            return: 成功返回数组json格式的元素信息，失败返回null
        """
        response = self.SendData("getElements")
        if response == "null":
            return None
        return json.loads(response)

class IframeOperation:
    """
        iframe 操作
    """

    def switch_to_frame(self, xpath) -> bool:
        """
            切换到指定 frame

            xpath: xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("switchFrame", xpath)

    def switch_to_main_frame(self) -> bool:
        """
            切回主 frame

            return: 布尔值
        """
        return "true" in self.SendData("switchMainFrame")

class JSinjection:
    """
        JS 注入
    """

    def execute_script(self, script: str) -> str:
        """
            注入执行 JS

            script: 要执行的 JS 代码
            return: 假如注入代码有返回值，则返回此值，否则返回 None
        """
        response = self.SendData("executeScript", script)
        if response == "null":
            return None
        return response

class KeymouseOperation:
    """
        鼠标键盘操作
    """

    def click_mouse_by_element(self, xpath: str, typ: int) -> bool:
        """
            根据元素位置点击鼠标(元素中心点)

            xpath: 元素 xpath 路径
            typ: 点击类型，单击左键:1 单击右键:2 按下左键:3 弹起左键:4 按下右键:5 弹起右键:6 双击左键:7
            return: 布尔值
        """
        return "true" in self.SendData("clickMouseByXpath", xpath, typ)

    def move_to_element(self, xpath: str) -> bool:
        """
            移动鼠标到元素位置(元素中心点)

            xpath: 元素 xpath 路径
            return: 布尔值
        """
        return "true" in self.SendData("moveMouseByXpath", xpath)

    def scroll_mouse_by_element(self, xpath: str, offset_x: float, offset_y: float) -> bool:
        """
            根据元素位置滚动鼠标

            xpath: 元素路径
            offset_x: 水平滚动条移动的距离
            offset_y: 垂直滚动条移动的距离
            return: 布尔值
        """
        return "true" in self.SendData("wheelMouseByXpath", offset_x, offset_y, xpath)

    def click_mouse(self, point: tuple, typ: int) -> bool:
        """
            点击鼠标

            point: 坐标点
            typ: 点击类型，单击左键:1 单击右键:2 按下左键:3 弹起左键:4 按下右键:5 弹起右键:6 双击左键:7
            return: 布尔值
        """
        return "true" in self.SendData("clickMouse", point[0], point[1], typ) 

    def move_mouse(self, point: tuple) -> bool:
        """
            移动鼠标

            point: 坐标点
            return: 布尔值
        """
        return "true" in self.SendData("moveMouse", point[0], point[1])

    def scroll_mouse(self, point: tuple = (0,0), offset_x: float = 0, offset_y: float = 100) -> bool:
        """
            滚动鼠标

            point 鼠标x, y坐标位置
            offset_x: 水平滚动条移动的距离
            offset_y: 垂直滚动条移动的距离
            return: 布尔值
        """
        return "true" in self.SendData("wheelMouse", offset_x, offset_y, point[0], point[1])

class PagesNavigation:
    """
        页面和导航功能模块
    """

    def goto(self, url: str) -> bool:
        """
            跳转页面

            url: 网址
            return: 布尔值
        """
        return "true" in self.SendData("goto", url)

    def new_page(self, url: str) -> bool:
        """
            新建 Tab 并跳转页面

            url: 网址
            return: 布尔值
        """
        return "true" in self.SendData("newPage", url)

    def back(self) -> bool:
        """
            后退

            return: 布尔值
        """
        return "true" in self.SendData("back")

    def forward(self) -> bool:
        """
            前进

            return: 布尔值
        """
        return "true" in self.SendData("forward")

    def refresh(self) -> bool:
        """
            刷新

            return: 布尔值
        """
        return "true" in self.SendData("refresh")

    def get_current_page_id(self) -> str:
        """
            获取当前页面 ID

            return: 字符串, 找不到页面则返回None
        """
        response = self.SendData("getCurPageId")
        if response == "null":
            return None
        return response

    def get_all_page_id(self) -> list:
        """
            获取所有页面 ID

            return: 所有页面ID，找不到则返回空列表[]
        """
        response = self.SendData("getAllPageId")
        if response == "null":
            return []
        return response.split("|")
    
    def switch_to_page(self, page_id: str) -> bool:
        """
            切换到指定页面

            page_id: 你要切换的页面ID
            return: 布尔值
        """
        return "true" in self.SendData("switchPage", page_id)

    def close_current_page(self) -> bool:
        """
            关闭当前页面

            return: 布尔值
        """
        return "true" in self.SendData("closePage")

    def get_current_url(self) -> str:
        """
            获取当前页面 URL

            return: 当前页面URL 或 None
        """
        response = self.SendData("getCurrentUrl")
        if response == "webdriver error":
            return None
        response = re.findall(r'(http.*)',response)
        if response:
            return response[0]
        else:
            return None

    def get_current_title(self) -> str:
        """
            获取当前页面标题

            return：当前页面标题 或 None

        """
        response = self.SendData("getTitle")
        if response == "webdriver error":
            return None
        return response

class PopUpWindow:
    """
        点击alert警告框
    """
    
    def click_alert(self, accept: bool, prompt_text: str = "") -> bool:
        """
            点击警告框

            accept: 确认或取消
            prompt_text: 可选参数，输入的警告框文本
            return: 布尔值
        """
        return "true" in self.SendData("clickAlert", accept, prompt_text) 

    def get_alert_text(self) -> str:
        """
            获取警告框文本

            return: 警告框文本字符串
        """
        response = self.SendData("getAlertText")
        if response == "null":
            return None
        return response

class WindowOperation:
    """
        窗口操作
    """

    def get_window_pos(self) -> dict:
        """
            获取窗口位置和状态

            return: left和top：浏览器相对于与Windows窗口左上角坐标点，height和width：浏览器本身高度和宽度
        """

        response = self.SendData("getWindowPos")
        response = response.replace("\n","").replace("\t","")

        if response == "null":
            return None
        response = json.loads(response)
        return response

    def set_window_pos(self, status: str = "normal", left: float = 0, top: float = 0, width: float = 0, height: float = 0) -> bool:
        """
            设置窗口位置和窗口大小窗口状态

            status: 正常:"normal"  最小化:"minimized"  最大化:"maximized"  全屏:"fullscreen"
            left:   浏览器相对于与Windows窗口左上角X坐标点     可选参数，浏览器窗口位置，此参数仅 status 值为 "normal" 时有效
            top:    浏览器相对于与Windows窗口左上角Y坐标点     可选参数，浏览器窗口位置，此参数仅 status 值为 "normal" 时有效
            width:  浏览器本身宽度                           可选参数，浏览器窗口位置，此参数仅 status 值为 "normal" 时有效
            height: 浏览器本身高度                           可选参数，浏览器窗口位置，此参数仅 windowState 值为 "normal" 时有效
            return: 布尔值
        """
        return "true" in self.SendData("setWindowPos", status, left, top, width, height) 

    def quit(self) -> bool:
        """
            退出浏览器

            return: 布尔值
        """
        return "true" in self.SendData("closeBrowser")
        
    def mobile_emulation(self, width: int, height: int, userAgent: str, platform: str, platformVersion: str, acceptLanguage: str = "", timezoneId: str = "", latitude: float = 0, longitude: float = 0,accuracy: float = 0) -> bool:
        """
            模拟移动端浏览器

            width: 宽度
            height: 高度
            userAgent: 用户代理
            platform: 系统平台，例如 "Android"、"IOS"、"iPhone"
            platformVersion: 系统版本号，例如 "9.0"，应当与userAgent提供的版本号对应
            acceptLanguage: 可选参数，语言，例如 "zh-CN"、"en"
            timezoneId: 可选参数，时区标识，例如"Asia/Shanghai"、"Europe/Berlin"、"Europe/London" 时区应当与 语言、经纬度 对应
            latitude: 可选参数，纬度，例如 31.230416
            longitude: 可选参数，经度，例如 121.473701
            accuracy: 可选参数，精度，例如 1111
            return: 布尔值
        """
        return "true" in self.SendData("mobileEmulation", width, height, userAgent, platform, platformVersion, acceptLanguage, timezoneId, latitude, longitude,accuracy) 



class WebBotMain(
        PagesNavigation,
        ElementOperation,
        KeymouseOperation,
        PopUpWindow,
        WindowOperation,
        DrivingOperation,
        JSinjection,
        CookiesOperation,
    ):

   
    # @abstractmethod
    def script_main(self):
        pass











