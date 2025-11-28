# 📋 常用命令说明

## 开发命令

### 安装依赖
```bash
npm install
```
> 首次运行项目时需要执行，安装所有依赖包

### 启动开发服务器
```bash
npm run dev
```
> 启动Vite开发服务器，支持热更新
> 访问地址：http://localhost:5173

### 构建生产版本
```bash
npm run build
```
> 先进行TypeScript类型检查，然后构建生产版本
> 输出目录：`dist/`

### 预览构建结果
```bash
npm run preview
```
> 本地预览构建后的生产版本
> 访问地址：http://localhost:4173

---

## 开发工具

### 代码格式化
```bash
# 格式化所有文件（如果安装了prettier）
npx prettier --write .
```

### 代码检查
```bash
# 运行ESLint检查（如果配置了lint脚本）
npm run lint
```

---

## 常见问题

### 1. 依赖安装失败
```bash
# 清除缓存后重新安装
npm cache clean --force
npm install
```

### 2. 端口被占用
如果5173端口被占用，可以：
- 修改 `vite.config.ts` 中的 `server.port`
- 或关闭占用端口的程序

### 3. 后端连接失败
检查：
- 后端服务是否启动（端口8081）
- `vite.config.ts` 中的proxy配置是否正确

---

## 快速启动流程

### 第一次使用
```bash
# 1. 进入项目目录
cd score-system/frontend-h5

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 日常开发
```bash
# 直接启动
npm run dev
```

### 部署上线
```bash
# 1. 构建
npm run build

# 2. 上传dist目录到服务器
# 3. 配置Nginx
```

---

## 环境要求

- **Node.js**：18.0.0 或更高版本
- **npm**：9.0.0 或更高版本
- **浏览器**：支持ES2020的现代浏览器

---

## 相关端口

| 服务 | 端口 | 说明 |
|-----|------|------|
| 前端开发服务器 | 5173 | Vite默认端口 |
| 前端预览服务器 | 4173 | Vite预览端口 |
| 后端API服务 | 8081 | 后端服务端口 |

---

**更新日期**：2024年11月26日




