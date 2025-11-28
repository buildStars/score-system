# 生产环境SSL配置指南 🔒

## ⚠️ 重要安全提醒

**生产环境必须启用SSL证书验证！**

当前代码中临时忽略了SSL验证（`rejectUnauthorized: false`），这仅用于开发调试，**绝对不能**在生产环境使用。

---

## 🔐 SSL验证的重要性

### 为什么需要SSL验证？

```
没有SSL验证的风险：

用户 → 后端服务器 → [中间人攻击] → 伪造的API服务器
                     ↓
                  窃取/篡改数据
```

**具体风险**：
1. 🔴 **中间人攻击（MITM）**：黑客可以拦截和修改数据
2. 🔴 **数据篡改**：开奖数据可能被恶意修改
3. 🔴 **身份伪造**：无法确认API服务器的真实身份
4. 🔴 **合规问题**：不符合安全标准（PCI-DSS、等保等）

---

## ✅ 推荐配置方案

### 方案1：使用默认SSL验证（最推荐）⭐⭐⭐

**适用场景**：第三方API的SSL证书是正规CA签发的

#### 修改步骤

**1. 修改 `usa28.data-source.ts`**

```typescript
// ❌ 错误做法（开发环境临时方案）
import * as https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,  // 不验证证书
});

const response = await axios.get(url, { httpsAgent });
```

```typescript
// ✅ 正确做法（生产环境）
const response = await axios.get(url, {
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0...',
  },
  // 不需要 httpsAgent，使用默认SSL验证
});
```

**2. 修改 `jnd28.data-source.ts`**

```typescript
// ✅ 正确做法
const response = await axios.get(this.apiUrl, {
  params,
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0...',
    'Accept': 'application/json',
  },
  // 使用默认SSL验证
});
```

**3. 移除 https 导入**

```typescript
// usa28.data-source.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
// import * as https from 'https';  ← 删除此行
import { ILotteryDataSource, LotteryDataItem } from '../interfaces/lottery-data-source.interface';
```

---

### 方案2：配置自定义CA证书（特殊情况）

**适用场景**：第三方API使用自签名证书或内部CA

#### 步骤

**1. 下载API的CA证书**

```bash
# 获取证书
openssl s_client -showcerts -connect api.365kaik.com:443 </dev/null 2>/dev/null | \
  openssl x509 -outform PEM > api-ca.pem
```

**2. 配置Axios使用自定义CA**

```typescript
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export class USA28DataSource implements ILotteryDataSource {
  private httpsAgent: https.Agent;

  constructor() {
    // 读取CA证书
    const ca = fs.readFileSync(
      path.join(__dirname, '../../../../certs/api-ca.pem')
    );

    // 创建HTTPS Agent
    this.httpsAgent = new https.Agent({
      ca: ca,  // 使用自定义CA
      rejectUnauthorized: true,  // 启用验证
    });
  }

  async fetchLatestData() {
    const response = await axios.get(this.apiUrl, {
      httpsAgent: this.httpsAgent,
      // ...
    });
  }
}
```

**3. 项目结构**

```
backend/
├── src/
│   └── modules/
│       └── lottery/
│           └── data-sources/
└── certs/              ← 新建目录
    ├── api-ca.pem      ← USA28证书
    └── jnd28-ca.pem    ← JND28证书
```

---

### 方案3：环境变量控制（灵活方案）

**适用场景**：开发环境需要忽略SSL，生产环境启用

#### 实现代码

```typescript
// usa28.data-source.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class USA28DataSource implements ILotteryDataSource {
  constructor(private configService: ConfigService) {}

  async fetchLatestData() {
    const isDev = this.configService.get('NODE_ENV') === 'development';
    
    // 根据环境决定是否验证SSL
    const httpsAgent = isDev ? new https.Agent({
      rejectUnauthorized: false,  // 开发环境：忽略SSL
    }) : undefined;  // 生产环境：使用默认SSL验证

    const response = await axios.get(this.apiUrl, {
      params,
      timeout: 10000,
      ...(httpsAgent && { httpsAgent }),  // 只在开发环境传入
      headers: {
        'User-Agent': 'Mozilla/5.0...',
      },
    });
  }
}
```

**环境配置**

```env
# .env.development
NODE_ENV=development
SSL_VERIFY=false

# .env.production
NODE_ENV=production
SSL_VERIFY=true
```

---

## 🧪 测试SSL配置

### 1. 测试API证书是否有效

```bash
# 检查USA28 API证书
curl -v https://api.365kaik.com/api/v1/trend/getHistoryList?lotCode=10029&pageSize=1&pageNum=0

# 检查JND28 API证书
curl -v https://c2api.canada28.vip/api/lotteryresult/result_jnd28?game_id=7&page=1&pageSize=1
```

**预期结果**：
```
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
* Server certificate:
*  subject: CN=api.365kaik.com
*  issuer: C=US; O=Let's Encrypt; CN=R3
*  SSL certificate verify ok.  ✅ 证书有效
```

**问题情况**：
```
* SSL certificate problem: self signed certificate  ❌ 自签名证书
* SSL certificate problem: unable to get local issuer certificate  ❌ CA不受信任
```

### 2. Node.js代码测试

```typescript
// test-ssl.ts
import axios from 'axios';

async function testSSL() {
  try {
    // 测试USA28
    const res1 = await axios.get('https://api.365kaik.com/api/v1/trend/getHistoryList', {
      params: { lotCode: '10029', pageSize: '1', pageNum: '0' },
      timeout: 10000,
      // 不传 httpsAgent，使用默认SSL验证
    });
    console.log('✅ USA28 SSL证书有效');

    // 测试JND28
    const res2 = await axios.get('https://c2api.canada28.vip/api/lotteryresult/result_jnd28', {
      params: { game_id: '7', page: '1', pageSize: '1' },
      timeout: 10000,
    });
    console.log('✅ JND28 SSL证书有效');

  } catch (error) {
    if (error.code === 'CERT_HAS_EXPIRED') {
      console.error('❌ SSL证书已过期');
    } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('❌ SSL证书验证失败');
    } else {
      console.error('❌ 错误:', error.message);
    }
  }
}

testSSL();
```

运行测试：
```bash
cd score-system/backend
npx ts-node test-ssl.ts
```

---

## 🚀 生产部署检查清单

### SSL配置检查

- [ ] 已移除 `rejectUnauthorized: false`
- [ ] 已移除不必要的 `https` 导入
- [ ] 已测试API的SSL证书有效性
- [ ] 已在生产环境验证连接正常
- [ ] 已配置环境变量（如果使用方案3）
- [ ] 已更新相关文档

### 网络配置检查

- [ ] 服务器可以访问第三方API（ping测试）
- [ ] 防火墙允许HTTPS出站（端口443）
- [ ] DNS解析正常
- [ ] 网络延迟可接受（< 2秒）

### 安全配置检查

- [ ] 启用HTTPS（自己的API）
- [ ] 配置API访问日志
- [ ] 设置请求频率限制
- [ ] 添加异常监控和告警

---

## 📊 常见问题

### Q1: 生产环境必须启用SSL验证吗？

**A**: 是的！除非：
1. 你完全信任网络环境（如内网）
2. 第三方API明确说明使用自签名证书
3. 已经采取了其他安全措施（VPN、专线等）

但即使在这些情况下，也建议使用方案2（自定义CA）而不是完全忽略验证。

### Q2: 如果第三方API的SSL证书有问题怎么办？

**A**: 可以：
1. **联系API提供方**：要求修复证书问题
2. **使用方案2**：添加自定义CA证书
3. **切换数据源**：使用备用API（我们已有3个数据源）
4. **最后手段**：使用方案3，但必须添加日志和监控

### Q3: 开发环境可以忽略SSL吗？

**A**: 可以，但建议使用方案3（环境变量控制）：
- 开发环境：`SSL_VERIFY=false`（方便调试）
- 生产环境：`SSL_VERIFY=true`（确保安全）

### Q4: 如何知道当前使用的是否验证了SSL？

**A**: 查看日志，如果SSL有问题会报错：
```
Error: self signed certificate
Error: unable to verify the first certificate
```

如果没有这类错误，说明SSL验证通过。

### Q5: 我的服务器在中国，会影响SSL验证吗？

**A**: 通常不会，但可能遇到：
- 网络延迟较高 → 增加 `timeout`
- 部分CA不受信任 → 使用方案2
- 防火墙拦截 → 配置出站规则

---

## 🔧 快速修复脚本

### 自动移除SSL忽略

```bash
# remove-ssl-ignore.sh
#!/bin/bash

echo "🔧 移除SSL验证忽略..."

# 1. 移除 usa28.data-source.ts 中的SSL忽略
sed -i '/rejectUnauthorized: false/d' \
  backend/src/modules/lottery/data-sources/usa28.data-source.ts

# 2. 移除 jnd28.data-source.ts 中的SSL忽略（如果有）
sed -i '/rejectUnauthorized: false/d' \
  backend/src/modules/lottery/data-sources/jnd28.data-source.ts

# 3. 测试连接
cd backend
npx ts-node test-ssl.ts

echo "✅ 完成！请重启服务验证。"
```

---

## 📖 相关资源

- [Node.js HTTPS文档](https://nodejs.org/api/https.html)
- [Axios SSL配置](https://axios-http.com/docs/req_config)
- [Let's Encrypt免费证书](https://letsencrypt.org/)
- [SSL Labs测试工具](https://www.ssllabs.com/ssltest/)

---

## 🎯 推荐做法总结

| 环境 | 推荐方案 | SSL验证 | 说明 |
|------|---------|---------|------|
| **开发** | 方案3 | 可选关闭 | 使用环境变量控制 |
| **测试** | 方案1 | ✅ 启用 | 与生产环境保持一致 |
| **生产** | 方案1 | ✅ 启用 | 必须启用，除非特殊情况用方案2 |

---

**文档版本**: v1.0  
**最后更新**: 2025-11-29  
**安全等级**: 🔴 高优先级

