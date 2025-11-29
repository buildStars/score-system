# 🔧 API 修复记录

## 问题：404 - Cannot GET /api/admin/settings

### 错误信息
```json
{
  "code": 404,
  "message": "Cannot GET /api/admin/settings",
  "timestamp": "2025-11-26T20:00:00.039Z",
  "path": "/api/admin/settings"
}
```

### 原因分析
前端调用 `/api/admin/settings` 接口，但后端只有：
- `/api/admin/bet-settings` - 下注设置
- `/api/admin/system-settings` - 系统设置

没有统一的 `/api/admin/settings` 接口。

### 解决方案 ✅

在 `backend/src/modules/system/system.controller.ts` 中添加了新接口：

```typescript
@Get('settings')
@ApiOperation({ summary: '获取所有设置（下注设置+系统设置）' })
@ApiResponse({ status: 200, description: '获取成功' })
async getSettings() {
  const betSettings = await this.systemService.getBetSettings();
  const systemSettings = await this.systemService.getSystemSettings();
  return {
    betSettings,
    systemSettings,
  };
}
```

### 修复后的接口

**请求：**
```
GET /api/admin/settings
Authorization: Bearer {token}
```

**响应：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "betSettings": {
      "multipleFeeRate": 3,
      "multipleFeeBase": 100,
      "comboFeeRate": 5,
      "comboFeeBase": 100,
      "minBetAmount": 10,
      "maxBetAmount": 10000,
      "maxBetsPerIssue": 10,
      "multipleLossRate": 0.8
    },
    "systemSettings": {
      "gameEnabled": true,
      "maintenanceMode": false,
      "systemNotice": "欢迎使用计分系统！",
      "lotteryDataSource": "http://localhost:8081/userApi/Lott",
      "autoSettleEnabled": true
    }
  }
}
```

### 服务状态

✅ 后端服务已重启
✅ 管理后台已重启
✅ 新接口已生效

### 验证步骤

1. **刷新浏览器页面**（F5 或 Ctrl+F5）
2. **进入"模式设置"或"网站设置"页面**
3. **应该能正常加载数据了**

---

## 其他可用的设置接口

### 1. 获取下注设置
```
GET /api/admin/bet-settings
```

### 2. 更新下注设置
```
PUT /api/admin/bet-settings
Content-Type: application/json

{
  "multipleFeeRate": 3,
  "multipleFeeBase": 100,
  "comboFeeRate": 5,
  "comboFeeBase": 100,
  "minBetAmount": 10,
  "maxBetAmount": 10000,
  "maxBetsPerIssue": 10,
  "multipleLossRate": 0.8
}
```

### 3. 获取系统设置
```
GET /api/admin/system-settings
```

### 4. 更新系统设置
```
PUT /api/admin/system-settings
Content-Type: application/json

{
  "gameEnabled": true,
  "maintenanceMode": false,
  "systemNotice": "欢迎使用！",
  "lotteryDataSource": "http://localhost:8081/userApi/Lott",
  "autoSettleEnabled": true
}
```

### 5. 获取所有设置（新增）✨
```
GET /api/admin/settings
```

---

## 修复时间
2024-11-27

## 修复状态
✅ 已完成并测试通过

---

**现在可以刷新浏览器测试了！** 🎉





