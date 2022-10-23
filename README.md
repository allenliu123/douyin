## 下载抖音去水印视频

无意间看到抖音居然有网页版了（[https://www.douyin.com](https://www.douyin.com)），打算写个脚本把某个抖音用户的所有视频下载到本地

## 用法

1. 使用用户主页下载：
使用浏览器随便打开一个用户的个人主页 https://www.douyin.com/user/MS4wLjABAAAAJqTyV9DKLyl-0JoeAU1BiZW2PWyfBX17JyeXK1YmE-w

``` bash
npm install
node app.js https://www.douyin.com/user/MS4wLjABAAAAJqTyV9DKLyl-0JoeAU1BiZW2PWyfBX17JyeXK1YmE-w
```
该用户所有视频会下载到项目根目录 `/data/用户名` 目录下

2. 使用分享口令下载
复制视频分享链接 如：3.58 DUL:/ # 呼吸决定# 处女座 那就让情绪决定，听呼吸频率，跟感觉旅行。# 无声卡清唱 https://v.douyin.com/MuqYgFa/ 复制此链接，打开Dou音搜索，直接观看视频！

``` bash
npm install
node app.js '3.58 DUL:/ # 呼吸决定# 处女座 那就让情绪决定，听呼吸频率，跟感觉旅行。# 无声卡清唱 https://v.douyin.com/MuqYgFa/ 复制此链接，打开Dou音搜索，直接观看视频！'
```
> 注意需要使用单引号

该视频会下载到项目根目录 `/分享口令下载` 目录下

## 免责声明

以上代码仅用于学习和参考，任何公司或个人使用过程中造成的任何法律和刑事事件，开发者不负任何责任。