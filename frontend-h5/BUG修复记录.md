# 🐛 Bug修复记录

## 修复时间：2024年11月26日

---

## Bug #1: Pinia初始化顺序错误

### 问题描述
```
Uncaught (in promise) Error: [🍍]: "getActivePinia()" was called but there was no active Pinia.
Are you trying to use a store before calling "app.use(pinia)"?
```

### 错误原因
在 `main.ts` 中，Router 在 Pinia 之前注册，导致组件加载时 Pinia 还未初始化。

### 原始代码（错误）
```typescript
const app = createApp(App)

app.use(router)  // ❌ 先注册Router
app.use(pinia)   // ❌ 后注册Pinia

app.mount('#app')
```

### 修复后代码（正确）
```typescript
const app = createApp(App)

// ✅ 重要：先注册Pinia，再注册Router
// 因为Router的守卫和组件可能需要使用Store
app.use(pinia)   // ✅ 先注册Pinia
app.use(router)  // ✅ 后注册Router

app.mount('#app')
```

### 修复位置
- 文件：`src/main.ts`
- 行号：14-15

### 解决方案
调整插件注册顺序：**先安装Pinia，再安装Router**

### 原因分析
1. Vue组件在setup函数中会调用 `useUserStore()` 和 `useLotteryStore()`
2. 这些store需要Pinia已经被注册到应用实例中
3. 如果Router先注册，路由组件加载时Pinia还未准备好
4. 导致 `getActivePinia()` 返回undefined

### 验证方法
1. 刷新浏览器页面
2. 检查控制台是否还有Pinia错误
3. 正常访问首页和其他页面
4. Store功能正常工作

---

## 最佳实践

### Vue插件注册顺序建议
```typescript
const app = createApp(App)

// 1. 首先注册状态管理（Pinia/Vuex）
app.use(pinia)

// 2. 然后注册路由
app.use(router)

// 3. 最后注册其他插件
// app.use(otherPlugin)

app.mount('#app')
```

### 为什么这个顺序很重要？
1. **状态管理优先**：组件和路由守卫可能需要访问store
2. **路由其次**：路由守卫可能需要使用store进行权限判断
3. **其他插件最后**：它们可能依赖前面的插件

---

## 相关文档
- [Pinia - Outside Component Usage](https://pinia.vuejs.org/core-concepts/outside-component-usage.html)
- [Vue - Plugin Registration](https://vuejs.org/guide/reusability/plugins.html)

---

## 状态
✅ **已修复** - 问题已解决，应用可正常运行

---

**修复日期**：2024年11月26日




