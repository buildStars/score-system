<template>
    <div class="profile-page">
        <!-- 顶部导航栏 -->
        <van-nav-bar title="个人中心" fixed placeholder />

        <!-- 用户信息卡片 -->
        <div class="user-card card">
            <div class="avatar-section">
                <van-icon name="user-circle-o" size="60" color="#1989fa" />
            </div>
            <div class="user-info">
                <div class="username">{{ userStore.username }}</div>
                <div class="nickname">{{ userStore.nickname || '暂无昵称' }}</div>
            </div>
        </div>

        <!-- 积分信息 -->
        <div class="points-card card">
            <div class="points-item">
                <div class="label">当前积分</div>
                <div class="value primary">{{ formatPoints(userStore.points) }}</div>
            </div>

        </div>

        <!-- 功能列表 -->
        <div class="menu-section">
            <van-cell-group>
                <van-cell title="下注历史" is-link @click="goToBetHistory" icon="orders-o" />
                <van-cell title="积分记录" is-link to="/point-records" icon="gold-coin-o" />
                <van-cell title="开奖历史" is-link to="/history" icon="records-o" />
                <van-cell title="修改密码" is-link @click="showPasswordDialog = true" icon="lock" />
            </van-cell-group>
        </div>

        <!-- 退出登录 -->
        <div class="logout-section">
            <van-button type="danger" block round @click="onLogout">退出登录</van-button>
        </div>

        <!-- 修改密码弹窗 -->
        <van-dialog v-model:show="showPasswordDialog" title="修改密码" show-cancel-button :before-close="onPasswordSubmit">
            <van-form ref="passwordFormRef">
                <van-cell-group inset>
                    <van-field v-model="passwordForm.oldPassword" type="password" label="旧密码" placeholder="请输入旧密码"
                        :rules="[{ required: true, message: '请输入旧密码' }]" clearable />
                    <van-field v-model="passwordForm.newPassword" type="password" label="新密码"
                        placeholder="请输入新密码(6-20位)" :rules="[
                            { required: true, message: '请输入新密码' },
                            { min: 6, max: 20, message: '密码长度为6-20位' }
                        ]" clearable />
                    <van-field v-model="passwordForm.confirmPassword" type="password" label="确认密码"
                        placeholder="请再次输入新密码" :rules="[
                            { required: true, message: '请再次输入新密码' },
                            { validator: validateConfirmPassword, message: '两次密码输入不一致' }
                        ]" clearable />
                </van-cell-group>
            </van-form>
        </van-dialog>

        <!-- 底部导航 -->
        <van-tabbar v-model="activeTab" route fixed>
            <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
            <van-tabbar-item icon="orders-o" to="/bet-history">投注历史</van-tabbar-item>
            <van-tabbar-item icon="records-o" to="/lottery-history">开奖历史</van-tabbar-item>
            <van-tabbar-item icon="gold-coin-o" to="/point-records">积分账单</van-tabbar-item>
            <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
        </van-tabbar>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'
import { formatPoints } from '@/utils/format'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref(4)

const showPasswordDialog = ref(false)
const passwordFormRef = ref()

const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
})



/**
 * 验证确认密码
 */
const validateConfirmPassword = (value: string) => {
    return value === passwordForm.newPassword
}

/**
 * 前往下注历史
 */
const goToBetHistory = () => {
    // 这里可以创建一个下注历史页面，或者在积分记录中筛选
    router.push('/point-records')
}

/**
 * 提交修改密码
 */
const onPasswordSubmit = async (action: string) => {
    if (action === 'confirm') {
        try {
            // 验证表单
            await passwordFormRef.value?.validate()

            // 提交修改
            await userApi.changePassword({
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            })

            showToast({
                message: '密码修改成功，请重新登录',
                type: 'success',
            })

            // 清空表单
            passwordForm.oldPassword = ''
            passwordForm.newPassword = ''
            passwordForm.confirmPassword = ''

            // 退出登录
            setTimeout(() => {
                userStore.logout()
                router.replace('/login')
            }, 1500)

            return true
        } catch (error) {
            console.error('修改密码失败：', error)
            return false
        }
    } else {
        // 取消，清空表单
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        return true
    }
}

/**
 * 退出登录
 */
const onLogout = async () => {
    try {
        await showConfirmDialog({
            title: '提示',
            message: '确认退出登录吗？',
            confirmButtonText: '确认',
            cancelButtonText: '取消',
        })

        userStore.logout()

        showToast({
            message: '已退出登录',
            type: 'success',
        })

        router.replace('/login')
    } catch (error) {
        // 用户取消
    }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.profile-page {
    min-height: 100vh;
    padding-bottom: 60px;
    background-color: $background-color;
}

.user-card {
    margin: 10px;
    text-align: center;
    padding: 30px 20px;

    .avatar-section {
        margin-bottom: 15px;
    }

    .user-info {
        .username {
            font-size: 18px;
            font-weight: bold;
            color: $text-color;
            margin-bottom: 5px;
        }

        .nickname {
            font-size: 14px;
            color: #999;
        }
    }
}

.points-card {
    margin: 10px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 20px 10px;

    .points-item {
        flex: 1;
        text-align: center;

        .label {
            font-size: 12px;
            color: #999;
            margin-bottom: 8px;
        }

        .value {
            font-size: 18px;
            font-weight: bold;
            color: $text-color;

            &.primary {
                color: $primary-color;
            }

            &.success {
                color: $success-color;
            }

            &.danger {
                color: $danger-color;
            }
        }
    }

    :deep(.van-divider--vertical) {
        height: 40px;
    }
}

.menu-section {
    margin: 10px;

    :deep(.van-cell-group) {
        border-radius: $border-radius-md;
        overflow: hidden;
    }

    :deep(.van-cell) {
        font-size: 15px;

        .van-icon {
            margin-right: 10px;
            color: $primary-color;
        }
    }
}

.logout-section {
    margin: 20px 10px 10px;
}
</style>
