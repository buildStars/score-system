# 🐛 修复 getUserBetHistory 的 null 引用错误

## 问题描述

**错误信息**：
```
TypeError: Cannot read properties of null (reading 'createdAt')
at /app/dist/src/modules/bet/bet.service.js:197:80
at Array.sort (<anonymous>)
at BetService.getUserBetHistory
```

## 根本原因

在 `getUserBetHistory` 方法中，当某个期号的所有下注都被取消时，`mergeBetsByIssue` 方法会返回 `null`。

但代码没有检查就直接将 `null` push 到数组，导致后续排序时访问 `null.createdAt` 报错。

**问题代码**：
```typescript
for (const [issueKey, bets] of groupedByIssue.entries()) {
  const merged = await this.mergeBetsByIssue(bets);
  mergedBets.push(merged);  // ❌ 可能 push null
}

// 排序时出错
mergedBets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
```

## 解决方案

在 push 之前添加 null 检查：

```typescript
for (const [issueKey, bets] of groupedByIssue.entries()) {
  const merged = await this.mergeBetsByIssue(bets);
  // ✅ 过滤掉 null 值（当该期号所有下注都被取消时）
  if (merged) {
    mergedBets.push(merged);
  }
}
```

## 修复文件

- `score-system/backend/src/modules/bet/bet.service.ts` - 第 267-272 行

## 重新部署

### 方式一：Docker 重新构建（生产环境）

```bash
cd score-system

# 停止旧容器
docker-compose down

# 重新构建后端
docker-compose build backend

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

### 方式二：本地开发环境

```bash
cd score-system/backend

# 重新编译
npm run build

# 或使用开发模式（自动重启）
npm run start:dev
```

## 验证修复

1. 访问 H5 下注历史页面（会触发 `getUserBetHistory` 接口）
2. 确认不再出现 `Cannot read properties of null` 错误
3. 检查日志，确保接口正常返回数据

## 相关说明

- 管理后台的 `getAllBets` 方法已经有正确的 null 检查，所以没有这个问题
- `mergeBetsByIssue` 返回 null 的场景：
  - `bets.length === 0`
  - 所有下注的 status 都是 `'cancelled'`

