<template>
  <div class="login-page">
    <div class="login-header">
      <h1 class="title">计分系统</h1>
      <p class="subtitle">欢迎登录</p>
    </div>

    <div class="login-form">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
            clearable
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            clearable
          />
        </van-cell-group>

        <div class="login-btn">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            登录
          </van-button>
        </div>
      </van-form>
    </div>

    <div class="login-footer">
      <p class="tips">请使用管理员提供的账号登录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
})

/**
 * 提交登录
 */
const onSubmit = async () => {
  if (!form.username || !form.password) {
    showToast('请输入用户名和密码')
    return
  }

  loading.value = true
  
  try {
    await userStore.login({
      username: form.username,
      password: form.password,
    })
    
    showToast({
      message: '登录成功',
      type: 'success',
    })

    // 跳转到之前的页面或首页
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (error: any) {
    console.error('登录失败：', error)
    // 错误提示已在axios拦截器中处理
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-header {
  flex-shrink: 0;
  text-align: center;
  color: #fff;
  padding: 60px 0 40px;

  .title {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 16px;
    opacity: 0.9;
  }
}

.login-form {
  flex: 1;
}

.login-btn {
  margin: 20px 16px;
}

.login-footer {
  flex-shrink: 0;
  text-align: center;
  color: #fff;
  padding: 20px 0;

  .tips {
    font-size: 12px;
    opacity: 0.8;
  }
}
</style>



