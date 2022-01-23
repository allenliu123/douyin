## 下载 程jiajia 抖音去水印视频

无意间看到抖音居然有网页版了（https://www.douyin.com），打算写个脚本爬一些视频下来

## 过程

1. 使用浏览器打开主页 https://www.douyin.com/user/MS4wLjABAAAAJqTyV9DKLyl-0JoeAU1BiZW2PWyfBX17JyeXK1YmE-w
2. 打开控制台找到类似这样的请求 https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&channel=channel_pc_web&sec_user_id=MS4wLjABAAAAJqTyV9DKLyl-0JoeAU1BiZW2PWyfBX17JyeXK1YmE-w&max_cursor=1639476488000&locate_query=false&count=10&publish_video_strategy_type=2&version_code=170400&version_name=17.4.0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Chrome&browser_version=97.0.4692.99&browser_online=true&engine_name=Blink&engine_version=97.0.4692.99&os_name=Windows&os_version=10&cpu_core_num=16&device_memory=8&platform=PC&downlink=10&effective_type=4g&round_trip_time=50&webid=7056296821304395271&msToken=Hr5RMEuAGda0zY9P-Ku77bGUupDA9FUAXFw_mueeipH7EqP6Vork84N2QYRZ8d8mShgv26AAHuaHkhsw2vd8d--JjSaqSS-Xx2-hBSyyeo_g32l1bXSRDR5IVgCbIdE=&X-Bogus=DFSzsdVucj0ANrm5SbqgPRXAIQ5L&_signature=_02B4Z6wo00001hHyLbQAAIDDcvjt3rSmfaoR9ikAAOWfAXHNnBDQ0iNavZyjtmhx6MaVqD2YOWtBowdhzbl56vAbpZEw4cYGIqS2KPc8Z90v7Tz7gV5hqDgaGvZoQh4DlfIDtI4EsA8erAV6ae
3. 多次请求，复制所有 response 里的 aweme_list 数据到 response.json 文件中 (由于接口有签名校验，暂时没找到解决办法，只能先用这种方式了)
4. 提取 response.json 里的视频 id, desc 列表，然后通过视频 id 取得视频无水印真实链接，再下载视频到本地

## Useage

git clone
npm install
node app.js

## 免责声明

以上代码仅用于学习和参考，任何公司或个人使用过程中造成的任何法律和刑事事件，开发者不负任何责任。