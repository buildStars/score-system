import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// 引入全局样式
import '@/assets/styles/index.scss'

// 引入Vant样式
import 'vant/lib/index.css'

const app = createApp(App)

// 重要：先注册Pinia，再注册Router
// 因为Router的守卫和组件可能需要使用Store
app.use(pinia)
app.use(router)

app.mount('#app')

