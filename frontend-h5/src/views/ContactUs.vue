<template>
  <div class="contact-us-page">
    <van-nav-bar
      title="咨询与合作"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <div class="content">
      <div class="header-section">
        <div class="icon">💬</div>
        <h2>有疑问？合作洽谈</h2>
        <p>请留下您的联系方式，我们会尽快与您联系</p>
      </div>

      <van-form @submit="onSubmit" class="contact-form">
        <van-cell-group inset>
          <van-field
            v-model="formData.name"
            name="name"
            label="姓名"
            placeholder="请输入您的姓名"
            :rules="[{ required: true, message: '请输入姓名' }]"
            maxlength="50"
            show-word-limit
          />
          
          <van-field
            v-model="formData.contact"
            name="contact"
            label="联系方式"
            placeholder="手机号/微信/邮箱"
            :rules="[{ required: true, message: '请输入联系方式' }]"
            maxlength="100"
            show-word-limit
          />
          
          <van-field
            v-model="formData.message"
            name="message"
            label="留言内容"
            type="textarea"
            placeholder="请输入您的问题或合作意向"
            :rules="[{ required: true, message: '请输入留言内容' }]"
            rows="5"
            autosize
            maxlength="500"
            show-word-limit
          />
        </van-cell-group>

        <div class="submit-section">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="submitting"
            loading-text="提交中..."
          >
            提交留言
          </van-button>
        </div>
      </van-form>

      <div class="tips-section">
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <span class="tip-text">我们会在24小时内回复您</span>
        </div>
        <div class="tip-item">
          <span class="tip-icon">✓</span>
          <span class="tip-text">您的信息将被严格保密</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { submitMessage } from '@/api/message'

const router = useRouter()

const formData = reactive({
  name: '',
  contact: '',
  message: '',
})

const submitting = ref(false)

const onClickLeft = () => {
  router.back()
}

const onSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    await submitMessage({
      name: formData.name,
      contact: formData.contact,
      message: formData.message,
    })

    showSuccessToast('留言提交成功！\n我们会尽快与您联系')
    
    // 延迟返回
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error: any) {
    console.error('提交留言失败:', error)
    const errorMessage = error?.response?.data?.message || '提交失败，请稍后重试'
    showFailToast(errorMessage)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.contact-us-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f8fa 0%, #ffffff 100%);

  .content {
    padding: 20px 16px;
  }

  .header-section {
    text-align: center;
    margin-bottom: 30px;

    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #323233;
      margin: 0 0 8px 0;
    }

    p {
      font-size: 14px;
      color: #969799;
      margin: 0;
    }
  }

  .contact-form {
    margin-bottom: 24px;

    :deep(.van-cell-group) {
      border-radius: 12px;
      overflow: hidden;
    }

    :deep(.van-field__label) {
      width: 80px;
      color: #646566;
    }

    :deep(.van-field__control) {
      color: #323233;
    }
  }

  .submit-section {
    padding: 24px 16px;

    .van-button {
      height: 44px;
      font-size: 16px;
      font-weight: 500;
    }
  }

  .tips-section {
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    margin-top: 16px;

    .tip-item {
      display: flex;
      align-items: center;
      padding: 8px 0;

      .tip-icon {
        display: inline-block;
        width: 20px;
        height: 20px;
        line-height: 20px;
        text-align: center;
        border-radius: 50%;
        background: #07c160;
        color: #fff;
        font-size: 12px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .tip-text {
        font-size: 14px;
        color: #646566;
      }

      &:not(:last-child) {
        margin-bottom: 8px;
      }
    }
  }
}
</style>






