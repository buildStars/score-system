<template>
  <div class="main-layout">
    <!-- 移动端遮罩层 -->
    <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="toggleMobileMenu"></div>
    
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="sidebarWidth" class="sidebar" :class="{ 'mobile-open': isMobileMenuOpen }">
        <div class="logo">
          <el-icon :size="28"><TrendCharts /></el-icon>
          <span v-if="!isCollapse">计分系统</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          :router="true"
          :collapse="false"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409eff"
          @select="handleMenuSelect"
          class="sidebar-menu"
        >
          <el-menu-item
            v-for="route in menuRoutes"
            :key="route.path"
            :index="route.path"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>
              <span>{{ route.meta?.title }}</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主体内容 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <!-- 移动端菜单按钮 -->
            <el-icon class="mobile-menu-btn" @click="toggleMobileMenu">
              <Expand v-if="!isMobileMenuOpen" />
              <Fold v-else />
            </el-icon>
            
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <div class="user-info">
                <el-icon class="user-icon"><User /></el-icon>
                <span class="user-name">{{ authStore.adminName }}</span>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 内容区 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" v-if="Component" :key="route.path" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { User, ArrowDown, SwitchButton, TrendCharts, Expand, Fold } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 移动端状态
const isMobile = ref(false)
const isMobileMenuOpen = ref(false)
const isCollapse = ref(false)

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  // 移动端不折叠菜单，保持展开以显示文字
  isCollapse.value = false
}

// 侧边栏宽度
const sidebarWidth = computed(() => {
  // 统一使用 240px 宽度
  return '240px'
})

// 切换移动端菜单
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// 菜单选择（移动端自动关闭）
const handleMenuSelect = () => {
  if (isMobile.value) {
    isMobileMenuOpen.value = false
  }
}

// 菜单路由（从 router 的 children 中过滤）
const menuRoutes = computed(() => {
  return router.options.routes
    .find((r) => r.path === '/')
    ?.children?.filter((child) => child.meta?.title) || []
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return '/' + route.path.split('/')[1]
})

// 当前页面标题
const currentTitle = computed(() => {
  return route.meta?.title as string || '首页'
})

// 下拉菜单操作
const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      
      authStore.clearAuth()
      router.push('/login')
    } catch {
      // 取消退出
    }
  }
}

// 监听窗口大小变化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.main-layout {
  width: 100%;
  height: 100%;
  position: relative;
}

.el-container {
  height: 100%;
}

// 移动端遮罩层
.mobile-overlay {
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 998;
  }
}

.sidebar {
  background-color: #001529;
  transition: transform 0.3s ease;
  
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 64px;
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    gap: 12px;
    transition: all 0.3s;
  }

  .el-menu {
    border-right: none;
    
    // 确保菜单文字显示
    .el-menu-item {
      .el-icon {
        margin-right: 10px;
      }
      
      span {
        font-size: 14px;
        color: #fff;
      }
    }
  }
  
  // 移动端样式
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 999;
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    
    &.mobile-open {
      transform: translateX(0);
    }
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 24px;

  .header-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    
    .mobile-menu-btn {
      display: none;
      font-size: 24px;
      cursor: pointer;
      color: #333;
      
      @media (max-width: 768px) {
        display: block;
      }
    }
    
    .breadcrumb {
      font-size: 16px;
      
      @media (max-width: 768px) {
        font-size: 15px;
      }
      
      @media (max-width: 480px) {
        font-size: 14px;
      }
      
      // 确保面包屑文字显示
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          color: #333;
          font-weight: 500;
          
          @media (max-width: 480px) {
            font-size: 14px;
          }
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
      background-color: #f5f5f5;
    }

    .user-icon {
      font-size: 20px;
    }
    
    .user-name {
      @media (max-width: 480px) {
        display: none;
      }
    }

    .arrow-icon {
      font-size: 12px;
      
      @media (max-width: 480px) {
        display: none;
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 0 16px;
  }
}

.main-content {
  background-color: #f5f5f5;
  padding: 24px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
  }
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 全局表格移动端适配
:deep(.el-table) {
  @media (max-width: 768px) {
    font-size: 13px;
    
    .el-table__cell {
      padding: 8px 0;
    }
  }
}

// 全局卡片移动端适配
:deep(.el-card) {
  @media (max-width: 768px) {
    .el-card__body {
      padding: 16px;
    }
  }
}

// 全局按钮移动端适配
:deep(.el-button) {
  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>

