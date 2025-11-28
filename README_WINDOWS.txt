========================================
  计分系统 - Windows 快速启动说明
========================================

问题已修复！
-----------
之前的错误是由于 Windows 批处理文件对某些特殊字符（emoji）的兼容性问题。
现在已经全部修复，使用纯文本标签代替。


快速开始（3步）
--------------

1. 确保 Docker Desktop 已启动
   - 检查右下角托盘图标
   - 应该显示 "Docker Desktop is running"

2. 双击运行 start.bat
   - 第一次运行会自动创建配置文件
   - 等待 5-10 分钟下载和构建

3. 浏览器访问
   - H5 用户端:  http://localhost:8081
   - 管理后台:    http://localhost:8080
   - 后端 API:    http://localhost:3000


默认账号
-------
管理员: admin / admin123
用户:   user1 / 123456


常用操作
-------
启动服务:   双击 start.bat
停止服务:   双击 stop.bat
查看日志:   双击 logs.bat
查看状态:   docker-compose ps
重启服务:   docker-compose restart


配置修改
-------
如需修改端口或密码，编辑 .env 文件后重启服务


详细文档
-------
Windows 用户专用指南:  WINDOWS_GUIDE.md
完整部署文档:          DOCKER_DEPLOY.md
快速开始指南:          QUICK_START.md
Docker 命令速查:       docker-commands.md


常见问题
-------
1. 端口被占用？
   修改 .env 文件中的端口配置

2. Docker 未启动？
   打开 Docker Desktop 并等待启动完成

3. 启动失败？
   查看日志: docker-compose logs -f

4. 需要重新构建？
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d


获取帮助
-------
详细问题解决方案请查看 WINDOWS_GUIDE.md


祝使用愉快！
========================================



