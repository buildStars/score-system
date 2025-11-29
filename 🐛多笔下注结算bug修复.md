# 🐛 多笔下注结算BUG修复报告

## 📊 问题描述

**发现时间**：2025-11-29  
**影响范围**：同一期多笔下注时，积分结算不正确  
**状态**：✅ 已修复

---

## ❌ 问题表现

### 场景重现

用户在同一期下了9笔注：
```
期号: 3365728
开奖: 7+9+7=23 (大单，回本-对子)

9笔下注：
1. 100倍
2. 100小双
3. 100小单
4. 100大双
5. 100大单
6. 100小
7. 100大
8. 100双
9. 100单
```

### 预期结果

```
初始积分: 10000
总结算分: 177
最终积分: 10177 ✅
```

### 实际结果

```
初始积分: 10000
实际积分: 10097 ❌
损失: 80 分
```

---

## 🔍 根本原因

### 旧代码问题

```typescript
// ❌ 旧代码（有bug）
const pointsBeforeBet = Number(bet.pointsBefore);  // ← 使用下注时的积分
const finalPoints = pointsBeforeBet + settlementAmount;

await tx.user.update({
  where: { id: bet.userId },
  data: { points: finalPoints },
});
```

### Bug 分析

当有9笔下注同时提交时：

```
下注时:
- 记录1: pointsBefore = 10000
- 记录2: pointsBefore = 10000  ← 都是同一时刻的积分
- 记录3: pointsBefore = 10000
- ...
- 记录9: pointsBefore = 10000

结算时（按顺序）:
- 记录1: 10000 + 0 = 10000 → 写入数据库
- 记录2: 10000 + (-100) = 9900 → 写入数据库（覆盖了10000）
- 记录3: 10000 + 0 = 10000 → 写入数据库（覆盖了9900）
- 记录4: 10000 + (-100) = 9900 → 写入数据库
- 记录5: 10000 + (-5) = 9995 → 写入数据库
- 记录6: 10000 + 95 = 10095 → 写入数据库
- 记录7: 10000 + 95 = 10095 → 写入数据库
- 记录8: 10000 + 95 = 10095 → 写入数据库
- 记录9: 10000 + 97 = 10097 → 写入数据库（最终值）

结果: 用户积分 = 10097（只得到最后一条记录的结算分）
```

**问题**：每次结算都基于 `bet.pointsBefore`（10000），而不是用户的**当前积分**，导致后面的结算覆盖前面的结算！

---

## ✅ 修复方案

### 新代码

```typescript
// ✅ 新代码（已修复）
await this.prisma.$transaction(async (tx) => {
  // 获取用户当前的最新积分（而不是下注时的积分）
  const currentUser = await tx.user.findUnique({
    where: { id: bet.userId },
  });
  
  const currentPoints = Number(currentUser.points);
  
  // 基于当前积分计算
  const finalPoints = Math.floor(currentPoints + settlementAmount);

  await tx.user.update({
    where: { id: bet.userId },
    data: { points: finalPoints },
  });
});
```

### 修复后的流程

```
结算时（按顺序）:
- 记录1: 当前10000 + 0 = 10000 → 写入
- 记录2: 当前10000 + (-100) = 9900 → 写入
- 记录3: 当前9900 + 0 = 9900 → 写入  ✅ 基于当前值
- 记录4: 当前9900 + (-100) = 9800 → 写入
- 记录5: 当前9800 + (-5) = 9795 → 写入
- 记录6: 当前9795 + 95 = 9890 → 写入
- 记录7: 当前9890 + 95 = 9985 → 写入
- 记录8: 当前9985 + 95 = 10080 → 写入
- 记录9: 当前10080 + 97 = 10177 → 写入（最终值）✅

结果: 用户积分 = 10177 ✅ 正确！
```

---

## 🔧 已修复的文件

### 1. `lottery.service.ts` - 结算逻辑

**修改位置**：`settleSingleBet()` 方法

**关键变更**：
```diff
- const pointsBeforeBet = Number(bet.pointsBefore);
- const finalPoints = pointsBeforeBet + settlementAmount;

+ const currentUser = await tx.user.findUnique({
+   where: { id: bet.userId },
+ });
+ const currentPoints = Number(currentUser.points);
+ const finalPoints = currentPoints + settlementAmount;
```

### 2. PointRecord 记录

**修改位置**：积分记录创建

**关键变更**：
```diff
  await tx.pointRecord.create({
    data: {
-     balanceBefore: pointsBeforeBet,  // 下注前积分
+     balanceBefore: currentPoints,     // 结算前的当前积分
      balanceAfter: finalPoints,
    },
  });
```

---

## ✅ 验证修复

### 已修正的数据

```
用户ID: 2
期号: 3365728

修正前积分: 10097
修正后积分: 10177 ✅
补偿: +80 分
```

### 测试新规则

重新测试同一期多笔下注，验证积分正确累加：

```bash
# 清空数据重新测试
cd score-system/backend
npx ts-node clear-all-data.ts

# 提交多笔下注
# ...

# 验证积分正确性
# 最终积分应该 = 初始积分 + SUM(所有结算分)
```

---

## 📝 影响评估

### 受影响场景

✅ **已修复**：
- 同一期多笔下注
- 混合下注（倍数 + 组合）
- 快速连续下注

❌ **不受影响**：
- 单笔下注
- 不同期的下注

### 数据修正

如果生产环境已经有受影响的数据：

```sql
-- 1. 查找可能受影响的用户
SELECT 
  u.id, 
  u.username,
  u.points AS current_points,
  SUM(b.resultAmount) AS total_settlement,
  u.points - SUM(b.resultAmount) AS calculated_initial
FROM users u
JOIN bets b ON b.userId = u.id
WHERE b.status != 'pending'
GROUP BY u.id
HAVING COUNT(DISTINCT b.issue) > 0;

-- 2. 手动验证并修正（如有需要）
```

---

## 🎯 预防措施

### 1. 事务隔离

确保所有结算操作都在事务中：
```typescript
await this.prisma.$transaction(async (tx) => {
  // 所有数据库操作
});
```

### 2. 使用当前值

结算时始终使用用户的**当前积分**，而不是缓存值。

### 3. 测试用例

添加测试：
- 同一期多笔下注
- 快速连续下注
- 验证积分累加正确性

---

## ✅ 修复清单

- [x] 修复结算逻辑代码
- [x] 修正受影响用户的积分
- [x] 记录积分修正日志
- [x] 清空测试数据
- [x] 重新测试验证
- [x] 更新文档

---

**修复完成时间**：2025-11-29  
**状态**：✅ 已验证修复有效  
**可以部署**：✅ 是

